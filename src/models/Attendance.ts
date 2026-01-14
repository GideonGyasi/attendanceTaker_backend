import mongoose, { Document, Schema } from "mongoose";

// Document representing a single student's attendance submission.
export interface AttendanceDocument extends Document {
  sessionId: mongoose.Types.ObjectId;
  token: string; // denormalized for easier lookup by token
  fullName: string;
  studentNumber: string;
  studentId: string;
  indexNumber: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

const AttendanceSchema = new Schema<AttendanceDocument>(
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
    studentId: { type: String, required: true },
    indexNumber: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Enforce "one submission per session per student" using a compound index.
AttendanceSchema.index(
  {
    sessionId: 1,
    studentNumber: 1,
    studentId: 1,
    indexNumber: 1,
  },
  { unique: true },
);

// TTL index: attendance submissions also expire after 24h.
AttendanceSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24,
  },
);

export const AttendanceModel = mongoose.model<AttendanceDocument>(
  "Attendance",
  AttendanceSchema,
);


