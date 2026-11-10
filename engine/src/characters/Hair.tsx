import React from "react";
import { INK, palette } from "../theme/palette";

// Hair drawn over a head centred at (120, 92), radius 72. Styles with a
// back part ("long", "ponytail") also draw HairBack, which Bean puts behind
// the head and body.
//
// "spiky" is the old roommate hair. Its even points read as a crown at
// small sizes and in thumbnails (episode 1), so prefer "messy" for a scruffy
// character; keep "spiky" for a deliberate punk or a literal king joke.

export type HairStyle = "bowl" | "side" | "spiky" | "messy" | "long" | "ponytail" | "bun" | "bald" | "grayBack";

type HairProps = { style: HairStyle; color: string };

const shape = (color: string) => ({ fill: color, stroke: INK, strokeWidth: 7, strokeLinejoin: "round" as const });

const FRONT: Partial<Record<HairStyle, string>> = {
  bowl: "M46 96 Q44 18 120 18 Q196 18 194 96 Q184 60 150 56 L90 56 Q58 60 46 96 Z",
  side: "M50 88 Q46 22 122 20 Q192 22 192 80 Q170 50 128 58 Q120 40 96 52 Q66 60 50 88 Z",
  spiky: "M50 84 L46 40 L72 50 L76 18 L102 40 L120 10 L138 40 L164 18 L168 50 L194 40 L190 84 Q160 52 120 54 Q80 52 50 84 Z",
  // Bed head: two soft tufts flopping the same way plus a swoop of fringe.
  // Lopsided and curved on purpose, so it never reads as a crown.
  messy:
    "M48 94 Q38 34 92 20 Q96 0 122 2 Q108 10 114 18 Q134 -2 160 12 Q144 14 148 24 Q192 36 194 88 " +
    "Q186 64 160 60 Q150 74 128 62 Q114 74 98 58 Q70 60 60 78 Q54 84 48 94 Z",
  // Centre part with the fringe swept to the sides; the length is in HairBack.
  long: "M46 98 Q42 18 120 18 Q198 18 194 98 Q188 60 160 50 Q138 42 120 26 Q102 42 80 50 Q52 60 46 98 Z",
  ponytail: "M48 92 Q46 20 120 18 Q194 20 192 90 Q180 56 146 48 Q116 44 90 54 Q62 64 48 92 Z",
  grayBack: "M52 80 Q54 26 120 24 Q186 26 188 80 Q176 48 150 46 Q136 58 120 46 Q104 58 90 46 Q64 48 52 80 Z",
};

export function Hair({ style, color }: HairProps) {
  const common = shape(color);
  if (style === "bun") {
    return (
      <g>
        <circle cx={120} cy={14} r={22} {...common} />
        <path {...common} d="M48 92 Q44 22 120 22 Q196 22 192 92 Q176 54 120 52 Q64 54 48 92 Z" />
      </g>
    );
  }
  const d = FRONT[style];
  return d ? <path {...common} d={d} /> : null;
}

/** The part of the hair behind the head and shoulders. Draw before the body. */
export function HairBack({ style, color }: HairProps) {
  const common = shape(color);
  switch (style) {
    case "long":
      // Falls past the shoulders on both sides of the body.
      return <path {...common} d="M42 86 Q40 12 120 12 Q200 12 198 86 L206 222 Q208 240 188 240 Q170 240 164 226 L76 226 Q70 240 52 240 Q32 240 34 222 Z" />;
    case "ponytail":
      return (
        <g>
          <path {...common} d="M178 48 Q238 46 240 112 Q242 172 210 204 Q222 146 198 100 Q190 76 178 48 Z" />
          <ellipse cx={190} cy={56} rx={14} ry={10} fill={palette.shirts[4]} stroke={INK} strokeWidth={5} transform="rotate(30 190 56)" />
        </g>
      );
    default:
      return null;
  }
}
