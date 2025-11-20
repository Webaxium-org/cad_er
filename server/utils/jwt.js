import jwt from 'jsonwebtoken';

export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
