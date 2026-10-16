import createHttpError from "http-errors";
import PlanVersion from "../models/planVersion.js";
import { latestPlans, validatePlan } from "../services/subscriptionPlans.js";

export const adminPlans = async (_req, res, next) => {
  try { res.json({ plans: await latestPlans(), paymentMode: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") ? "live" : "test" }); }
  catch (error) { next(error); }
};

export const planHistory = async (req, res, next) => {
  try { res.json({ versions: await PlanVersion.find({ code: req.params.code }).sort({ version: -1 }).lean() }); }
  catch (error) { next(error); }
};

export const publishPlan = async (req, res, next) => {
  try {
    const current = await PlanVersion.findOne({ code: req.params.code }).sort({ version: -1 }).lean();
    if (!current) throw createHttpError(404, "Plan not found");
    if (req.body.expectedVersion !== current.version) throw createHttpError(409, "This plan changed. Reload before publishing");
    const fields = validatePlan(req.body);
    // A plan code identifies a billing interval. Do not silently change its meaning.
    if (fields.interval !== current.interval) throw createHttpError(400, "Billing interval cannot change for an existing plan");
    const plan = await PlanVersion.create({ ...fields, code: current.code, version: current.version + 1, createdBy: req.user.userId });
    res.status(201).json({ plan });
  } catch (error) {
    if (error.code === 11000) return next(createHttpError(409, "Another administrator published this plan. Reload before publishing"));
    next(error);
  }
};
