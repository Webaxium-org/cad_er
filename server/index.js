import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import "./config/env.js";

import configureCors from "./utils/cors.js";
import errorHandler from "./middleware/errorHandler.js";

import indexRouter from "./routes/indexRoute.js";
import organizationRouter from "./routes/organizationRoute.js";
import userRouter from "./routes/userRoute.js";
import surveyRouter from "./routes/surveyRoute.js";

const app = express();

const startServer = async () => {
  await connectDB(); // Ensure DB is connected before starting the server

  const PORT = process.env.PORT;

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

// Start the server
startServer();

// 🟢 Dev-only logging
if (process.env.NODE_ENV === "development") {
  const { default: morgan } = await import("morgan");
  app.use(morgan("dev"));
}

// 🟢 Middlewares
app.use(configureCors());
app.use(express.json());
app.use(cookieParser());

// 🟢 Routes
app.use("/api", indexRouter);
app.use("/api/organization", organizationRouter);
app.use("/api/user", userRouter);
app.use("/api/surveys", surveyRouter);

// 🟢 Error Handler Middleware (Keep at the End)
app.use(errorHandler);
