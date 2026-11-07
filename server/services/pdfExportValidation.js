import createHttpError from "http-errors";
export const validatePdfSnapshot = (body) => {
  if (!body || typeof body.requestKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(body.requestKey)) throw createHttpError(400, "Invalid export request.");
  const snapshot = body.snapshot;
  if (!snapshot || !Array.isArray(snapshot.lsPages) || !Array.isArray(snapshot.allCs)
    || !snapshot.lsPages.length || !snapshot.allCs.length
    || snapshot.lsPages.length + snapshot.allCs.length > 1000
    || !snapshot.tableData || !snapshot.reportDetails || !snapshot.chartOptions?.layout
    || !Number.isFinite(snapshot.chartWidth) || snapshot.chartWidth < 100 || snapshot.chartWidth > 2000) {
    throw createHttpError(400, "The report is not ready or exceeds the 1,000 chart export limit.");
  }
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 8 * 1024 * 1024) throw createHttpError(413, "This report exceeds the 8 MB export snapshot limit.");
  return snapshot;
};
export const publicPdfJob = (job) => ({
  id: String(job._id), surveyId: String(job.surveyId), title: job.title,
  requestKey: job.requestKey,
  attempts: job.attempts || 0,
  status: job.status, progress: job.progress, message: job.message,
  estimatedTimeLeft: job.estimatedTimeLeft ?? null, createdAt: job.createdAt,
  completedAt: job.completedAt, downloadedAt: job.downloadedAt, expiresAt: job.expiresAt,
});
