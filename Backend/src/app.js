import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/auth.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";
import { getBarangays } from "./controllers/registration.controller.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:8000",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "SENIORCARE API is running." });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/registration", registrationRoutes);
  app.use("/api/verifications", verificationRoutes);
  app.use("/api/admin", adminRoutes);
  // Convenience alias — same handler as GET /api/registration/barangays.
  app.get("/api/barangays", getBarangays);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
