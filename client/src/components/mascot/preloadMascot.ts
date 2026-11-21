import { useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { MASCOT_SOURCES, type MascotVariant } from './mascot.assets';

const preloaded = new Set<string>();

function preload(key: string, load: () => void) {
  if (preloaded.has(key)) return;
  preloaded.add(key);
  load();
}

function preloadPoster(variant: MascotVariant) {
  preload(`poster:${variant}`, () => {
    new Image().src = MASCOT_SOURCES[variant].poster;
  });
}

function preloadVideo(variant: MascotVariant) {
  preload(`video:${variant}`, () => {
    const { webm, mp4 } = MASCOT_SOURCES[variant];
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.src = video.canPlayType('video/webm; codecs="vp9"') ? webm : mp4;
    video.load();
  });
}

export function usePreloadMascot(variant: MascotVariant | undefined) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!variant) return;
    preloadPoster(variant);
    if (!reducedMotion) preloadVideo(variant);
  }, [variant, reducedMotion]);
}
