import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    organization: {
      type: Types.ObjectId,
      ref: 'Company',
    },
    designation: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
    phone: {
      type: String,
      unique: [true, 'This Contact Number Is Already In Use'],
      minlength: 7,
      trim: true,
    },
    phoneCode: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, 'This Email Is Already In Use'],
    },
    authProvider: {
      type: String,
      enum: ['google'],
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Prefer Not To Say', 'Not Defined'],
      default: 'Not Defined',
      required: true,
    },
    dob: Date,
    role: {
      type: String,
      required: true,
      enum: [
        'Super Admin',
        'Survey Manager',
        'Chief Surveyor',
        'Senior Surveyor',
        'Site Engineer',
        'Assistant Engineer',
        'Guest',
      ],
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
      index: true,
      required: true,
    },
  },
  { timestamps: true }
);

UserSchema.virtual('activityHistory', {
  ref: 'History',
  localField: '_id',
  foreignField: 'entityId',
  match: { entityType: 'User' },
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

export default model('User', UserSchema);
