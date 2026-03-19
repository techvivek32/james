/**
 * initVideoSequence
 *
 * For each Vimeo/YouTube/HTML5 video in a lesson:
 *  - Detects when each video ends
 *  - If autoPlay ON: starts the next video automatically
 *  - When the LAST video ends: always calls onAllEnded() to go to next lesson
 *
 * Strategy:
 *  - Vimeo: replace iframe with a new one that has api=1, wait for load, then
 *    subscribe to 'finish' via postMessage. Use 'ready' event as confirmation.
 *  - YouTube: use IFrame API (replaces iframe with YT.Player div)
 *  - HTML5: use 'ended' event
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    _ytApiLoading?: boolean;
    _ytApiReady?: boolean;
    _ytApiCallbacks?: Array<() => void>;
  }
}

// ── YouTube API loader ────────────────────────────────────────────────────────
function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window._ytApiReady) { resolve(); return; }
    if (!window._ytApiCallbacks) window._ytApiCallbacks = [];
    window._ytApiCallbacks.push(resolve);
    if (!window._ytApiLoading) {
      window._ytApiLoading = true;
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        window._ytApiReady = true;
        if (prev) prev();
        (window._ytApiCallbacks || []).forEach(cb => cb());
        window._ytApiCallbacks = [];
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
}

function extractYTVideoId(src: string): string | null {
  const m = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^?&"'>]+)/);
  return m ? m[1] : null;
}

// ── Build a clean Vimeo embed URL with api=1 ──────────────────────────────────
function buildVimeoSrc(originalSrc: string, isFirst: boolean, autoPlay: boolean): string {
  // Strip all params we'll re-add
  const [base] = originalSrc.split('?');
  const params = new URLSearchParams();
  params.set('api', '1');
  if (isFirst && autoPlay) {
    params.set('autoplay', '1');
    params.set('muted', '1'); // required for browser autoplay policy
  }
  return `${base}?${params.toString()}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type VimeoEntry = { type: 'vimeo'; iframe: HTMLIFrameElement; seqIdx: number; ready: boolean; pendingPlay: boolean };
type YTEntry    = { type: 'yt';    seqIdx: number; player: any; ready: boolean; pendingPlay: boolean };
type H5Entry    = { type: 'html5'; seqIdx: number; video: HTMLVideoElement };
type Entry = VimeoEntry | YTEntry | H5Entry;

// ── Main ──────────────────────────────────────────────────────────────────────
export async function initVideoSequence(
  container: HTMLElement,
  onAllEnded: () => void,
  autoPlay: boolean = true
): Promise<(() => void) | undefined> {
  if (typeof window === 'undefined') return;

  const allEls = Array.from(container.querySelectorAll<HTMLElement>('iframe, video'));
  const entries: Entry[] = [];
  const ytRaw: { el: HTMLIFrameElement; seqIdx: number }[] = [];

  // ── 1. Collect & replace Vimeo iframes ────────────────────────────────────
  allEls.forEach(el => {
    if (el.tagName !== 'IFRAME' && el.tagName !== 'VIDEO') return;

    if (el.tagName === 'VIDEO') {
      const video = el as HTMLVideoElement;
      const seqIdx = entries.length;
      if (seqIdx > 0) video.autoplay = false;
      entries.push({ type: 'html5', seqIdx, video });
      return;
    }

    const iframe = el as HTMLIFrameElement;
    const src = iframe.src || '';

    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      const seqIdx = entries.length;
      entries.push({ type: 'yt', seqIdx, player: null, ready: false, pendingPlay: false });
      ytRaw.push({ el: iframe, seqIdx });
      return;
    }

    if (src.includes('vimeo.com')) {
      const seqIdx = entries.length;
      const isFirst = seqIdx === 0;
      const newSrc = buildVimeoSrc(src, isFirst, autoPlay);

      // Create a brand-new iframe with api=1 already in the URL
      // so we never need to reload it
      const newIframe = document.createElement('iframe');
      newIframe.src = newSrc;
      newIframe.style.cssText = iframe.style.cssText || 'width:100%;height:100%;border:none;';
      newIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      newIframe.setAttribute('allowfullscreen', '');
      // Copy width/height attributes if present
      if (iframe.width) newIframe.width = iframe.width;
      if (iframe.height) newIframe.height = iframe.height;

      iframe.parentNode?.replaceChild(newIframe, iframe);

      entries.push({ type: 'vimeo', seqIdx, iframe: newIframe, ready: false, pendingPlay: false });
    }
  });

  if (entries.length === 0) return;
  const total = entries.length;

  // ── 2. playItem ───────────────────────────────────────────────────────────
  function playItem(idx: number) {
    if (idx >= total) {
      onAllEnded();
      return;
    }
    if (!autoPlay) return; // don't chain; onAllEnded still fires above when idx>=total

    const e = entries[idx];
    if (e.type === 'yt') {
      if (e.ready && e.player) e.player.playVideo();
      else e.pendingPlay = true;
    } else if (e.type === 'vimeo') {
      if (e.ready) {
        e.iframe.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), 'https://player.vimeo.com');
      } else {
        e.pendingPlay = true;
      }
    } else {
      e.video.play().catch(() => {});
    }
  }

  // ── 3. HTML5 ──────────────────────────────────────────────────────────────
  entries.forEach(e => {
    if (e.type === 'html5') {
      e.video.addEventListener('ended', () => playItem(e.seqIdx + 1));
    }
  });

  // ── 4. Vimeo postMessage ──────────────────────────────────────────────────
  const vimeoEntries = entries.filter((e): e is VimeoEntry => e.type === 'vimeo');

  const msgHandler = (event: MessageEvent) => {
    if (!event.origin.includes('vimeo.com')) return;
    let data: any;
    try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; }
    catch { return; }
    if (!data) return;

    // Match by contentWindow reference
    const entry = vimeoEntries.find(e => e.iframe.contentWindow === event.source);
    if (!entry) return;

    if (data.event === 'ready') {
      entry.ready = true;
      // Subscribe to finish
      entry.iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'addEventListener', value: 'finish' }),
        'https://player.vimeo.com'
      );
      if (entry.pendingPlay) {
        entry.pendingPlay = false;
        entry.iframe.contentWindow?.postMessage(
          JSON.stringify({ method: 'play' }),
          'https://player.vimeo.com'
        );
      }
    }

    if (data.event === 'finish') {
      playItem(entry.seqIdx + 1);
    }
  };

  window.addEventListener('message', msgHandler);

  // Subscribe to 'ready' for each Vimeo iframe after it loads
  vimeoEntries.forEach(e => {
    const sendReadySub = () => {
      e.iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'addEventListener', value: 'ready' }),
        'https://player.vimeo.com'
      );
    };
    // The new iframe hasn't loaded yet — wait for load event
    e.iframe.addEventListener('load', () => {
      // Small delay to ensure Vimeo player JS is initialised inside the iframe
      setTimeout(sendReadySub, 200);
    }, { once: true });
  });

  // ── 5. YouTube ────────────────────────────────────────────────────────────
  if (ytRaw.length > 0) {
    await loadYTApi();
    ytRaw.forEach(({ el: iframe, seqIdx }) => {
      const videoId = extractYTVideoId(iframe.src);
      if (!videoId) return;

      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.minHeight = '315px';
      const divId = `yt-${Date.now()}-${seqIdx}`;
      wrapper.id = divId;
      iframe.parentNode?.replaceChild(wrapper, iframe);

      const ytEntry = entries[seqIdx] as YTEntry;
      const player = new window.YT.Player(divId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: seqIdx === 0 && autoPlay ? 1 : 0, enablejsapi: 1, rel: 0 },
        events: {
          onReady: () => {
            ytEntry.ready = true;
            ytEntry.player = player;
            if (ytEntry.pendingPlay) { ytEntry.pendingPlay = false; player.playVideo(); }
          },
          onStateChange: (ev: any) => { if (ev.data === 0) playItem(seqIdx + 1); },
        },
      });
      ytEntry.player = player;
    });
  }

  return () => window.removeEventListener('message', msgHandler);
}
