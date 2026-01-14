const express = require("express");
const { SessionModel } = require("../models/Session");
const { AttendanceModel } = require("../models/Attendance");
const { haversineDistanceMeters } = require("../utils/geo");

const attendanceRouter = express.Router();

// POST /api/attendance/:token
// Accepts a single student's attendance submission.
attendanceRouter.post("/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const {
      fullName,
      studentNumber,
      studentId,
      indexNumber,
      latitude,
      longitude,
    } = req.body || {};

    if (
      !fullName ||
      !studentNumber ||
      !studentId ||
      !indexNumber ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({ error: "Invalid attendance payload" });
    }

    const session = await SessionModel.findOne({ token });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    if (now < session.startsAt || now > session.endsAt) {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Server-side geofence validation using Haversine formula.
    const distance = haversineDistanceMeters(
      latitude,
      longitude,
      session.latitude,
      session.longitude
    );

    if (distance > session.radiusMeters) {
      return res.status(403).json({ error: "Outside allowed location" });
    }

    try {
      const submission = await AttendanceModel.create({
        sessionId: session._id,
        token: session.token,
        fullName,
        studentNumber,
        studentId,
        indexNumber,
        latitude,
        longitude,
      });

      res.status(201).json({
        id: submission._id,
        createdAt: submission.createdAt,
      });
    } catch (err) {
      // Duplicate index violation = student already submitted.
      if (err && err.code === 11000) {
        return res
          .status(409)
          .json({ error: "Attendance already submitted for this session" });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = attendanceRouter;
