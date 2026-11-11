import React, { useRef } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useTextBoxAudit } from "../../scenes/textBoxAudit";
import { displayFont } from "./fonts";

// A rubber stamp that slams onto the picture: the punchline of a beat, in
// one or two words (SKIPPED, NONREFUNDABLE, DONE). It lands big and settles
// with a small knock. Audited like a sign, so `npm run bubbles` flags a
// stamp whose words are cut by the frame edge after the camera move.

export type StampProps = {
  text: string;
  /** Centre, fractions of the frame (or of the parent it is placed in). */
  x: number;
  y: number;
  /** Frame of the shot at which it lands. Put a thud on the same frame. */
  at?: number;
  rotate?: number;
  size?: number;
  color?: string;
};

export function Stamp({ text, x, y, at = 0, rotate = -9, size = 104, color = "#E5352B" }: StampProps) {
  const frame = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  const boxRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);
  useTextBoxAudit("sign", text, wordsRef, boxRef, at + 6);
  if (frame < 0) return null;
  const land = spring({ frame, fps, config: { damping: 15, stiffness: 320, mass: 0.5 } });
  const knock = frame < 9 ? Math.sin(frame * 2.6) * (9 - frame) * 0.25 : 0;
  return (
    <div ref={boxRef} style={{
      position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`,
      transform: `translate(-50%, -50%) rotate(${rotate + knock}deg) scale(${2.3 - 1.3 * land})`, opacity: Math.min(1, (frame + 1) / 3),
      border: `${Math.round(size * 0.085)}px solid ${color}`, borderRadius: size * 0.14, padding: `${size * 0.06}px ${size * 0.26}px`,
      fontFamily: displayFont, fontSize: size, lineHeight: 1.08, letterSpacing: size * 0.03, color, whiteSpace: "pre", textTransform: "uppercase",
      background: "rgba(255,255,255,0.08)", boxShadow: "0 6px 24px rgba(0,0,0,0.25)", zIndex: 30,
    }}>
      <span ref={wordsRef} style={{ display: "inline-block" }}>{text}</span>
    </div>
  );
}
