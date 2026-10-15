import mongoose from "mongoose";

const RazorpayPlanSchema = new mongoose.Schema({
  keyId: { type: String, required: true },
  code: { type: String, required: true },
  planId: { type: String, required: true },
}, { timestamps: true });

RazorpayPlanSchema.index({ keyId: 1, code: 1 }, { unique: true });

export default mongoose.model("RazorpayPlan", RazorpayPlanSchema);
