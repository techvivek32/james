import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseModel } from "../../../src/lib/models/Course";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    res.status(405).end();
    return;
  }

  const courses = Array.isArray(req.body) ? req.body : req.body?.courses;
  if (!Array.isArray(courses)) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  console.log(`[Bulk Save] Saving ${courses.length} courses`);

  // Migrate fileUrls from string[] to LessonLink[] format
  const migratedCourses = courses.map(course => {
    if (course.pages && Array.isArray(course.pages)) {
      course.pages = course.pages.map((page: any) => {
        if (page.fileUrls && Array.isArray(page.fileUrls)) {
          page.fileUrls = page.fileUrls.map((fileUrl: any) => {
            // If it's already an object with label and href, keep it
            if (typeof fileUrl === 'object' && fileUrl.label && fileUrl.href) {
              return fileUrl;
            }
            // If it's a string, convert to object format
            if (typeof fileUrl === 'string') {
              const fileName = fileUrl.split('/').pop() || 'File';
              return { label: fileName, href: fileUrl };
            }
            // Fallback for any other format
            return { label: 'File', href: String(fileUrl) };
          });
        }
        return page;
      });
    }
    return course;
  });

  // Save all courses in parallel
  const savedCourses = await Promise.all(
    migratedCourses.map((course) =>
      CourseModel.findOneAndUpdate(
        { id: course.id },
        { $set: course },
        { upsert: true, new: true, lean: true }
      )
    )
  );

  console.log(`[Bulk Save] Successfully saved ${savedCourses.length} courses`);
  res.status(200).json(savedCourses);
}
