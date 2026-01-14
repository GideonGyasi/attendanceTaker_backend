import mongoose, { Document, Schema } from "mongoose";

// Document describing an attendance session configuration.
// This is short-lived (TTL index is defined below).
export interface SessionDocument extends Document {
  token: string; // Unguessable session token shared with students
  courseName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true, // Prevent collision of session tokens
      index: true,
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
  },
);

// TTL index: automatically remove the session 24h after creation.
SessionSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24, // 24h
  },
);

export const SessionModel = mongoose.model<SessionDocument>(
  "Session",
  SessionSchema,
);


