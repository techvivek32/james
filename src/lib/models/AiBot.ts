import { Schema, model, models } from "mongoose";

const trainingLinkSchema = new Schema({
  id: String,
  url: String,
  type: { type: String, enum: ["full-website", "webpage", "pdf", "word-doc", "excel-csv", "youtube"] },
  status: { type: String, enum: ["trained", "pending", "failed", "no-space"], default: "pending" },
  chars: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const qaSchema = new Schema({
  id: String,
  question: String,
  answer: String
}, { _id: false });

const aiBotSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  assignedRoles: [{ type: String }], // e.g. ["manager", "sales", "marketing"]
  // Training data
  trainingLinks: [trainingLinkSchema],
  trainingText: { type: String, default: "" },
  qaItems: [qaSchema],
  // Behaviour / Tune AI
  model: { type: String, default: "gpt-4o-mini" },
  creativity: { type: Number, default: 0 }, // 0-100
  systemPrompt: { type: String, default: "" },
  // Stats
  totalChats: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const AiBotModel = models.AiBot || model("AiBot", aiBotSchema);
