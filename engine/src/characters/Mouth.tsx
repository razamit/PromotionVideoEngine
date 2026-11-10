import React from "react";
import { INK } from "../theme/palette";
import { EYE_L, EYE_R, EYE_Y } from "./Eyes";

// Mouths and brows, drawn on a head centred at (120, 92) with radius 72.

export type Mouth = "smile" | "grin" | "flat" | "open" | "o" | "frown" | "wobble" | "gritted" | "smirk" | "scream";
export type Brows = "none" | "worried" | "angry" | "raised" | "skeptic";

const MOUTH_Y = 122;
const stroke = { stroke: INK, strokeWidth: 6, fill: "none", strokeLinecap: "round" as const };

function Teeth({ width, height }: { width: number; height: number }) {
  const left = 120 - width / 2;
  const top = MOUTH_Y - height / 2;
  const cols = [0.25, 0.5, 0.75].map((f) => left + width * f);
  return (
    <g>
      <rect x={left} y={top} width={width} height={height} rx={9} fill="#fff" stroke={INK} strokeWidth={5} />
      <path d={`M${left} ${MOUTH_Y} L${left + width} ${MOUTH_Y} ${cols.map((x) => `M${x} ${top} L${x} ${top + height}`).join(" ")}`} stroke={INK} strokeWidth={3} />
    </g>
  );
}

export function MouthShape({ mouth }: { mouth: Mouth }) {
  const y = MOUTH_Y;
  switch (mouth) {
    case "grin":
      return <Teeth width={44} height={24} />;
    case "gritted":
      return <Teeth width={40} height={16} />;
    case "open":
      return <ellipse cx={120} cy={y + 2} rx={13} ry={16} fill={INK} />;
    case "o":
      return <ellipse cx={120} cy={y + 2} rx={7} ry={9} fill={INK} />;
    case "scream":
      return <path d={`M100 ${y - 8} Q120 ${y - 16} 140 ${y - 8} L134 ${y + 22} Q120 ${y + 30} 106 ${y + 22} Z`} fill={INK} />;
    case "frown":
      return <path d={`M104 ${y + 8} Q120 ${y - 8} 136 ${y + 8}`} {...stroke} />;
    case "wobble":
      return <path d={`M102 ${y + 8} Q108 ${y - 2} 114 ${y + 4} Q120 ${y + 9} 126 ${y + 4} Q132 ${y - 2} 138 ${y + 8}`} {...stroke} />;
    case "flat":
      return <path d={`M106 ${y} L134 ${y}`} {...stroke} />;
    case "smirk":
      return <path d={`M106 ${y + 2} Q124 ${y + 6} 138 ${y - 6}`} {...stroke} />;
    default:
      return <path d={`M102 ${y - 4} Q120 ${y + 16} 138 ${y - 4}`} {...stroke} />;
  }
}

export function BrowPair({ brows }: { brows: Brows }) {
  if (brows === "none") return null;
  const tilt = brows === "worried" ? -7 : brows === "angry" ? 7 : 0;
  const lift = brows === "raised" ? -8 : 0;
  const y = EYE_Y - 24 + lift;
  // Skeptic: the left brow flat and low, the right one cocked up.
  const right = brows === "skeptic" ? `M${EYE_R - 12} ${y - 6} L${EYE_R + 12} ${y - 12}` : `M${EYE_R - 12} ${y + tilt} L${EYE_R + 12} ${y - tilt}`;
  const left = brows === "skeptic" ? `M${EYE_L - 12} ${y + 4} L${EYE_L + 12} ${y + 4}` : `M${EYE_L - 12} ${y - tilt} L${EYE_L + 12} ${y + tilt}`;
  return (
    <g stroke={INK} strokeWidth={6} strokeLinecap="round">
      <path d={left} />
      <path d={right} />
    </g>
  );
}
