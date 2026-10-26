import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  amountPaise: { type: Number, required: true },
  cycles: { type: Number, required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  paymentMethod: { type: String, enum: ["upi", "card"], required: true },
  razorpayOfferId: { type: String, required: true },
  razorpayKeyId: { type: String, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  code: { type: String, required: true },
  version: { type: Number, required: true },
  name: { type: String, required: true },
  amountPaise: { type: Number, required: true },
  firstPaymentAmountPaise: { type: Number, default: null },
  ongoingAmountPaise: { type: Number, default: null },
  ongoingOfferAppliesToFirstPeriod: { type: Boolean, default: false },
  interval: { type: String, enum: ["monthly", "yearly"], required: true },
  projectLimit: { type: Number, required: true },
  features: [String],
  highlighted: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  offer: { type: offerSchema, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
schema.index({ code: 1, version: -1 }, { unique: true });
export default mongoose.model("PlanVersion", schema);
