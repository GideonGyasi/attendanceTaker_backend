const express = require("express");
const crypto = require("crypto");
const  SessionModel  = require("../models/Session");
const  AttendanceModel  = require("../models/Attendance");

const sessionRouter = express.Router();

// POST /api/sessions
// Creates a new attendance session and returns a secure token.
sessionRouter.post("/", async (req, res, next) => {
  try {
    const { courseName, latitude, longitude, radiusMeters, startsAt, endsAt } = req.body || {};

    if (
      !courseName ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof radiusMeters !== "number" ||
      !startsAt ||
      !endsAt
    ) {
      return res.status(400).json({ error: "Invalid session payload" });
    }

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid start/end time" });
    }
    if (end <= start) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    const token = crypto.randomBytes(24).toString("base64url");

    const session = await SessionModel.create({
      token,
      courseName,
      latitude,
      longitude,
      radiusMeters,
      startsAt: start,
      endsAt: end,
    });

    res.status(201).json({
      token: session.token,
      courseName: session.courseName,
      latitude: session.latitude,
      longitude: session.longitude,
      radiusMeters: session.radiusMeters,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      path: `/attendance/${session.token}`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:token
sessionRouter.get("/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const session = await SessionModel.findOne({ token }).lean();
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    const isActive = now >= session.startsAt && now <= session.endsAt;

    res.json({
      token: session.token,
      courseName: session.courseName,
      latitude: session.latitude,
      longitude: session.longitude,
      radiusMeters: session.radiusMeters,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      isActive,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:token/attendance.csv
sessionRouter.get("/:token/attendance.csv", async (req, res, next) => {
  try {
    const { token } = req.params;
    const session = await SessionModel.findOne({ token }).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });

    const records = await AttendanceModel.find({ sessionId: session._id })
      .lean()
      .sort({ createdAt: 1 });

    const header = [
      "fullName",
      "studentNumber",
      "studentId",
      "indexNumber",
      "latitude",
      "longitude",
      "createdAt",
    ];

    const escape = (value) => {
      const raw = String(value || "");
      if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    };

    const lines = [header.join(","), ...records.map((r) =>
      [r.fullName, r.studentNumber, r.studentId, r.indexNumber, r.latitude, r.longitude, r.createdAt.toISOString()]
        .map(escape)
        .join(",")
    )];

    const csv = lines.join("\n");

    res.setHeader("Content-Disposition", `attachment; filename="attendance-${session.token}.csv"`);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:token/attendance.pdf
sessionRouter.get("/:token/attendance.pdf", async (req, res, next) => {
  try {
    const { token } = req.params;
    const session = await SessionModel.findOne({ token }).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });

    const records = await AttendanceModel.find({ sessionId: session._id })
      .lean()
      .sort({ createdAt: 1 });

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Disposition", `attachment; filename="attendance-${session.token}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text(`Attendance – ${session.courseName}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Token: ${session.token}`);
    doc.text(`Date: ${new Date(session.startsAt).toLocaleString()} – ${new Date(session.endsAt).toLocaleString()}`);
    doc.moveDown();

    records.forEach((r, index) => {
      doc.fontSize(11).text(
        `${index + 1}. ${r.fullName} | Student No: ${r.studentNumber} | ID: ${r.studentId} | Index: ${r.indexNumber} | Time: ${r.createdAt.toISOString()}`
      );
    });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = sessionRouter;
