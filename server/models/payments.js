import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const PaymentSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySubscriptionId: String,
  razorpaySignature: String,

  amount: Number,
  currency: { type: String, default: "INR" },

  purpose: {
    type: String,
    enum: ["COURSE_PURCHASE", "SUBSCRIPTION"],
    required: true,
  },

  status: {
    type: String,
    enum: ["CREATED", "SUCCESS", "FAILED"],
    default: "CREATED",
  },

  createdAt: { type: Date, default: Date.now },
});

PaymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });

export default model("Payments", PaymentSchema);
