import React from "react";
import { INK, OUTLINE } from "../theme/palette";

// One stick limb: a curved ink stroke from the shoulder or hip, ending in a
// round hand or an oval foot.

export function limbEnd(x: number, y: number, len: number, deg: number, side: -1 | 1) {
  const rad = (deg * Math.PI) / 180;
  return { x: x + side * Math.sin(rad) * len, y: y + Math.cos(rad) * len };
}

export type LimbProps = {
  x: number;
  y: number;
  len: number;
  /** Degrees from hanging down; positive swings outward on this side. */
  deg: number;
  side: -1 | 1;
  bend: number;
  end: "hand" | "foot";
  /** Which way the toes point, -1 left or 1 right. Defaults to outward. */
  toe?: -1 | 1;
};

export function Limb({ x, y, len, deg, side, bend, end, toe = side }: LimbProps) {
  const tip = limbEnd(x, y, len, deg, side);
  const mid = { x: (x + tip.x) / 2 + side * bend * 22, y: (y + tip.y) / 2 };
  return (
    <g>
      <path d={`M${x} ${y} Q${mid.x} ${mid.y} ${tip.x} ${tip.y}`} stroke={INK} strokeWidth={OUTLINE + 1} fill="none" strokeLinecap="round" />
      {end === "hand" ? (
        <circle cx={tip.x} cy={tip.y} r={10} fill={INK} />
      ) : (
        <ellipse cx={tip.x + toe * 8} cy={tip.y + 2} rx={18} ry={9} fill={INK} />
      )}
    </g>
  );
}
