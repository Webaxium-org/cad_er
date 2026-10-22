import createHttpError from "http-errors";
import crypto from "node:crypto";
import Subscription from "../models/subscription.js";
import RazorpayEvent from "../models/razorpayEvent.js";
import Payment from "../models/payments.js";
import { ensurePaymentInvoice } from "../services/paymentInvoice.js";
import CheckoutLock from "../models/checkoutLock.js";
import { publicPlans, activeOffer, quotePlanForUser, renewalAmount } from "../services/subscriptionPlans.js";
import PlanVersion from "../models/planVersion.js";
import { getCurrentSubscription, hasSubscriptionAccess } from "../services/subscriptionAccess.js";
import { getCheckoutKey, razorpayRequest, verifyCheckoutSignature, verifyWebhookSignature } from "../services/razorpay.js";
import { getOrCreateRazorpayPlan } from "../services/razorpayPlans.js";
import { verifyOrderSignature } from "../services/razorpay.js";
import { hasInitialAccess, needsAutopaySetup, recordInitialPayment, reconcileInitialOrder } from "../services/initialSubscriptionPayment.js";
import { PROJECT_ADD_ON_QUOTE, projectAddOnQuote, captureProjectAddOn, reconcileProjectAddOns, refundProjectAddOn } from "../services/projectAddOn.js";

const fromUnix = (seconds) => seconds ? new Date(seconds * 1000) : null;

const syncPaidSubscription = async (record, remote) => {
  if (remote.id !== record.razorpaySubscriptionId || remote.plan_id !== record.razorpayPlanId) {
    throw createHttpError(409, "Subscription identity mismatch");
  }
  // A mandate authorisation or an unpaid first renewal must not replace paid upfront access.
  const remoteStart = fromUnix(remote.current_start);
  const paidPeriod = remote.paid_count > 0 && ((remote.paid_count || 0) > (record.paidCount || 0) ||
    remoteStart?.getTime() === record.periodStart?.getTime());
  const currentStart = paidPeriod ? remoteStart : null;
  const currentEnd = paidPeriod ? fromUnix(remote.current_end) : null;
  const periodChanged = currentStart && currentStart.getTime() !== record.periodStart.getTime();
  const update = {
    status: remote.status,
    paidCount: remote.paid_count || 0,
    endedAt: fromUnix(remote.ended_at),
    ...(currentStart && currentEnd ? { periodStart: currentStart, periodEnd: currentEnd } : {}),
  };
  const monotonic = { _id: record._id, paidCount: { $lte: remote.paid_count || 0 } };
  if (periodChanged) {
    const reset = await Subscription.updateOne(
      { ...monotonic, periodStart: record.periodStart },
      { $set: { ...update, projectCount: 0, projectLimit: record.pricingSnapshot?.projectLimit ?? record.projectLimit, projectAddOnOrders: [] } },
    );
    if (!reset.modifiedCount) await Subscription.updateOne({ ...monotonic, periodStart: { $lte: currentStart } }, { $set: update });
  } else {
    await Subscription.updateOne(monotonic, { $set: update });
  }
  if ((remote.paid_count || 0) > 0 && currentStart) {
    await Subscription.updateOne(
      { userId: record.userId, kind: "trial", periodEnd: { $gt: currentStart } },
      { $set: { periodEnd: currentStart, status: "cancelled" } },
    );
  }
  return Subscription.findById(record._id);
};

export const listPlans = async (req, res, next) => {
  try { res.set("Cache-Control", "no-store").json({ plans: await publicPlans(req.user?.userId) }); }
  catch (error) { next(error); }
};

export const getSubscription = async (req, res, next) => {
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    let pendingCheckout = await Subscription.findOne({ userId: req.user.userId, kind: "paid", initialPaidAt: null, status: { $in: ["created", "authenticated"] } }).sort({ createdAt: -1 });
    if (pendingCheckout?.razorpayOrderId) {
      pendingCheckout = await reconcileInitialOrder(pendingCheckout);
      if (pendingCheckout.initialPaidAt) pendingCheckout = null;
    }
    const subscription = await getCurrentSubscription(req.user.userId);
    if (subscription.kind === "paid" && hasSubscriptionAccess(subscription)) await reconcileProjectAddOns(subscription);
    const current = await Subscription.findById(subscription._id);
    res.json({
      subscription: {
        id: subscription._id,
        kind: subscription.kind,
        planCode: subscription.planCode,
        planName: subscription.pricingSnapshot?.name,
        pricingSnapshot: subscription.pricingSnapshot,
        amountPaise: subscription.amountPaise,
        nextAmountPaise: renewalAmount(subscription),
        billingInterval: subscription.billingInterval,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        projectLimit: current.projectLimit,
        projectCount: current.projectCount,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || ["cancelled", "completed", "expired"].includes(subscription.status),
        autopaySetupRequired: needsAutopaySetup(subscription),
        initialPeriodEnd: subscription.initialPeriodEnd,
        initialPaidAt: subscription.initialPaidAt,
        canCancelRenewal: Boolean(subscription.razorpaySubscriptionId && ["created", "authenticated", "active", "pending", "halted", "paused"].includes(subscription.status)),
      },
      hasAccess: hasSubscriptionAccess(subscription),
      projectAddOnQuote: PROJECT_ADD_ON_QUOTE,
      pendingCheckout: pendingCheckout ? { planCode: pendingCheckout.planCode, status: pendingCheckout.status,
        pricingSnapshot: pendingCheckout.pricingSnapshot, expiresAt: pendingCheckout.checkoutExpiresAt } : null,
    });
  } catch (error) { next(error); }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const pageSize = 10;
    const filter = { userId: req.user.userId, purpose: "SUBSCRIPTION", status: "SUCCESS",
      currency: "INR", razorpayPaymentId: { $exists: true, $ne: null } };
    const [total, rows] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize)
        .select("subscriptionId planVersionId billingPhase addOnQuantity amount createdAt razorpayPaymentId invoiceNumber")
        .populate("subscriptionId", "planCode pricingSnapshot")
        .populate("planVersionId", "name")
        .lean(),
    ]);
    // Older successful payments receive their number once when first viewed.
    for (const row of rows) {
      if (!row.invoiceNumber) row.invoiceNumber = await ensurePaymentInvoice({ _id: row._id });
    }
    res.set("Cache-Control", "no-store").json({ page, pageSize, total,
      payments: rows.map(row => ({ id: row._id,
        planName: row.subscriptionId?.pricingSnapshot?.name || row.planVersionId?.name ||
          row.subscriptionId?.planCode?.replaceAll("_", " ") || "Subscription",
        phase: row.billingPhase || "legacy", quantity: row.addOnQuantity || 1, amountPaise: row.amount, createdAt: row.createdAt,
        paymentId: row.razorpayPaymentId, invoiceNumber: row.invoiceNumber, status: "SUCCESS",
      })) });
  } catch (error) { next(error); }
};

export const createProjectAddOnCheckout = async (req, res, next) => {
  let lockToken;
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    const quantity = req.body?.quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw createHttpError(400, "Choose between 1 and 100 projects");
    lockToken = await acquireBillingLock(req.user.userId);
    const subscription = await getCurrentSubscription(req.user.userId);
    if (subscription.kind !== "paid" || !hasSubscriptionAccess(subscription)) throw createHttpError(409, "An active paid plan is required");
    const quote = projectAddOnQuote(quantity);
    const order = await razorpayRequest("POST", "/orders", { amount: quote.totalPaise,
      currency: "INR", partial_payment: false, receipt: crypto.randomUUID(),
      notes: { purpose: "project_addon", userId: String(req.user.userId), subscriptionId: String(subscription._id), quantity: String(quantity) } });
    if (!order.id || order.amount !== quote.totalPaise || order.currency !== "INR") {
      throw createHttpError(502, "Payment provider did not confirm the project price");
    }
    await Payment.create({ userId: req.user.userId, subscriptionId: subscription._id,
      planVersionId: subscription.planVersionId, addOnPeriodStart: subscription.periodStart, addOnQuantity: quantity,
      razorpayOrderId: order.id, billingPhase: "project_addon", amount: quote.totalPaise,
      currency: "INR", purpose: "SUBSCRIPTION", status: "CREATED" });
    res.json({ keyId: getCheckoutKey(), orderId: order.id, amountPaise: quote.totalPaise, quantity, currency: "INR" });
  } catch (error) { next(error); }
  finally { if (lockToken) await CheckoutLock.deleteOne({ userId: req.user.userId, token: lockToken }); }
};

export const verifyProjectAddOnCheckout = async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    const order = await Payment.findOne({ userId: req.user.userId, razorpayOrderId: orderId, billingPhase: "project_addon" });
    if (!order || typeof paymentId !== "string" || !verifyOrderSignature(orderId, paymentId, signature)) {
      throw createHttpError(400, "Invalid project payment confirmation");
    }
    const payment = await razorpayRequest("GET", `/payments/${encodeURIComponent(paymentId)}`);
    const captured = await captureProjectAddOn(order, payment);
    res.json({ captured });
  } catch (error) { next(error); }
};

export const createCheckout = async (req, res, next) => {
  let lockToken;
  let unsavedRemoteId;
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    const requestedCode = req.body?.planCode;
    if (typeof requestedCode !== "string" || !/^[a-z_]{1,60}$/.test(requestedCode)) throw createHttpError(400, "Unknown plan");
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
    if (current.razorpaySubscriptionId && (current.initialPaidAt || ["halted", "paused", "pending"].includes(current.status)) &&
        ["created", "authenticated", "active", "pending", "halted", "paused"].includes(current.status)) {
      throw createHttpError(409, "Cancel the current auto pay mandate before choosing another plan");
    }
    let pending = await Subscription.findOne({ userId: req.user.userId, kind: "paid", initialPaidAt: null, status: { $in: ["created", "authenticated"] } }).sort({ createdAt: -1 });
    if (pending) {
      if (pending.razorpayOrderId) {
        pending = await reconcileInitialOrder(pending);
        if (pending.initialPaidAt) return res.json({ type: "paid", subscriptionRecordId: pending._id });
        if (pending.planCode !== requestedCode) throw createHttpError(409, "Finish or cancel the pending checkout first");
        if (pending.checkoutExpiresAt <= new Date()) throw createHttpError(409, "Checkout expired. Cancel it and choose the plan again");
        const order = await razorpayRequest("GET", `/orders/${encodeURIComponent(pending.razorpayOrderId)}`);
        if (order.attempts > 0) throw createHttpError(409, "A payment was attempted. Refresh to check its result; if it failed, cancel this checkout and try again");
        return res.json(initialCheckoutResponse(pending));
      }
      const remotePending = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(pending.razorpaySubscriptionId)}`);
      pending = await syncPaidSubscription(pending, remotePending);
      if (["created", "authenticated"].includes(pending.status)) {
        if (pending.planCode !== requestedCode) throw createHttpError(409, "Finish or cancel the pending checkout first");
        if (pending.checkoutExpiresAt && pending.checkoutExpiresAt <= new Date()) throw createHttpError(409, "This checkout has expired. Cancel it and choose a plan again");
        return res.json({ keyId: getCheckoutKey(), subscriptionId: pending.razorpaySubscriptionId, planCode: pending.planCode, pricing: pending.pricingSnapshot });
      }
      if (hasSubscriptionAccess(pending)) throw createHttpError(409, "Manage the current subscription before choosing another plan");
    }

    const plan = await PlanVersion.findOne({ code: requestedCode }).sort({ version: -1 }).lean();
    if (!plan?.available) throw createHttpError(400, "This plan is no longer available");
    const pricing = await quotePlanForUser(plan, req.user.userId);
    if (req.body.quoteKey !== pricing.quoteKey) throw createHttpError(409, "Pricing or offer availability changed. Refresh and review the current price");
    if (pricing.firstPaymentAmountPaise != null) {
      const order = await razorpayRequest("POST", "/orders", {
        amount: pricing.checkout.totalPaise, currency: "INR", partial_payment: false,
        receipt: crypto.randomUUID(),
        notes: { purpose: "subscription_initial", userId: String(req.user.userId), planVersionId: String(plan._id) },
      });
      if (!order.id || order.amount !== pricing.checkout.totalPaise || order.currency !== "INR") throw createHttpError(502, "Payment provider did not confirm the initial amount");
      const now = new Date();
      const record = await Subscription.create({ userId: req.user.userId, kind: "paid", planCode: plan.code,
        planVersionId: plan._id, pricingSnapshot: pricing, razorpayOrderId: order.id,
        checkoutExpiresAt: new Date(Date.now() + 30 * 60000), status: "created", periodStart: now, periodEnd: now,
        projectLimit: plan.projectLimit, projectCount: 0, amountPaise: pricing.renewalCheckout.totalPaise, billingInterval: plan.interval,
      });
      return res.json(initialCheckoutResponse(record));
    }
    const offer = activeOffer(plan);
    if (offer) throw createHttpError(409, "This legacy offer cannot include the updated checkout charges. Choose a current plan price");
    const checkoutExpiresAt = new Date(Math.min(Date.now() + 30 * 60 * 1000, offer ? new Date(offer.endsAt).getTime() : Infinity));
    if (checkoutExpiresAt.getTime() - Date.now() < 60000) throw createHttpError(409, "This offer is ending. Refresh in a minute for current pricing");
    const planId = await getOrCreateRazorpayPlan(plan, pricing.renewalCheckout.totalPaise);
    const remote = await razorpayRequest("POST", "/subscriptions", {
      plan_id: planId,
      ...(offer ? { offer_id: offer.razorpayOfferId } : {}),
      expire_by: Math.floor(checkoutExpiresAt.getTime() / 1000),
      total_count: plan.interval === "monthly" ? 120 : 10,
      quantity: 1,
      customer_notify: true,
      notes: { userId: String(req.user.userId), planCode: requestedCode, planVersionId: String(plan._id) },
    });
    unsavedRemoteId = remote.id;
    if (remote.plan_id !== planId || (offer && remote.offer_id !== offer.razorpayOfferId)) {
      throw createHttpError(502, "Payment provider did not confirm the selected plan and offer");
    }
    const now = new Date();
    await Subscription.create({
      userId: req.user.userId,
      kind: "paid",
      planCode: requestedCode,
      planVersionId: plan._id,
      pricingSnapshot: pricing,
      razorpayOfferId: offer?.razorpayOfferId,
      checkoutExpiresAt,
      status: "created",
      periodStart: now,
      periodEnd: now,
      projectLimit: plan.projectLimit,
      projectCount: 0,
      amountPaise: pricing.renewalCheckout.totalPaise,
      billingInterval: plan.interval,
      razorpayPlanId: planId,
      razorpaySubscriptionId: remote.id,
    });
    unsavedRemoteId = null;
    res.json({ keyId: getCheckoutKey(), subscriptionId: remote.id, amountPaise: pricing.checkout.totalPaise, planCode: requestedCode, pricing });
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
    if (req.body?.razorpay_order_id) {
      const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
      const record = await Subscription.findOne({ userId: req.user.userId, razorpayOrderId: orderId, kind: "paid" });
      if (!record || typeof paymentId !== "string" || !verifyOrderSignature(record.razorpayOrderId, paymentId, signature)) throw createHttpError(400, "Invalid initial payment confirmation");
      const payment = await razorpayRequest("GET", `/payments/${encodeURIComponent(paymentId)}`);
      const updated = await recordInitialPayment(record, payment);
      return res.json({ status: updated.status, hasAccess: hasSubscriptionAccess(updated),
        subscriptionRecordId: updated._id, autopaySetupRequired: needsAutopaySetup(updated) });
    }
    const { razorpay_subscription_id: subscriptionId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    const record = await Subscription.findOne({ userId: req.user.userId, razorpaySubscriptionId: subscriptionId, kind: "paid" });
    if (!record || !paymentId || !verifyCheckoutSignature(record.razorpaySubscriptionId, paymentId, signature)) {
      throw createHttpError(400, "Invalid checkout confirmation");
    }
    const remote = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(record.razorpaySubscriptionId)}`);
    const updated = await syncPaidSubscription(record, remote);
    res.json({ status: updated.status, hasAccess: hasSubscriptionAccess(updated),
      initialPaidAt: updated.initialPaidAt, autopayAuthorized: ["authenticated", "active"].includes(updated.status) });
  } catch (error) { next(error); }
};

export const cancelSubscription = async (req, res, next) => {
  let lockToken;
  try {
    lockToken = await acquireBillingLock(req.user.userId);
    const record = await Subscription.findOne({ userId: req.user.userId, kind: "paid", status: { $in: ["created", "authenticated", "active", "pending", "halted", "paused"] } }).sort({ createdAt: -1 });
    if (!record) throw createHttpError(404, "No cancellable subscription");
    if (record.razorpayOrderId && !record.initialPaidAt) await reconcileInitialOrder(record);
    const initial = await Subscription.findById(record._id);
    if (!initial.razorpaySubscriptionId) {
      await Subscription.updateOne({ _id: initial._id }, { $set: { cancelAtPeriodEnd: true, status: "cancelled" } });
      return res.json({ success: true, periodEnd: hasInitialAccess(initial) ? initial.initialPeriodEnd : null });
    }
    const atPeriodEnd = initial.paidCount > 0 && initial.periodEnd > new Date();
    const remote = await razorpayRequest("POST", `/subscriptions/${encodeURIComponent(record.razorpaySubscriptionId)}/cancel`, { cancel_at_cycle_end: atPeriodEnd });
    await syncPaidSubscription(record, remote);
    const preserveInitialPeriod = hasInitialAccess(initial);
    await Subscription.updateOne({ _id: record._id }, { $set: { cancelAtPeriodEnd: atPeriodEnd || preserveInitialPeriod } });
    res.json({ success: true, periodEnd: preserveInitialPeriod ? initial.initialPeriodEnd : atPeriodEnd ? record.periodEnd : null });
  } catch (error) { next(error); }
  finally { if (lockToken) await CheckoutLock.deleteOne({ userId: req.user.userId, token: lockToken }); }
};

const initialCheckoutResponse = record => ({ type: "initial", keyId: getCheckoutKey(), orderId: record.razorpayOrderId,
  amountPaise: record.pricingSnapshot.checkout?.totalPaise ?? record.pricingSnapshot.firstPaymentAmountPaise, currency: "INR", pricing: record.pricingSnapshot,
  subscriptionRecordId: record._id });

const acquireBillingLock = async userId => {
  const token = crypto.randomUUID();
  try {
    await CheckoutLock.findOneAndUpdate({ userId, expiresAt: { $lte: new Date() } },
      { $set: { token, expiresAt: new Date(Date.now() + 60000) } }, { upsert: true, new: true });
    return token;
  } catch (error) {
    if (error.code === 11000) throw createHttpError(409, "A billing change is already in progress");
    throw error;
  }
};

export const setupAutopay = async (req, res, next) => {
  let lockToken, unsavedRemoteId;
  try {
    if (req.user.type !== "Professional") throw createHttpError(403, "Professional account required");
    lockToken = await acquireBillingLock(req.user.userId);
    let record = await Subscription.findOne({ _id: req.body?.subscriptionRecordId, userId: req.user.userId, kind: "paid" });
    if (!record || !hasInitialAccess(record) || record.cancelAtPeriodEnd) throw createHttpError(409, "An active initial paid period is required to set up auto pay");
    const otherMandate = await Subscription.exists({ userId: req.user.userId, _id: { $ne: record._id },
      razorpaySubscriptionId: { $exists: true }, status: { $in: ["created", "authenticated", "active", "pending", "halted", "paused"] } });
    if (otherMandate) throw createHttpError(409, "Cancel the other subscription before authorizing another auto pay mandate");
    if (record.razorpaySubscriptionId) {
      const remote = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(record.razorpaySubscriptionId)}`);
      record = await syncPaidSubscription(record, remote);
      if (record.status !== "created") throw createHttpError(409, "Auto pay is already authorized or this mandate has ended. Refresh your subscription");
    } else {
      const plan = await PlanVersion.findById(record.planVersionId).lean();
      if (!plan || (plan.amountPaise !== record.amountPaise && record.pricingSnapshot?.renewalCheckout?.totalPaise !== record.amountPaise) || plan.interval !== record.billingInterval) throw createHttpError(409, "Purchased pricing could not be verified");
      const startAt = Math.floor(record.initialPeriodEnd.getTime() / 1000);
      // Leave time to finish authorisation; never schedule a retroactive first debit.
      if (startAt <= Date.now() / 1000 + 3600) throw createHttpError(409, "This period is ending. Choose a new plan after it ends");
      const planId = await getOrCreateRazorpayPlan(plan, record.amountPaise);
      const remote = await razorpayRequest("POST", "/subscriptions", {
        plan_id: planId, start_at: startAt, expire_by: startAt - 60,
        total_count: plan.interval === "monthly" ? 119 : 9, quantity: 1, customer_notify: true,
        notes: { userId: String(req.user.userId), planVersionId: String(plan._id), initialOrderId: record.razorpayOrderId },
      });
      unsavedRemoteId = remote.id;
      if (!remote.id || remote.plan_id !== planId || remote.start_at !== startAt) throw createHttpError(502, "Payment provider did not confirm the renewal schedule");
      await Subscription.updateOne({ _id: record._id }, { $set: {
        razorpaySubscriptionId: remote.id, razorpayPlanId: planId, status: remote.status,
      } });
      record.razorpaySubscriptionId = remote.id;
      unsavedRemoteId = null;
    }
    res.json({ type: "autopay", keyId: getCheckoutKey(), subscriptionId: record.razorpaySubscriptionId,
      pricing: record.pricingSnapshot, startsAt: record.initialPeriodEnd });
  } catch (error) {
    if (unsavedRemoteId) {
      try { await razorpayRequest("POST", `/subscriptions/${encodeURIComponent(unsavedRemoteId)}/cancel`, { cancel_at_cycle_end: false }); }
      catch (cleanupError) { console.error("Could not cancel orphaned auto pay mandate", cleanupError); }
    }
    next(error);
  } finally { if (lockToken) await CheckoutLock.deleteOne({ userId: req.user.userId, token: lockToken }); }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    if (!verifyWebhookSignature(req.body, req.get("x-razorpay-signature"))) throw createHttpError(400, "Invalid webhook signature");
    const eventId = req.get("x-razorpay-event-id");
    if (!eventId) throw createHttpError(400, "Missing webhook event ID");
    if (await RazorpayEvent.exists({ eventId })) return res.json({ success: true });
    const event = JSON.parse(req.body.toString("utf8"));
    const eventPayment = event.payload?.payment?.entity;
    if (eventPayment?.order_id && ["payment.captured", "order.paid", "payment.refunded"].includes(event.event)) {
      const addOnOrder = await Payment.findOne({ razorpayOrderId: eventPayment.order_id, billingPhase: "project_addon" });
      if (addOnOrder) {
        const payment = await razorpayRequest("GET", `/payments/${encodeURIComponent(eventPayment.id)}`);
        if (payment.amount_refunded >= payment.amount) await refundProjectAddOn(addOnOrder, payment);
        else if (payment.status === "captured") await captureProjectAddOn(addOnOrder, payment);
      }
      const initialRecord = await Subscription.findOne({ razorpayOrderId: eventPayment.order_id });
      if (initialRecord) {
        const payment = await razorpayRequest("GET", `/payments/${encodeURIComponent(eventPayment.id)}`);
        await recordInitialPayment(initialRecord, payment);
      } else if (eventPayment.notes?.purpose === "subscription_initial" || event.payload?.order?.entity?.notes?.purpose === "subscription_initial") {
        throw createHttpError(503, "Initial purchase is not ready");
      }
    }
    const subscriptionId = event.payload?.subscription?.entity?.id;
    if (subscriptionId) {
      const record = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });
      if (record) {
        const remote = await razorpayRequest("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
        await syncPaidSubscription(record, remote);
        const payment = event.payload?.payment?.entity;
        if (event.event === "subscription.charged" && payment?.id && payment.status === "captured" && payment.currency === "INR") {
          // Discounted invoices and regular renewals legitimately have different amounts.
          // Verify invoice ownership rather than comparing every payment to one price.
          if (!payment.invoice_id) throw createHttpError(502, "Subscription payment is missing its invoice");
          const invoice = await razorpayRequest("GET", `/invoices/${encodeURIComponent(payment.invoice_id)}`);
          if (invoice.subscription_id !== subscriptionId || invoice.payment_id !== payment.id ||
              invoice.amount_paid !== payment.amount || invoice.currency !== payment.currency) {
            throw createHttpError(409, "Subscription invoice mismatch");
          }
          await Payment.updateOne(
            { razorpayPaymentId: payment.id },
            { $setOnInsert: { userId: record.userId, razorpaySubscriptionId: subscriptionId, razorpayPaymentId: payment.id,
              razorpayInvoiceId: payment.invoice_id, planVersionId: record.planVersionId,
              subscriptionId: record._id, billingPhase: "recurring",
              amount: payment.amount, currency: payment.currency, purpose: "SUBSCRIPTION", status: "SUCCESS" } },
            { upsert: true },
          );
          await ensurePaymentInvoice({ razorpayPaymentId: payment.id });
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
