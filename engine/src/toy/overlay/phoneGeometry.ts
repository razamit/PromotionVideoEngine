import { SAFE_ZONE } from "../../layout/safeZone";
import { scrollRect, type CaptureCrop, type CaptureSize } from "../../phone/captureGeometry";

// The floating phone's body, in one place: FloatingPhone draws it,
// CaptureCallout uses it to grow out of the right spot on the screen, and
// engine/scripts/capture_window.mjs repeats the same numbers for the lint.

/** Centre of the readable width of the frame, where the phone and a callout sit by default. */
export const SAFE_CENTRE_X = (SAFE_ZONE.left + 1 - SAFE_ZONE.right) / 2;
export const PHONE_DEFAULTS = { height: 1000, y: 0.36 };

/** Where a floating phone sits: centre in frame fractions, height in px. */
export type PhonePlace = { x?: number; y?: number; height?: number };

export function floatingPhoneBody(height: number) {
  const width = Math.round((height * 9) / 19.5);
  const bezel = Math.round(height * 0.014);
  return { width, bezel, screen: { width: width - 2 * bezel, height: height - 2 * bezel } };
}

/**
 * Where `crop` sits on a floating phone that shows the capture whole: its
 * centre in frame fractions, and its size as a fraction of a card
 * `cardWidth` px wide that shows the same crop.
 */
export function cropOnPhone(phone: PhonePlace, crop: CaptureCrop, capture: CaptureSize, cardWidth: number, frame: { width: number; height: number }) {
  const { screen } = floatingPhoneBody(phone.height ?? PHONE_DEFAULTS.height);
  const rect = scrollRect(screen, capture, 0);
  const left = (phone.x ?? SAFE_CENTRE_X) * frame.width - screen.width / 2 + rect.left;
  const top = (phone.y ?? PHONE_DEFAULTS.y) * frame.height - screen.height / 2 + rect.top;
  return {
    x: (left + (crop.x + crop.w / 2) * rect.width) / frame.width,
    y: (top + (crop.y + crop.h / 2) * rect.height) / frame.height,
    scale: (crop.w * rect.width) / cardWidth,
  };
}
