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

    if (type === "youtube") {
      content = await fetchYouTubeTranscript(url);
    } else if (type === "pdf") {
      content = await fetchPdfContent(url);
    } else if (type === "word-doc") {
      content = await fetchWordContent(url);
    } else if (type === "excel-csv") {
      content = await fetchExcelContent(url);
    } else {
      content = await fetchWebContent(url, type === "full-website");
    }

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
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Fetch the YouTube page to extract captionTracks from ytInitialPlayerResponse
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    }
  });
  if (!pageRes.ok) throw new Error("Could not load YouTube page");

  const html = await pageRes.text();

  // Extract player response JSON
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|window)/s);
  if (!playerMatch) throw new Error("Could not parse YouTube player data");

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerMatch[1]);
  } catch {
    throw new Error("Could not parse YouTube player JSON");
  }

  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) throw new Error("No captions available for this video. Enable captions on the video first.");

  // Prefer English, fallback to first available
  const track = tracks.find((t: any) => t.languageCode === "en") ||
                tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
                tracks[0];

  // Fetch transcript XML
  const transcriptRes = await fetch(track.baseUrl);
  if (!transcriptRes.ok) throw new Error("Could not fetch transcript data");

  const xml = await transcriptRes.text();
  if (!xml || xml.trim().length === 0) throw new Error("Transcript is empty. The video may not have accessible captions.");

  // Parse <text> tags from XML
  const segments = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map(m => m[1]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);

  if (segments.length === 0) throw new Error("Could not extract transcript text. Try a different video.");

  const langNote = track.languageCode !== "en" ? ` [Language: ${track.name?.simpleText || track.languageCode}]` : "";
  return `YouTube Video Transcript${langNote} (${url}):\n\n${segments.join(" ")}`;
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
