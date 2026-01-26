const mongoose = require("mongoose");
const { Schema } = mongoose;

// Document representing a single student's attendance submission
const AttendanceSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    studentNumber: { type: String, required: true },
    indexNumber: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    isAdminEntry: { type: Boolean, default: false }, // <-- admin bypass flag
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique index for normal students only (admin entries bypass uniqueness)
AttendanceSchema.index(
  { sessionId: 1, studentNumber: 1, indexNumber: 1 },
  { unique: true, partialFilterExpression: { isAdminEntry: false } }
);

// TTL index: attendance submissions expire after 24h
AttendanceSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
);

const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);

module.exports = AttendanceModel;
