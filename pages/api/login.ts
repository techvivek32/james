import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../src/lib/mongodb";
import { UserModel } from "../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  await connectMongo();
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword =
    typeof password === "string" ? password.trim() : "";
  const moduleKeys = [
    "dashboard",
    "userManagement",
    "roleHierarchy",
    "businessUnits",
    "salesOverview",
    "marketingOverview",
    "courseManagement",
    "materialsLibrary",
    "approvalWorkflows",
    "aiBots",
    "webTemplates",
    "featureToggles",
    "systemSettings",
    "teamBusinessPlans",
    "teamFunnelMetrics",
    "teamTraining",
    "aiAssistant",
    "businessPlan",
    "trainingCenter",
    "marketingMaterials",
    "aiChat",
    "repWebPage",
    "businessCards",
    "assetLibrary",
    "contentApprovals",
    "socialMetrics"
  ];
  const defaultToggles = moduleKeys.reduce<Record<string, boolean>>(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {}
  );

  function sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  if (!normalizedEmail || !normalizedPassword) {
    res.status(400).json({ error: "Email and password required." });
    return;
  }

  const totalUsers = await UserModel.countDocuments();
  if (totalUsers === 0) {
    const name = normalizedEmail.split("@")[0] || "User";
    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const created = await UserModel.create({
      id: `user-${Date.now()}`,
      name,
      email: normalizedEmail,
      role: "admin",
      strengths: "",
      weaknesses: "",
      passwordHash,
      publicProfile: {
        showHeadshot: false,
        showEmail: false,
        showPhone: false,
        showStrengths: false,
        showWeaknesses: false,
        showTerritory: false
      },
      featureToggles: defaultToggles
    });
    res.status(201).json(sanitizeUser(created.toObject()));
    return;
  }

  const user = await UserModel.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.deleted) {
    res.status(403).json({ error: "Account has been deleted. Contact administrator." });
    return;
  }

  if (user.suspended) {
    res.status(403).json({ error: "Account suspended. Contact administrator." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "No password set. Please contact admin." });
    return;
  }

  const match = await bcrypt.compare(normalizedPassword, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.status(200).json(sanitizeUser(user));
}
