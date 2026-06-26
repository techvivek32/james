import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectMongo } from "../../../../../src/lib/mongodb";
import { UserModel } from "../../../../../src/lib/models/User";
import { ImpersonationLogModel } from "../../../../../src/lib/models/ImpersonationLog";
import { allowMethods, requireRole, signImpersonationSession, buildSessionCookie } from "../../../../../src/lib/auth";
import { getClientIp, getUserAgent } from "../../../../../src/lib/impersonation";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/social-media-metrics",
  manager: "/manager/dashboard",
  sales: "/sales/dashboard",
  marketing: "/marketing/dashboard",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!allowMethods(req, res, ["POST"])) return;

  // Only a real admin may start impersonation.
  const admin = requireRole(req, res, "admin");
  if (!admin) return;

  // No nested impersonation: an impersonation token already has imp=true.
  if (admin.imp) {
    res.status(409).json({ error: "Already impersonating. Exit first." });
    return;
  }

  const rawId = req.query.id;
  const targetId = typeof rawId === "string" ? decodeURIComponent(rawId) : null;
  if (!targetId) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (targetId === admin.sub) {
    res.status(400).json({ error: "You cannot impersonate yourself." });
    return;
  }

  await connectMongo();

  const target = await UserModel.findOne({ id: targetId }).lean() as any;
  if (!target || target.deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.suspended) {
    res.status(403).json({ error: "This account is suspended and cannot be viewed." });
    return;
  }

  const adminUser = await UserModel.findOne({ id: admin.sub }).lean() as any;

  // Create the audit row up front so the token can carry its id (lid).
  const logId = crypto.randomUUID();
  await ImpersonationLogModel.create({
    id: logId,
    adminId: admin.sub,
    adminName: adminUser?.name || "Admin",
    adminRole: admin.role,
    targetId: target.id,
    targetName: target.name,
    targetRole: target.role,
    startTime: new Date(),
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
    status: "active",
    actions: [],
  });

  const token = signImpersonationSession(
    { id: target.id, role: target.role },
    { id: admin.sub, role: admin.role },
    logId
  );
  res.setHeader("Set-Cookie", buildSessionCookie(token));

  const { passwordHash, ...safeTarget } = target;
  res.status(200).json({
    token,
    user: safeTarget,
    redirect: ROLE_HOME[target.role] || "/login",
    impersonatedBy: admin.sub,
    originalRole: admin.role,
    adminName: adminUser?.name || "Admin",
  });
}
