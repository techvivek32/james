import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();
  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (req.method === "GET") {
    const user = await UserModel.findOne({ id }).lean();
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { passwordHash, ...safeUser } = user;
    
    // Set default publicProfile values for new users
    if (safeUser.publicProfile) {
      safeUser.publicProfile = {
        showHeadshot: safeUser.publicProfile.showHeadshot ?? true,
        showEmail: safeUser.publicProfile.showEmail ?? true,
        showPhone: safeUser.publicProfile.showPhone ?? true,
        showStrengths: safeUser.publicProfile.showStrengths ?? true,
        showWeaknesses: safeUser.publicProfile.showWeaknesses ?? true,
        showTerritory: safeUser.publicProfile.showTerritory ?? true
      };
    }
    
    res.status(200).json(safeUser);
    return;
  }

  if (req.method === "PUT") {
    const payload = req.body || {};
    const { password, passwordHash, ...rest } = payload;
    const hashedPassword =
      typeof password === "string" && password.trim().length > 0
        ? await bcrypt.hash(password.trim(), 10)
        : passwordHash;
    const updated = await UserModel.findOneAndUpdate(
      { id },
      { ...rest, passwordHash: hashedPassword },
      {
        returnDocument: 'after',
        upsert: true
      }
    ).lean();
    const { passwordHash: updatedPasswordHash, ...safeUser } = updated;
    res.status(200).json(safeUser);
    return;
  }

  if (req.method === "DELETE") {
    // Soft delete: mark as deleted instead of removing
    await UserModel.findOneAndUpdate(
      { id },
      { deleted: true, deletedAt: new Date() }
    );
    res.status(204).end();
    return;
  }

  if (req.method === "PATCH") {
    const { action } = req.body;
    if (action === 'restore') {
      await UserModel.findOneAndUpdate(
        { id },
        { deleted: false, deletedAt: null }
      );
      res.status(200).json({ success: true });
      return;
    }
    if (action === 'permanent-delete') {
      await UserModel.deleteOne({ id });
      res.status(200).json({ success: true });
      return;
    }
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  res.setHeader("Allow", "GET, PUT, DELETE, PATCH");
  res.status(405).end();
}
