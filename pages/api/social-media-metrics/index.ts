import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { SocialMediaMetricsModel } from "../../../src/lib/models/SocialMediaMetrics";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectMongo();

  if (req.method === "GET") {
    try {
      const metrics = await SocialMediaMetricsModel.find({}).sort({ platform: 1 }).lean();
      res.status(200).json(metrics);
    } catch (error) {
      console.error("Failed to fetch social media metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  } else if (req.method === "POST") {
    try {
      const { platform, platformName, followers, posts30d, views30d } = req.body;

      if (!platform || !platformName) {
        res.status(400).json({ error: "Platform and platform name are required" });
        return;
      }

      const metric = await SocialMediaMetricsModel.create({
        id: `social-${platform}-${Date.now()}`,
        platform,
        platformName,
        followers: followers || 0,
        posts30d: posts30d || 0,
        views30d: views30d || 0,
        lastUpdated: new Date()
      });

      res.status(201).json(metric);
    } catch (error) {
      console.error("Failed to create social media metric:", error);
      res.status(500).json({ error: "Failed to create metric" });
    }
  } else if (req.method === "PUT") {
    try {
      const metrics = req.body;

      if (!Array.isArray(metrics)) {
        res.status(400).json({ error: "Expected array of metrics" });
        return;
      }

      console.log("Saving metrics:", metrics);

      // Update all metrics
      for (const metric of metrics) {
        // Generate new ID for new metrics
        const metricId = metric.id.startsWith("social-new-") 
          ? `social-${metric.platform}-${Date.now()}`
          : metric.id;

        await SocialMediaMetricsModel.findOneAndUpdate(
          { id: metricId },
          {
            id: metricId,
            platform: metric.platform,
            platformName: metric.platformName,
            followers: parseInt(metric.followers) || 0,
            posts30d: parseInt(metric.posts30d) || 0,
            views30d: parseInt(metric.views30d) || 0,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log("Metrics saved successfully");
      res.status(200).json({ message: "Metrics updated successfully" });
    } catch (error) {
      console.error("Failed to update metrics:", error);
      res.status(500).json({ error: "Failed to update metrics", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).end();
  }
}
