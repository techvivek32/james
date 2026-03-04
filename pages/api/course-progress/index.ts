import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { connectMongo } from "../../../src/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    try {
      const { userId, courseId } = req.query;

      // Get user progress from database
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const userProgressCollection = db.collection('userprogresses');
      
      if (userId && courseId) {
        // Get specific user's progress for a course
        const progress = await userProgressCollection.findOne({ 
          userId: userId as string, 
          courseId: courseId as string 
        });
        
        if (progress) {
          const completionPercentage = progress.completedLessons?.length 
            ? Math.round((progress.completedLessons.length / (progress.totalLessons || 1)) * 100)
            : 0;
          res.status(200).json({ 
            userId: progress.userId,
            courseId: progress.courseId,
            completionPercentage 
          });
        } else {
          res.status(200).json({ completionPercentage: 0 });
        }
        return;
      }

      if (userId) {
        // Get all progress for a user
        const progress = await userProgressCollection.find({ 
          userId: userId as string 
        }).toArray();
        
        const formattedProgress = progress.map(p => ({
          userId: p.userId,
          courseId: p.courseId,
          completionPercentage: p.completedLessons?.length 
            ? Math.round((p.completedLessons.length / (p.totalLessons || 1)) * 100)
            : 0
        }));
        
        res.status(200).json(formattedProgress);
        return;
      }

      // Get all progress for all users
      const allProgress = await userProgressCollection.find().toArray();
      
      const formattedProgress = allProgress.map(p => ({
        userId: p.userId,
        courseId: p.courseId,
        completionPercentage: p.completedLessons?.length 
          ? Math.round((p.completedLessons.length / (p.totalLessons || 1)) * 100)
          : 0
      }));
      
      res.status(200).json(formattedProgress);
      return;
    } catch (error) {
      console.error("Error fetching course progress:", error);
      res.status(200).json([]);
      return;
    }
  }

  res.setHeader("Allow", "GET");
  res.status(405).end();
}
