import express from "express";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { SessionModel } from "../models/Session";
import { AttendanceModel } from "../models/Attendance";

export const adminRouter = express.Router();

// All admin routes require a valid admin token.
adminRouter.use(requireAdmin);

// GET /api/admin/summary
// Returns counts for dashboard stats.
adminRouter.get("/summary", async (_req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const [totalSessions, activeSessions, totalSubmissions] = await Promise.all([
      SessionModel.countDocuments({}),
      SessionModel.countDocuments({
        startsAt: { $lte: now },
        endsAt: { $gte: now },
      }),
      AttendanceModel.countDocuments({}),
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
adminRouter.get("/sessions", async (_req: AuthRequest, res, next) => {
  try {
    const sessions = await SessionModel.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const sessionIds = sessions.map((s) => s._id);
    const counts = await AttendanceModel.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
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
        submissions: countMap.get(String(s._id)) ?? 0,
      })),
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/sessions/:token
// Deletes a session and all associated attendance submissions.
adminRouter.delete("/sessions/:token", async (req: AuthRequest, res, next) => {
  try {
    const { token } = req.params;
    const session = await SessionModel.findOne({ token });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    await AttendanceModel.deleteMany({ sessionId: session._id });
    await SessionModel.deleteOne({ _id: session._id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});


