import rateLimit from "express-rate-limit";

/**
 * Helper to create consistent limiters that integrate with our global error handler
 */
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    // The handler intercepts the limit reach and forwards it to your errorHandler.js
    handler: (req, res, next) => {
      const error = new Error(
        message || "Too many requests. Please try again later.",
      );
      error.statusCode = 429;
      error.name = "RateLimitError";
      next(error);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

/* Global limiter: 300 requests per 15 mins */
export const globalLimiter = createLimiter(15 * 60 * 1000, 300);
export const webhookLimiter = createLimiter(60 * 1000, 1000);

/* Login limiter: 5 attempts per 10 mins */
export const loginLimiter = createLimiter(
  10 * 60 * 1000,
  5,
  "Too many login attempts. Please try again after 10 minutes.",
);

/* API limiter: 60 requests per minute */
export const apiLimiter = createLimiter(60 * 1000, 60);

/* Heavy endpoints: 10 requests per minute */
export const heavyLimiter = createLimiter(
  60 * 1000,
  10,
  "This is a resource-intensive operation. Please wait a minute before trying again.",
);
