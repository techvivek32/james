import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const bot = await AiBotModel.findOne({ id }).lean();
    if (!bot) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(normalizeBot(bot));
  }

  if (req.method === "PATCH") {
    const { _id, id: _id2, ...safeUpdates } = req.body;
    // For Mixed type fields like teamMemberAccess, use findOne + save to ensure markModified works
    const botDoc = await AiBotModel.findOne({ id });
    if (!botDoc) return res.status(404).json({ error: "Not found" });
    Object.assign(botDoc, safeUpdates);
    if (safeUpdates.teamMemberAccess !== undefined) {
      botDoc.markModified("teamMemberAccess");
    }
    await botDoc.save();
    const saved = botDoc.toObject();
    return res.status(200).json(normalizeBot(saved));
  }

  if (req.method === "DELETE") {
    await AiBotModel.findOneAndUpdate({ id }, { $set: { isActive: false } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  res.status(405).end();
}

function normalizeBot(doc: any) {
  const { _id, __v, ...rest } = doc;
  // Ensure all appearance/settings fields have defaults so they're never undefined
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
    teamMemberAccess: rest.teamMemberAccess ?? {},
    trainingLinks: rest.trainingLinks ?? [],
    qaItems: rest.qaItems ?? [],
  };
}
