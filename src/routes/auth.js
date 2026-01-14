const express = require("express");
const bcrypt = require("bcryptjs");
const { AdminModel } = require("../models/Admin");
const { signAdminToken, requireAdmin } = require("../middleware/auth");

const authRouter = express.Router();

// POST /api/auth/register
// Simple email/password admin registration.
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await AdminModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Admin with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await AdminModel.create({ email, passwordHash });
    const token = signAdminToken(admin._id.toString());

    res.status(201).json({ token, email: admin.email });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAdminToken(admin._id.toString());
    res.json({ token, email: admin.email });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get("/me", requireAdmin, async (req, res, next) => {
  try {
    const admin = await AdminModel.findById(req.adminId).lean();
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ email: admin.email });
  } catch (err) {
    next(err);
  }
});

module.exports = authRouter;
