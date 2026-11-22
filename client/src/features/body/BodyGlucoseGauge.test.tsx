import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BodyGlucoseGauge } from './BodyGlucoseGauge';
import { resetWebGLSupportCheck } from './useWebGLSupport';

vi.mock('./BodyGlucoseScene', () => ({ default: () => <div data-testid="scene" /> }));

function stubCanvasContext(context: unknown) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    (() => context) as unknown as HTMLCanvasElement['getContext'],
  );
  resetWebGLSupportCheck();
}

describe('BodyGlucoseGauge', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows the flat gauge when WebGL is unsupported', () => {
    stubCanvasContext(null);
    render(<BodyGlucoseGauge model="male" value={182} />);

    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(screen.getByText('182')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows a dash and no badge when there is no reading', () => {
    stubCanvasContext(null);
    render(<BodyGlucoseGauge model="female" value={null} />);

    expect(screen.getByText('–')).toBeInTheDocument();
    expect(screen.queryByText('In range')).not.toBeInTheDocument();
  });

  it('loads the 3D scene when WebGL is available, and is hidden from assistive tech', async () => {
    stubCanvasContext({});
    const { container } = render(<BodyGlucoseGauge model="male" value={110} />);

    expect(await screen.findByTestId('scene')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
