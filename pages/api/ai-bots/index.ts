import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === "GET") {
    const bots = await AiBotModel.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json(bots);
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const id = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bot = await AiBotModel.create({ id, name: name.trim() });
    return res.status(201).json(bot);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
