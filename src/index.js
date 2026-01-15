require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const sessionRouter = require("./routes/session");
const attendanceRouter = require("./routes/attendance");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ Allowed frontend origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  "http://localhost:5173",
  "https://attendancetaker-frontend.vercel.app",
];

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");

  const app = express();

  // 🔐 Security headers
  app.use(helmet());

  // ✅ CORS — THIS IS THE IMPORTANT PART
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked origin: ${origin}`));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true, // important for auth
    })
  );

  // ✅ Handle preflight explicitly
  app.options("*", cors());

  // 🪵 Logging
  app.use(morgan("dev"));

  // 📦 Body parsing
  app.use(bodyParser.json());


  // �🚏 Routes
  app.use("/api/sessions", sessionRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);

  // ❤️ Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ❌ Global error handler
  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Attendance backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server", err);
  process.exit(1);
});
