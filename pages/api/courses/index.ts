import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseModel } from "../../../src/lib/models/Course";
import { UserModel } from "../../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const { userId, userRole } = req.query;
    
    // Fetch all course data (needed for lessons, quizzes, etc.)
    const courses = await CourseModel.find({}).lean();
    
    // If no user context, return all courses (for admin)
    if (!userId || !userRole) {
      res.status(200).json(courses);
      return;
    }
    
    // Get user to check training center feature toggle
    const user = await UserModel.findOne({ id: userId }).lean();
    if (!user) {
      res.status(200).json([]);
      return;
    }
    
    // Filter courses based on access mode and user's training center toggle
    const filteredCourses = courses.filter((course: any) => {
      // Only show published courses (not draft)
      if (course.status !== "published") return false;
      
      // Check if user has training center enabled
      if (!user.featureToggles?.trainingCenter) return false;
      
      // If course is open to all members, show it
      if (course.accessMode === "open" || !course.accessMode) return true;
      
      // If course is assigned only, show only to managers
      if (course.accessMode === "assigned" && userRole === "manager") return true;
      
      return false;
    });
    
    res.status(200).json(filteredCourses);
    return;
  }

  if (req.method === "POST") {
    const payload = req.body;
    const id = payload.id || `course-${Date.now()}`;
    const created = await CourseModel.create({ ...payload, id });
    res.status(201).json(created);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
