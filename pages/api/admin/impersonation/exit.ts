import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../../src/lib/mongodb";
import { UserModel } from "../../../../src/lib/models/User";
import { ImpersonationLogModel } from "../../../../src/lib/models/ImpersonationLog";
import { allowMethods, requireUser, signSession, buildSessionCookie } from "../../../../src/lib/auth";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/social-media-metrics",
  manager: "/manager/dashboard",
  sales: "/sales/dashboard",
  marketing: "/marketing/dashboard",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!allowMethods(req, res, ["POST"])) return;

  const session = requireUser(req, res);
  if (!session) return;

  // Must currently be an impersonation session.
  if (!session.imp || !session.act) {
    res.status(400).json({ error: "Not impersonating." });
    return;
  }

  await connectMongo();

  // Close the audit row (best-effort: still restore even if this fails).
  if (session.lid) {
    try {
      const log = await ImpersonationLogModel.findOne({ id: session.lid, status: "active" });
      if (log) {
        const endTime = new Date();
        log.endTime = endTime;
        log.durationMs = endTime.getTime() - new Date(log.startTime).getTime();
        log.status = "ended";
        await log.save();
      }
    } catch (err) {
      console.error("[Impersonation] Failed to close log:", (err as Error)?.message || err);
    }
  }

  const adminUser = await UserModel.findOne({ id: session.act }).lean() as any;
  if (!adminUser || adminUser.deleted) {
    res.status(404).json({ error: "Original admin account is no longer available. Please log in again." });
    return;
  }

  // Restore a normal session for the original admin.
  const originalRole = session.actRole || adminUser.role;
  const token = signSession({ id: adminUser.id, role: originalRole });
  res.setHeader("Set-Cookie", buildSessionCookie(token));

  const { passwordHash, ...safeAdmin } = adminUser;
  res.status(200).json({
    token,
    user: safeAdmin,
    redirect: ROLE_HOME[originalRole] || "/admin/social-media-metrics",
  });
}
