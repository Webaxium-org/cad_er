import createHttpError from "http-errors";
import Subscription from "../models/subscription.js";
import Survey from "../models/survey.js";
import { ensureTrialSubscription, syncTrialProjectLimit } from "./trialSubscription.js";
import { hasInitialAccess, initialAccessFilter } from "./initialSubscriptionPayment.js";

export const paidAccessFilter = now => ({ kind: "paid", $or: [
  initialAccessFilter(now),
  { paidCount: { $gt: 0 }, status: { $in: ["active", "pending", "cancelled"] },
    $or: [{ endedAt: null }, { endedAt: { $gt: now } }] },
] });

export const getCurrentSubscription = async (userId) => {
  const now = new Date();
  const paid = await Subscription.findOne({
    userId,
    ...paidAccessFilter(now),
    periodStart: { $lte: now },
    periodEnd: { $gt: now },
  }).sort({ periodEnd: -1 });
  if (paid) return paid;

  const trial = await Subscription.findOne({ userId, kind: "trial" });
  if (hasSubscriptionAccess(trial, now)) return syncTrialProjectLimit(trial);
  const latest = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
  return latest ? syncTrialProjectLimit(latest) : trial ? syncTrialProjectLimit(trial) : ensureTrialSubscription(userId);
};

export const hasSubscriptionAccess = (subscription, now = new Date()) =>
  hasInitialAccess(subscription, now) || Boolean(subscription && subscription.periodStart <= now && subscription.periodEnd > now &&
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
    : paidAccessFilter(now);
  const projectType = req.body?.type || "Road Survey";
  const isTrial = subscription.kind === "trial";
  const trialMessage = "Your free trial includes only one Road Survey and one Water Way (two projects total). Upgrade to create more projects.";
  if (isTrial) {
    if (!["Road Survey", "Water Way"].includes(projectType)) throw createHttpError(400, "Choose Road Survey or Water Way for your trial project");
    // Cover projects created before per-type usage was recorded. Deleted and
    // completed projects still consume the allowance; branches are not projects.
    const existing = await Survey.exists({
      createdBy: req.user.userId, type: projectType,
      "branchDetails.isBranch": { $ne: true },
      createdAt: { $gte: subscription.periodStart, $lt: subscription.periodEnd },
    }).session(session || null);
    if (existing) throw createHttpError(402, trialMessage);
  }
  const updated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, ...eligibility, periodStart: { $lte: now }, periodEnd: { $gt: now },
      ...(isTrial ? { trialProjectTypes: { $ne: projectType } } : {}),
      $expr: { $lt: ["$projectCount", isTrial ? { $min: ["$projectLimit", 2] } : "$projectLimit"] } },
    { $inc: { projectCount: 1 }, ...(isTrial ? { $addToSet: { trialProjectTypes: projectType } } : {}) },
    { new: true, ...(session ? { session } : {}) },
  );
  if (!updated) throw createHttpError(402, isTrial ? trialMessage : "Project limit reached for this subscription period");
  return updated;
};
