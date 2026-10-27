import createHttpError from "http-errors";
import User from "../models/user.js";
import { saveMyGstProfile } from "./profileGstController.js";

export const saveOnboardingGst = async (req, res, next) => {
  try {
    if (!req.user?.isAuthenticated) throw createHttpError(401, "Please sign in to continue");
    const user = await User.findById(req.user.userId).select("type").lean();
    if (!user || user.type) throw createHttpError(403, "Account setup is not available");
    return await saveMyGstProfile(req, res, next);
  } catch (error) { next(error); }
};
