import mongoose from "mongoose";

const RazorpayEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  event: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

export default mongoose.model("RazorpayEvent", RazorpayEventSchema);
