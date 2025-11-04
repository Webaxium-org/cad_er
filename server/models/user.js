import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    company: {
      type: Types.ObjectId,
      required: true,
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
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: [true, 'This Contact Number Is Already In Use'],
      minlength: 7,
      trim: true,
    },
    phoneCode: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, 'This Email Is Already In Use'],
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
    dob: {
      type: Date,
      required: true,
    },
    role: {
      type: Types.ObjectId,
      ref: 'Role',
      required: true,
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
