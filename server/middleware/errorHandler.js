// middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log error for debugging

  let statusCode = err.statusCode || err.status || 500;
  if (err.name === "MulterError") statusCode = 400;
  let message = err.message || "Internal Server Error";
  let errors = null;

  // Handle JWT-specific errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Unauthorized. Invalid token.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Unauthorized. Token has expired.";
  }
  // Handle MongoDB errors
  else if (err.name === "MongoServerError") {
    // Duplicate key error (E11000)
    if (err.code === 11000) {
      statusCode = 409; // Conflict
      message = "Duplicate key error";

      // Extract the duplicate field from the error message
      const keyPattern = Object.keys(err.keyPattern || {});
      if (keyPattern.length > 0) {
        message = `${keyPattern[0]} already exists`;
      }

      // Optionally include which fields caused the conflict
      errors = err.keyValue ? { ...err.keyValue } : null;
    }
    // Validation errors
    else if (err.code === 121) {
      statusCode = 400; // Bad Request
      message = "Document validation failed";
    }
  } else if (err.name === "RateLimitError") {
    statusCode = 429; // Too Many Requests
    message = err.message;
  }

  // Handle Mongoose validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }
  // Handle CastError (invalid ObjectId, etc)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Clear the authentication cookie if it's an auth error
  if (statusCode === 401 || statusCode === 403) {
    res.clearCookie("access__", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  // Prepare response
  const response = {
    success: false,
    message,
    ...(errors && { errors }), // Only include errors if they exist
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in development
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
