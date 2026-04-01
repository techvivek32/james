import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { CourseAiBotModel } from "../../../src/lib/models/CourseAiBot";
import { BotChatHistoryModel } from "../../../src/lib/models/BotChatHistory";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { botId, messages, chatId, userId = "admin", userName = "Admin", userEmail = "", userRole = "admin" } = req.body;
  if (!botId || !messages?.length) return res.status(400).json({ error: "botId and messages required" });

  await connectMongo();
  const bot = await CourseAiBotModel.findOne({ id: botId }).lean() as any;
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const systemPrompt = bot.trainingText?.trim()
    ? `${bot.systemPrompt || "You are a helpful course assistant. Only answer questions related to the course content provided."}\n\nCOURSE CONTENT:\n${bot.trainingText}`
    : (bot.systemPrompt || "You are a helpful course assistant.");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: bot.model || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: (bot.creativity || 0) / 100,
        max_tokens: 800,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.statusText}`);
    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Save to chat history
    const cid = chatId || `course-chat-${botId}-${Date.now()}`;
    const allMessages = [...messages, { role: "assistant", content: reply, timestamp: new Date() }];
    const title = messages[0]?.content?.slice(0, 60) || "New Chat";

    await BotChatHistoryModel.findOneAndUpdate(
      { chatId: cid },
      { $set: { chatId: cid, botId, userId, userName, userEmail, userRole, title, messages: allMessages, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Increment totalMessages
    await CourseAiBotModel.updateOne({ id: botId }, { $inc: { totalMessages: 1 } });

    return res.status(200).json({ message: reply, chatId: cid });
  } catch (err: any) {
    console.error("Course bot chat error:", err);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}
