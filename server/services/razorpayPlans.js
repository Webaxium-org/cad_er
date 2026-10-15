import createHttpError from "http-errors";
import RazorpayPlan from "../models/razorpayPlan.js";
import { getCheckoutKey, razorpayRequest } from "./razorpay.js";
import { SUBSCRIPTION_PLANS } from "./subscriptionPlans.js";

export const getOrCreateRazorpayPlan = async (code) => {
  const plan = SUBSCRIPTION_PLANS[code];
  if (!plan) throw createHttpError(400, "Unknown plan");
  const keyId = getCheckoutKey();
  let mapping = await RazorpayPlan.findOne({ keyId, code });
  if (!mapping) {
    const created = await razorpayRequest("POST", "/plans", {
      period: plan.interval,
      interval: 1,
      item: {
        name: `CADer ${plan.name} ${plan.interval}`,
        amount: plan.amountPaise,
        currency: "INR",
        description: `${plan.projectLimit} new projects per ${plan.interval === "monthly" ? "month" : "year"}`,
      },
      notes: { code },
    });
    try {
      mapping = await RazorpayPlan.findOneAndUpdate(
        { keyId, code },
        { $setOnInsert: { keyId, code, planId: created.id } },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      mapping = await RazorpayPlan.findOne({ keyId, code });
      if (!mapping) throw error;
    }
  }
  const remote = await razorpayRequest("GET", `/plans/${encodeURIComponent(mapping.planId)}`);
  if (remote.item?.amount !== plan.amountPaise || remote.item?.currency !== "INR" || remote.period !== plan.interval || remote.interval !== 1) {
    throw createHttpError(503, "Razorpay plan does not match the configured price");
  }
  return mapping.planId;
};
