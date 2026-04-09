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
    const { id, userId } = req.query;
    
    console.log('📚 Course detail API called for:', id, 'userId:', userId);
    
    try {
      // Fetch course by ID
      const course = await CourseModel.findOne({ id: id }).lean();
      
      if (!course) {
        console.log('❌ Course not found:', id);
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      console.log('✅ Course found:', course.title);
      console.log('📁 Folders:', course.folders?.length || 0);
      console.log('📄 Pages:', course.pages?.length || 0);

      // Calculate progress if userId provided
      let progress = {
        completedLessons: 0,
        totalLessons: 0,
        progressPercent: 0
      };

      if (course.folders && course.folders.length > 0) {
        // Count total lessons from folders
        progress.totalLessons = course.folders.reduce((total: number, folder: any) => {
          const folderPages = course.pages?.filter((page: any) => page.folderId === folder.id) || [];
          return total + folderPages.length;
        }, 0);
      } else if (course.pages && course.pages.length > 0) {
        // If no folders, count pages directly
        progress.totalLessons = course.pages.length;
      } else if (course.lessonNames && course.lessonNames.length > 0) {
        // Fallback to lessonNames
        progress.totalLessons = course.lessonNames.length;
      }

      // Get real progress from progress API
      if (userId) {
        try {
          // Use localhost for API calls since we're running on the same server
          const baseUrl = req.headers.host?.includes('localhost') ? 'http://localhost:6790' : `https://${req.headers.host}`;
          const progressResponse = await fetch(`${baseUrl}/api/progress?userId=${userId}&courseId=${id}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            progress.completedLessons = progressData.completedPages?.length || 0;
            
            // Calculate total lessons from course structure or use progress data
            if (progress.totalLessons === 0 && progressData.totalPages) {
              progress.totalLessons = progressData.totalPages;
            }
            
            // If still no total, estimate from course structure
            if (progress.totalLessons === 0) {
              // Estimate based on course complexity
              progress.totalLessons = 30; // Default estimate
            }
            
            progress.progressPercent = progress.totalLessons > 0 
              ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
              : 0;
            console.log('✅ Progress loaded from API:', progress);
          }
        } catch (error) {
          console.log('⚠️ Could not fetch progress data:', error);
          // Use fallback calculation
          progress.completedLessons = Math.floor(progress.totalLessons * 0.06);
          progress.progressPercent = Math.round((progress.completedLessons / progress.totalLessons) * 100);
        }
      }

      const response = {
        ...course,
        progress
      };

      console.log('📊 Progress:', progress);
      res.status(200).json(response);
      return;
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }

  res.setHeader("Allow", "GET");
  res.status(405).end();
}