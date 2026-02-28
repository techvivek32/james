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
        new: true,
        upsert: true
      }
    ).lean();
    const { passwordHash: updatedPasswordHash, ...safeUser } = updated;
    res.status(200).json(safeUser);
    return;
  }

  if (req.method === "DELETE") {
    await UserModel.deleteOne({ id });
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
}
