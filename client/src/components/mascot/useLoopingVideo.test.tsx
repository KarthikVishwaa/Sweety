import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoopingVideo } from './useLoopingVideo';

function createVideo() {
  const video = document.createElement('video');
  const play = vi.fn(() => Promise.resolve());
  Object.assign(video, { play, pause: vi.fn(), load: vi.fn() });
  Object.defineProperty(video, 'paused', { value: false });
  return { video, play };
}

function mount(video: HTMLVideoElement, enabled = true) {
  return renderHook(() => useLoopingVideo({ current: video }, enabled));
}

describe('useLoopingVideo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays as soon as it mounts', () => {
    const { video, play } = createVideo();
    mount(video);

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('rewinds and plays again when the clip ends', () => {
    const { video, play } = createVideo();
    mount(video);
    video.currentTime = 3;
    play.mockClear();

    video.dispatchEvent(new Event('ended'));

    expect(video.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays again after an unexpected pause', () => {
    const { video, play } = createVideo();
    mount(video);
    play.mockClear();

    video.dispatchEvent(new Event('pause'));

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays when the media can play', () => {
    const { video, play } = createVideo();
    mount(video);
    play.mockClear();

    video.dispatchEvent(new Event('canplay'));

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('retries a rejected play() with a growing delay until it works', async () => {
    const { video, play } = createVideo();
    play.mockRejectedValueOnce(new Error('blocked')).mockRejectedValueOnce(new Error('blocked'));
    mount(video);
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(play).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(play).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(play).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(1000);
    expect(play).toHaveBeenCalledTimes(3);
  });

  it('recovers a clip whose clock has stopped, first by seeking and then by reloading', async () => {
    const { video, play } = createVideo();
    video.currentTime = 1;
    mount(video);
    await vi.advanceTimersByTimeAsync(0);
    play.mockClear();

    await vi.advanceTimersByTimeAsync(2000);
    expect(video.load).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(video.currentTime).toBe(0);
    expect(play).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(video.load).toHaveBeenCalled();
  });

  it('leaves a clip that is advancing alone', async () => {
    const { video, play } = createVideo();
    mount(video);
    await vi.advanceTimersByTimeAsync(0);
    play.mockClear();

    for (let tick = 1; tick <= 5; tick++) {
      video.currentTime = tick;
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(play).not.toHaveBeenCalled();
    expect(video.load).not.toHaveBeenCalled();
  });

  it('does nothing while disabled and stops everything on unmount', async () => {
    const disabled = createVideo();
    mount(disabled.video, false);
    expect(disabled.play).not.toHaveBeenCalled();
    expect(disabled.video.pause).toHaveBeenCalled();

    const { video, play } = createVideo();
    const { unmount } = mount(video);
    unmount();
    play.mockClear();

    video.dispatchEvent(new Event('ended'));
    video.dispatchEvent(new Event('pause'));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(play).not.toHaveBeenCalled();
  });
});
