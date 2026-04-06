import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";
import { sendQuickStartUserEmail, sendQuickStartManagerEmail } from "../../../src/lib/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const { role, managerId, deleted } = req.query;
    const query: any = {};
    if (role) query.role = role;
    if (managerId) query.managerId = managerId;
    if (deleted === "true") {
      query.deleted = true;
    } else if (deleted === "false" || deleted === undefined) {
      query.deleted = { $ne: true };
    }
    const users = await UserModel.find(query).lean();
    const sanitized = users.map(({ passwordHash, ...rest }) => rest);
    res.status(200).json(sanitized);
    return;
  }

  if (req.method === "POST") {
    const payload = req.body || {};
    const { password, passwordHash, ...rest } = payload;
    const id = payload.id || `user-${Date.now()}`;
    const hashedPassword =
      typeof password === "string" && password.trim().length > 0
        ? await bcrypt.hash(password.trim(), 10)
        : passwordHash;

    // Check if a deleted user with same email exists — restore + update instead of creating new
    if (rest.email) {
      const existingDeleted = await UserModel.findOne({ email: { $regex: new RegExp(`^${rest.email}$`, "i") }, deleted: true });
      if (existingDeleted) {
        const restored = await UserModel.findOneAndUpdate(
          { id: existingDeleted.id },
          { ...rest, id: existingDeleted.id, passwordHash: hashedPassword, deleted: false, deletedAt: null },
          { returnDocument: "after" }
        ).lean();
        const { passwordHash: _rph, ...safeRestored } = restored;
        res.status(201).json(safeRestored);
        return;
      }
    }

    const created = await UserModel.create({ ...rest, id, passwordHash: hashedPassword });
    const createdObj = created.toObject();
    const { passwordHash: _ph, ...safeUser } = createdObj;

    // Send 48-hour Quick Start onboarding email for new sales users
    if (rest.role === "sales" && rest.email) {
      try {
        const newHireName = rest.name || rest.email;
        await sendQuickStartUserEmail(newHireName, rest.email);

        if (rest.managerId) {
          const manager = await UserModel.findOne({ id: rest.managerId }).lean();
          if (manager?.email) {
            await sendQuickStartManagerEmail(newHireName, manager.name || manager.email, manager.email);
          }
        }
      } catch (emailErr) {
        console.error("Failed to send onboarding email:", emailErr);
      }
    }

    res.status(201).json(safeUser);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
