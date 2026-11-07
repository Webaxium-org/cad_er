import { randomUUID } from "node:crypto";

// Log slow queue acceptance separately from the background rendering job.
// Never log cookies, tokens, report contents, or database connection strings.
export const pdfExportTiming = (req, res, next) => {
  if (req.method !== "POST") return next();
  const started = Date.now(), traceId = randomUUID();
  let slow = false, finished = false;
  req.pdfExportStage = "authentication";
  const details = () => ({ traceId, stage: req.pdfExportStage, elapsedMs: Date.now() - started,
    contentLength: Number(req.headers["content-length"]) || null });
  const timer = setTimeout(() => {
    slow = true;
    console.warn("PDF export queue request is slow", details());
  }, 10000);
  timer.unref();
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (slow || res.statusCode >= 500 || !res.writableFinished) {
      console.warn("PDF export queue request ended", { ...details(), status: res.statusCode, responseFinished: res.writableFinished });
    }
  };
  res.once("finish", finish);
  res.once("close", finish);
  next();
};
