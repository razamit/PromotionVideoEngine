// Where a real capture's pixels land inside a box (the phone screen or a
// CaptureCard). Everything a scene says about a capture is in CAPTURE
// fractions (0..1 of the capture's own width and height), so a tap, a crop
// or a zoom target is measured once on the screenshot and stays right at
// any phone size, scroll or zoom.

/** Pixel size of the capture file. The house captures are 1080x2400 Android screenshots and recordings. */
export type CaptureSize = [number, number];
export const ANDROID_CAPTURE: CaptureSize = [1080, 2400];

/** Zoom target: (x, y) in capture fractions is put at the screen centre, `zoom` 1 = capture fills the screen. */
export type CaptureFocus = { x: number; y: number; zoom: number };

/** A region of the capture, capture fractions. */
export type CaptureCrop = { x: number; y: number; w: number; h: number };

/** The capture's rendered rectangle in px, relative to the box it is shown in. */
export type CaptureRect = { left: number; top: number; width: number; height: number };

export type Box = { width: number; height: number };

/** The size at which the capture covers the box (like objectFit: cover). */
function coverSize(box: Box, capture: CaptureSize) {
  const scale = Math.max(box.width / capture[0], box.height / capture[1]);
  return { width: capture[0] * scale, height: capture[1] * scale };
}

/** Cover, centred across, scrolled down by `scrollPercent` (0 = top, 100 = bottom). */
export function scrollRect(box: Box, capture: CaptureSize, scrollPercent: number): CaptureRect {
  const size = coverSize(box, capture);
  return { ...size, left: (box.width - size.width) / 2, top: ((box.height - size.height) * scrollPercent) / 100 };
}

/** Cover times `zoom`, with the focus point at the box centre, clamped so no edge of the capture shows. */
export function focusRect(box: Box, capture: CaptureSize, focus: CaptureFocus): CaptureRect {
  const base = coverSize(box, capture);
  const zoom = Math.max(1, focus.zoom);
  const width = base.width * zoom;
  const height = base.height * zoom;
  const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
  return {
    width,
    height,
    left: clamp(box.width / 2 - focus.x * width, box.width - width),
    top: clamp(box.height / 2 - focus.y * height, box.height - height),
  };
}

/** The crop region scaled so its width fills `box.width`. */
export function cropRect(box: Box, crop: CaptureCrop): CaptureRect {
  const width = box.width / crop.w;
  const height = box.height / crop.h;
  return { width, height, left: -crop.x * width, top: -crop.y * height };
}

/** Box height that shows `crop` at `width` px without stretching. */
export function cropHeight(width: number, crop: CaptureCrop, capture: CaptureSize) {
  return (width * crop.h * capture[1]) / (crop.w * capture[0]);
}

/** Capture fractions -> fractions of the box, for overlays such as TapRing. */
export function captureToBox(rect: CaptureRect, box: Box, x: number, y: number) {
  return { x: (rect.left + x * rect.width) / box.width, y: (rect.top + y * rect.height) / box.height };
}

/** Eased focus between two targets; zoom moves in log space so it feels constant-speed. */
export function mixFocus(from: CaptureFocus, to: CaptureFocus, t: number): CaptureFocus {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    zoom: Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * t),
  };
}
