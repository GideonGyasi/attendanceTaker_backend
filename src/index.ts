import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { json } from "body-parser";
import { sessionRouter } from "./routes/session";
import { attendanceRouter } from "./routes/attendance";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";

dotenv.config();

// Basic configuration with sane defaults for local development
const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance_app";

async function start() {
  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);

  const app = express();

  // Security + logging middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    }),
  );
  app.use(morgan("dev"));
  app.use(json());

  // API routes
  app.use("/api/sessions", sessionRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);

  // Simple healthcheck
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Global error handler with clean JSON responses
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Unhandled error:", err);
      res
        .status(err.statusCode || 500)
        .json({ error: err.message || "Internal server error" });
    },
  );

  app.listen(PORT, () => {
    console.log(`Attendance backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});


