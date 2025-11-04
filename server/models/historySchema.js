import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const HistorySchema = new Schema({
  entityType: {
    type: String,
    enum: ['User', 'Survey'],
    required: true,
  },
  entityId: { type: Types.ObjectId, required: true, index: true },
  action: { type: String, required: true },
  notes: String,
  performedBy: { type: Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now, index: true },
});

HistorySchema.index({ entityType: 1, entityId: 1 });
export default model('History', HistorySchema);
