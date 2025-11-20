import User from "../models/user.js";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.access__; // Get the token from cookies
    console.log("Auth Token:", token, req.cookies);
    if (!token) {
      req.user = { isAuthenticated: false };
      return next(); // Continue without blocking
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    const user = await User.findById(userId);

    if (!user) {
      req.user = { isAuthenticated: false };
      return next();
    }

    if (user.status !== "Active") {
      throw createHttpError(403, "Account suspended");
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
    // Token invalid OR verify error → unauthorized
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(createHttpError(401, "Invalid or expired token"));
    }

    next(error);
  }
};

export const isAuthenticated = (req, res, next) => {
  try {
    if (req.user?.isAuthenticated) {
      return next();
    }

    console.log(req.user, req.headers, req.cookies)

    throw createHttpError(401, "Authentication required");
  } catch (err) {
    next(err);
  }
};

export const isAuthorized = (roles = []) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!roles.includes(userRole)) {
        throw createHttpError(403, "Forbidden: Insufficient permissions");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
