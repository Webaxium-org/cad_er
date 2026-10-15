import mongoose from "mongoose";

const CheckoutLockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
CheckoutLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("CheckoutLock", CheckoutLockSchema);
