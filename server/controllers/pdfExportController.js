import mongoose from "mongoose";
import createHttpError from "http-errors";
import { pipeline } from "node:stream/promises";
import PdfExport from "../models/pdfExport.js";
import Survey from "../models/survey.js";
import { pdfBucket } from "../services/pdfExportStorage.js";
import { publicPdfJob, validatePdfSnapshot } from "../services/pdfExportValidation.js";
import { pdfRendererConfig } from "../services/pdfExportRenderer.js";

export const createPdfExport = async (req, res, next) => {
  try {
    const snapshot = validatePdfSnapshot(req.body);
    if (!mongoose.isValidObjectId(req.body.surveyId)) throw createHttpError(400, "Invalid survey.");
    const survey = await Survey.findOne({ _id: req.body.surveyId, createdBy: req.user.userId, deleted: false }).select("project").lean();
    if (!survey) throw createHttpError(404, "Survey not found.");
    const prior = await PdfExport.findOne({ owner: req.user.userId, requestKey: req.body.requestKey });
    if (prior) return res.json({ job: publicPdfJob(prior) });
    if (!pdfRendererConfig()) throw createHttpError(503, "Background PDF generation is not configured on this server. Please contact the administrator.");
    try {
      const job = await PdfExport.create({ owner: req.user.userId, surveyId: survey._id, requestKey: req.body.requestKey,
        title: String(survey.project || "Plotting and quantity report").slice(0, 200), snapshot,
        expiresAt: new Date(Date.now() + 7 * 86400000) });
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
    const jobs = await PdfExport.find({ owner: req.user.userId, dismissedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(20).lean();
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
    if (!["downloaded", "dismissed"].includes(req.body.action)) throw createHttpError(400, "Invalid action.");
    if (job.active) throw createHttpError(409, "This export is still running.");
    if (req.body.action === "downloaded" && job.status !== "completed") throw createHttpError(409, "The PDF is not ready yet.");
    await PdfExport.updateOne({ _id: job._id, owner: req.user.userId }, { $set: { [req.body.action === "downloaded" ? "downloadedAt" : "dismissedAt"]: new Date() } });
    res.json({ success: true });
  } catch (error) { next(error); }
};
