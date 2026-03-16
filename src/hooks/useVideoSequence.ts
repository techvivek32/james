/**
 * initVideoSequence
 * Finds all YouTube/Vimeo iframes and HTML5 videos in a container,
 * plays them one by one in DOM order, and calls onAllEnded when done.
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

type VideoItem =
  | { type: 'yt';    player: any; ready: boolean; pendingPlay: boolean }
  | { type: 'vimeo'; iframe: HTMLIFrameElement }
  | { type: 'html5'; video: HTMLVideoElement };

export async function initVideoSequence(
  container: HTMLElement,
  onAllEnded: () => void
): Promise<(() => void) | undefined> {
  if (typeof window === 'undefined') return;

  // Collect all media elements in DOM order
  const allEls = Array.from(container.querySelectorAll<HTMLElement>('iframe, video'));
  const items: VideoItem[] = [];

  // Separate YT iframes for API init
  const ytEls: { el: HTMLIFrameElement; globalIdx: number }[] = [];

  allEls.forEach(el => {
    if (el.tagName === 'IFRAME') {
      const iframe = el as HTMLIFrameElement;
      const src = iframe.src || '';
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        const idx = items.length;
        items.push({ type: 'yt', player: null, ready: false, pendingPlay: false });
        ytEls.push({ el: iframe, globalIdx: idx });
      } else if (src.includes('vimeo.com')) {
        // Strip autoplay from non-first vimeo, add api=1
        let newSrc = src
          .replace(/[&?]autoplay=\d/g, '')
          .replace(/[&?]api=\d/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
        const sep = newSrc.includes('?') ? '&' : '?';
        newSrc += sep + 'api=1';
        // Only first item overall gets autoplay
        if (items.length === 0) newSrc += '&autoplay=1';
        iframe.src = newSrc;
        items.push({ type: 'vimeo', iframe });
      }
    } else if (el.tagName === 'VIDEO') {
      const video = el as HTMLVideoElement;
      if (items.length > 0) video.autoplay = false;
      items.push({ type: 'html5', video });
    }
  });

  if (items.length === 0) return;

  function playItem(index: number) {
    if (index >= items.length) {
      onAllEnded();
      return;
    }
    const item = items[index];
    if (item.type === 'yt') {
      if (item.ready && item.player) {
        item.player.playVideo();
      } else {
        // Player not ready yet - mark pending, onReady will trigger it
        item.pendingPlay = true;
      }
    } else if (item.type === 'vimeo') {
      item.iframe.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
    } else if (item.type === 'html5') {
      item.video.play().catch(() => {});
    }
  }

  // Wire HTML5 video ended
  items.forEach((item, idx) => {
    if (item.type === 'html5') {
      item.video.onended = () => playItem(idx + 1);
    }
  });

  // Wire Vimeo via postMessage
  const vimeoHandler = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data?.event === 'finish') {
        const idx = items.findIndex(
          it => it.type === 'vimeo' && it.iframe.contentWindow === event.source
        );
        if (idx !== -1) playItem(idx + 1);
      }
    } catch {}
  };
  window.addEventListener('message', vimeoHandler);

  // Wire YouTube via IFrame API
  if (ytEls.length > 0) {
    await loadYTApi();

    ytEls.forEach(({ el: iframe, globalIdx }) => {
      const videoId = extractYTVideoId(iframe.src);
      if (!videoId) return;

      // Create a sized div to replace the iframe
      const wrapper = document.createElement('div');
      wrapper.style.width = iframe.style.width || iframe.getAttribute('width') || '100%';
      wrapper.style.height = iframe.style.height || iframe.getAttribute('height') || '315px';
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
          autoplay: globalIdx === 0 ? 1 : 0,
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
            if (e.data === 0) { // YT.PlayerState.ENDED
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
