import { Schema, model, models } from "mongoose";

const socialMediaMetricsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    platform: { 
      type: String, 
      required: true,
      enum: ["instagram", "facebook", "tiktok", "youtube"]
    },
    platformName: { type: String, required: true },
    followers: { type: Number, required: true, default: 0 },
    posts30d: { type: Number, required: true, default: 0 },
    views30d: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const SocialMediaMetricsModel = models.SocialMediaMetrics || model("SocialMediaMetrics", socialMediaMetricsSchema);
