import "../config/env.js";
import mongoose from "mongoose";
import PlanVersion from "../models/planVersion.js";
import RazorpayPlan from "../models/razorpayPlan.js";
import { SUBSCRIPTION_PLANS } from "../services/subscriptionPlans.js";

const code = "junior_monthly";
const archivedCode = "archived_junior_monthly_original";

try {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.transaction(async session => {
    const versions = await PlanVersion.find({ code }).sort({ version: 1 }).session(session).lean();
    if (versions.length === 1 && versions[0].version === 1 &&
        versions[0].amountPaise === SUBSCRIPTION_PLANS[code].amountPaise &&
        versions[0].firstPaymentAmountPaise === SUBSCRIPTION_PLANS[code].firstPaymentAmountPaise) {
      console.log("Junior: current catalog is already version 1");
      return;
    }
    const [oldPlan, currentPlan] = versions;
    if (versions.length !== 2 || oldPlan.version !== 1 || currentPlan.version !== 2 ||
        oldPlan.amountPaise !== 9900 || oldPlan.firstPaymentAmountPaise != null ||
        currentPlan.amountPaise !== SUBSCRIPTION_PLANS[code].amountPaise ||
        currentPlan.firstPaymentAmountPaise !== SUBSCRIPTION_PLANS[code].firstPaymentAmountPaise ||
        await PlanVersion.exists({ code: archivedCode }).session(session)) {
      throw new Error("Junior catalog differs from the expected initial setup; no changes made");
    }
    // Keep the original document addressable by purchased subscription references,
    // while removing it from the visible Junior catalog and version history.
    await PlanVersion.updateOne({ _id: oldPlan._id, code, version: 1 },
      { $set: { code: archivedCode, available: false } }, { session });
    // The old Razorpay plan is priced at INR 99. Free the v1 lookup key so
    // future checkouts create a new provider plan at INR 999.
    await RazorpayPlan.updateMany({ code }, { $set: { code: archivedCode } }, { session });
    await PlanVersion.updateOne({ _id: currentPlan._id, code, version: 2 },
      { $set: { version: 1 } }, { session });
    console.log("Junior: current catalog is version 1; old purchased terms archived");
  });
} finally { await mongoose.disconnect(); }
