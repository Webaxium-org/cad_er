import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    industryType: { type: String, trim: true },

    code: {
      type: String,
      trim: true,
      unique: true,
    },

    logo: {
      type: String, // URL to logo
    },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zip: { type: String, trim: true },
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    domain: {
      type: String, // used for SSO or multi-tenant domain
      trim: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Virtual: All users under this organization
OrganizationSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization',
});

OrganizationSchema.set('toObject', { virtuals: true });
OrganizationSchema.set('toJSON', { virtuals: true });

export default model('Organization', OrganizationSchema);
