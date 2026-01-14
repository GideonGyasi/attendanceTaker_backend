const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Middleware to require a valid admin JWT in the Authorization header
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.adminId = payload.sub; // attach adminId to request
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function signAdminToken(adminId) {
  return jwt.sign({ sub: adminId }, JWT_SECRET, { expiresIn: "8h" });
}

module.exports = {
  requireAdmin,
  signAdminToken,
};
