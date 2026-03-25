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

  console.log("Bulk save - Received courses:");
  courses.forEach(c => {
    console.log(`  Course ${c.id}: ${c.title}, order: ${c.order}`);
    console.log(`    - Status: ${c.status}`);
    console.log(`    - Pages: ${c.pages?.length || 0}`);
    c.pages?.forEach((p: any) => {
      console.log(`      - Page: ${p.title} (${p.id})`);
      console.log(`        - Status: ${p.status}`);
      console.log(`        - Video URL: ${p.videoUrl || 'none'}`);
      console.log(`        - Resource Links: ${p.resourceLinks?.length || 0}`);
      console.log(`        - File URLs: ${p.fileUrls?.length || 0}`);
      console.log(`        - Body length: ${p.body?.length || 0}`);
      if (p.isQuiz) {
        console.log(`        - Quiz questions: ${p.quizQuestions?.length || 0}`);
      }
    });
  });

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

  const ids = migratedCourses.map((course) => course.id).filter(Boolean);

  // Only delete courses that are not in the new list AND were previously saved
  // (avoid deleting everything if an empty/partial list is sent accidentally)
  if (ids.length > 0) {
    await CourseModel.deleteMany({ id: { $nin: ids } });
  }

  console.log("About to save courses with order:");
  migratedCourses.forEach(c => {
    console.log(`  ${c.id}: order=${c.order}`);
  });

  await Promise.all(
    migratedCourses.map((course) =>
      CourseModel.findOneAndUpdate(
        { id: course.id },
        { $set: course },
        { upsert: true, new: true }
      )
    )
  );

  const nextCourses = await CourseModel.find().lean();
  console.log("After save - courses in DB:");
  nextCourses.forEach(c => {
    console.log(`  Course ${c.id}: ${c.pages?.length || 0} pages, order: ${c.order}`);
    c.pages?.forEach((p: any) => {
      if (p.isQuiz) {
        console.log(`    - Quiz: ${p.title}, questions: ${p.quizQuestions?.length || 0}`);
      }
    });
  });
  res.status(200).json(nextCourses);
}
