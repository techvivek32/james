import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserProgressModel } from "../../../src/lib/models/UserProgress";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const { userId, courseIds } = req.query;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    if (!courseIds || (courseIds as string).trim() === '') {
      res.status(200).json({});
      return;
    }

    try {
      const courseIdArray = (courseIds as string).split(',').filter(id => id.trim());

      if (courseIdArray.length === 0) {
        res.status(200).json({});
        return;
      }

      // Read from UserProgress — same collection the frontend writes to
      const progressRecords = await UserProgressModel.find({
        userId,
        courseId: { $in: courseIdArray }
      }).lean();

      const result: Record<string, any> = {};

      courseIdArray.forEach(courseId => {
        const progress = progressRecords.find((p: any) => p.courseId === courseId);
        result[courseId] = progress || {
          completedPages: [],
          quizResults: [],
          courseCompleted: false
        };
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Failed to fetch course progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end();
  }
}
