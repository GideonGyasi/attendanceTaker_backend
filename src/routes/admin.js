const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const SessionModel = require("../models/Session");
const AttendanceModel = require("../models/Attendance");

const adminRouter = express.Router();

// All admin routes require a valid admin token.
adminRouter.use(requireAdmin);

// GET /api/admin/summary
// Returns counts for dashboard stats.
adminRouter.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const adminId = req.adminId;

    const [totalSessions, activeSessions, totalSubmissions] = await Promise.all([
      SessionModel.countDocuments({ adminId }),
      SessionModel.countDocuments({
        adminId,
        startsAt: { $lte: now },
        endsAt: { $gte: now },
      }),
      AttendanceModel.countDocuments({
        sessionId: { $in: await SessionModel.find({ adminId }).distinct('_id') },
      }),
    ]);

    res.json({
      totalSessions,
      activeSessions,
      totalSubmissions,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/sessions
// List recent sessions with attendance counts.
adminRouter.get("/sessions", async (req, res, next) => {
  try {
    const adminId = req.adminId;

    const sessions = await SessionModel.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const counts = await AttendanceModel.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    counts.forEach((c) => {
      countMap.set(String(c._id), c.count);
    });

    res.json(
      sessions.map((s) => ({
        token: s.token,
        courseName: s.courseName,
        createdAt: s.createdAt,
        radiusMeters: s.radiusMeters,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        submissions: countMap.get(String(s._id)) || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/sessions/:token
// Deletes a session and all associated attendance submissions.
adminRouter.delete("/sessions/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const adminId = req.adminId;

    const session = await SessionModel.findOne({ token, adminId });
    if (!session) {
      return res.status(404).json({ error: "Session not found or access denied" });
    }

    await AttendanceModel.deleteMany({ sessionId: session._id });
    await SessionModel.deleteOne({ _id: session._id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/sessions/:token/attendance
// Manually add attendance for a student (admin only)
adminRouter.post("/sessions/:token/attendance", async (req, res, next) => {
  try {
    const { token } = req.params;
    const adminId = req.adminId;

    const { fullName, studentNumber, indexNumber } = req.body || {};

    if (!fullName || !studentNumber || !indexNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const session = await SessionModel.findOne({ token, adminId });
    if (!session) {
      return res.status(404).json({ error: "Session not found or access denied" });
    }

    // Use session center as location for manual entries
    const latitude = session.latitude;
    const longitude = session.longitude;

    // ✅ Admin entries can bypass unique compound index
    const submission = await AttendanceModel.create({
      sessionId: session._id,
      token: session.token,
      fullName,
      studentNumber,
      indexNumber,
      latitude,
      longitude,
      isAdminEntry: true, // <-- allows multiple submissions for same student
    });

    res.status(201).json({
      id: submission._id,
      createdAt: submission.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = adminRouter;
