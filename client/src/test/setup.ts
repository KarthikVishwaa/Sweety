import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { cloneElement, createElement, type ReactElement } from 'react';
import { afterEach, vi } from 'vitest';

vi.mock('@number-flow/react', () => ({
  default: ({
    value,
    format,
    className,
  }: {
    value: number;
    format?: Intl.NumberFormatOptions;
    className?: string;
  }) => createElement('span', { className }, new Intl.NumberFormat('en-US', format).format(value)),
}));

vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof import('recharts')>();
  return {
    ...recharts,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width: number; height: number }>;
    }) => cloneElement(children, { width: 600, height: 300 }),
  };
});

vi.stubGlobal('scrollTo', () => undefined);

HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
}));

Element.prototype.animate = () =>
  ({
    cancel: () => undefined,
    finish: () => undefined,
    play: () => undefined,
    pause: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    finished: Promise.resolve(),
    onfinish: null,
  }) as unknown as Animation;

afterEach(cleanup);
