// ---------------------------------------------------------------------------
// Impersonation ("View As") audit helpers.
//
// Wire write-action auditing into any mutation API route in one line:
//
//   import { withImpersonationAudit } from "../../src/lib/impersonation";
//   async function handler(req, res) { ... }
//   export default withImpersonationAudit(handler);
//
// When the caller's session is an impersonation token, every POST/PUT/PATCH/
// DELETE is appended to the active ImpersonationLog. Read requests and normal
// (non-impersonated) sessions pass straight through untouched. Auditing is
// best-effort: it never delays or fails the wrapped request.
// ---------------------------------------------------------------------------

import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "./mongodb";
import { ImpersonationLogModel } from "./models/ImpersonationLog";
import { getAuthUser, type Session } from "./auth";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real;
  return req.socket?.remoteAddress || "unknown";
}

export function getUserAgent(req: NextApiRequest): string {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : "unknown";
}

/**
 * Append a write action to the active ImpersonationLog for the given session.
 * Best-effort: swallows all errors so it can never break the wrapped request.
 */
export async function recordImpersonatedAction(
  session: Session,
  endpoint: string,
  method: string
): Promise<void> {
  if (!session.imp || !session.lid) return;
  try {
    await connectMongo();
    await ImpersonationLogModel.updateOne(
      { id: session.lid, status: "active" },
      { $push: { actions: { endpoint, method, timestamp: new Date() } } }
    );
  } catch (err) {
    console.error("[Impersonation] Failed to record action:", (err as Error)?.message || err);
  }
}

type Handler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;

/**
 * Wrap an API handler so that any write request made under an impersonation
 * token is recorded to the audit log. Non-write methods and non-impersonated
 * sessions are unaffected. The wrapper runs the original handler exactly once
 * and does not alter its response.
 */
export function withImpersonationAudit(handler: Handler): Handler {
  return async (req, res) => {
    if (req.method && WRITE_METHODS.has(req.method)) {
      const session = getAuthUser(req);
      if (session?.imp) {
        // Fire-and-forget; don't block the actual request on the audit write.
        void recordImpersonatedAction(session, req.url || "unknown", req.method);
      }
    }
    return handler(req, res);
  };
}
