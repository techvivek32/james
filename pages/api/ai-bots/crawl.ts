import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../../src/lib/mongodb";
import { AiBotModel } from "../../../src/lib/models/AiBot";

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
  console.log(`Attempting to fetch transcript for video ID: ${videoId}`);

  // Use fallback method (web scraping) as primary since youtube-transcript is broken
  console.log("Using web scraping method...");
  return await fetchYouTubeTranscriptFallback(videoId, url);
}

async function fetchYouTubeTranscriptFallback(videoId: string, url: string): Promise<string> {
  console.log(`Using fallback method for video ID: ${videoId}`);

  // Fetch YouTube page HTML to extract caption tracks
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!pageRes.ok) {
    console.error(`Failed to fetch YouTube page: ${pageRes.status} ${pageRes.statusText}`);
    throw new Error(`Failed to fetch YouTube page: ${pageRes.statusText}`);
  }

  const html = await pageRes.text();
  console.log(`Fetched YouTube page, HTML length: ${html.length}`);
  
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|window)/s);
  
  if (!playerMatch) {
    console.error("Could not find ytInitialPlayerResponse in page HTML");
    throw new Error("Could not extract player data from YouTube page. Please copy the transcript manually from YouTube and paste it in the Text section.");
  }

  console.log("Found ytInitialPlayerResponse");
  const playerResponse = JSON.parse(playerMatch[1]);
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks || tracks.length === 0) {
    console.error("No caption tracks found in player response");
    throw new Error("No captions available for this video. Please enable captions on YouTube or copy the transcript manually.");
  }

  console.log(`Found ${tracks.length} caption tracks`);
  return await downloadTranscript(videoId, tracks, url);
}

async function downloadTranscript(videoId: string, tracks: any[], url: string): Promise<string> {
  // Prefer English, fallback to first available
  const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
  const lang = track.languageCode || "en";
  console.log(`Using caption track: ${lang}`);
  console.log(`Track baseUrl:`, track.baseUrl);

  // Use the baseUrl provided by YouTube (it includes authentication tokens)
  if (track.baseUrl) {
    // Decode HTML entities in the URL
    const decodedUrl = track.baseUrl
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    console.log(`Decoded URL: ${decodedUrl}`);
    console.log(`Fetching transcript from track baseUrl`);
    
    const transcriptRes = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": `https://www.youtube.com/watch?v=${videoId}`,
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    console.log(`Transcript response status: ${transcriptRes.status}`);

    if (transcriptRes.ok) {
      const raw = await transcriptRes.text();
      console.log(`Transcript response length: ${raw.length}, starts with: ${raw.substring(0, 100)}`);
      
      // Try JSON3 format first
      if (raw && raw.trim().startsWith("{")) {
        try {
          const json = JSON.parse(raw);
          const events = json?.events || [];
          console.log(`Parsed JSON, found ${events.length} events`);
          
          const text = events
            .filter((e: any) => e.segs)
            .flatMap((e: any) => e.segs.map((s: any) => s.utf8 || ""))
            .filter((s: string) => s.trim() && s.trim() !== "\n")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (text.length > 0) {
            console.log(`Successfully extracted transcript, length: ${text.length}`);
            const langNote = lang !== "en" ? ` [Language: ${lang}]` : "";
            return `YouTube Video Transcript${langNote} (${url}):\n\n${text}`;
          }
        } catch (e) {
          console.error("Failed to parse JSON format:", e);
        }
      }
      
      // Try XML format
      if (raw && raw.includes("<text")) {
        console.log("Trying XML format");
        const segments = [...raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
          .map(m => m[1]
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
            .replace(/<[^>]+>/g, "").trim())
          .filter(Boolean);

        if (segments.length > 0) {
          console.log(`Successfully extracted ${segments.length} XML segments`);
          const langNote = lang !== "en" ? ` [Language: ${lang}]` : "";
          return `YouTube Video Transcript${langNote} (${url}):\n\n${segments.join(" ")}`;
        }
      }
    }
  }

  console.error("All transcript fetching methods failed");
  throw new Error("Could not fetch transcript. Please copy the transcript manually from YouTube and paste it in the Text section.");
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
