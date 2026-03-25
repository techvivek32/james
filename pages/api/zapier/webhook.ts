import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { IntegrationEventModel } from "../../../src/lib/models/IntegrationEvent";
import { LeaderboardEntryModel } from "../../../src/lib/models/LeaderboardEntry";
import { NotificationModel } from "../../../src/lib/models/Notification";

function extractLocation(companyName: string): string {
  if (!companyName) return "Unknown";
  const name = companyName.toLowerCase();
  if (name.includes("dfw")) return "DFW";
  if (name.includes("lubbock")) return "Lubbock";
  if (name.includes("round rock")) return "Round Rock";
  if (name.includes("corpus christi")) return "Corpus Christi";
  return "Other";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  await connectMongo();

  const { rep_name, rep_id, event_type, job_id, amount, event_date, company_name } = req.body;

  console.log("Incoming Zapier payload:", req.body);

  if (!rep_name || !event_type || !job_id) {
    return res.status(400).json({ error: "Missing required fields: rep_name, event_type, job_id" });
  }

  const location = extractLocation(company_name || "");
  console.log("Extracted location:", location);

  try {
    // Dedupe check — same job_id + event_type combination
    const existing = await IntegrationEventModel.findOne({ 
      externalEventId: job_id,
      eventType: event_type,
      status: "processed"
    });
    if (existing) {
      await IntegrationEventModel.create({
        externalEventId: `${job_id}-dup-${Date.now()}`,
        source: "acculynx",
        eventType: event_type,
        repName: rep_name,
        repExternalId: rep_id,
        revenue: amount ?? 0,
        eventDate: event_date ? new Date(event_date) : new Date(),
        rawPayload: req.body,
        status: "duplicate",
        location,
        companyName: company_name || "",
      });
      return res.status(200).json({ ok: true, status: "duplicate" });
    }

    const isInspection = event_type.toLowerCase().includes("inspection");
    const isClaim = event_type.toLowerCase().includes("claim");

    // Upsert leaderboard
    const filter = rep_id ? { repExternalId: rep_id } : { repName: rep_name };
    const update: Record<string, any> = { repName: rep_name, repExternalId: rep_id };

    if (isInspection) {
      update.$inc = { inspectionCount: 1 };
    } else if (isClaim) {
      update.$inc = { claimCount: 1, revenueTotal: amount ?? 0 };
    }

    if (update.$inc) {
      await LeaderboardEntryModel.findOneAndUpdate(
        filter,
        { $inc: update.$inc, $set: { repName: rep_name, repExternalId: rep_id } },
        { upsert: true, new: true }
      );
    }

    // Save event
    await IntegrationEventModel.create({
      externalEventId: job_id,
      source: "acculynx",
      eventType: event_type,
      repName: rep_name,
      repExternalId: rep_id,
      revenue: amount ?? 0,
      eventDate: event_date ? new Date(event_date) : new Date(),
      rawPayload: req.body,
      status: "processed",
      location,
      companyName: company_name || "",
    });

    // Internal notification (broadcast to admin users — userId "admin")
    await NotificationModel.create({
      id: `zapier-${job_id}-${Date.now()}`,
      userId: "admin",
      type: "zapier_event",
      title: `New ${event_type} — ${rep_name}`,
      message: `Job ${job_id}${amount ? ` · $${amount}` : ""}`,
      read: false,
      metadata: { job_id, rep_name, event_type, amount },
    });

    return res.status(200).json({ ok: true, status: "processed" });
  } catch (err: any) {
    console.error("[Zapier Webhook] Error:", err);
    try {
      await IntegrationEventModel.create({
        externalEventId: `${job_id}-err-${Date.now()}`,
        source: "acculynx",
        eventType: event_type,
        repName: rep_name,
        rawPayload: req.body,
        status: "failed",
        failureReason: err.message,
        location,
        companyName: company_name || "",
      });
    } catch (_) {}
    return res.status(500).json({ error: "Internal server error" });
  }
}
