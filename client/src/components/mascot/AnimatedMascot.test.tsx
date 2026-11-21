import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedMascot } from './AnimatedMascot';
import type { MascotVariant } from './mascot.assets';

const VARIANTS: MascotVariant[] = ['floating', 'waving', 'bouncing', 'love'];
const play = vi.mocked(HTMLMediaElement.prototype.play);
const pause = vi.mocked(HTMLMediaElement.prototype.pause);

function renderMascot(variant: MascotVariant = 'floating') {
  const { container } = render(<AnimatedMascot variant={variant} />);
  return container.querySelector('video') as HTMLVideoElement;
}

function setTabVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('AnimatedMascot', () => {
  beforeEach(() => {
    play.mockClear().mockResolvedValue(undefined);
    pause.mockClear();
    setTabVisibility('visible');
  });

  it('renders WebM before MP4 and uses the WebP as the poster', () => {
    const video = renderMascot('waving');

    const sources = [...video.querySelectorAll('source')];
    expect(sources.map((source) => source.type)).toEqual(['video/webm', 'video/mp4']);
    expect(sources[0]?.getAttribute('src')).toContain('waving');
    expect(video.getAttribute('poster')).toContain('waving');
    expect(video.getAttribute('poster')).toMatch(/\.webp/);
  });

  it.each(VARIANTS)('uses the %s clip', (variant) => {
    const video = renderMascot(variant);

    expect(video.getAttribute('poster')).toContain(variant);
    expect(video.querySelector('source')?.getAttribute('src')).toContain(variant);
  });

  it('is a muted, looping, inline video that is hidden from assistive technology', () => {
    const video = renderMascot();

    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.getAttribute('preload')).toBe('auto');
    expect(video.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it.each([
    ['floating', true],
    ['waving', true],
    ['bouncing', true],
    ['love', false],
  ] as const)(
    '%s loops: %s (the love clip plays once and rests on its last frame)',
    (variant, loops) => {
      expect(renderMascot(variant).loop).toBe(loops);
    },
  );

  it('reserves its space with an aspect ratio so nothing shifts while loading', () => {
    const video = renderMascot();

    expect((video.parentElement as HTMLElement).style.aspectRatio).toBe('608 / 720');
  });

  it('plays when it can and pauses while the tab is hidden', () => {
    renderMascot();
    expect(play).toHaveBeenCalled();

    pause.mockClear();
    setTabVisibility('hidden');
    expect(pause).toHaveBeenCalled();

    play.mockClear();
    setTabVisibility('visible');
    expect(play).toHaveBeenCalled();
  });

  it('pauses when scrolled off screen and resumes when it comes back', () => {
    const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          callbacks.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    renderMascot();

    pause.mockClear();
    act(() => callbacks[0]?.([{ isIntersecting: false }]));
    expect(pause).toHaveBeenCalled();

    play.mockClear();
    act(() => callbacks[0]?.([{ isIntersecting: true }]));
    expect(play).toHaveBeenCalled();
  });

  it('fails silently and keeps the poster when play() is rejected', async () => {
    play.mockRejectedValue(new DOMException('Autoplay blocked', 'NotAllowedError'));

    const video = renderMascot();
    await act(async () => {
      await Promise.resolve();
    });

    expect(video.getAttribute('poster')).toContain('floating');
  });
});
