// Every scene is framed for the male stature so the model switch never moves the camera.
export const FRAME_HEIGHT = 1.78;
export const CAMERA_FOV = 28;
export const FRAME_MARGIN = 1.14;
// Half the width the body needs while it sways or is dragged, arms included.
export const FRAME_HALF_WIDTH = 0.46;
export const SWAY_RADIANS = (25 * Math.PI) / 180;
export const DRAG_LIMIT_RADIANS = (60 * Math.PI) / 180;
export const DRAG_RADIANS_PER_PIXEL = 0.012;
// Larger is quicker: about one second to settle.
export const DAMP_LAMBDA = 4.5;
