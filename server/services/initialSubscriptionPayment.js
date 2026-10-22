import createHttpError from "http-errors";
import Subscription from "../models/subscription.js";
import Payment from "../models/payments.js";
import { ensurePaymentInvoice } from "./paymentInvoice.js";
import { razorpayRequest } from "./razorpay.js";

// Calendar billing: Jan 31 -> Feb 28/29, and Feb 29 -> Feb 28 next year.
export const nextBillingDate = (start, interval) => {
  const end = new Date(start);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + (interval === "yearly" ? 12 : 1));
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
};

export const hasInitialAccess = (record, now = new Date()) => Boolean(record?.kind === "paid" &&
  record.initialPaidAt && !record.initialRevokedAt && record.initialPeriodStart <= now && record.initialPeriodEnd > now);

export const initialAccessFilter = now => ({ initialPaidAt: { $ne: null }, initialRevokedAt: null,
  initialPeriodStart: { $lte: now }, initialPeriodEnd: { $gt: now } });

export const needsAutopaySetup = (record, now = new Date()) => hasInitialAccess(record, now) &&
  !record.cancelAtPeriodEnd && (!record.razorpaySubscriptionId || record.status === "created");

export const recordInitialPayment = async (record, payment) => {
  if (!record.razorpayOrderId || payment.order_id !== record.razorpayOrderId || payment.currency !== "INR" ||
      payment.amount !== (record.pricingSnapshot?.checkout?.totalPaise ?? record.pricingSnapshot?.firstPaymentAmountPaise) || !payment.id) {
    throw createHttpError(409, "Initial payment does not match this purchase");
  }
  if (payment.amount_refunded >= payment.amount) {
    await Subscription.updateOne({ _id: record._id }, { $set: { initialRevokedAt: new Date() } });
    return Subscription.findById(record._id);
  }
  if (payment.status !== "captured") return record;
  const start = new Date(payment.created_at * 1000);
  if (!Number.isFinite(start.getTime()) || start > new Date()) throw createHttpError(502, "Invalid payment date");
  const end = nextBillingDate(start, record.billingInterval);
  // The first successful capture fixes the entitlement once; retries cannot reset quota/dates.
  await Subscription.updateOne({ _id: record._id, initialPaymentId: { $exists: false } }, { $set: {
    initialPaymentId: payment.id, initialPaidAt: start, initialPeriodStart: start, initialPeriodEnd: end,
    periodStart: start, periodEnd: end,
  } });
  const updated = await Subscription.findById(record._id);
  if (updated.initialPaymentId !== payment.id) throw createHttpError(409, "Another initial payment is already recorded");
  await Payment.updateOne({ razorpayPaymentId: payment.id }, { $setOnInsert: {
    userId: record.userId, subscriptionId: record._id, planVersionId: record.planVersionId,
    razorpayOrderId: record.razorpayOrderId, razorpayPaymentId: payment.id,
    billingPhase: "initial", amount: payment.amount, currency: payment.currency, purpose: "SUBSCRIPTION", status: "SUCCESS",
  } }, { upsert: true });
  await ensurePaymentInvoice({ razorpayPaymentId: payment.id });
  await Subscription.updateOne({ userId: record.userId, kind: "trial", periodEnd: { $gt: start } },
    { $set: { periodEnd: start, status: "cancelled" } });
  return updated;
};

// Reconcile after a closed browser or a delayed webhook without charging again.
export const reconcileInitialOrder = async record => {
  const payments = await razorpayRequest("GET", `/orders/${encodeURIComponent(record.razorpayOrderId)}/payments`);
  const captured = payments.items?.find(payment => payment.status === "captured");
  return captured ? recordInitialPayment(record, captured) : record;
};
