import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { BotChatHistoryModel } from "../../../src/lib/models/BotChatHistory";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  // GET: fetch chat sessions for a user+bot, or all sessions for a bot (admin)
  if (req.method === "GET") {
    const { botId, userId } = req.query as { botId?: string; userId?: string };
    if (!botId) return res.status(400).json({ error: "botId required" });

    const query: any = { botId };
    if (userId) query.userId = userId;

    const chats = await BotChatHistoryModel.find(query)
      .sort({ updatedAt: -1 })
      .select("-messages"); // list view — no messages
    return res.status(200).json(chats);
  }

  // POST: save/update a chat session
  if (req.method === "POST") {
    const { chatId, botId, userId, userName, userEmail, userRole, title, messages } = req.body;
    if (!chatId || !botId || !userId) return res.status(400).json({ error: "Missing required fields" });

    const chat = await BotChatHistoryModel.findOneAndUpdate(
      { chatId },
      { $set: { botId, userId, userName, userEmail, userRole, title, messages } },
      { upsert: true, new: true }
    );
    return res.status(200).json(chat);
  }

  // DELETE: delete a chat session
  if (req.method === "DELETE") {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: "chatId required" });
    await BotChatHistoryModel.deleteOne({ chatId });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end();
}
