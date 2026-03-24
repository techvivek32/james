import puppeteer, { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { addExtra } from 'puppeteer-extra';

// Add stealth plugin to puppeteer
const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(StealthPlugin());

let browserInstance: Browser | null = null;

interface TranscriptSegment {
  text: string;
  start: string;
}

/**
 * Get or create a shared browser instance for efficiency
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  console.log('Launching Puppeteer browser with stealth...');
  browserInstance = await puppeteerExtra.launch({
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
      '--disable-features=IsolateOrigins,site-per-process',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  browserInstance.on('disconnected', () => {
    console.log('Browser disconnected');
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Close the browser instance (call on server shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('Browser closed');
  }
}

/**
 * Fetch YouTube transcript using Puppeteer with stealth
 */
export async function fetchYouTubeTranscriptWithPuppeteer(
  videoUrl: string
): Promise<TranscriptSegment[]> {
  console.log(`[Puppeteer] Fetching transcript for: ${videoUrl}`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set real user agent (latest Chrome)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

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
    console.log('[Puppeteer] Navigating to YouTube...');
    await page.goto(videoUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for video player
    await page.waitForSelector('ytd-watch-flexy', { timeout: 15000 });
    console.log('[Puppeteer] Video page loaded');

    // Handle cookie consent if it appears
    try {
      const consentButton = await page.$('button[aria-label*="Accept"], button[aria-label*="Reject"]');
      if (consentButton) {
        await consentButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[Puppeteer] Handled cookie consent');
      }
    } catch (e) {
      // No consent dialog, continue
    }

    // Wait a bit for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click "More actions" button (three dots)
    console.log('[Puppeteer] Opening more actions menu...');
    const moreActionsSelector = 'button[aria-label*="More actions"], button[aria-label*="More"], ytd-menu-renderer button';
    
    await page.waitForSelector(moreActionsSelector, { timeout: 10000 });
    await page.click(moreActionsSelector);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find and click "Show transcript" button
    console.log('[Puppeteer] Looking for transcript button...');
    const transcriptClicked = await page.evaluate(() => {
      const menuItems = Array.from(
        document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item')
      );
      
      const transcriptItem = menuItems.find((item) => {
        const text = item.textContent?.toLowerCase() || '';
        return text.includes('transcript') || text.includes('show transcript');
      });

      if (transcriptItem) {
        (transcriptItem as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (!transcriptClicked) {
      throw new Error('Transcript button not found. Video may not have captions.');
    }

    console.log('[Puppeteer] Clicked transcript button');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for transcript panel to load
    await page.waitForSelector('ytd-transcript-segment-renderer', {
      timeout: 10000,
    });

    console.log('[Puppeteer] Extracting transcript segments...');

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
        };
      });
    });

    console.log(`[Puppeteer] Successfully extracted ${transcript.length} segments`);

    if (transcript.length === 0) {
      throw new Error('No transcript segments found');
    }

    return transcript;
  } catch (error: any) {
    console.error('[Puppeteer] Error:', error.message);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Convert transcript segments to plain text
 */
export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments
    .map(seg => seg.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main function to fetch and return transcript as text
 */
export async function fetchYouTubeTranscriptText(videoUrl: string): Promise<string> {
  const segments = await fetchYouTubeTranscriptWithPuppeteer(videoUrl);
  const text = transcriptToText(segments);
  
  if (text.length === 0) {
    throw new Error('Transcript is empty');
  }
  
  return text;
}
