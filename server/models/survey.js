import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const SurveySchema = new Schema(
  {
    type: { type: String, default: 'Road Survey', index: true },
    project: { type: String, required: true },
    agreementNo: { type: String, required: true },
    contractor: { type: String, required: true },
    department: { type: String, required: true },
    division: String,
    subDivision: String,
    section: String,
    consultant: String,
    client: String,
    status: {
      type: String,
      enum: ['Active', 'Deleted'],
      required: true,
      default: 'Active',
    },
    instrumentNo: { type: String, required: true },
    chainageMultiple: { type: Number, required: true },
    reducedLevel: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    isSurveyFinish: { type: Boolean, default: false, index: true },
    DateOfSurvey: { type: Date, default: Date.now },
    surveyFinishDate: Date,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// --- Virtuals ---
SurveySchema.virtual('purposes', {
  ref: 'SurveyPurpose',
  localField: '_id',
  foreignField: 'surveyId',
});

SurveySchema.set('toObject', { virtuals: true });
SurveySchema.set('toJSON', { virtuals: true });

export default model('Survey', SurveySchema);
