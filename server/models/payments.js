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

export default model("Payments", PaymentSchema);
