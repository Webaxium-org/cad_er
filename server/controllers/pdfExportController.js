import mongoose from "mongoose";
import createHttpError from "http-errors";
import { pipeline } from "node:stream/promises";
import PdfExport from "../models/pdfExport.js";
import Survey from "../models/survey.js";
import { pdfBucket } from "../services/pdfExportStorage.js";
import { publicPdfJob, validatePdfSnapshot } from "../services/pdfExportValidation.js";
import { pdfRendererConfig } from "../services/pdfExportRenderer.js";
import { serverPdfExportsEnabled } from "../services/pdfExportAvailability.js";

export const createPdfExport = async (req, res, next) => {
  try {
    if (!serverPdfExportsEnabled()) throw createHttpError(503, "Background PDF exports are temporarily disabled. Refresh the app and download the PDF from the report page.");
    req.pdfExportStage = "snapshot validation";
    const snapshot = validatePdfSnapshot(req.body);
    if (!mongoose.isValidObjectId(req.body.surveyId)) throw createHttpError(400, "Invalid survey.");
    req.pdfExportStage = "survey ownership lookup";
    const survey = await Survey.findOne({ _id: req.body.surveyId, createdBy: req.user.userId, deleted: false }).select("project").lean();
    if (!survey) throw createHttpError(404, "Survey not found.");
    req.pdfExportStage = "existing job lookup";
    const prior = await PdfExport.findOne({ owner: req.user.userId, requestKey: req.body.requestKey });
    if (prior) return res.json({ job: publicPdfJob(prior) });
    req.pdfExportStage = "renderer configuration";
    if (!pdfRendererConfig()) throw createHttpError(503, "Background PDF generation is not configured on this server. Please contact the administrator.");
    try {
      req.pdfExportStage = "persisting queued job";
      const job = await PdfExport.create({ owner: req.user.userId, surveyId: survey._id, requestKey: req.body.requestKey,
        title: String(survey.project || "Plotting and quantity report").slice(0, 200), snapshot,
        expiresAt: new Date(Date.now() + 7 * 86400000) });
      req.pdfExportStage = "queued";
      res.status(202).json({ job: publicPdfJob(job) });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const duplicate = await PdfExport.findOne({ owner: req.user.userId, requestKey: req.body.requestKey });
      if (duplicate) return res.json({ job: publicPdfJob(duplicate) });
      throw createHttpError(409, "A PDF is already being generated. Open its progress indicator to follow it.");
    }
  } catch (error) { next(error); }
};

export const listPdfExports = async (req, res, next) => {
  try {
    const requestKey = req.query?.requestKey;
    if (requestKey !== undefined && (typeof requestKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestKey))) throw createHttpError(400, "Invalid export request key.");
    const jobs = await PdfExport.find({ owner: req.user.userId, ...(requestKey !== undefined ? { requestKey } : {}), dismissedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(20).lean();
    res.set("Cache-Control", "no-store").json({ jobs: jobs.map(publicPdfJob) });
  } catch (error) { next(error); }
};

const ownedJob = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw createHttpError(404, "Export not found.");
  const job = await PdfExport.findOne({ _id: req.params.id, owner: req.user.userId, expiresAt: { $gt: new Date() } });
  if (!job) throw createHttpError(404, "Export not found or expired.");
  return job;
};
export const downloadPdfExport = async (req, res, next) => {
  try {
    const job = await ownedJob(req);
    if (job.status !== "completed" || !job.fileId) throw createHttpError(409, "The PDF is not ready yet.");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="plotting-and-quantity-report.pdf"', "Cache-Control": "private, no-store" });
    await pipeline(pdfBucket().openDownloadStream(job.fileId), res);
  } catch (error) { if (res.headersSent) res.destroy(error); else next(error); }
};
export const acknowledgePdfExport = async (req, res, next) => {
  try {
    const job = await ownedJob(req);
    if (req.body.action === "cancel") {
      const cancelled = await PdfExport.findOneAndUpdate({ _id: job._id, owner: req.user.userId, active: true, status: { $in: ["queued", "running"] } }, {
        $set: { status: "cancelled", active: false, message: "PDF export cancelled.", estimatedTimeLeft: null },
        $unset: { snapshot: 1, leaseToken: 1, leaseUntil: 1 },
      }, { new: true });
      if (!cancelled && job.status !== "cancelled") throw createHttpError(409, "This export has already finished. Refresh its status.");
      return res.json({ job: publicPdfJob(cancelled || job) });
    }
    if (!["downloaded", "dismissed"].includes(req.body.action)) throw createHttpError(400, "Invalid action.");
    if (job.active) throw createHttpError(409, "This export is still running.");
    if (req.body.action === "downloaded" && job.status !== "completed") throw createHttpError(409, "The PDF is not ready yet.");
    await PdfExport.updateOne({ _id: job._id, owner: req.user.userId }, { $set: { [req.body.action === "downloaded" ? "downloadedAt" : "dismissedAt"]: new Date() } });
    res.json({ success: true });
  } catch (error) { next(error); }
};
