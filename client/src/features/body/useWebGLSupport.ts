let supported: boolean | undefined;

function detect(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Checked once: creating a context just to ask is not free.
export function useWebGLSupport(): boolean {
  supported ??= detect();
  return supported;
}

export function resetWebGLSupportCheck(): void {
  supported = undefined;
}
