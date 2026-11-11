import React from "react";
import { useCurrentFrame } from "remotion";
import { displayFont, easeIn, labelFont } from "./fonts";

// A small data readout pinned to the picture, like a line of a dashboard:
// a spaced-out label in the accent colour and one big value under it
// ("LAST NIGHT'S SLEEP" / "3 HRS", "SKIP IT" / "-$5"). It states a fact of
// the scene in two lines, so it works with the sound off.

export type ReadoutProps = {
  label: string;
  value: string;
  /** Top-left corner (or top-right with align "right"), fractions of the frame. Default: top left of the safe zone. */
  x?: number;
  y?: number;
  align?: "left" | "right";
  accent?: string;
  /** Colour of the value. Default white. */
  color?: string;
  size?: number;
  /** Frame of the shot at which it appears. */
  at?: number;
};

export function Readout({ label, value, x = 0.075, y = 0.15, align = "left", accent = "#FF4B3A", color = "#FFFFFF", size = 118, at = 0 }: ReadoutProps) {
  const frame = useCurrentFrame() - at;
  if (frame < 0) return null;
  const p = easeIn(frame, 9);
  const side = align === "left" ? { left: `${x * 100}%` } : { right: `${(1 - x) * 100}%` };
  return (
    <div style={{ position: "absolute", top: `${y * 100}%`, ...side, textAlign: align, opacity: p, transform: `translateY(${(1 - p) * 18}px)`, zIndex: 20 }}>
      <div style={{ fontFamily: labelFont, fontWeight: 800, fontSize: size * 0.27, letterSpacing: size * 0.035, color: accent, textTransform: "uppercase", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{label}</div>
      <div style={{ fontFamily: displayFont, fontSize: size, lineHeight: 1.05, color, textTransform: "uppercase", textShadow: "0 4px 18px rgba(0,0,0,0.55)" }}>{value}</div>
    </div>
  );
}
