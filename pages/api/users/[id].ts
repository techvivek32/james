import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectMongo } from "../../../src/lib/mongodb";
import { UserModel } from "../../../src/lib/models/User";
import { sendUserAccountUpdatedEmail, sendAdminConfirmationEmail } from "../../../src/lib/email";

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
    const { password, passwordHash, sendNotification, adminName, adminEmail, managerName, ...rest } = payload;
    const plainPassword = typeof password === "string" && password.trim().length > 0 ? password.trim() : null;
    const hashedPassword = plainPassword
      ? await bcrypt.hash(plainPassword, 10)
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

    // Send emails if admin checked the notify checkbox
    if (sendNotification && safeUser.email) {
      const loginUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : "https://yourdomain.com/login";
      const roles = (safeUser.roles as string[]) || [safeUser.role as string];
      const updatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

      try {
        const roles = (safeUser.roles as string[]) || [safeUser.role as string];
        const updatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
        // Email to user
        await sendUserAccountUpdatedEmail({
          name: safeUser.name as string,
          email: safeUser.email as string,
          password: plainPassword,
          roles,
          managerName: managerName || null,
          loginUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : "https://yourdomain.com/login"
        });
        // Email to admin
        if (adminEmail) {
          await sendAdminConfirmationEmail({
            adminName: adminName || "Admin",
            adminEmail,
            userName: safeUser.name as string,
            userEmail: safeUser.email as string,
            roles,
            managerName: managerName || null,
            passwordChanged: !!plainPassword,
            updatedAt
          });
        }
      } catch (emailErr) {
        console.error("Failed to send update emails:", emailErr);
      }
    }

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
    const { action, featureToggles } = req.body;

    // Save feature toggles only
    if (!action && featureToggles) {
      await UserModel.findOneAndUpdate({ id }, { featureToggles });
      res.status(200).json({ success: true });
      return;
    }

    if (action === 'restore') {
      await UserModel.findOneAndUpdate(
        { id },
        { deleted: false, deletedAt: null }
      );
      res.status(200).json({ success: true });
      return;
    }
    if (action === 'permanent-delete') {
      const user = await UserModel.findOne({ id }).lean() as any;
      await UserModel.deleteOne({ id });
      // Also delete the approved user request for this email
      if (user?.email) {
        const { UserRequestModel } = await import("../../../src/lib/models/UserRequest");
        await UserRequestModel.deleteOne({ email: user.email, status: "approved" });
      }
      res.status(200).json({ success: true });
      return;
    }
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  res.setHeader("Allow", "GET, PUT, DELETE, PATCH");
  res.status(405).end();
}
