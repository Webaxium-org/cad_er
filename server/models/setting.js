import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const SettingsSchema = new Schema(
  {
    scope: {
      type: String,
      enum: ['System', 'Organization', 'User'],
      required: true,
      index: true,
    },

    organization: {
      type: Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    user: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },

    settings: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure ONE settings doc per scope
SettingsSchema.index({ scope: 1, organization: 1, user: 1 }, { unique: true });

/* -----------------------------
   🔹 VIRTUAL POPULATIONS
----------------------------- */

// Virtual: User details
SettingsSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

// Virtual: Organization details
SettingsSchema.virtual('organizationDetails', {
  ref: 'Organization',
  localField: 'organization',
  foreignField: '_id',
  justOne: true,
});

// Add virtuals to JSON and object output
SettingsSchema.set('toObject', { virtuals: true });
SettingsSchema.set('toJSON', { virtuals: true });

export default model('Settings', SettingsSchema);
