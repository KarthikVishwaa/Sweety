import { useEffect, type RefObject } from 'react';
import { useIsActive } from '@/hooks/useIsActive';

const WATCHDOG_MS = 2000;
const RETRY_BASE_MS = 100;
const RETRY_MAX_MS = 2000;

// Keeps a muted video playing for as long as it is on screen and the tab is visible. The native `loop`
// attribute does the looping; everything here is a safety net for the cases where a browser stops a clip anyway
// (a rejected play(), a pause it chose to make, a missed loop point, a decoder that stalled).
export function useLoopingVideo(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const active = useIsActive(videoRef);
  const shouldPlay = enabled && active;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!shouldPlay) {
      video.pause();
      return;
    }

    let retry: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let lastTime = -1;
    let stalledChecks = 0;

    const play = () => {
      clearTimeout(retry);
      Promise.resolve(video.play()).then(
        () => {
          failures = 0;
        },
        () => {
          retry = setTimeout(play, Math.min(RETRY_BASE_MS * 2 ** failures, RETRY_MAX_MS));
          failures += 1;
        },
      );
    };
    const restart = () => {
      video.currentTime = 0;
      lastTime = 0;
      play();
    };
    const reload = () => {
      video.load();
      play();
    };

    // Only a clip that should be moving but is not gets here: it is paused, or its clock has not advanced.
    const watchdog = setInterval(() => {
      if (video.paused || video.ended) {
        restart();
        return;
      }
      stalledChecks = video.currentTime === lastTime ? stalledChecks + 1 : 0;
      lastTime = video.currentTime;
      if (stalledChecks === 1) restart();
      else if (stalledChecks > 1) reload();
    }, WATCHDOG_MS);

    video.addEventListener('ended', restart);
    video.addEventListener('pause', play);
    video.addEventListener('canplay', play);
    video.addEventListener('error', reload);
    play();

    return () => {
      clearTimeout(retry);
      clearInterval(watchdog);
      video.removeEventListener('ended', restart);
      video.removeEventListener('pause', play);
      video.removeEventListener('canplay', play);
      video.removeEventListener('error', reload);
    };
  }, [shouldPlay, videoRef]);
}
