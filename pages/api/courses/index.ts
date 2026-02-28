import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseModel } from "../../../src/lib/models/Course";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const courses = await CourseModel.find().lean();
    res.status(200).json(courses);
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
