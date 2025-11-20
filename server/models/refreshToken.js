import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    // When rotating tokens
    expiresAt: {
      type: Date,
      required: true,
    },

    // DEVICE SECURITY
    ipAddress: { type: String },
    userAgent: { type: String },

    // Replace old token with a new one (rotation)
    replacedByToken: { type: String },

    // Soft delete
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

// Whether token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

// Whether token is active
refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});

export default mongoose.model('RefreshToken', refreshTokenSchema);
