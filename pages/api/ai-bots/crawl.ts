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

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured in environment");

  // Step 1: Get caption tracks list via YouTube Data API v3
  const captionsListRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
  );
  if (!captionsListRes.ok) {
    const err = await captionsListRes.json();
    throw new Error(`YouTube API error: ${err?.error?.message || captionsListRes.statusText}`);
  }

  const captionsData = await captionsListRes.json();
  const items = captionsData.items || [];

  if (items.length === 0) throw new Error("No captions available for this video. Enable captions on the video first.");

  // Prefer English, fallback to first available
  const track = items.find((t: any) => t.snippet?.language === "en") ||
                items.find((t: any) => t.snippet?.language?.startsWith("en")) ||
                items[0];

  const trackId = track.id;
  const lang = track.snippet?.language || "unknown";

  // Step 2: Download caption track content
  const captionDownloadRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${trackId}?tfmt=srt&key=${apiKey}`,
    { headers: { "Accept": "text/plain" } }
  );

  if (!captionDownloadRes.ok) {
    // Caption download requires OAuth for non-owner videos — fallback to timedtext
    return await fetchYouTubeTimedText(videoId, lang, url);
  }

  const srtText = await captionDownloadRes.text();
  if (!srtText || srtText.trim().length === 0) {
    return await fetchYouTubeTimedText(videoId, lang, url);
  }

  // Parse SRT format — remove timestamps and sequence numbers
  const transcript = srtText
    .replace(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const langNote = lang !== "en" ? ` [Language: ${lang}]` : "";
  return `YouTube Video Transcript${langNote} (${url}):\n\n${transcript}`;
}

async function fetchYouTubeTimedText(videoId: string, lang: string, originalUrl: string): Promise<string> {
  // Fallback: use timedtext API with fmt=json3
  const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
  const res = await fetch(timedTextUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Referer": `https://www.youtube.com/watch?v=${videoId}`
    }
  });

  if (!res.ok) throw new Error("Could not fetch transcript. The video may have restricted captions.");

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("json")) throw new Error("YouTube blocked transcript access from this server. Try adding the video transcript manually via the Text section.");

  const json = await res.json();
  const events = json?.events || [];
  const text = events
    .filter((e: any) => e.segs)
    .flatMap((e: any) => e.segs.map((s: any) => s.utf8))
    .filter((s: string) => s && s.trim() !== "\n")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) throw new Error("Transcript is empty. Try adding the video transcript manually via the Text section.");

  const langNote = lang !== "en" ? ` [Language: ${lang}]` : "";
  return `YouTube Video Transcript${langNote} (${originalUrl}):\n\n${text}`;
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
