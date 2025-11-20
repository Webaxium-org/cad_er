import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.access__; // Get the token from cookies

    if (!token) {
      req.user = { isAuthenticated: false };
      return next(); // Proceed without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    const user = await User.findById(userId);

    if (!user) {
      req.user = { isAuthenticated: false };
      return next();
    }

    if (user.status !== "Active")
      throw new Error("The user has been suspended");

    req.user = {
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      isAuthenticated: true,
    };

    next();
  } catch (error) {
    req.user = { isAuthenticated: false };
    // return res.status(401).json({ error: 'Unauthorized. Invalid token.' });

    error.statusCode = error.statusCode || 401;
    next(error);
  }
};

export const isAuthenticated = async (req, res, next) => {
  try {
    if (req.user && req.user.isAuthenticated) {
      return next();
    }

    console.log(`Unauthorized access attempt: ${req.originalUrl}`);

    console.log(req.user);
    console.log(req.cookies);
    console.log(req.headers);
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  } catch (err) {
    next(err); // Pass the error to the global error handler
  }
};

export const isAuthorized = (roles = []) => {
  return (req, res, next) => {
    try {
      const {
        user: { role },
      } = req;

      if (roles.includes(role)) {
        const error = new Error("Forbidden: Insufficient permissions.");
        error.statusCode = 403;
        throw error;
      }

      next();
    } catch (err) {
      next(err); // Pass the error to the global error handler
    }
  };
};
