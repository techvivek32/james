import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;

interface TranscriptSegment {
  text: string;
  start: string;
  duration: string;
}

/**
 * Get or create a shared browser instance for efficiency
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  console.log('Launching new Puppeteer browser...');
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  // Handle browser disconnect
  browserInstance.on('disconnected', () => {
    console.log('Browser disconnected');
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Close the browser instance (call this on server shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('Browser closed');
  }
}

/**
 * Fetch YouTube transcript using Puppeteer
 */
export async function fetchYouTubeTranscriptWithPuppeteer(
  videoUrl: string
): Promise<TranscriptSegment[]> {
  console.log(`Fetching transcript for: ${videoUrl}`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set realistic user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate to YouTube video
    console.log('Navigating to YouTube video...');
    await page.goto(videoUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for video player to load
    await page.waitForSelector('ytd-watch-flexy', { timeout: 10000 });

    // Reject cookie consent if it appears
    try {
      const rejectButton = await page.$('button[aria-label*="Reject"]');
      if (rejectButton) {
        await rejectButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.log('No cookie consent dialog found');
    }

    // Click the "More actions" button (three dots menu)
    console.log('Opening transcript menu...');
    await page.waitForSelector('#primary-button button[aria-label*="More actions"]', {
      timeout: 10000,
    });
    await page.click('#primary-button button[aria-label*="More actions"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click "Show transcript" option
    const transcriptButton = await page.evaluateHandle(() => {
      const items = Array.from(
        document.querySelectorAll('ytd-menu-service-item-renderer')
      );
      return items.find((item) =>
        item.textContent?.toLowerCase().includes('transcript')
      );
    });

    if (!transcriptButton) {
      throw new Error('Transcript button not found. Video may not have captions.');
    }

    await (transcriptButton as any).click();
    console.log('Clicked transcript button');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for transcript panel to load
    await page.waitForSelector('ytd-transcript-segment-renderer', {
      timeout: 10000,
    });

    console.log('Extracting transcript segments...');

    // Extract transcript data
    const transcript = await page.evaluate(() => {
      const segments = Array.from(
        document.querySelectorAll('ytd-transcript-segment-renderer')
      );

      return segments.map((segment) => {
        const textElement = segment.querySelector(
          'yt-formatted-string.segment-text'
        );
        const timestampElement = segment.querySelector(
          '.segment-timestamp'
        );

        const text = textElement?.textContent?.trim() || '';
        const timestamp = timestampElement?.textContent?.trim() || '0:00';

        // Convert timestamp to seconds
        const parts = timestamp.split(':').map(Number);
        let startSeconds = 0;
        if (parts.length === 2) {
          startSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          startSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        return {
          text,
          start: startSeconds.toString(),
          duration: '0', // YouTube doesn't provide duration per segment
        };
      });
    });

    console.log(`Successfully extracted ${transcript.length} transcript segments`);

    if (transcript.length === 0) {
      throw new Error('No transcript segments found');
    }

    return transcript;
  } catch (error: any) {
    console.error('Error fetching transcript:', error.message);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  } finally {
    // Always close the page
    await page.close();
  }
}

/**
 * Fallback: Try to extract transcript from page source (auto-generated captions)
 */
export async function fetchYouTubeTranscriptFallback(
  videoUrl: string
): Promise<TranscriptSegment[]> {
  console.log('Using fallback method to fetch transcript...');
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract video ID from URL
    const videoId = videoUrl.match(/[?&]v=([^&]+)/)?.[1];
    if (!videoId) throw new Error('Invalid YouTube URL');

    // Get page HTML and extract ytInitialPlayerResponse
    const html = await page.content();
    const playerMatch = html.match(
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s
    );

    if (!playerMatch) {
      throw new Error('Could not extract player data');
    }

    const playerResponse = JSON.parse(playerMatch[1]);
    const tracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      throw new Error('No captions available for this video');
    }

    // Get English track or first available
    const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    const captionUrl = track.baseUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    console.log('Fetching caption data from:', captionUrl);

    // Fetch caption XML
    const captionPage = await page.goto(captionUrl, { timeout: 10000 });
    const xml = await captionPage!.text();

    // Parse XML
    const segments = [...xml.matchAll(/<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/g)];

    const transcript = segments.map((match) => ({
      text: match[3]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim(),
      start: match[1],
      duration: match[2],
    }));

    console.log(`Fallback extracted ${transcript.length} segments`);
    return transcript;
  } catch (error: any) {
    console.error('Fallback method failed:', error.message);
    throw error;
  } finally {
    await page.close();
  }
}
