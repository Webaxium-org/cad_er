import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { globalLimiter } from "./middleware/rateLimiter.js";
import configureCors from "./utils/cors.js";
import errorHandler from "./middleware/errorHandler.js";

import indexRouter from "./routes/indexRoute.js";
import settingsRouter from "./routes/settingsRoute.js";
import organizationRouter from "./routes/organizationRoute.js";
import userRouter from "./routes/userRoute.js";
import surveyRouter from "./routes/surveyRoute.js";
import ticketRouter from "./routes/ticketRoute.js";
import openingRouter from "./routes/openingRoute.js";

const app = express();

app.set("trust proxy", 1);

// 1. Security & Optimization
app.use(helmet());
app.use(compression());
app.use(configureCors());

// 2. Logging
if (process.env.NODE_ENV === "development") {
  const { default: morgan } = await import("morgan");
  app.use(morgan("dev"));
}

// 3. Parsers
app.use(express.json());
app.use(cookieParser());

// 4. Rate Limiting
app.use(globalLimiter);

// 5. Routes
app.use("/api/organizations", organizationRouter);
app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/surveys", surveyRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/openings", openingRouter);
app.use("/api", indexRouter);

// 6. Error Handling
app.use(errorHandler);

export default app;
