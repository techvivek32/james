import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseModel } from "../../../src/lib/models/Course";
import { UserModel } from "../../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  await connectMongo();

  if (req.method === "GET") {
    const { userId, userRole } = req.query;
    
    console.log('📚 Courses API called with userId:', userId, 'userRole:', userRole);
    
    // Fetch all course data (needed for lessons, quizzes, etc.)
    const courses = await CourseModel.find({}).lean();
    console.log('📚 Total courses in DB:', courses.length);
    
    // If no user context, return all courses (for admin)
    if (!userId || !userRole) {
      console.log('📚 No user context, returning all courses');
      res.status(200).json(courses);
      return;
    }
    
    // Get user to check training center feature toggle
    const user = await UserModel.findOne({ id: userId }).lean();
    if (!user) {
      console.log('📚 User not found, returning empty array');
      res.status(200).json([]);
      return;
    }
    
    console.log('📚 User found:', user.name, 'trainingCenter toggle:', user.featureToggles?.trainingCenter);
    
    // Filter courses based on access mode and user's training center toggle
    const filteredCourses = courses.filter((course: any) => {
      console.log('📚 Checking course:', course.title, 'status:', course.status, 'accessMode:', course.accessMode);
      
      // Only show published courses (not draft)
      if (course.status !== "published") {
        console.log('  ❌ Not published');
        return false;
      }
      
      // Check if user has training center enabled
      if (!user.featureToggles?.trainingCenter) {
        console.log('  ❌ Training center not enabled for user');
        return false;
      }
      
      // If course is open to all members, show it
      if (course.accessMode === "open" || !course.accessMode) {
        console.log('  ✅ Open access');
        return true;
      }
      
      // If course is assigned only, show only to managers
      if (course.accessMode === "assigned" && userRole === "manager") {
        console.log('  ✅ Assigned to manager');
        return true;
      }
      
      console.log('  ❌ Access denied');
      return false;
    });
    
    console.log('📚 Filtered courses count:', filteredCourses.length);
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
