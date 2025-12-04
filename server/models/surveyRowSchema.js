import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const SurveyRowSchema = new Schema(
  {
    purposeId: {
      type: Types.ObjectId,
      ref: 'SurveyPurpose',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Instrument setup', 'Chainage', 'TBM', 'CP'],
      required: true,
    },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
    backSight: { type: String, trim: true },
    reducedLevels: [{ type: String, trim: true }],
    heightOfInstrument: { type: String, trim: true },
    intermediateSight: [{ type: String, trim: true }],
    foreSight: { type: String, trim: true },
    chainage: { type: String, trim: true },
    roadWidth: { type: String, trim: true },
    spacing: { type: String, trim: true },
    offsets: [{ type: String, trim: true }],
    remarks: [{ type: String, trim: true }],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🚫 Prevent duplicate chainage inside the same purpose
SurveyRowSchema.index(
  { purposeId: 1, chainage: 1 },
  { unique: true, sparse: true } // Only index documents where the indexed field exists and is not null.
);

export default model('SurveyRow', SurveyRowSchema);
//Survey Reading
