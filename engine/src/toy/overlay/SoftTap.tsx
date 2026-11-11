import React from "react";
import { useCurrentFrame } from "remotion";
import { useCaptureToScreen } from "../../phone/CaptureMedia";

// Marks a real tap on a capture in the toy style: a soft ring with no ink
// outline (the kit's TapRing is drawn for the bean style). A child of
// FloatingPhone or CaptureCallout; x and y are capture fractions, so the
// ring lands on the button under any zoom or crop.

const LIFE = 16; // frames the ring is on screen

export type SoftTapProps = {
  x: number;
  y: number;
  /** Frame of the shot at which the finger lands. */
  at?: number;
  color?: string;
  /** The fill and halo: the app's accent, as "r, g, b". */
  glow?: string;
};

export function SoftTap({ x, y, at = 0, color = "#FFFFFF", glow = "255, 255, 255" }: SoftTapProps) {
  const local = useCurrentFrame() - at;
  const { toScreen, zoom } = useCaptureToScreen();
  if (local < 0 || local > LIFE) return null;
  const centre = toScreen(x, y);
  const radius = (26 + local * 5) * Math.min(1.6, Math.sqrt(zoom));
  return (
    <div style={{
      position: "absolute", left: `${centre.x * 100}%`, top: `${centre.y * 100}%`,
      width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius, borderRadius: "50%",
      border: `6px solid ${color}`, background: `rgba(${glow}, 0.28)`, boxShadow: `0 0 24px rgba(${glow}, 0.55)`, opacity: 1 - local / LIFE,
    }} />
  );
}
