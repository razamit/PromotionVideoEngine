import React from "react";
import { slideFontFamily } from "../slideFont";
import { SLIDE_LINE_HEIGHT } from "../slideGeometry";

// Plain text with a dark outline, the look of text typed in TikTok's editor:
// readable over any screenshot or photo without a card behind it.

const OUTLINE_DIRECTIONS = 24;
/** Outline thickness as a share of the font size. */
const OUTLINE_RATIO = 0.06;

function outlineShadows(fontSize: number, color: string): string {
  const radius = Math.max(3, fontSize * OUTLINE_RATIO);
  const ring = Array.from({ length: OUTLINE_DIRECTIONS }, (_, step) => {
    const angle = (step / OUTLINE_DIRECTIONS) * Math.PI * 2;
    return `${(Math.cos(angle) * radius).toFixed(2)}px ${(Math.sin(angle) * radius).toFixed(2)}px 0 ${color}`;
  });
  return ring.join(", ");
}

export type OutlinedTextProps = {
  text: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  weight: number;
  align?: "left" | "center";
};

export const OutlinedText: React.FC<OutlinedTextProps> = ({ text, fontSize, color, outlineColor, weight, align = "center" }) => (
  <div style={{
    fontFamily: slideFontFamily, fontSize, fontWeight: weight, lineHeight: SLIDE_LINE_HEIGHT, color, textAlign: align,
    textShadow: outlineShadows(fontSize, outlineColor), whiteSpace: "pre-line", textWrap: "balance", width: "100%",
  }}>
    {text}
  </div>
);
