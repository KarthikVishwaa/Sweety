import { useEffect, useState, type RefObject } from 'react';

function isTabVisible() {
  return document.visibilityState !== 'hidden';
}

export function useMascotPlayback(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(isTabVisible);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [videoRef]);

  useEffect(() => {
    const handleVisibilityChange = () => setTabVisible(isTabVisible());
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const shouldPlay = enabled && onScreen && tabVisible;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay && !video.ended) Promise.resolve(video.play()).catch(() => undefined);
    else video.pause();
  }, [shouldPlay, videoRef]);
}
