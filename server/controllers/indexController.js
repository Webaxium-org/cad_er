import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import RefreshToken from '../models/refreshToken.js';

import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { createRefreshToken } from '../helper/tokenHelper.js';
import { signAccessToken } from '../utils/jwt.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    if (user.authProvider === 'google') {
      return next(
        createHttpError(401, 'Please sign in with Google, not password')
      );
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    // 3. Check account status
    if (user.status !== 'Active') {
      return next(
        createHttpError(403, `Login failed: Account is ${user.status}`)
      );
    }

    // 4. Create ACCESS TOKEN (short-lived, frontend stores in memory)
    const accessToken = signAccessToken({ id: user._id });

    // 5. Create & store REFRESH TOKEN in DB (long-lived)
    const refreshToken = await createRefreshToken(user, req);

    const isProd = process.env.NODE_ENV === 'production';

    // 6. Set REFRESH TOKEN cookie (HttpOnly, secure)
    res.cookie('refresh__', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/refresh', // IMPORTANT
      domain: 'cader-server-n3t6t.ondigitalocean.app',
    });

    // 7. Return user + accessToken (frontend stores in memory)
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      status: 'success',
      accessToken,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const {
      body: { data },
    } = req;

    if (!data) {
      return next(createHttpError(400, 'Google token missing'));
    }

    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: data,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    if (!email) {
      return next(
        createHttpError(400, 'Unable to extract email from Google token')
      );
    }

    // 2. Check if user exists
    let user = await User.findOne({ email });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(sub, 10), // not used but required
        designation: 'User',
        department: 'General',
        gender: 'Not Defined',
        role: 'Guest',
        status: 'Active',
        authProvider: 'google',
      });
    }

    if (user.status !== 'Active') {
      return next(
        createHttpError(
          403,
          `Login failed. Your account is currently ${user.status}.`
        )
      );
    }

    // 3. Generate short-lived access token (frontend stores IN MEMORY)
    const accessToken = signAccessToken({ id: user._id });

    // 4. Create refresh token (DB)
    const refreshTokenDoc = await createRefreshToken(user, req);
    const refreshToken = refreshTokenDoc.token;

    const isProd = process.env.NODE_ENV === 'production';

    // 5. Set REFRESH TOKEN cookie
    res.cookie('refresh__', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/refresh', // IMPORTANT
      domain: 'cader-server-n3t6t.ondigitalocean.app', // backend domain
    });

    // 6. Extract safe user
    const { password: _, ...userWithoutPassword } = user.toObject();

    // 7. Send access token in JSON (NOT cookie)
    return res.status(200).json({
      status: 'success',
      accessToken,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh__;
    const isProd = process.env.NODE_ENV === 'production';

    // If no refresh token cookie:
    if (!refreshToken) {
      res.clearCookie('refresh__', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/api/refresh',
        domain: 'cader-server-n3t6t.ondigitalocean.app',
      });

      return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    }

    // Remove the refresh token from DB
    await RefreshToken.findOneAndDelete({ token: refreshToken });

    // Clear refresh token cookie
    res.clearCookie('refresh__', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/refresh',
      domain: 'cader-server-n3t6t.ondigitalocean.app',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies['refresh__']; // FIXED

    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // 1. Find in DB
    const storedToken = await RefreshToken.findOne({ token }).populate('user');

    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // 2. Check expiry
    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const user = storedToken.user;

    // 3. Rotate refresh token
    const newToken = crypto.randomBytes(40).toString('hex');
    storedToken.token = newToken;
    storedToken.expiresAt = new Date(Date.now() + 30 * 86400000);
    await storedToken.save();

    const isProd = process.env.NODE_ENV === 'production';

    // 4. Set new cookie (SAME NAME!)
    res.cookie('refresh__', newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 86400000,
    });

    // 5. New access token
    const accessToken = signAccessToken({ id: user._id });

    return res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const {
      user: { userId, organization },
    } = req;

    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};
