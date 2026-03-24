import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";
import { fetchYouTubeTranscriptText } from "../../../src/lib/youtubeTranscriptPuppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== CRAWL API CALLED ===");
  console.log("Method:", req.method);
  console.log("Body:", JSON.stringify(req.body));
  
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  await connectMongo();
  const { botId, url, type } = req.body;
  console.log(`Processing: botId=${botId}, url=${url}, type=${type}`);

  if (!botId || !url) {
    console.error("Missing required fields");
    return res.status(400).json({ error: "Missing botId or url" });
  }

  const bot = await AiBotModel.findOne({ id: botId });
  if (!bot) {
    console.error("Bot not found:", botId);
    return res.status(404).json({ error: "Bot not found" });
  }
  console.log("Bot found:", bot.name);

  try {
    let content = "";
    console.log(`Starting content fetch for type: ${type}`);

    if (type === "youtube") {
      console.log("Calling fetchYouTubeTranscript...");
      content = await fetchYouTubeTranscript(url);
      console.log(`YouTube transcript fetched, length: ${content.length}`);
    } else if (type === "pdf") {
      console.log("Calling fetchPdfContent...");
      content = await fetchPdfContent(url);
    } else if (type === "word-doc") {
      console.log("Calling fetchWordContent...");
      content = await fetchWordContent(url);
    } else if (type === "excel-csv") {
      console.log("Calling fetchExcelContent...");
      content = await fetchExcelContent(url);
    } else {
      console.log("Calling fetchWebContent...");
      content = await fetchWebContent(url, type === "full-website");
    }

    console.log(`Content fetched successfully, length: ${content.length}`);

    const newLink = {
      id: `link-${Date.now()}`,
      url,
      type,
      status: "trained",
      chars: content.length
    };

    bot.trainingLinks = bot.trainingLinks || [];
    bot.trainingLinks.push(newLink);
    bot.trainingText = (bot.trainingText || "") + `\n\n[Source: ${url}]\n${content}`;
    
    console.log("Saving bot with new training data...");
    await bot.save();
    console.log("Bot saved successfully");

    return res.status(200).json({ link: newLink, extractedChars: content.length });
  } catch (error: any) {
    console.error("=== CRAWL ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

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

async function fetchWordContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch Word doc: ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

async function fetchExcelContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch Excel file: ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  const XLSX = require("xlsx");
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  let text = "";
  workbook.SheetNames.forEach((sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    text += XLSX.utils.sheet_to_csv(sheet) + "\n\n";
  });
  return text;
}

async function fetchYouTubeTranscript(url: string): Promise<string> {
  console.log(">>> fetchYouTubeTranscript called with URL:", url);
  
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    console.error("Failed to extract video ID from URL:", url);
    throw new Error(`Invalid YouTube URL: ${url}`);
  }

  console.log(`Video ID extracted: ${videoId}`);
  console.log(`Fetching transcript using Puppeteer with stealth...`);

  const text = await fetchYouTubeTranscriptText(url);
  
  console.log(`Successfully extracted transcript, length: ${text.length} characters`);
  return `YouTube Video Transcript (${url}):\n\n${text}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Clean the URL
  url = url.trim();
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/  // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log(`Extracted video ID: ${match[1]} from URL: ${url}`);
      return match[1];
    }
  }

  console.error(`No video ID found in URL: ${url}`);
  return null;
}
