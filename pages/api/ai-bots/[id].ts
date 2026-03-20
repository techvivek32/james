import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const bot = await AiBotModel.findOne({ id });
    if (!bot) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(bot);
  }

  if (req.method === "PATCH") {
    const bot = await AiBotModel.findOneAndUpdate({ id }, { $set: req.body }, { new: true });
    if (!bot) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(bot);
  }

  if (req.method === "DELETE") {
    await AiBotModel.findOneAndUpdate({ id }, { $set: { isActive: false } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  res.status(405).end();
}
