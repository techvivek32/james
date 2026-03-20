import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";
import { BotChatModel } from "../../../src/lib/models/BotChat";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  await connectMongo();
  const { botId, messages, chatId, userId, userName, userEmail, userRole } = req.body;

  const bot = await AiBotModel.findOne({ id: botId, isActive: true });
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  // Build system prompt from all training data
  let systemContent = bot.systemPrompt || `You are a helpful AI assistant named ${bot.name}.`;

  if (bot.trainingText?.trim()) {
    systemContent += `\n\nTRAINING CONTENT:\n${bot.trainingText}`;
  }

  if (bot.qaItems?.length > 0) {
    const qaText = bot.qaItems
      .filter((q: any) => q.question && q.answer)
      .map((q: any) => `Q: ${q.question}\nA: ${q.answer}`)
      .join("\n\n");
    if (qaText) systemContent += `\n\nFREQUENTLY ASKED QUESTIONS:\n${qaText}`;
  }

  const temperature = (bot.creativity || 0) / 100;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: bot.model || "gpt-4o-mini",
        messages: [{ role: "system", content: systemContent }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
        temperature,
        max_tokens: 800
      })
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.statusText}`);
    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Auto-generate title from first user message
    let title = "New Chat";
    const firstUserMsg = messages.find((m: any) => m.role === "user");
    if (firstUserMsg) {
      title = firstUserMsg.content.substring(0, 60).trim();
      if (firstUserMsg.content.length > 60) title += "...";
    }

    // Save chat to DB
    if (chatId && userId) {
      const allMessages = [...messages, { role: "assistant", content: reply, timestamp: new Date() }];
      await BotChatModel.findOneAndUpdate(
        { chatId },
        { chatId, botId, userId, userName: userName || "User", userEmail: userEmail || "", userRole: userRole || "", title, messages: allMessages },
        { upsert: true, new: true }
      );
    }

    // Update bot stats
    await AiBotModel.findOneAndUpdate({ id: botId }, { $inc: { totalMessages: 1 } });

    return res.status(200).json({ message: reply });
  } catch (err) {
    console.error("Bot chat error:", err);
    return res.status(500).json({ error: "Failed to get response" });
  }
}
