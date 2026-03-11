import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    const { role, managerId } = req.query;
    
    let query: any = {};
    if (role) query.role = role;
    if (managerId) query.managerId = managerId;
    
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
    const created = await UserModel.create({
      ...rest,
      id,
      passwordHash: hashedPassword
    });
    const createdObj = created.toObject();
    const { passwordHash: createdPasswordHash, ...safeUser } = createdObj;
    res.status(201).json(safeUser);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
