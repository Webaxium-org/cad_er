import express from "express";
import Settings from "../models/setting.js";
import { requireAuth, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, isAuthenticated);

router.get("/", async (req, res, next) => {
  try {
    const document = await Settings.findOne({ scope: "User", user: req.user.userId });
    res.json({ settings: document?.settings || {} });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const settings = req.body?.settings;
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return res.status(400).json({ message: "Valid settings are required" });
    }
    const document = await Settings.findOneAndUpdate(
      { scope: "User", user: req.user.userId },
      { $set: { settings }, $setOnInsert: { scope: "User", user: req.user.userId } },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ settings: document.settings });
  } catch (error) {
    next(error);
  }
});

export default router;
