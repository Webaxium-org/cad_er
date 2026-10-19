import Subscription from "../models/subscription.js";
import User from "../models/user.js";

const TRIAL_DAYS = 30;
const configuredLimit = Number(process.env.TRIAL_PROJECT_LIMIT);
const TRIAL_PROJECT_LIMIT = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 5;

export const syncTrialProjectLimit = async (subscription, { session } = {}) => {
  if (!subscription || subscription.kind !== "trial" || subscription.projectLimit === TRIAL_PROJECT_LIMIT) return subscription;
  return Subscription.findOneAndUpdate(
    { _id: subscription._id, kind: "trial" },
    { $set: { projectLimit: TRIAL_PROJECT_LIMIT } },
    { new: true, ...(session ? { session } : {}) },
  );
};

export const ensureTrialSubscription = async (userId, { session } = {}) => {
  const existing = await Subscription.findOne({ userId }).sort({ createdAt: -1 }).session(session || null);
  if (existing) {
    if (existing.projectCount == null) {
      await Subscription.updateOne({ _id: existing._id, projectCount: null }, { $set: { projectCount: 0 } }, { session });
      existing.projectCount = 0;
    }
    return syncTrialProjectLimit(existing, { session });
  }

  // Move trial dates written by the previous dashboard implementation out of User.
  const legacyUser = await User.collection.findOne({ _id: userId }, { projection: { professionalTrialStartedAt: 1 }, session });
  const legacyStart = legacyUser?.professionalTrialStartedAt ? new Date(legacyUser.professionalTrialStartedAt) : null;
  const periodStart = legacyStart && Number.isFinite(legacyStart.getTime()) ? legacyStart : new Date();
  const periodEnd = new Date(periodStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId, kind: "trial" },
      {
        $setOnInsert: {
          userId,
          kind: "trial",
          planCode: "professional_trial",
          status: "active",
          periodStart,
          periodEnd,
          projectLimit: TRIAL_PROJECT_LIMIT,
          projectCount: 0,
          billingInterval: "trial",
        },
      },
      { upsert: true, new: true, session },
    );
    if (legacyUser?.professionalTrialStartedAt) await User.collection.updateOne({ _id: userId }, { $unset: { professionalTrialStartedAt: "" } }, { session });
    return subscription;
  } catch (error) {
    // Concurrent dashboard requests can race while creating the first trial.
    if (error.code === 11000) return Subscription.findOne({ userId, kind: "trial" }).session(session || null);
    throw error;
  }
};
