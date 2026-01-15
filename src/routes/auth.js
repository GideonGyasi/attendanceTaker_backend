const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const  AdminModel  = require("../models/Admin");
const { signAdminToken, requireAdmin } = require("../middleware/auth");

const authRouter = express.Router();

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if admin already exists with this Google ID
      let admin = await AdminModel.findOne({ googleId: profile.id });

      if (admin) {
        return done(null, admin);
      }

      // Check if admin exists with this email
      admin = await AdminModel.findOne({ email: profile.emails[0].value });

      if (admin) {
        // Link Google account to existing admin
        admin.googleId = profile.id;
        admin.name = profile.displayName;
        admin.picture = profile.photos[0].value;
        admin.isGoogleUser = true;
        await admin.save();
        return done(null, admin);
      }

      // Create new admin with Google account
      admin = await AdminModel.create({
        email: profile.emails[0].value,
        googleId: profile.id,
        name: profile.displayName,
        picture: profile.photos[0].value,
        isGoogleUser: true
      });

      return done(null, admin);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await AdminModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

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
    res.json({ email: admin.email, name: admin.name, picture: admin.picture, isGoogleUser: admin.isGoogleUser });
  } catch (err) {
    next(err);
  }
});

// Google OAuth routes
authRouter.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const token = signAdminToken(req.user._id.toString());
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?token=${token}&google=true`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

module.exports = authRouter;
