import User from "../models/user.js";
import Verification from "../models/onboardingVerification.js";
import { generateEmailCode, hashEmailCode } from "../utils/onboardingVerification.js";
import { send_mail } from "../utils/mailer.js";
import { EMAIL_TEMPLATES } from "../utils/emails/templates.js";

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
    const now = new Date();
    const code = generateEmailCode();
    const codeHash = hashEmailCode(user._id, user.email, code);
    try {
      // Unique user index makes the resend cooldown atomic across requests.
      await Verification.findOneAndUpdate(
        { user: user._id, nextSendAt: { $lte: now } },
        { $set: { email: user.email, codeHash, attempts: 0, expiresAt: new Date(now.getTime() + 600000), nextSendAt: new Date(now.getTime() + 60000) }, $unset: { verifiedAt: 1 } },
        { upsert: true, new: true, runValidators: true },
      );
    } catch (error) {
      if (error.code === 11000) throw fail("Please wait 60 seconds before requesting another code", 429);
      throw error;
    }
    const sent = await send_mail(user.email, "Verify your CADer email", EMAIL_TEMPLATES.ONBOARDING_CODE(code));
    if (!sent) {
      await Verification.deleteOne({ user: user._id, codeHash });
      throw fail("Could not send the email. Please try again shortly.", 503);
    }
    res.json({ success: true, email: user.email, retryAfter: 60 });
  } catch (error) { next(error); }
};

export const verifyOnboardingCode = async (req, res, next) => {
  try {
    const user = await getOnboardingUser(req);
    const code = req.body.code;
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) throw fail("Enter the six-digit verification code");
    const now = new Date();
    const challenge = await Verification.findOneAndUpdate(
      { user: user._id, email: user.email, expiresAt: { $gt: now }, verifiedAt: null, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!challenge) throw fail("Code expired or attempt limit reached. Request a new code.");
    if (challenge.codeHash !== hashEmailCode(user._id, user.email, code)) throw fail("Incorrect verification code");
    const result = await Verification.updateOne(
      { _id: challenge._id, codeHash: challenge.codeHash, verifiedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { verifiedAt: new Date() } },
    );
    if (!result.modifiedCount) throw fail("This code is no longer valid. Request a new code.");
    res.json({ success: true });
  } catch (error) { next(error); }
};
