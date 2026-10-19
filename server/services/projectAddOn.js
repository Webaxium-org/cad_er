import createHttpError from "http-errors";
import Payment from "../models/payments.js";
import Subscription from "../models/subscription.js";
import { razorpayRequest } from "./razorpay.js";
import { checkoutPricing } from "./checkoutPricing.js";

export const projectAddOnQuote = quantity => checkoutPricing(9900 * quantity);
export const PROJECT_ADD_ON_QUOTE = projectAddOnQuote(1);

export const captureProjectAddOn = async (order, payment) => {
  if (order.billingPhase !== "project_addon" || !payment?.id || payment.order_id !== order.razorpayOrderId ||
      payment.amount !== order.amount || payment.currency !== "INR") {
    throw createHttpError(409, "Project payment does not match the order");
  }
  if (payment.amount_refunded >= payment.amount) throw createHttpError(409, "Project payment was refunded");
  if (payment.status !== "captured") return false;
  const now = new Date();
  const updated = await Subscription.updateOne({
    _id: order.subscriptionId, userId: order.userId, kind: "paid",
    periodStart: order.addOnPeriodStart, periodEnd: { $gt: now },
    projectAddOnOrders: { $ne: order.razorpayOrderId },
  }, { $inc: { projectLimit: order.addOnQuantity || 1 }, $addToSet: { projectAddOnOrders: order.razorpayOrderId } });
  const subscription = updated.modifiedCount ? null : await Subscription.findById(order.subscriptionId);
  if (!updated.modifiedCount && !subscription?.projectAddOnOrders?.includes(order.razorpayOrderId)) {
    throw createHttpError(409, "This project's billing period has ended. Contact support about the payment");
  }
  await Payment.updateOne({ _id: order._id }, { $set: { status: "SUCCESS", razorpayPaymentId: payment.id } });
  return true;
};

export const refundProjectAddOn = async (order, payment) => {
  if (order.billingPhase !== "project_addon" || payment?.order_id !== order.razorpayOrderId ||
      payment.amount_refunded < payment.amount || payment.currency !== "INR") return;
  await Subscription.updateOne({ _id: order.subscriptionId, periodStart: order.addOnPeriodStart,
    projectAddOnOrders: order.razorpayOrderId },
  { $inc: { projectLimit: -(order.addOnQuantity || 1) }, $pull: { projectAddOnOrders: order.razorpayOrderId } });
  await Payment.updateOne({ _id: order._id }, { $set: { status: "FAILED" } });
};

export const reconcileProjectAddOns = async (subscription) => {
  const orders = await Payment.find({ userId: subscription.userId, subscriptionId: subscription._id,
    addOnPeriodStart: subscription.periodStart, billingPhase: "project_addon", status: "CREATED" });
  for (const order of orders) {
    const payments = await razorpayRequest("GET", `/orders/${encodeURIComponent(order.razorpayOrderId)}/payments`);
    const captured = payments.items?.find(item => item.status === "captured");
    if (captured) await captureProjectAddOn(order, captured);
  }
};
