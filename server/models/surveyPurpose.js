import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const typeEnum = [
  "Initial Level",
  "Proposed Level",
  "Final Earth Work",
  "Proposed Earth Work",
  "Final Quarry Muck",
  "Proposed Quarry Muck",
  "Final GSB",
  "Proposed GSB",
  "Final WMM",
  "Proposed WMM",
  "Final BM",
  "Proposed BM",
  "Final BC",
  "Proposed BC",
  "Final Tile Top",
  "Proposed Tile Top",
  "Final Level",
];

const SurveyPurposeSchema = new Schema(
  {
    surveyId: {
      type: Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true,
    },
    phase: {
      type: String,
      enum: ["Actual", "Proposal"],
      required: true,
      default: "Actual",
    },
    pls: String,
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: typeEnum,
    },
    relation: {
      type: Types.ObjectId,
      ref: "SurveyPurpose",
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Finished", "Deleted"],
      required: true,
      default: "Active",
    },
    finalForesight: Number,
    proposedLevel: Number,
    lSection: Number,
    lsSlop: Number,
    cSection: Number,
    csSlop: Number,
    quantity: Number,
    length: String,
    width: Number,
    csCamper: { type: String, trim: true },
    isPurposeFinish: { type: Boolean, default: false, index: true },
    DateOfSurvey: { type: Date, default: Date.now },
    purposeFinishDate: Date,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Each purpose can have multiple rows
SurveyPurposeSchema.virtual("rows", {
  ref: "SurveyRow",
  localField: "_id",
  foreignField: "purposeId",
});

// History (linked via unified History model)
SurveyPurposeSchema.virtual("history", {
  ref: "History",
  localField: "_id",
  foreignField: "entityId",
  match: { entityType: "SurveyPurpose" },
});

SurveyPurposeSchema.set("toObject", { virtuals: true });
SurveyPurposeSchema.set("toJSON", { virtuals: true });

export default model("SurveyPurpose", SurveyPurposeSchema);
