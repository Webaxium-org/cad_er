import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const SurveySchema = new Schema(
  {
    type: { type: String, default: "Road Survey", index: true, trim: true },
    project: { type: String, required: true, trim: true },
    agreementNo: { type: String, required: true, trim: true },
    contractor: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    division: { type: String, trim: true },
    subDivision: { type: String, trim: true },
    section: { type: String, trim: true },
    consultant: { type: String, trim: true },
    client: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Active", "Deleted"],
      required: true,
      default: "Active",
    },
    instrumentNo: { type: String, required: true, trim: true },
    chainageMultiple: { type: Number, required: true },
    separator: { type: String, required: true },
    reducedLevel: { type: String, required: true, trim: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    isSurveyFinish: { type: Boolean, default: false, index: true },
    DateOfSurvey: { type: Date, default: Date.now },
    surveyFinishDate: Date,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// --- Virtuals ---
SurveySchema.virtual("purposes", {
  ref: "SurveyPurpose",
  localField: "_id",
  foreignField: "surveyId",
});

SurveySchema.set("toObject", { virtuals: true });
SurveySchema.set("toJSON", { virtuals: true });

export default model("Survey", SurveySchema);
