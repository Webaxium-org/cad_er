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
    type: { type: String, enum: ['Instrument setup', 'Chainage', 'TBM', 'CP'], required: true },
    backSight: String,
    intermediateSight: [String],
    foreSight: String,
    chainage: String,
    roadWidth: String,
    offsets: [String],
    remarks: [String],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model('SurveyRow', SurveyRowSchema);
