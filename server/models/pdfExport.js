import mongoose from "mongoose";
import { pdfExportCollection } from "../services/pdfExportQueue.js";
const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  surveyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  requestKey: { type: String, required: true },
  title: String,
  active: { type: Boolean, default: true },
  status: { type: String, enum: ["queued", "running", "completed", "failed", "cancelled"], default: "queued" },
  snapshot: { type: mongoose.Schema.Types.Mixed, select: false },
  progress: { type: Number, default: 0 },
  message: { type: String, default: "Queued for PDF generation..." },
  estimatedTimeLeft: Number,
  attempts: { type: Number, default: 0 },
  leaseToken: String,
  leaseUntil: Date,
  fileId: mongoose.Schema.Types.ObjectId,
  completedAt: Date,
  downloadedAt: Date,
  dismissedAt: Date,
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });
schema.index({ owner: 1, active: 1 }, { unique: true, partialFilterExpression: { active: true } });
schema.index({ owner: 1, requestKey: 1 }, { unique: true });
schema.index({ status: 1, leaseUntil: 1, createdAt: 1 });
export default mongoose.model("PdfExport", schema, pdfExportCollection());
