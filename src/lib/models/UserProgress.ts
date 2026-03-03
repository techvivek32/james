import { Schema, model, models } from "mongoose";

const userProgressSchema = new Schema(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completedPages: [String]
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgressModel = models.UserProgress || model("UserProgress", userProgressSchema);
