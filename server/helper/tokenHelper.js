import RefreshToken from '../models/refreshToken.js';
import crypto from 'crypto';

export const createRefreshToken = async (user, req) => {
  const token = crypto.randomBytes(40).toString('hex');

  return await RefreshToken.create({
    user: user._id,
    token,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};
