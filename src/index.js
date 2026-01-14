require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { json } = require("body-parser");

const sessionRouter  = require("./routes/session");
const attendanceRouter  = require("./routes/attendance");
const authRouter = require("./routes/auth");
const  adminRouter = require("./routes/admin");

// Basic configuration with sane defaults for local development
const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI;

async function start() {
  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);

  const app = express();

  // Security + logging middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    })
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
  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`Attendance backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
