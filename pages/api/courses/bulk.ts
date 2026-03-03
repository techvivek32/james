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
    console.log(`  Course ${c.id}: ${c.pages?.length || 0} pages`);
    c.pages?.forEach(p => {
      if (p.isQuiz) {
        console.log(`    - Quiz: ${p.title}, questions: ${p.quizQuestions?.length || 0}`);
      }
    });
  });

  const ids = courses.map((course) => course.id).filter(Boolean);
  await CourseModel.deleteMany({
    id: { $nin: ids.length ? ids : ["__none__"] }
  });

  await Promise.all(
    courses.map((course) =>
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
    console.log(`  Course ${c.id}: ${c.pages?.length || 0} pages`);
    c.pages?.forEach(p => {
      if (p.isQuiz) {
        console.log(`    - Quiz: ${p.title}, questions: ${p.quizQuestions?.length || 0}`);
      }
    });
  });
  res.status(200).json(nextCourses);
}
