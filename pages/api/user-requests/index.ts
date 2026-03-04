import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserRequestModel } from "../../../src/lib/models/UserRequest";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    try {
      const requests = await UserRequestModel.find({}).sort({ requestedAt: -1 }).lean();
      res.status(200).json(requests);
    } catch (error) {
      console.error("Failed to fetch user requests:", error);
      res.status(500).json({ error: "Failed to fetch user requests" });
    }
  } else if (req.method === "POST") {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      if (!["manager", "sales", "marketing"].includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }

      // Check if user already exists
      const { UserModel } = await import("../../../src/lib/models/User");
      const existingUser = await UserModel.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        res.status(400).json({ error: "An account with this email already exists" });
        return;
      }

      // Check if there's already a pending request
      const existingRequest = await UserRequestModel.findOne({ 
        email: email.trim().toLowerCase(),
        status: "pending"
      });

      if (existingRequest) {
        res.status(400).json({ error: "A request with this email is already pending" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userRequest = await UserRequestModel.create({
        id: `req-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        status: "pending"
      });

      res.status(201).json({ 
        message: "Registration request submitted successfully",
        requestId: userRequest.id 
      });
    } catch (error) {
      console.error("Failed to create user request:", error);
      res.status(500).json({ error: "Failed to submit registration request" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end();
  }
}
