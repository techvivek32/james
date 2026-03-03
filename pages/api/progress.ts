import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../src/lib/mongodb";
import { UserProgressModel } from "../../src/lib/models/UserProgress";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === "GET") {
    const { userId, courseId } = req.query;
    if (!userId || !courseId) {
      res.status(400).json({ error: "Missing userId or courseId" });
      return;
    }
    const progress = await UserProgressModel.findOne({ userId, courseId }).lean();
    res.status(200).json(progress || { userId, courseId, completedPages: [] });
    return;
  }

  if (req.method === "POST") {
    const { userId, courseId, completedPages, quizResults, courseCompleted } = req.body;
    if (!userId || !courseId) {
      res.status(400).json({ error: "Invalid data" });
      return;
    }
    const updateData: any = {};
    if (Array.isArray(completedPages)) updateData.completedPages = completedPages;
    if (Array.isArray(quizResults)) updateData.quizResults = quizResults;
    if (courseCompleted === true) {
      updateData.courseCompleted = true;
      updateData.completedAt = new Date();
    }
    
    const progress = await UserProgressModel.findOneAndUpdate(
      { userId, courseId },
      { $set: updateData },
      { upsert: true, new: true }
    ).lean();
    res.status(200).json(progress);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
