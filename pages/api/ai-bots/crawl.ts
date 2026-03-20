import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  await connectMongo();
  const { botId, url, type } = req.body;

  if (!botId || !url) return res.status(400).json({ error: "Missing botId or url" });

  const bot = await AiBotModel.findOne({ id: botId });
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  try {
    let content = "";
    let status = "trained";

    if (type === "youtube") {
      content = await fetchYouTubeTranscript(url);
    } else if (type === "pdf") {
      content = await fetchPdfContent(url);
    } else {
      content = await fetchWebContent(url, type === "full-website");
    }

    const newLink = {
      id: `link-${Date.now()}`,
      url,
      type,
      status,
      chars: content.length
    };

    bot.trainingLinks = bot.trainingLinks || [];
    bot.trainingLinks.push(newLink);
    bot.trainingText = (bot.trainingText || "") + `\n\n[Source: ${url}]\n${content}`;
    await bot.save();

    return res.status(200).json({ link: newLink, extractedChars: content.length });
  } catch (error: any) {
    console.error("Crawl error:", error);
    
    const failedLink = {
      id: `link-${Date.now()}`,
      url,
      type,
      status: "failed",
      chars: 0
    };
    
    bot.trainingLinks = bot.trainingLinks || [];
    bot.trainingLinks.push(failedLink);
    await bot.save();

    return res.status(200).json({ link: failedLink, error: error.message });
  }
}

async function fetchWebContent(url: string, fullWebsite: boolean): Promise<string> {
  const cheerio = require("cheerio");
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  $("script, style, nav, footer, header").remove();
  
  let text = $("body").text().trim().replace(/\s+/g, " ");
  
  if (fullWebsite) {
    const links = new Set<string>();
    $("a[href]").each((_: number, el: any) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/")) {
        const baseUrl = new URL(url).origin;
        links.add(baseUrl + href);
      }
    });
    
    const maxPages = 10;
    let count = 0;
    for (const link of links) {
      if (count >= maxPages) break;
      try {
        const subResponse = await fetch(link);
        if (subResponse.ok) {
          const subHtml = await subResponse.text();
          const $sub = cheerio.load(subHtml);
          $sub("script, style, nav, footer, header").remove();
          text += "\n\n" + $sub("body").text().trim().replace(/\s+/g, " ");
        }
      } catch {}
      count++;
    }
  }
  
  return text.substring(0, 500000);
}

async function fetchPdfContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  
  const buffer = await response.arrayBuffer();
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(Buffer.from(buffer));
  return data.text;
}

async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");
  
  return `YouTube video: ${url}\n[Note: Transcript extraction requires YouTube API key or third-party service]`;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
