import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const SubscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["trial", "paid"], required: true },
    planCode: { type: String, required: true },
    planVersionId: { type: Types.ObjectId, ref: "PlanVersion" },
    pricingSnapshot: Schema.Types.Mixed,
    razorpayOfferId: String,
    checkoutExpiresAt: Date,
    razorpayOrderId: { type: String, sparse: true, unique: true },
    initialPaymentId: { type: String, sparse: true, unique: true },
    initialPaidAt: Date,
    initialPeriodStart: Date,
    initialPeriodEnd: Date,
    initialRevokedAt: Date,
    status: { type: String, enum: ["created", "authenticated", "active", "pending", "halted", "paused", "expired", "cancelled", "completed"], default: "active" },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    projectLimit: { type: Number, required: true, min: 0 },
    projectCount: { type: Number, default: 0, min: 0 },
    trialProjectTypes: { type: [String], enum: ["Road Survey", "Water Way"], default: [] },
    projectAddOnOrders: { type: [String], default: [] },
    amountPaise: Number,
    billingInterval: { type: String, enum: ["trial", "monthly", "yearly"] },
    razorpayPlanId: String,
    razorpaySubscriptionId: { type: String, sparse: true, unique: true },
    paidCount: { type: Number, default: 0 },
    endedAt: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true },
);

SubscriptionSchema.index(
  { userId: 1, kind: 1 },
  { unique: true, partialFilterExpression: { kind: "trial" } },
);
SubscriptionSchema.index({ userId: 1, createdAt: -1 });

export default model("Subscription", SubscriptionSchema);
