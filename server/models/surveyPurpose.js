import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const typeEnum = [
  'Initial Level',
  'Final Level',
  'Final Earth Work',
  'Quarry Muck',
  'Final GSB',
  'Final WMM',
  'Final BM',
  'Final BC',
  'Final Tile Top',
  'Proposed Level',
  'Proposed Earth Work',
  'Proposed Muck',
  'Proposed GSB',
  'Proposed WMM',
  'Proposed BM',
  'Proposed BC',
  'Proposed Tile Top',
];

const SurveyPurposeSchema = new Schema(
  {
    surveyId: {
      type: Types.ObjectId,
      ref: 'Survey',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: typeEnum,
    },
    relation: {
      type: Types.ObjectId,
      ref: 'SurveyPurpose',
    },
    finalOffset:  Number,
    lSection:  Number,
    lsSlop:  Number,
    cSection:  Number,
    csSlop:  Number,
    csLamper:  String,
    isPurposeFinish: { type: Boolean, default: false, index: true },
    DateOfSurvey: { type: Date, default: Date.now },
    purposeFinishDate: Date,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Each purpose can have multiple rows
SurveyPurposeSchema.virtual('rows', {
  ref: 'SurveyRow',
  localField: '_id',
  foreignField: 'purposeId',
});

// History (linked via unified History model)
SurveyPurposeSchema.virtual('history', {
  ref: 'History',
  localField: '_id',
  foreignField: 'entityId',
  match: { entityType: 'SurveyPurpose' },
});

SurveyPurposeSchema.set('toObject', { virtuals: true });
SurveyPurposeSchema.set('toJSON', { virtuals: true });

export default model('SurveyPurpose', SurveyPurposeSchema);
