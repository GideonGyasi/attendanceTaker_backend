const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: false }, // Optional for Google OAuth users
    googleId: { type: String, required: false, unique: true, sparse: true },
    name: { type: String, required: false },
    picture: { type: String, required: false },
    isGoogleUser: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const AdminModel = mongoose.model("Admin", AdminSchema);

module.exports = AdminModel;
