import User from '../models/user.js';
import createHttpError from 'http-errors';
import { verifyAccessToken } from '../utils/jwt.js';

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // If no header → user is not logged in (public visitor)
    if (!header || !header.startsWith('Bearer ')) {
      req.user = { isAuthenticated: false };
      return next();
    }

    const token = header.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      // Token expired or invalid — allow frontend to refresh automatically
      req.user = { isAuthenticated: false };
      return next();
    }

    const user = await User.findById(decoded.id).lean();

    if (!user) {
      req.user = { isAuthenticated: false };
      return next();
    }

    if (user.status !== 'Active') {
      return next(createHttpError(403, 'User account is suspended'));
    }

    req.user = {
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      isAuthenticated: true,
    };

    next();
  } catch (error) {
    next(createHttpError(401, 'Unauthorized'));
  }
};

export const isAuthenticated = (req, res, next) => {
  if (req.user?.isAuthenticated) {
    return next();
  }

  return next(createHttpError(401, 'Authentication required'));
};

export const isAuthorized = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;

      if (!role || !allowedRoles.includes(role)) {
        return next(
          createHttpError(403, 'Forbidden: Insufficient permissions')
        );
      }

      next();
    } catch (err) {
      return next(createHttpError(403, 'Forbidden'));
    }
  };
};
