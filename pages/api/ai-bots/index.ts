import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === "GET") {
    const bots = await AiBotModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    // Normalize: expose custom `id` field, remove mongo internals
    const normalized = bots.map(normalizeBot);
    return res.status(200).json(normalized);
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const id = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bot = await AiBotModel.create({ id, name: name.trim() });
    return res.status(201).json(normalizeBot(bot.toObject()));
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}

function normalizeBot(doc: any) {
  const { _id, __v, ...rest } = doc;
  return {
    ...rest,
    botTitle: rest.botTitle ?? "",
    displayMessage: rest.displayMessage ?? "",
    displayMessageEnabled: rest.displayMessageEnabled ?? false,
    welcomeMessage: rest.welcomeMessage ?? "Hi, How can I help you today?",
    showWelcomePopup: rest.showWelcomePopup ?? true,
    placeholder: rest.placeholder ?? "Ask me anything...",
    suggestions: rest.suggestions ?? [],
    removeSuggestionsAfterFirst: rest.removeSuggestionsAfterFirst ?? false,
    colorTheme: rest.colorTheme ?? "#3b82f6",
    botAvatarUrl: rest.botAvatarUrl ?? "",
    chatIconSize: rest.chatIconSize ?? 60,
    enterMessage: rest.enterMessage ?? "Chat Now",
    attentionSound: rest.attentionSound ?? "None",
    attentionAnimation: rest.attentionAnimation ?? "None",
    immediatelyOpenChat: rest.immediatelyOpenChat ?? false,
    leadCollection: rest.leadCollection ?? false,
    privacyPolicyEnabled: rest.privacyPolicyEnabled ?? true,
    privacyActionText: rest.privacyActionText ?? "Read our",
    privacyLinkText: rest.privacyLinkText ?? "Privacy Policy",
    privacyLink: rest.privacyLink ?? "",
    isPublic: rest.isPublic ?? false,
    assignedRoles: rest.assignedRoles ?? [],
    teamMembers: rest.teamMembers ?? [],
    trainingLinks: rest.trainingLinks ?? [],
    qaItems: rest.qaItems ?? [],
  };
}
