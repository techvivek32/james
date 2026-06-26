import { Schema, model, models, deleteModel } from "mongoose";

// One row per "View As" session. Created when an admin starts impersonating a
// user (status "active"), updated on exit (status "ended", endTime/durationMs).
// Every write request performed while impersonating is appended to `actions`.

const impersonationActionSchema = new Schema(
  {
    endpoint: String,
    method: String,
    timestamp: Date,
  },
  { _id: false }
);

const impersonationLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    adminId: { type: String, required: true, index: true },
    adminName: String,
    adminRole: String,
    targetId: { type: String, required: true, index: true },
    targetName: String,
    targetRole: String,
    startTime: { type: Date, required: true },
    endTime: Date,
    durationMs: Number,
    ip: String,
    userAgent: String,
    status: { type: String, enum: ["active", "ended"], default: "active", index: true },
    actions: { type: [impersonationActionSchema], default: [] },
  },
  { timestamps: true }
);

// In dev, Next.js keeps the previously-compiled Mongoose model across hot
// reloads. Drop the cached model so a changed schema is always picked up.
// (In production the model compiles once, so `models.ImpersonationLog` is falsy
// here and this is a no-op.)
if (models.ImpersonationLog) {
  deleteModel("ImpersonationLog");
}

export const ImpersonationLogModel = model("ImpersonationLog", impersonationLogSchema);
