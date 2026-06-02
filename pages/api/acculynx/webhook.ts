import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { IntegrationEventModel } from "../../../src/lib/models/IntegrationEvent";
import { LeaderboardEntryModel } from "../../../src/lib/models/LeaderboardEntry";
import { NotificationModel } from "../../../src/lib/models/Notification";
import { UserModel } from "../../../src/lib/models/User";

/**
 * AccuLynx Direct Webhook Handler
 * This endpoint receives events directly from AccuLynx without Zapier.
 */

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

  console.log("Incoming AccuLynx Direct Payload:", JSON.stringify(req.body, null, 2));

  const payload = req.body;
  const topicName = payload.topicName || "unknown";
  const eventId = payload.eventId; // Unique ID from AccuLynx
  const eventData = payload.Event || {};
  
  const jobId = eventData.jobId || eventData.externalEventId;
  const companyUserId = eventData.companyUserId;
  const milestoneName = eventData.milestoneName;
  const approvedValue = eventData.approvedValue || 0;

  if (!jobId || !eventId) {
    console.error("Missing required fields (jobId or eventId) in payload");
    return res.status(400).json({ error: "Missing required fields: jobId, eventId" });
  }

  await connectMongo();

  try {
    // 1. Dedupe check using the unique eventId from AccuLynx
    const existing = await IntegrationEventModel.findOne({ 
      externalEventId: eventId 
    });

    if (existing) {
      console.log(`Duplicate event ignored: ${eventId}`);
      return res.status(200).json({ ok: true, status: "duplicate" });
    }

    // 2. Resolve Rep Name from companyUserId if possible
    let repName = "Unknown Rep";
    let repEmail = "";

    if (companyUserId) {
      // Try local DB first
      const user = await UserModel.findOne({ 
        $or: [{ id: companyUserId }, { acculynxUserId: companyUserId }, { email: companyUserId }] 
      }).lean();
      
      if (user) {
        repName = user.name || user.email;
        repEmail = user.email;
      } else if (process.env.ACCULYNX_API_KEY) {
        // Try fetching from AccuLynx API to get more details
        try {
          console.log(`🔍 Rep not found in DB. Fetching from AccuLynx: ${companyUserId}`);
          const acculynxRes = await fetch(`https://api.acculynx.com/api/v2/users`, {
            headers: { "Authorization": `Bearer ${process.env.ACCULYNX_API_KEY}` }
          });
          
          if (acculynxRes.ok) {
            const usersData = await acculynxRes.json();
            const acculynxUser = usersData.items?.find((u: any) => u.userId === companyUserId);
            
            if (acculynxUser) {
              repName = `${acculynxUser.firstName} ${acculynxUser.lastName}`;
              repEmail = acculynxUser.emailAddress;
              console.log(`✅ Found rep in AccuLynx: ${repName} (${repEmail})`);
              
              // Try finding in DB again by email
              if (repEmail) {
                const userByEmail = await UserModel.findOne({ email: repEmail }).lean();
                if (userByEmail) {
                  console.log(`🔗 Linked AccuLynx user to local user: ${userByEmail.id}`);
                }
              }
            }
          }
        } catch (fetchErr) {
          console.error("Failed to fetch user from AccuLynx:", fetchErr);
        }
      }
    }
    
    // Fallback to payload rep name if provided in event data
    if (repName === "Unknown Rep" && eventData.companyUserName) {
      repName = eventData.companyUserName;
    }

    // 3. Determine what to update on the leaderboard
    const isInspection = (topicName === "job.milestone.current_changed" || topicName === "job-milestone-changed") && 
                        milestoneName && milestoneName.toLowerCase().includes("inspection");
    
    const isClaim = (topicName === "job.milestone.current_changed" || topicName === "job-milestone-changed") && 
                    milestoneName && (milestoneName.toLowerCase().includes("claim") || milestoneName.toLowerCase().includes("approved"));
    
    const isRevenueUpdate = topicName === "job.financials.approved-value_changed";

    // 4. Update Leaderboard
    const filter = companyUserId ? { repExternalId: companyUserId } : { repName: repName };
    const leaderboardUpdate: any = { $set: { repName } };
    if (companyUserId) leaderboardUpdate.$set.repExternalId = companyUserId;

    const inc: any = {};
    if (isInspection) inc.inspectionCount = 1;
    if (isClaim) inc.claimCount = 1;
    if (isRevenueUpdate) inc.revenueTotal = approvedValue;

    if (Object.keys(inc).length > 0) {
      leaderboardUpdate.$inc = inc;
      await LeaderboardEntryModel.findOneAndUpdate(
        filter,
        leaderboardUpdate,
        { upsert: true, new: true }
      );
    }

    // 5. Save Event Log
    const location = extractLocation(eventData.companyName || "");
    await IntegrationEventModel.create({
      externalEventId: eventId,
      source: "acculynx_direct",
      eventType: topicName,
      repName: repName,
      repExternalId: companyUserId,
      revenue: isRevenueUpdate ? approvedValue : 0,
      eventDate: payload.eventDateTime ? new Date(payload.eventDateTime) : new Date(),
      rawPayload: payload,
      status: "processed",
      location,
      companyName: eventData.companyName || "",
    });

    // 6. Internal Notification
    await NotificationModel.create({
      id: `acculynx-${eventId}`,
      userId: "admin",
      type: "zapier_event", 
      title: `AccuLynx: ${topicName.split('.').pop()}`,
      message: `${repName} - Job ${jobId}${isRevenueUpdate ? ` · $${approvedValue}` : (milestoneName ? ` · ${milestoneName}` : "")}`,
      read: false,
      metadata: { jobId, repName, topicName, milestoneName, revenue: approvedValue },
    });

    // 7. Add a slight delay or trigger a cache revalidation if needed
    // In a serverless env, we just return. Next.js SWR/Polling handles the rest.

    return res.status(200).json({ ok: true, status: "processed" });

  } catch (err: any) {
    console.error("[AccuLynx Webhook] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
