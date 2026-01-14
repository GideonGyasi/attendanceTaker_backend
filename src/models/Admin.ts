import mongoose, { Document, Schema } from "mongoose";

export interface AdminDocument extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const AdminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const AdminModel = mongoose.model<AdminDocument>("Admin", AdminSchema);


