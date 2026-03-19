/**
 * initVideoSequence
 *
 * Sets up video end-detection for a lesson page.
 * autoPlayRef is a React ref — always reads the LIVE value, no stale closures.
 *
 * When autoPlay is ON:
 *   - Each video ending plays the next one automatically
 *   - Last video ending → onAllEnded() (navigate to next lesson/quiz)
 *
 * When autoPlay is OFF:
 *   - Videos don't auto-chain
 *   - Last video ending still calls onAllEnded() so navigation still works
 *
 * Vimeo: rewrites iframe src to add ?api=1 so the JS SDK can communicate,
 *        then waits for the iframe to reload before attaching the SDK.
 */

import VimeoPlayer from '@vimeo/player';

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

/** Add ?api=1 to Vimeo iframe src so the JS SDK can communicate with the player */
function enableVimeoApi(iframe: HTMLIFrameElement): void {
  const src = iframe.src;
  if (!src || src.includes('api=1')) return; // already enabled
  try {
    const url = new URL(src);
    url.searchParams.set('api', '1');
    url.searchParams.set('autopause', '0');
    iframe.removeAttribute('loading');
    iframe.src = url.toString();
  } catch {
    const sep = src.includes('?') ? '&' : '?';
    iframe.removeAttribute('loading');
    iframe.src = src + sep + 'api=1&autopause=0';
  }
}

/** Wait for iframe load event (with 5s safety timeout) */
function waitForLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    const onLoad = () => { iframe.removeEventListener('load', onLoad); resolve(); };
    iframe.addEventListener('load', onLoad);
    setTimeout(resolve, 5000);
  });
}

type Entry =
  | { type: 'vimeo'; seqIdx: number; player: VimeoPlayer }
  | { type: 'yt';    seqIdx: number; player: any; ready: boolean; pendingPlay: boolean }
  | { type: 'html5'; seqIdx: number; video: HTMLVideoElement };

/**
 * @param container   - The DOM element containing the lesson body
 * @param onAllEnded  - Called when the last video ends (navigate to next lesson)
 * @param autoPlayRef - A React ref to the live autoPlay boolean value
 */
export async function initVideoSequence(
  container: HTMLElement,
  onAllEnded: () => void,
  autoPlayRef: { current: boolean }
): Promise<(() => void) | undefined> {
  if (typeof window === 'undefined') return;

  const allEls = Array.from(container.querySelectorAll<HTMLElement>('iframe, video'));
  if (allEls.length === 0) return;

  const entries: Entry[] = [];
  const ytRaw: { el: HTMLIFrameElement; seqIdx: number }[] = [];
  const vimeoRaw: { iframe: HTMLIFrameElement; seqIdx: number }[] = [];
  const vimeoPlayers: VimeoPlayer[] = [];

  // ── Collect elements ──────────────────────────────────────────────────────
  allEls.forEach(el => {
    if (el.tagName === 'VIDEO') {
      const video = el as HTMLVideoElement;
      const seqIdx = entries.length;
      video.autoplay = false; // we control playback manually
      entries.push({ type: 'html5', seqIdx, video });
      return;
    }
    if (el.tagName === 'IFRAME') {
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
        entries.push({ type: 'vimeo', seqIdx, player: null as any });
        vimeoRaw.push({ iframe, seqIdx });
      }
    }
  });

  if (entries.length === 0) return;
  const total = entries.length;

  // ── playItem: play video at idx if autoPlay is on ─────────────────────────
  function playItem(idx: number) {
    if (idx >= total) {
      onAllEnded();
      return;
    }
    // Always call onAllEnded for the last video regardless of autoPlay
    if (idx === total - 1 && !autoPlayRef.current) {
      // Don't auto-play the last one, but when it ends naturally onAllEnded fires
      return;
    }
    if (!autoPlayRef.current) return; // autoPlay off — don't chain

    const e = entries[idx];
    if (e.type === 'vimeo') {
      e.player.play().catch(() => {});
    } else if (e.type === 'yt') {
      if (e.ready && e.player) e.player.playVideo();
      else e.pendingPlay = true;
    } else {
      e.video.play().catch(() => {});
    }
  }

  // ── Vimeo: enable API, wait for reload, attach SDK ────────────────────────
  if (vimeoRaw.length > 0) {
    await Promise.all(vimeoRaw.map(async ({ iframe, seqIdx }) => {
      enableVimeoApi(iframe); // rewrites src → triggers reload
      await waitForLoad(iframe); // wait for reload to complete
      try {
        const vp = new VimeoPlayer(iframe);
        vimeoPlayers.push(vp);
        (entries[seqIdx] as Extract<Entry, { type: 'vimeo' }>).player = vp;

        vp.on('ended', () => {
          if (seqIdx === total - 1) {
            // Last video: always navigate to next lesson
            onAllEnded();
          } else {
            // Middle video: only chain if autoPlay is on
            if (autoPlayRef.current) playItem(seqIdx + 1);
          }
        });
      } catch (err) {
        console.error('[VideoSeq] VimeoPlayer init failed for index', seqIdx, err);
      }
    }));

    // Autoplay first video if autoPlay is on
    if (autoPlayRef.current && entries[0]?.type === 'vimeo' && entries[0].player) {
      entries[0].player.play().catch(() => {});
    }
  }

  // ── HTML5 ─────────────────────────────────────────────────────────────────
  entries.forEach(e => {
    if (e.type !== 'html5') return;
    e.video.addEventListener('ended', () => {
      if (e.seqIdx === total - 1) onAllEnded();
      else if (autoPlayRef.current) playItem(e.seqIdx + 1);
    });
    if (e.seqIdx === 0 && autoPlayRef.current) e.video.play().catch(() => {});
  });

  // ── YouTube ───────────────────────────────────────────────────────────────
  if (ytRaw.length > 0) {
    await loadYTApi();
    ytRaw.forEach(({ el: iframe, seqIdx }) => {
      const videoId = extractYTVideoId(iframe.src);
      if (!videoId) return;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:100%;height:100%;min-height:315px;';
      const divId = `yt-${Date.now()}-${seqIdx}`;
      wrapper.id = divId;
      iframe.parentNode?.replaceChild(wrapper, iframe);

      const ytEntry = entries[seqIdx] as Extract<Entry, { type: 'yt' }>;
      const player = new window.YT.Player(divId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: seqIdx === 0 && autoPlayRef.current ? 1 : 0, enablejsapi: 1, rel: 0 },
        events: {
          onReady: () => {
            ytEntry.ready = true;
            ytEntry.player = player;
            if (ytEntry.pendingPlay) { ytEntry.pendingPlay = false; player.playVideo(); }
          },
          onStateChange: (ev: any) => {
            if (ev.data === 0) { // ended
              if (seqIdx === total - 1) onAllEnded();
              else if (autoPlayRef.current) playItem(seqIdx + 1);
            }
          },
        },
      });
      ytEntry.player = player;
    });
  }

  return () => {
    vimeoPlayers.forEach(vp => { try { vp.destroy(); } catch {} });
  };
}
