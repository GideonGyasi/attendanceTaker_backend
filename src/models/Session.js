const mongoose = require("mongoose");
const { Schema } = mongoose;

// Document describing an attendance session configuration
// This is short-lived (TTL index is defined below)
const SessionSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true, // Prevent collision of session tokens
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      required: false, // TODO: Make required after migrating existing sessions
      index: true, // Index for efficient admin-based queries
    },
    courseName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: automatically remove the session 24h after creation
SessionSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24, // 24h
  }
);

const SessionModel = mongoose.model("Session", SessionSchema);

module.exports = SessionModel;
