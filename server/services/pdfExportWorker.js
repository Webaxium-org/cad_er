import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import PdfExport from "../models/pdfExport.js";
import { pdfBucket, deletePdfFile } from "./pdfExportStorage.js";
import { pdfRendererConfig, renderPdfSnapshot } from "./pdfExportRenderer.js";
import { pdfExportResources } from "./pdfExportResources.js";
import { serverPdfExportsEnabled } from "./pdfExportAvailability.js";

export const pdfClaimFilter = (now) => ({ active: true, expiresAt: { $gt: now }, $or: [
  { status: "queued" }, { status: "running", leaseUntil: { $lt: now } },
] });

export const runPdfJob = async (job, render = renderPdfSnapshot) => {
  const match = { _id: job._id, leaseToken: job.leaseToken, status: "running" };
  const controller = new AbortController();
  let upload, heartbeat, bytes = 0, streamError;
  let stage = "Starting PDF renderer";
  const startedAt = Date.now();
  const logResources = async () => console.info("PDF export resources", JSON.stringify({
    jobId: String(job._id), attempt: job.attempts, stage, elapsedMs: Date.now() - startedAt,
    ...await pdfExportResources(),
  }));
  const fileId = new mongoose.Types.ObjectId();
  try {
    if (job.fileId) await deletePdfFile(job.fileId);
    if (job.attempts > 3) throw Error("Export was interrupted repeatedly. Please start a new export.");
    const reserved = await PdfExport.updateOne(match, { $set: { fileId } });
    if (!reserved.matchedCount) return;
    await logResources();
    upload = pdfBucket().openUploadStreamWithId(fileId, "plotting-and-quantity-report.pdf", { metadata: { owner: job.owner, jobId: job._id }, contentType: "application/pdf" });
    upload.on("error", (error) => { streamError = error; controller.abort(); });
    heartbeat = setInterval(async () => {
      try {
        const result = await PdfExport.updateOne(match, { $set: { leaseUntil: new Date(Date.now() + 120000) } });
        if (!result.matchedCount) controller.abort();
        else await logResources();
      } catch { controller.abort(); }
    }, 15000);
    let lastProgress = 0;
    await render(job.snapshot, {
      signal: controller.signal,
      onProgress: async (progress) => {
        stage = String(progress.message || "Generating PDF...").slice(0, 200);
        if (Date.now() - lastProgress < 1000) return;
        lastProgress = Date.now();
        await PdfExport.updateOne(match, { $set: {
          progress: Math.min(99, Math.max(0, Number(progress.percent) || 0)),
          message: String(progress.message || "Generating PDF...").slice(0, 200),
          estimatedTimeLeft: Number.isFinite(progress.estimatedTimeLeft) ? progress.estimatedTimeLeft : null,
        } });
      },
      onChunk: async (encoded) => {
        if (controller.signal.aborted || streamError) throw Error("PDF output was interrupted.");
        if (typeof encoded !== "string" || encoded.length > 1500000) throw Error("Invalid PDF chunk.");
        const chunk = Buffer.from(encoded, "base64");
        if (!bytes && chunk.subarray(0, 5).toString() !== "%PDF-") throw Error("Renderer did not produce a PDF.");
        bytes += chunk.length;
        if (bytes > 256 * 1024 * 1024) throw Error("PDF exceeds the 256 MB export limit.");
        await new Promise((resolve, reject) => upload.write(chunk, (error) => error ? reject(error) : resolve()));
      },
    });
    if (controller.signal.aborted || !bytes || streamError) throw Error("PDF output was interrupted.");
    await new Promise((resolve, reject) => { upload.once("finish", resolve); upload.once("error", reject); upload.end(); });
    const result = await PdfExport.updateOne(match, { $set: { status: "completed", active: false, progress: 100,
      message: "PDF ready to download", completedAt: new Date(), estimatedTimeLeft: 0 }, $unset: { snapshot: 1, leaseToken: 1, leaseUntil: 1 } });
    if (!result.matchedCount) await deletePdfFile(fileId);
  } catch (error) {
    if (upload && !upload.writableFinished) await upload.abort().catch(() => {});
    console.error("PDF export failed", String(job._id), stage, error.message);
    const message = job.attempts > 3
      ? "PDF generation was interrupted repeatedly on the server. Please contact support before retrying."
      : "PDF generation failed. Please start a new export or contact support.";
    const failed = await PdfExport.updateOne(match, { $set: { active: false, status: "failed", message },
      $unset: { snapshot: 1, fileId: 1, leaseToken: 1, leaseUntil: 1 } });
    // A completion write can succeed even if its acknowledgement is lost.
    // Never delete a PDF still referenced by a completed job in that case.
    if (failed.matchedCount || !await PdfExport.exists({ _id: job._id, fileId })) await deletePdfFile(fileId);
  } finally { clearInterval(heartbeat); }
};

export const cleanupPdfExports = async () => {
  const expired = await PdfExport.find({ expiresAt: { $lte: new Date() } }).limit(50).lean();
  for (const job of expired) {
    await deletePdfFile(job.fileId);
    await PdfExport.deleteOne({ _id: job._id, expiresAt: { $lte: new Date() } });
  }
};

export const startPdfExportWorker = () => {
  if (!serverPdfExportsEnabled()) { console.info("Background PDF exports disabled: downloads are generated in the browser."); return () => {}; }
  if (!pdfRendererConfig()) { console.warn("Background PDF exports disabled: configure PDF_RENDER_ORIGIN and PDF_CHROME_PATH."); return () => {}; }
  let busy = false, stopped = false, lastCleanup = 0;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      if (Date.now() - lastCleanup > 3600000) { await cleanupPdfExports(); lastCleanup = Date.now(); }
      const now = new Date();
      const job = await PdfExport.findOneAndUpdate(pdfClaimFilter(now), { $set: { status: "running", leaseToken: randomUUID(), leaseUntil: new Date(Date.now() + 120000), progress: 0, estimatedTimeLeft: null, message: "Starting PDF renderer..." }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, new: true }).select("+snapshot").lean();
      if (job) await runPdfJob(job);
    } catch (error) { console.error("PDF worker error:", error.message); }
    finally { busy = false; }
  };
  const timer = setInterval(tick, 3000);
  timer.unref();
  tick();
  return () => { stopped = true; clearInterval(timer); };
};
