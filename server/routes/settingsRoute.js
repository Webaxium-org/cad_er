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

router.patch("/instruments", async (req, res, next) => {
  try {
    const previousSerial =
      typeof req.body?.previousSerial === "string" ? req.body.previousSerial.trim() : "";
    const input = req.body?.instrument;
    const serial = typeof input?.serial === "string" ? input.serial.trim() : "";
    const model = typeof input?.model === "string" ? input.model.trim() : "";
    const purchaseDate = input?.purchaseDate || "";
    const calibrationDate = input?.calibrationDate || "";
    const validDate = (value) => typeof value === "string" && (!value || /^\d{4}-\d{2}-\d{2}$/.test(value));
    if (!previousSerial || !serial || !model || !validDate(purchaseDate) || !validDate(calibrationDate)) {
      return res.status(400).json({ message: "Valid instrument model, number, and dates are required" });
    }

    const owner = { scope: "User", user: req.user.userId };
    const existing = await Settings.findOne(owner);
    const instruments = existing?.settings?.instruments || [];
    const matches = instruments.filter((item) => item?.serial?.trim() === previousSerial);
    if (!matches.length) {
      return res.status(404).json({ message: "Saved instrument not found" });
    }
    if (matches.length > 1) {
      return res.status(409).json({ message: "Multiple instruments share this number. Edit them in Settings." });
    }
    if (instruments.some((item) => item?.serial?.trim() === serial && serial !== previousSerial)) {
      return res.status(409).json({ message: "That instrument number already exists" });
    }

    const document = await Settings.findOneAndUpdate(
      { ...owner, "settings.instruments.serial": matches[0].serial },
      { $set: {
        "settings.instruments.$.serial": serial,
        "settings.instruments.$.model": model,
        "settings.instruments.$.purchaseDate": purchaseDate,
        "settings.instruments.$.calibrationDate": calibrationDate,
      } },
      { new: true, runValidators: true },
    );
    if (!document) {
      return res.status(409).json({ message: "Instrument changed. Reload and try again." });
    }
    res.json({ instruments: document.settings.instruments });
  } catch (error) {
    next(error);
  }
});

const editableFields = {
  commissioning: {
    Government: ["Department", "Agreement No.", "Division", "Sub-Division", "Section", "Contractor"],
    "Corporate / Private": ["Client", "Agreement No.", "Contractor", "Consultant", "Additional field 1", "Additional field 2"],
  },
  staff: {
    "Engineer / Site In-Charge": ["Staff 1", "Staff 2", "Staff 3", "Staff 4", "Staff 5", "Staff 6"],
    "Senior Surveyor": ["Staff 1", "Staff 2", "Staff 3", "Staff 4", "Staff 5", "Staff 6"],
    "Junior Surveyor": ["Staff 1", "Staff 2", "Staff 3", "Staff 4", "Staff 5", "Staff 6"],
  },
};

router.patch("/fields", async (req, res, next) => {
  try {
    const { section, group, values } = req.body || {};
    const allowed = editableFields[section]?.[group];
    if (!allowed || !values || typeof values !== "object" || Array.isArray(values)) {
      return res.status(400).json({ message: "Invalid Settings group" });
    }
    const entries = Object.entries(values);
    if (!entries.length || entries.some(([field, value]) => !allowed.includes(field) || typeof value !== "string")) {
      return res.status(400).json({ message: "Invalid Settings fields" });
    }
    const owner = { scope: "User", user: req.user.userId };
    const existing = await Settings.findOne(owner);
    const groupValues = {
      ...(existing?.settings?.[section]?.[group] || {}),
      ...Object.fromEntries(entries.map(([field, value]) => [field, value.trim()])),
    };
    const document = await Settings.findOneAndUpdate(
      owner,
      {
        $set: { [`settings.${section}.${group}`]: groupValues },
        $setOnInsert: { scope: "User", user: req.user.userId },
      },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ values: document.settings[section][group] });
  } catch (error) {
    next(error);
  }
});

export default router;
