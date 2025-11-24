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
    backSight: String,
    reducedLevels: [String],
    heightOfInstrument: String,
    intermediateSight: [String],
    foreSight: String,
    chainage: String,
    roadWidth: String,
    spacing: String,
    offsets: [String],
    remarks: [String],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model('SurveyRow', SurveyRowSchema);
//Survey Reading
