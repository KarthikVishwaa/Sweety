import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
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

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);
