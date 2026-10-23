import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  phone: { type: String, required: true },
  challengeId: { type: String, required: true },
  providerRequestId: String,
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  nextSendAt: { type: Date, required: true },
  verifiedAt: Date,
});

export default mongoose.model("OnboardingVerification", schema);
