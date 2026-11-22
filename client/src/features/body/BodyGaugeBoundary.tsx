import { Component, type ErrorInfo, type ReactNode } from 'react';

interface BodyGaugeBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

// Any failure of the 3D module (a chunk that will not load, a shader error) leaves the flat gauge in place.
export class BodyGaugeBoundary extends Component<BodyGaugeBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D body gauge failed', error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
