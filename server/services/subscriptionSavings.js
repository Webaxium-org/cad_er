import Payment from "../models/payments.js";
import Subscription from "../models/subscription.js";
import PlanVersion from "../models/planVersion.js";
import { invoicePricing } from "./invoicePricing.js";

// Compare base plan prices, excluding GST and processing fees on both sides.
export const subscriptionPaymentSavings = payment => {
  if (payment.status !== "SUCCESS" || payment.purpose !== "SUBSCRIPTION" || payment.currency !== "INR" ||
      !["initial", "recurring"].includes(payment.billingPhase) || !Number.isSafeInteger(payment.amount) || payment.amount <= 0 ||
      payment.razorpayPaymentId?.startsWith("test_manual_")) return 0;
  const subscription = payment.subscriptionId;
  if (payment.billingPhase === "initial" && subscription?.initialRevokedAt) return 0;
  const regular = subscription?.pricingSnapshot?.amountPaise ?? payment.planVersionId?.amountPaise;
  const breakdown = invoicePricing(payment, subscription);
  if (!Number.isSafeInteger(regular) || regular <= 0 || !breakdown) return 0;
  return Math.max(0, regular - breakdown.basePaise);
};

export const getTotalSubscriptionSavings = async userId => {
  const payments = Payment.find({ userId, purpose: "SUBSCRIPTION", status: "SUCCESS", currency: "INR",
    billingPhase: { $in: ["initial", "recurring"] }, amount: { $gt: 0 } })
    .select("status purpose currency billingPhase amount razorpayPaymentId checkoutBreakdown subscriptionId planVersionId")
    .populate({ path: "subscriptionId", model: Subscription, match: { userId }, select: "pricingSnapshot initialRevokedAt" })
    .populate({ path: "planVersionId", model: PlanVersion, select: "amountPaise" })
    .lean().cursor();
  let total = 0;
  for await (const payment of payments) total += subscriptionPaymentSavings(payment);
  return total;
};
