import { useMemo, useRef, type PointerEvent, type RefObject } from 'react';
import { DRAG_LIMIT_RADIANS, DRAG_RADIANS_PER_PIXEL } from './bodyScene.constants';

export interface DragState {
  /** Where the drag wants the figure to turn to, in radians. It returns to 0 on release. */
  target: number;
  active: boolean;
}

type PointerHandler = (event: PointerEvent<HTMLElement>) => void;

// Horizontal dragging turns the figure within a limit. The container keeps vertical page scroll working.
export function useDragRotation(): {
  drag: RefObject<DragState>;
  handlers: {
    onPointerDown: PointerHandler;
    onPointerMove: PointerHandler;
    onPointerUp: PointerHandler;
    onPointerCancel: PointerHandler;
  };
} {
  const drag = useRef<DragState>({ target: 0, active: false });
  const lastX = useRef(0);

  const handlers = useMemo(() => {
    const release: PointerHandler = (event) => {
      drag.current.active = false;
      drag.current.target = 0;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    };

    return {
      onPointerDown: ((event) => {
        drag.current.active = true;
        lastX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }) as PointerHandler,
      onPointerMove: ((event) => {
        if (!drag.current.active) return;
        const next = drag.current.target + (event.clientX - lastX.current) * DRAG_RADIANS_PER_PIXEL;
        lastX.current = event.clientX;
        drag.current.target = Math.min(Math.max(next, -DRAG_LIMIT_RADIANS), DRAG_LIMIT_RADIANS);
      }) as PointerHandler,
      onPointerUp: release,
      onPointerCancel: release,
    };
  }, []);

  return { drag, handlers };
}
