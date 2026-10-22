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
  razorpayInvoiceId: String,
  invoiceNumber: String,
  planVersionId: { type: Types.ObjectId, ref: "PlanVersion" },
  subscriptionId: { type: Types.ObjectId, ref: "Subscription" },
  billingPhase: { type: String, enum: ["initial", "recurring", "project_addon"] },
  addOnPeriodStart: Date,
  addOnQuantity: { type: Number, min: 1, max: 100 },
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
PaymentSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ purpose: 1, status: 1, currency: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, purpose: 1, status: 1, currency: 1, createdAt: -1 });

export default model("Payments", PaymentSchema);
