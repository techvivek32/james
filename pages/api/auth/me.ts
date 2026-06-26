import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";
import { allowMethods, requireUser } from "../../../src/lib/auth";

// Returns the current authenticated user plus impersonation status. A 401 here
// lets the client detect an expired/invalid token and log out.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!allowMethods(req, res, ["GET"])) return;

  const session = requireUser(req, res);
  if (!session) return;

  await connectMongo();
  const user = await UserModel.findOne({ id: session.sub }).lean() as any;
  if (!user || user.deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash, ...safeUser } = user;
  res.status(200).json({
    ...safeUser,
    isImpersonating: !!session.imp,
    originalRole: session.actRole ?? null,
    impersonatedBy: session.act ?? null,
  });
}
