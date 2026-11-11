import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureMedia, CaptureSpaceProvider } from "../../phone/CaptureMedia";
import { useScreenRect, type CartoonPhoneProps } from "../../phone/CartoonPhone";
import type { CaptureCrop } from "../../phone/captureGeometry";
import { labelFont } from "./fonts";
import { PHONE_DEFAULTS, SAFE_CENTRE_X, floatingPhoneBody } from "./phoneGeometry";

// The app in the toy style: a plain dark phone that floats over the scene,
// usually above the figure's head, with a REAL capture on its screen. Same
// rule as CartoonPhone: the frame is drawn, the screen never is. It takes
// the same capture props (focus, focusTo, scroll, videoStart), so a tap ring
// or a zoom is measured on the screenshot.
//
// A zoom shows less of the capture's width (62% at 1.6x), so it only suits
// an element narrow enough to stay whole; say which one in `element` and
// the lint checks it. A full-width banner or row goes in a CaptureCallout
// beside a phone that shows the whole screenshot.

export type FloatingPhoneProps = Pick<CartoonPhoneProps, "src" | "captureSize" | "scrollFrom" | "scrollTo" | "focus" | "focusTo" | "videoStart" | "children"> & {
  /** Phone height in px. 1000 is the usual size; 1200+ when the screen itself must be read. */
  height?: number;
  /** Centre of the phone, fractions of the frame. Default: centred on the safe zone, upper half. */
  x?: number;
  y?: number;
  /** Frame of the shot at which it appears. */
  enterAt?: number;
  /** rise: floats up into place. pop: a small overshoot. none: already there (a shot that continues the last one). */
  entrance?: "rise" | "pop" | "none";
  tilt?: number;
  /** One small line under the phone, e.g. a disclaimer the claims need ("Example data"). */
  note?: string;
  /** With `focus`: the box of the one UI element the zoom is for, capture fractions. Not drawn; `npm run lint` fails the shot when the zoom cuts it. */
  element?: CaptureCrop;
};

function useEntrance(enterAt: number, entrance: FloatingPhoneProps["entrance"]) {
  const frame = useCurrentFrame() - enterAt;
  const { fps } = useVideoConfig();
  if (entrance === "none") return { opacity: 1, rise: 0, scale: 1, frame };
  const config = entrance === "pop" ? { damping: 11, stiffness: 220, mass: 0.6 } : { damping: 200, stiffness: 120, mass: 0.6 };
  const p = frame <= 0 ? 0 : spring({ frame, fps, config });
  return { opacity: Math.min(1, Math.max(0, frame / 5)), rise: (1 - p) * 90, scale: 0.9 + 0.1 * p, frame };
}

export function FloatingPhone(props: FloatingPhoneProps) {
  const { src, height = PHONE_DEFAULTS.height, x = SAFE_CENTRE_X, y = PHONE_DEFAULTS.y, enterAt = 0, entrance = "rise", tilt = 0, note, videoStart = 0, children } = props;
  const { width, bezel, screen } = floatingPhoneBody(height);
  const { rect, zoom } = useScreenRect(screen, props);
  const enter = useEntrance(enterAt, entrance);
  const bob = Math.sin((enter.frame + 20) / 21) * 7;
  if (enter.frame < 0) return null;
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, -50%) translateY(${enter.rise + bob}px) rotate(${tilt}deg) scale(${enter.scale})`, opacity: enter.opacity }}>
      <div style={{
        width, height, boxSizing: "border-box", padding: bezel, borderRadius: width * 0.15, background: "#0C0C10",
        boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 8px 22px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.14)",
      }}>
        <div style={{ position: "relative", width: screen.width, height: screen.height, borderRadius: width * 0.125, overflow: "hidden", background: "#000" }}>
          {src ? <CaptureMedia src={src} rect={rect} videoStart={videoStart} /> : null}
          <CaptureSpaceProvider value={{ rect, box: screen, zoom }}>{children}</CaptureSpaceProvider>
        </div>
      </div>
      {note ? (
        <div style={{ marginTop: 16, textAlign: "center", fontFamily: labelFont, fontWeight: 500, fontSize: 26, color: "rgba(255,255,255,0.86)", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>{note}</div>
      ) : null}
    </div>
  );
}
