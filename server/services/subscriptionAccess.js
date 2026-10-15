import createHttpError from "http-errors";
import Subscription from "../models/subscription.js";
import { ensureTrialSubscription } from "./trialSubscription.js";

export const getCurrentSubscription = async (userId) => {
  const now = new Date();
  const paid = await Subscription.findOne({
    userId,
    kind: "paid",
    paidCount: { $gt: 0 },
    periodStart: { $lte: now },
    periodEnd: { $gt: now },
    status: { $in: ["active", "pending", "cancelled"] },
    $or: [{ endedAt: null }, { endedAt: { $gt: now } }],
  }).sort({ periodEnd: -1 });
  if (paid) return paid;

  const trial = await Subscription.findOne({ userId, kind: "trial" });
  if (hasSubscriptionAccess(trial, now)) return trial;
  const latest = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
  return latest || trial || ensureTrialSubscription(userId);
};

export const hasSubscriptionAccess = (subscription, now = new Date()) =>
  Boolean(subscription && subscription.periodStart <= now && subscription.periodEnd > now &&
    ((subscription.kind === "trial" && subscription.status === "active") || (subscription.paidCount > 0 && ["active", "pending", "cancelled"].includes(subscription.status))) &&
    (!subscription.endedAt || subscription.endedAt > now));

export const requireProfessionalSubscription = async (req, _res, next) => {
  try {
    if (req.user?.type !== "Professional" || req.user?.role === "Super Admin") return next();
    const subscription = await getCurrentSubscription(req.user.userId);
    if (!hasSubscriptionAccess(subscription)) throw createHttpError(402, "An active subscription is required");
    req.subscription = subscription;
    next();
  } catch (error) {
    next(error);
  }
};

export const reserveProjectSlot = async (req, session) => {
  if (req.user?.role === "Super Admin") return null;
  const subscription = req.subscription || await getCurrentSubscription(req.user.userId);
  const now = new Date();
  if (!hasSubscriptionAccess(subscription, now)) throw createHttpError(402, "An active subscription is required");
  const eligibility = subscription.kind === "trial"
    ? { kind: "trial", status: "active" }
    : { kind: "paid", paidCount: { $gt: 0 }, status: { $in: ["active", "pending", "cancelled"] }, $or: [{ endedAt: null }, { endedAt: { $gt: now } }] };
  const updated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, ...eligibility, periodStart: { $lte: now }, periodEnd: { $gt: now }, $expr: { $lt: ["$projectCount", "$projectLimit"] } },
    { $inc: { projectCount: 1 } },
    { new: true, ...(session ? { session } : {}) },
  );
  if (!updated) throw createHttpError(402, "Project limit reached for this subscription period");
  return updated;
};
