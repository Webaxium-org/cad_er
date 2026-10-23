import User from "../models/user.js";
import Verification from "../models/onboardingVerification.js";
import { normalizePhone } from "../utils/onboardingVerification.js";
import { randomUUID } from "node:crypto";
import { sendWidgetCode, verifyWidgetCode } from "../utils/msg91.js";

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const getOnboardingUser = async (req) => {
  if (!req.user?.isAuthenticated) throw fail("Please sign in to continue", 401);
  const user = await User.findById(req.user.userId);
  if (!user || user.type) throw fail("Account setup is not available");
  return user;
};

export const sendOnboardingCode = async (req, res, next) => {
  try {
    const user = await getOnboardingUser(req);
    const phone = normalizePhone(req.body?.phone);
    if (!phone) throw fail("Enter a valid phone number including country code");
    if (await User.exists({ phone, _id: { $ne: user._id } })) {
      throw fail("Phone number already registered. Please use another number.", 409);
    }
    const now = new Date();
    const challengeId = randomUUID();
    try {
      // Unique user index makes the resend cooldown atomic across requests.
      await Verification.findOneAndUpdate(
        { user: user._id, nextSendAt: { $lte: now } },
        { $set: { phone, challengeId, attempts: 0, expiresAt: new Date(now.getTime() + 600000), nextSendAt: new Date(now.getTime() + 60000) }, $unset: { verifiedAt: 1, providerRequestId: 1, codeHash: 1 } },
        { upsert: true, new: true, runValidators: true },
      );
    } catch (error) {
      if (error.code === 11000) throw fail("Please wait 60 seconds before requesting another code", 429);
      throw error;
    }
    try {
      const providerRequestId = await sendWidgetCode(phone);
      const saved = await Verification.updateOne({ user: user._id, challengeId }, { $set: { providerRequestId } });
      if (!saved.modifiedCount) throw fail("This request is no longer valid. Request a new code.");
    } catch (error) {
      await Verification.deleteOne({ user: user._id, challengeId });
      throw error;
    }
    res.json({ success: true, phone, retryAfter: 60 });
  } catch (error) { next(error); }
};

export const verifyOnboardingCode = async (req, res, next) => {
  try {
    const user = await getOnboardingUser(req);
    const code = req.body?.code;
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) throw fail("Enter the six-digit verification code");
    const phone = normalizePhone(req.body?.phone);
    if (!phone) throw fail("Enter a valid phone number including country code");
    if (await User.exists({ phone, _id: { $ne: user._id } })) {
      throw fail("Phone number already registered. Please use another number.", 409);
    }
    const now = new Date();
    const challenge = await Verification.findOneAndUpdate(
      { user: user._id, phone, providerRequestId: { $type: "string" }, expiresAt: { $gt: now }, verifiedAt: null, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!challenge) throw fail("Code expired or attempt limit reached. Request a new code.");
    await verifyWidgetCode(challenge.providerRequestId, code, phone);
    const result = await Verification.updateOne(
      { _id: challenge._id, challengeId: challenge.challengeId, providerRequestId: challenge.providerRequestId, verifiedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { verifiedAt: new Date() } },
    );
    if (!result.modifiedCount) throw fail("This code is no longer valid. Request a new code.");
    res.json({ success: true });
  } catch (error) { next(error); }
};
