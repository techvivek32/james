import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseAiBotModel } from "../../../src/lib/models/CourseAiBot";
import { CourseModel } from "../../../src/lib/models/Course";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const bot = await CourseAiBotModel.findOne({ id }).lean();
    if (!bot) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(bot);
  }

  if (req.method === "PATCH") {
    const updates = req.body;
    console.log('PATCH request - updates:', updates);

    // If course selection changed, rebuild trainingText
    if (updates.selectedPages !== undefined || updates.selectedCourses !== undefined) {
      const bot = await CourseAiBotModel.findOne({ id }).lean() as any;
      const selectedPages: string[] = updates.selectedPages ?? bot?.selectedPages ?? [];

      if (selectedPages.length > 0) {
        const courses = await CourseModel.find({}).lean() as any[];
        let trainingText = "";

        for (const course of courses) {
          const coursePages = (course.pages || []).filter((p: any) => selectedPages.includes(p.id));
          if (coursePages.length === 0) continue;

          trainingText += `\n\n=== COURSE: ${course.title} ===\n`;
          for (const page of coursePages) {
            trainingText += `\n--- Lesson: ${page.title} ---\n`;
            if (page.body) trainingText += page.body + "\n";
            if (page.transcript) trainingText += `\nTranscript:\n${page.transcript}\n`;
          }
        }
        updates.trainingText = trainingText.trim();
      }
    }

    const updated = await CourseAiBotModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, returnDocument: "after" }
    ).lean();
    
    console.log('Updated bot from DB:', updated);
    console.log('Status field in updated bot:', updated?.status);
    
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await CourseAiBotModel.deleteOne({ id });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PATCH, DELETE");
  res.status(405).end();
}
