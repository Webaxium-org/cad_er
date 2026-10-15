import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const SubscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["trial", "paid"], required: true },
    planCode: { type: String, required: true },
    status: { type: String, enum: ["created", "authenticated", "active", "pending", "halted", "paused", "expired", "cancelled", "completed"], default: "active" },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    projectLimit: { type: Number, required: true, min: 0 },
    projectCount: { type: Number, default: 0, min: 0 },
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
