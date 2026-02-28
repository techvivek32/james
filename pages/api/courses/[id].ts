 import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseModel } from "../../../src/lib/models/Course";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();
  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (req.method === "GET") {
    const course = await CourseModel.findOne({ id }).lean();
    if (!course) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(200).json(course);
    return;
  }

  if (req.method === "PUT") {
    const updated = await CourseModel.findOneAndUpdate({ id }, req.body, {
      new: true,
      upsert: true
    }).lean();
    res.status(200).json(updated);
    return;
  }

  if (req.method === "DELETE") {
    await CourseModel.deleteOne({ id });
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
}
