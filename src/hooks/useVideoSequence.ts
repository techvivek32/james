/**
 * initVideoSequence
 *
 * Finds all YouTube / Vimeo iframes and HTML5 <video> elements inside `container`.
 * - Multiple videos play one by one automatically (when autoPlay is ON)
 * - When the last video ends → calls onAllEnded() to advance to the next lesson
 * - autoPlay only controls whether the NEXT video in the same lesson auto-starts;
 *   onAllEnded() is ALWAYS called when the last video finishes regardless of autoPlay
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

// ─── YouTube IFrame API loader (singleton) ────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type VimeoItem = {
  type: 'vimeo';
  iframe: HTMLIFrameElement;
  ready: boolean;       // true after we receive the 'ready' event from Vimeo
  pendingPlay: boolean; // true if we want to play but aren't ready yet
};

type VideoItem =
  | { type: 'yt';    player: any; ready: boolean; pendingPlay: boolean }
  | VimeoItem
  | { type: 'html5'; video: HTMLVideoElement };

// ─── Main export ──────────────────────────────────────────────────────────────

export async function initVideoSequence(
  container: HTMLElement,
  onAllEnded: () => void,
  autoPlay: boolean = true
): Promise<(() => void) | undefined> {
  if (typeof window === 'undefined') return;

  const allEls = Array.from(container.querySelectorAll<HTMLElement>('iframe, video'));
  const items: VideoItem[] = [];
  const ytEls: { el: HTMLIFrameElement; globalIdx: number }[] = [];

  // ── Collect items ─────────────────────────────────────────────────────────
  allEls.forEach(el => {
    if (el.tagName === 'IFRAME') {
      const iframe = el as HTMLIFrameElement;
      const src = iframe.src || '';

      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        const idx = items.length;
        items.push({ type: 'yt', player: null, ready: false, pendingPlay: false });
        ytEls.push({ el: iframe, globalIdx: idx });

      } else if (src.includes('vimeo.com')) {
        // Add api=1 so Vimeo accepts postMessage commands & events
        let newSrc = src
          .replace(/[&?]autoplay=\d/g, '')
          .replace(/[&?]api=\d/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
        const sep = newSrc.includes('?') ? '&' : '?';
        newSrc += `${sep}api=1`;
        // First video autoplays when autoPlay is on
        if (items.length === 0 && autoPlay) newSrc += '&autoplay=1';
        iframe.src = newSrc;
        items.push({ type: 'vimeo', iframe, ready: false, pendingPlay: false });
      }

    } else if (el.tagName === 'VIDEO') {
      const video = el as HTMLVideoElement;
      if (items.length > 0) video.autoplay = false;
      items.push({ type: 'html5', video });
    }
  });

  if (items.length === 0) return;

  const total = items.length;

  // ── playItem: trigger playback of item at `index` ─────────────────────────
  function playItem(index: number) {
    if (index >= total) {
      // All videos done — always advance to next lesson
      onAllEnded();
      return;
    }

    // autoPlay=false: don't auto-start next video, but onAllEnded still fires above
    if (!autoPlay) return;

    const item = items[index];

    if (item.type === 'yt') {
      if (item.ready && item.player) {
        item.player.playVideo();
      } else {
        item.pendingPlay = true;
      }

    } else if (item.type === 'vimeo') {
      if (item.ready) {
        item.iframe.contentWindow?.postMessage(
          JSON.stringify({ method: 'play' }),
          'https://player.vimeo.com'
        );
      } else {
        item.pendingPlay = true;
      }

    } else if (item.type === 'html5') {
      item.video.play().catch(() => {});
    }
  }

  // ── Wire HTML5 ended ──────────────────────────────────────────────────────
  items.forEach((item, idx) => {
    if (item.type === 'html5') {
      item.video.addEventListener('ended', () => playItem(idx + 1));
    }
  });

  // ── Wire Vimeo via postMessage ────────────────────────────────────────────
  // Vimeo requires:
  //   1. iframe src has api=1
  //   2. After iframe loads, send addEventListener for 'finish' (and 'ready')
  //   3. Listen for { event: 'ready' } → then subscribe to finish
  //   4. Listen for { event: 'finish' } → call playItem(idx + 1)
  //
  // We identify which iframe sent the message by matching iframe elements
  // against event.source (WindowProxy).

  const vimeoItems = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.type === 'vimeo') as { item: VimeoItem; idx: number }[];

  const vimeoHandler = (event: MessageEvent) => {
    // Only handle messages from Vimeo
    if (!event.origin.includes('vimeo.com')) return;

    let data: any;
    try {
      data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch { return; }

    if (!data) return;

    // Find which vimeo item sent this message
    const match = vimeoItems.find(({ item }) => item.iframe.contentWindow === event.source);
    if (!match) return;

    const { item, idx } = match;

    if (data.event === 'ready') {
      // Vimeo player is ready — subscribe to finish event
      item.ready = true;
      item.iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'addEventListener', value: 'finish' }),
        'https://player.vimeo.com'
      );
      // If we were waiting to play this item, do it now
      if (item.pendingPlay) {
        item.pendingPlay = false;
        item.iframe.contentWindow?.postMessage(
          JSON.stringify({ method: 'play' }),
          'https://player.vimeo.com'
        );
      }
    }

    if (data.event === 'finish') {
      playItem(idx + 1);
    }
  };

  window.addEventListener('message', vimeoHandler);

  // Send initial addEventListener for 'ready' to each Vimeo iframe
  // We do this after a short tick to ensure the iframe src has been set
  vimeoItems.forEach(({ item }) => {
    // Use onload if not yet loaded, otherwise send immediately
    const sendReady = () => {
      item.iframe.contentWindow?.postMessage(
        JSON.stringify({ method: 'addEventListener', value: 'ready' }),
        'https://player.vimeo.com'
      );
    };
    if (item.iframe.contentWindow) {
      sendReady();
    }
    item.iframe.addEventListener('load', sendReady, { once: true });
  });

  // ── Wire YouTube via IFrame API ───────────────────────────────────────────
  if (ytEls.length > 0) {
    await loadYTApi();

    ytEls.forEach(({ el: iframe, globalIdx }) => {
      const videoId = extractYTVideoId(iframe.src);
      if (!videoId) return;

      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.minHeight = '315px';
      wrapper.style.display = 'block';
      const divId = `yt-seq-${Date.now()}-${globalIdx}`;
      wrapper.id = divId;
      iframe.parentNode?.replaceChild(wrapper, iframe);

      const ytItem = items[globalIdx] as Extract<VideoItem, { type: 'yt' }>;

      const player = new window.YT.Player(divId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: (globalIdx === 0 && autoPlay) ? 1 : 0,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            ytItem.ready = true;
            ytItem.player = player;
            if (ytItem.pendingPlay) {
              ytItem.pendingPlay = false;
              player.playVideo();
            }
          },
          onStateChange: (e: any) => {
            if (e.data === 0) { // ENDED
              playItem(globalIdx + 1);
            }
          },
        },
      });

      ytItem.player = player;
    });
  }

  return () => {
    window.removeEventListener('message', vimeoHandler);
  };
}
