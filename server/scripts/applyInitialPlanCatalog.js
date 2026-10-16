import "../config/env.js";
import mongoose from "mongoose";
import PlanVersion from "../models/planVersion.js";
import Subscription from "../models/subscription.js";
import RazorpayPlan from "../models/razorpayPlan.js";
import { SUBSCRIPTION_PLANS } from "../services/subscriptionPlans.js";

// One-time correction of the original catalog. Purchased or provider-linked
// versions remain immutable; only those plans need a second version.
const original = {
  junior_monthly: { name: "Junior", amountPaise: 9900 },
  executive_monthly: { name: "Executive", amountPaise: 49900 },
  director_monthly: { name: "Director", amountPaise: 99900 },
  professionals_yearly: { name: "Professionals", amountPaise: 599900 },
  teams_yearly: { name: "Teams", amountPaise: 1199900 },
};
const reversedYearly = {
  professionals_yearly: { name: "Engineer", amountPaise: 599900, firstPaymentAmountPaise: 1999900 },
  teams_yearly: { name: "Proprietor", amountPaise: 1199900, firstPaymentAmountPaise: 4999900 },
};

try {
  await mongoose.connect(process.env.MONGO_URI);
  await PlanVersion.init();
  for (const [code, desired] of Object.entries(SUBSCRIPTION_PLANS)) {
    const versions = await PlanVersion.find({ code }).sort({ version: -1 }).lean();
    const current = versions[0];
    if (!current) throw new Error(`${code}: seed plans before applying the catalog`);
    const matches = current.name === desired.name && current.amountPaise === desired.amountPaise &&
      current.firstPaymentAmountPaise === desired.firstPaymentAmountPaise &&
      current.projectLimit === desired.projectLimit && current.interval === desired.interval &&
      JSON.stringify(current.features) === JSON.stringify(desired.features);
    if (matches) { console.log(`${code}: already configured`); continue; }
    const wasOriginal = versions.length === 1 && current.version === 1 &&
      current.name === original[code].name && current.amountPaise === original[code].amountPaise &&
      current.firstPaymentAmountPaise == null && current.interval === desired.interval;
    const reversed = reversedYearly[code];
    const wasReversedYearly = versions.length === 1 && current.version === 1 && reversed &&
      current.name === reversed.name && current.amountPaise === reversed.amountPaise &&
      current.firstPaymentAmountPaise === reversed.firstPaymentAmountPaise &&
      current.interval === desired.interval && current.projectLimit === desired.projectLimit &&
      JSON.stringify(current.features) === JSON.stringify(desired.features);
    if (!wasOriginal && !wasReversedYearly) throw new Error(`${code}: existing catalog was customized; review before changing it`);
    const protectedVersion = await Subscription.exists({ kind: "paid", planCode: code }) ||
      await RazorpayPlan.exists({ code });
    if (protectedVersion) {
      await PlanVersion.create({ ...desired, code, version: 2, available: true, highlighted: current.highlighted, offer: null });
      console.log(`${code}: added version 2; purchased/provider-linked version 1 preserved`);
    } else {
      const result = await PlanVersion.updateOne({ _id: current._id, version: 1, name: current.name,
        amountPaise: current.amountPaise }, { $set: { ...desired, offer: null } });
      if (result.modifiedCount !== 1) throw new Error(`${code}: catalog changed during migration`);
      console.log(`${code}: corrected untouched version 1`);
    }
  }
} finally {
  await mongoose.disconnect();
}
