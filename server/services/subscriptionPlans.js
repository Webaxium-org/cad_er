import crypto from "node:crypto";
import createHttpError from "http-errors";
import PlanVersion from "../models/planVersion.js";
import Subscription from "../models/subscription.js";
import { checkoutPricing } from "./checkoutPricing.js";

// Migration seeds only. Runtime prices are always read from MongoDB.
export const SUBSCRIPTION_PLANS = Object.freeze({
  junior_monthly: { name: "Junior", amountPaise: 99900, firstPaymentAmountPaise: 9900, interval: "monthly", projectLimit: 1,
    features: ["Single user access", "Cloud storage", "Export to .pdf, .csv, .dwg and .xlsx formats", "Use anywhere (mobile / tablet / desktop)"] },
  executive_monthly: { name: "Executive", amountPaise: 499900, firstPaymentAmountPaise: 49900, interval: "monthly", projectLimit: 6,
    features: ["Priority email support"] },
  director_monthly: { name: "Director", amountPaise: 999900, firstPaymentAmountPaise: 99900, interval: "monthly", projectLimit: 14,
    features: ["Multi user access (2 nos)", "Community access"] },
  professionals_yearly: { name: "Engineer", amountPaise: 1999900, firstPaymentAmountPaise: 599900, interval: "yearly", projectLimit: 80,
    features: ["Single user access", "Cloud storage", "Auto level calibration check", "Export to .pdf, .csv, .dwg and .xlsx formats", "Use anywhere (mobile / tablet / desktop)"] },
  teams_yearly: { name: "Proprietor", amountPaise: 4999900, firstPaymentAmountPaise: 1199900, interval: "yearly", projectLimit: 200,
    features: ["Multi user access (2 nos)", "Community access", "On-site training", "Priority email support"] },
});

export const seedPlans = async () => {
  await PlanVersion.init();
  for (const [code, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    try { await PlanVersion.updateOne({ code, version: 1 }, { $setOnInsert: {
      ...plan, code, version: 1, available: true, offer: null,
      highlighted: ["executive_monthly", "teams_yearly"].includes(code),
      features: plan.features,
    } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    const legacy = await PlanVersion.findOne({ code, version: 1 }).lean();
    await Subscription.updateMany({ kind: "paid", planCode: code, planVersionId: { $exists: false },
      amountPaise: legacy.amountPaise, billingInterval: legacy.interval, projectLimit: legacy.projectLimit,
    }, { $set: { planVersionId: legacy._id, pricingSnapshot: quotePlan(legacy) } });
  }
};

export const latestPlans = () => PlanVersion.aggregate([
  { $match: { code: { $in: Object.keys(SUBSCRIPTION_PLANS) } } },
  { $sort: { code: 1, version: -1 } },
  { $group: { _id: "$code", plan: { $first: "$$ROOT" } } },
  { $replaceRoot: { newRoot: "$plan" } },
  { $sort: { interval: 1, amountPaise: 1 } },
]);

export const activeOffer = (plan, now = new Date()) => plan.offer &&
  new Date(plan.offer.startsAt) <= now && new Date(plan.offer.endsAt) > now ? plan.offer : null;

export const quotePlan = (plan, now = new Date()) => {
  const offer = activeOffer(plan, now);
  const result = {
    id: String(plan._id), code: plan.code, version: plan.version, name: plan.name,
    amountPaise: plan.amountPaise, interval: plan.interval, projectLimit: plan.projectLimit,
    firstPaymentAmountPaise: plan.firstPaymentAmountPaise ?? null,
    checkout: checkoutPricing(plan.firstPaymentAmountPaise ?? (offer?.amountPaise ?? plan.amountPaise)),
    renewalCheckout: checkoutPricing(plan.amountPaise),
    features: plan.features || [], highlighted: plan.highlighted,
    offer: offer ? { amountPaise: offer.amountPaise, cycles: offer.cycles,
      endsAt: offer.endsAt, paymentMethod: offer.paymentMethod } : null,
  };
  result.quoteKey = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex");
  return result;
};

export const quotePlanForUser = async (plan, userId) => {
  if (userId && plan.firstPaymentAmountPaise != null && await Subscription.exists({
    userId, kind: "paid", planCode: plan.code, $or: [{ initialPaidAt: { $ne: null } }, { paidCount: { $gt: 0 } }],
  })) return quotePlan({ ...plan, firstPaymentAmountPaise: null });
  return quotePlan(plan);
};

export const publicPlans = async userId => Promise.all((await latestPlans()).filter(p => p.available).map(p => quotePlanForUser(p, userId)));

export const validatePlan = (input) => {
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!input || typeof input.name !== "string" || !input.name.trim() || input.name.length > 80 ||
      !integer(input.amountPaise, 100, 100000000) || !integer(input.projectLimit, 1, 1000000) ||
      !["monthly", "yearly"].includes(input.interval) || typeof input.available !== "boolean" ||
      typeof input.highlighted !== "boolean" || !Array.isArray(input.features) || input.features.length > 20 ||
      input.features.some(f => typeof f !== "string" || !f.trim() || f.length > 200)) {
    throw createHttpError(400, "Enter a valid name, price, billing interval, project limit and features");
  }
  // Existing offer versions remain readable, but new versions use an initial payment.
  if (input.offer) throw createHttpError(400, "Use the first-period price instead of a Razorpay offer");
  const firstPaymentAmountPaise = input.firstPaymentAmountPaise ?? null;
  if (firstPaymentAmountPaise !== null && !integer(firstPaymentAmountPaise, 100, 100000000)) {
    throw createHttpError(400, "First-period price must be between INR 1 and INR 10,00,000");
  }
  return { name: input.name.trim(), amountPaise: input.amountPaise, interval: input.interval,
    projectLimit: input.projectLimit, available: input.available, highlighted: input.highlighted,
    features: input.features.map(f => f.trim()), firstPaymentAmountPaise, offer: null };
};

export const renewalAmount = (subscription) => {
  const offer = subscription.pricingSnapshot?.offer;
  return offer && subscription.paidCount < offer.cycles
    ? (subscription.pricingSnapshot?.checkout ? checkoutPricing(offer.amountPaise).totalPaise : offer.amountPaise)
    : subscription.amountPaise;
};
