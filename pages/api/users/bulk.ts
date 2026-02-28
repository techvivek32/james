import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    res.status(405).end();
    return;
  }

  const users = Array.isArray(req.body) ? req.body : req.body?.users;
  if (!Array.isArray(users)) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const ids = users
    .map((user) => (user.id && user.id.length ? user.id : user.email))
    .filter(Boolean);
  const existing = await UserModel.find({ id: { $in: ids } })
    .select("id passwordHash")
    .lean();
  const passwordById = new Map(
    existing.map((user) => [user.id, user.passwordHash])
  );
  await UserModel.deleteMany({
    id: { $nin: ids.length ? ids : ["__none__"] }
  });

  await Promise.all(
    users.map(async (user) => {
      const nextId =
        typeof user.email === "string" && user.email.trim().length > 0
          ? user.email.trim()
          : user.id;
      const incomingPassword =
        typeof user.password === "string" && user.password.trim().length > 0
          ? user.password.trim()
          : "";
      const existingPassword = nextId ? passwordById.get(nextId) : undefined;
      const passwordHash =
        incomingPassword.length > 0
          ? await bcrypt.hash(incomingPassword, 10)
          : typeof user.passwordHash === "string" && user.passwordHash.length > 0
            ? user.passwordHash
            : existingPassword;
      const { password, ...rest } = user;
      return UserModel.updateOne(
        { id: nextId },
        { ...rest, id: nextId, passwordHash },
        { upsert: true }
      );
    })
  );

  const nextUsers = await UserModel.find().lean();
  const sanitized = nextUsers.map(({ passwordHash, ...rest }) => rest);
  res.status(200).json(sanitized);
}
