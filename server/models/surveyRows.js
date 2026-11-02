import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const intermediateOffsetSchema = new Schema(
  {
    is: { type: String, trim: true, default: "" }, // intermediateSight
    offset: { type: String, trim: true, default: "" },
    remark: { type: String, trim: true, default: "" },
    mode: { type: String, enum: ["S", "R"], default: "R" },
  },
  { _id: false },
);

const SurveyRowSchema = new Schema(
  {
    purposeId: {
      type: Types.ObjectId,
      ref: "SurveyPurpose",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "Instrument setup",
        "Chainage",
        "TBM",
        "CP",
        "Break",
        "Water Level",
      ],
      required: true,
    },
    upcomingBranches: {
      type: [Types.ObjectId],
      ref: "Branch",
      default: [],
    },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    // Explicit reading order allows intermediate stations without changing creation dates.
    // New field readings append after the compact order assigned during an insertion.
    readingOrder: { type: Number, default: () => Date.now() },

    // ── Scalar fields (Instrument setup / CP / TBM) ────────────────────────
    backSight: { type: String, trim: true },
    heightOfInstrument: { type: String, trim: true },
    foreSight: { type: String, trim: true },

    // Single-element RL array — used by Instrument setup / CP / TBM rows
    reducedLevels: [{ type: String, trim: true }],

    // Single-element IS array — used by TBM rows only
    intermediateSight: [{ type: String, trim: true }],

    // Single remark for non-Chainage rows (Instrument setup, TBM, CP)
    remark: { type: String, trim: true, default: "" },

    // ── Chainage / Water Level fields ──────────────────────────────────────
    chainage: { type: String, trim: true, default: null },
    from: { type: String, trim: true, default: null },
    to: { type: String, trim: true, default: null },
    roadWidth: { type: String, trim: true },
    spacing: { type: String, trim: true },
    basis: { type: String, enum: ["Readings", "Soundings"], default: "Readings" },

    // Array of objects — one per cross-section offset point
    intermediateOffsets: { type: [intermediateOffsetSchema], default: [] },

    // Proposal-generated interpolated RLs (kept as top-level array)
    interpolatedReducedLevels: [{ type: String, trim: true }],

    observation: { type: String, trim: true, default: "" },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 🚫 Prevent duplicate chainage inside the same purpose
SurveyRowSchema.index(
  { purposeId: 1, chainage: 1 },
  {
    unique: true,
    partialFilterExpression: { chainage: { $ne: null }, deleted: false },
  },
);

export default model("SurveyRow", SurveyRowSchema);
//Survey Reading
