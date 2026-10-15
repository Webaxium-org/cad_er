import createHttpError from "http-errors";
import crypto from "node:crypto";
import Subscription from "../models/subscription.js";
import RazorpayEvent from "../models/razorpayEvent.js";
import Payment from "../models/payments.js";
import CheckoutLock from "../models/checkoutLock.js";
import { SUBSCRIPTION_PLANS, publicPlans } from "../services/subscriptionPlans.js";
import { getCurrentSubscription, hasSubscriptionAccess } from "../services/subscriptionAccess.js";
import { getCheckoutKey, razorpayRequest, verifyCheckoutSignature, verifyWebhookSignature } from "../services/razorpay.js";
import { getOrCreateRazorpayPlan } from "../services/razorpayPlans.js";

const fromUnix = (seconds) => seconds ? new Date(seconds * 1000) : null;

const syncPaidSubscription = async (record, remote) => {
  if (remote.id !== record.razorpaySubscriptionId || remote.plan_id !== record.razorpayPlanId) {
    throw createHttpError(409, "Subscription identity mismatch");
  }
  const currentStart = fromUnix(remote.current_start);
  const currentEnd = fromUnix(remote.current_end);
  const periodChanged = currentStart && currentStart.getTime() !== record.periodStart.getTime();
  const update = {
    status: remote.status,
    paidCount: remote.paid_count || 0,
    endedAt: fromUnix(remote.ended_at),
    ...(currentStart && currentEnd ? { periodStart: currentStart, periodEnd: currentEnd } : {}),
  };
  if (periodChanged) {
    const reset = await Subscription.updateOne(
      { _id: record._id, periodStart: record.periodStart },
      { $set: { ...update, projectCount: 0 } },
    );
    if (!reset.modifiedCount) await Subscription.updateOne({ _id: record._id }, { $set: update });
  } else {
    await Subscription.updateOne({ _id: record._id }, { $set: update });
  }
  if ((remote.paid_count || 0) > 0 && currentStart) {
    await Subscription.updateOne(
      { userId: record.userId, kind: "trial", periodEnd: { $gt: currentStart } },
      { $set: { periodEnd: currentStart, status: "cancelled" } },
    );
  }
  return Subscription.findById(record._id);
};

export const listPlans = (_req, res) => res.json({ plans: publicPlans() });

export const getSubscription = async (req, res, next) => {
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    const subscription = await getCurrentSubscription(req.user.userId);
    const pendingCheckout = await Subscription.findOne({ userId: req.user.userId, kind: "paid", status: { $in: ["created", "authenticated"] } }).sort({ createdAt: -1 });
    res.json({
      subscription: {
        kind: subscription.kind,
        planCode: subscription.planCode,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        projectLimit: subscription.projectLimit,
        projectCount: subscription.projectCount,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      hasAccess: hasSubscriptionAccess(subscription),
      pendingCheckout: pendingCheckout ? { planCode: pendingCheckout.planCode, status: pendingCheckout.status } : null,
    });
  } catch (error) { next(error); }
};

export const createCheckout = async (req, res, next) => {
  let lockToken;
  let unsavedRemoteId;
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    const requestedCode = req.body?.planCode;
    if (typeof requestedCode !== "string" || !Object.hasOwn(SUBSCRIPTION_PLANS, requestedCode)) throw createHttpError(400, "Unknown plan");
    const plan = SUBSCRIPTION_PLANS[requestedCode];
    lockToken = crypto.randomUUID();
    try {
      await CheckoutLock.findOneAndUpdate(
        { userId: req.user.userId, expiresAt: { $lte: new Date() } },
        { $set: { token: lockToken, expiresAt: new Date(Date.now() + 60000) } },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (error.code === 11000) throw createHttpError(409, "A checkout is already being prepared");
      throw error;
    }
    const current = await getCurrentSubscription(req.user.userId);
    if (current.kind === "paid" && hasSubscriptionAccess(current)) throw createHttpError(409, "Manage the current subscription before choosing another plan");
    let pending = await Subscription.findOne({ userId: req.user.userId, kind: "paid", status: { $in: ["created", "authenticated"] } }).sort({ createdAt: -1 });
    if (pending) {
      const remotePending = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(pending.razorpaySubscriptionId)}`);
      pending = await syncPaidSubscription(pending, remotePending);
      if (["created", "authenticated"].includes(pending.status)) {
        if (pending.planCode !== requestedCode) throw createHttpError(409, "Finish or cancel the pending checkout first");
        return res.json({ keyId: getCheckoutKey(), subscriptionId: pending.razorpaySubscriptionId, planCode: pending.planCode });
      }
      if (hasSubscriptionAccess(pending)) throw createHttpError(409, "Manage the current subscription before choosing another plan");
    }

    const planId = await getOrCreateRazorpayPlan(requestedCode);
    const remote = await razorpayRequest("POST", "/subscriptions", {
      plan_id: planId,
      total_count: plan.interval === "monthly" ? 120 : 10,
      quantity: 1,
      customer_notify: true,
      notes: { userId: String(req.user.userId), planCode: requestedCode },
    });
    unsavedRemoteId = remote.id;
    const now = new Date();
    await Subscription.create({
      userId: req.user.userId,
      kind: "paid",
      planCode: requestedCode,
      status: "created",
      periodStart: now,
      periodEnd: now,
      projectLimit: plan.projectLimit,
      projectCount: 0,
      amountPaise: plan.amountPaise,
      billingInterval: plan.interval,
      razorpayPlanId: planId,
      razorpaySubscriptionId: remote.id,
    });
    unsavedRemoteId = null;
    res.json({ keyId: getCheckoutKey(), subscriptionId: remote.id, planCode: requestedCode });
  } catch (error) {
    if (unsavedRemoteId) {
      try { await razorpayRequest("POST", `/subscriptions/${encodeURIComponent(unsavedRemoteId)}/cancel`, { cancel_at_cycle_end: false }); }
      catch (cleanupError) { console.error("Could not cancel orphaned Razorpay subscription", cleanupError); }
    }
    next(error);
  }
  finally { if (lockToken) await CheckoutLock.deleteOne({ userId: req.user.userId, token: lockToken }); }
};

export const verifyCheckout = async (req, res, next) => {
  try {
    const { razorpay_subscription_id: subscriptionId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    const record = await Subscription.findOne({ userId: req.user.userId, razorpaySubscriptionId: subscriptionId, kind: "paid" });
    if (!record || !paymentId || !verifyCheckoutSignature(record.razorpaySubscriptionId, paymentId, signature)) {
      throw createHttpError(400, "Invalid checkout confirmation");
    }
    const remote = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(record.razorpaySubscriptionId)}`);
    const updated = await syncPaidSubscription(record, remote);
    res.json({ status: updated.status, hasAccess: hasSubscriptionAccess(updated) });
  } catch (error) { next(error); }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const record = await Subscription.findOne({ userId: req.user.userId, kind: "paid", status: { $in: ["created", "authenticated", "active", "pending"] } }).sort({ createdAt: -1 });
    if (!record) throw createHttpError(404, "No cancellable subscription");
    const atPeriodEnd = record.paidCount > 0 && record.periodEnd > new Date();
    const remote = await razorpayRequest("POST", `/subscriptions/${encodeURIComponent(record.razorpaySubscriptionId)}/cancel`, { cancel_at_cycle_end: atPeriodEnd });
    await syncPaidSubscription(record, remote);
    await Subscription.updateOne({ _id: record._id }, { $set: { cancelAtPeriodEnd: atPeriodEnd } });
    res.json({ success: true, periodEnd: atPeriodEnd ? record.periodEnd : null });
  } catch (error) { next(error); }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    if (!verifyWebhookSignature(req.body, req.get("x-razorpay-signature"))) throw createHttpError(400, "Invalid webhook signature");
    const eventId = req.get("x-razorpay-event-id");
    if (!eventId) throw createHttpError(400, "Missing webhook event ID");
    if (await RazorpayEvent.exists({ eventId })) return res.json({ success: true });
    const event = JSON.parse(req.body.toString("utf8"));
    const subscriptionId = event.payload?.subscription?.entity?.id;
    if (subscriptionId) {
      const record = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
      if (record) {
        const remote = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
        await syncPaidSubscription(record, remote);
        const payment = event.payload?.payment?.entity;
        if (payment?.id && payment.status === "captured" && payment.amount === record.amountPaise && payment.currency === "INR") {
          await Payment.updateOne(
            { razorpayPaymentId: payment.id },
            { $setOnInsert: { userId: record.userId, razorpaySubscriptionId: subscriptionId, razorpayPaymentId: payment.id, amount: payment.amount, currency: payment.currency, purpose: "SUBSCRIPTION", status: "SUCCESS" } },
            { upsert: true },
          );
        }
      } else if (event.payload?.subscription?.entity?.notes?.userId) {
        // Our checkout record may still be committing; request a webhook retry.
        throw createHttpError(503, "Subscription record is not ready");
      }
    }
    try { await RazorpayEvent.create({ eventId, event: event.event }); }
    catch (error) { if (error.code !== 11000) throw error; }
    res.json({ success: true });
  } catch (error) { next(error); }
};
