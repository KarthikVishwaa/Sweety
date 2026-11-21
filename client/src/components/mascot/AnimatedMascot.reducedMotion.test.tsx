import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AnimatedMascot } from './AnimatedMascot';

describe('AnimatedMascot with prefers-reduced-motion', () => {
  beforeAll(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
  });

  it('does not autoplay and shows only the poster', () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();

    const { container } = render(<AnimatedMascot variant="love" />);
    const video = container.querySelector('video') as HTMLVideoElement;

    expect(video.autoplay).toBe(false);
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.getAttribute('poster')).toContain('love');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
