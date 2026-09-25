import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const SurveySchema = new Schema(
  {
    type: { type: String, default: "Road Survey", index: true, trim: true },
    project: { type: String, required: true, trim: true },
    projectType: { type: String, enum: ["Public", "Private", "None"] },
    agreementNo: { type: String, trim: true },
    contractor: { type: String, trim: true },
    department: { type: String, trim: true },
    division: { type: String, trim: true },
    subDivision: { type: String, trim: true },
    section: { type: String, trim: true },
    consultant: { type: String, trim: true },
    client: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Scheduled", "Active", "Completed", "Deleted"],
      required: true,
      default: "Active",
    },
    branchDetails: {
      hasBranching: { type: Boolean, default: false },
      isBranch: { type: Boolean, default: false, index: true },
      branchStartedFrom: { type: String, trim: true },
      rootBranch: { type: Types.ObjectId, ref: "Survey" },
      parentBranch: { type: Types.ObjectId, ref: "Survey" },
      isBranchStart: { type: Boolean, default: false },
      isBranchEnd: { type: Boolean, default: false },
      currentBranch: { type: Types.ObjectId, ref: "Survey" },
    },
    instrumentNo: { type: String, trim: true },
    chainageMultiple: { type: Number },
    separator: { type: String },
    reducedLevel: { type: String, trim: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    isSurveyFinish: { type: Boolean, default: false, index: true },
    DateOfSurvey: { type: Date, default: Date.now },
    surveyFinishDate: Date,
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: Types.ObjectId, ref: "User" },
    engineerSurveyor: { type: String, trim: true },
    assistant1: { type: String, trim: true },
    assistant2: { type: String, trim: true },
    assistant3: { type: String, trim: true },
    assistant4: { type: String, trim: true },
    assistant5: { type: String, trim: true },
    // Legacy scheduling date
    scheduledDate: Date,
    // Queue scheduling fields
    proposalScheduleDate: Date,
    proposalDeadline: Date,
    location: { type: String, trim: true },
    finalScheduleDate: Date,
    finalDeadline: Date,
  },
  { timestamps: true },
);


// --- Virtuals ---
SurveySchema.virtual("purposes", {
  ref: "SurveyPurpose",
  localField: "_id",
  foreignField: "surveyId",
});

SurveySchema.virtual("branches", {
  ref: "Branch",
  localField: "_id",
  foreignField: "surveyId",
});

SurveySchema.virtual("parentBranch", {
  ref: "Branch",
  localField: "_id",
  foreignField: "parentBranch",
});

SurveySchema.virtual("rootBranch", {
  ref: "Branch",
  localField: "_id",
  foreignField: "rootBranch",
});

SurveySchema.set("toObject", { virtuals: true });
SurveySchema.set("toJSON", { virtuals: true });

export default model("Survey", SurveySchema);
