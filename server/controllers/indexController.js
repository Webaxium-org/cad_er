import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import jwt from '../utils/jwt.js';

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), {
        statusCode: 401,
      });
    }

    if (user.authProvider === 'google') {
      throw Object.assign(
        new Error('Please sign in with Google, not with email/password'),
        {
          statusCode: 401,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw Object.assign(new Error('Invalid credentials'), {
        statusCode: 401,
      });
    }

    // Check if the user's status is not "Active"
    if (user.status !== 'Active') {
      throw Object.assign(
        new Error(`Login failed. Your account is currently ${user.status}.`),
        { statusCode: 403 } // Forbidden
      );
    }

    const token = jwt(user._id);

    const { password: _, ...userWithoutPassword } = user.toObject();

    const isProd = process.env.NODE_ENV === 'production';

    res
      .cookie('access__', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ status: 'success', user: { ...userWithoutPassword } });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const {
      body: { data },
    } = req;

    // verify Google token
    const ticket = await client.verifyIdToken({
      idToken: data,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    // check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(sub, 10),
        designation: 'User',
        department: 'General',
        gender: 'Not Defined',
        role: 'Guest',
        status: 'Active',
        authProvider: 'google',
      });
    }

    const token = jwt(user._id);

    const { password: _, ...userWithoutPassword } = user.toObject();

    const isProd = process.env.NODE_ENV === 'production';

    res
      .cookie('access__', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({ status: 'success', user: { ...userWithoutPassword } });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = (req, res, next) => {
  try {
    res.clearCookie('access__', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
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
