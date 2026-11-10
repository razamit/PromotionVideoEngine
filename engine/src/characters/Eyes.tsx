import React from "react";
import { INK } from "../theme/palette";

// The eye pair, drawn on a head centred at (120, 92) with radius 72.
// `look` shifts the pupils (and the whole pair a little, like a head turn);
// `openness` squashes the eyes shut for blinks.

export type Eyes = "dots" | "wide" | "pin" | "happy" | "tired" | "half" | "shades" | "closed";

/** Pupil direction, -1..1 on each axis. Screen space is handled by Bean. */
export type Gaze = { x: number; y: number };

export const EYE_Y = 86;
export const EYE_L = 96;
export const EYE_R = 144;

/** Eyes that are already lines or glasses never blink. */
export const BLINKLESS: Eyes[] = ["happy", "closed", "shades"];

type EyeDraw = (x: number, gaze: Gaze) => React.ReactNode;

const line = (x: number, dy = 2) => (
  <path key={x} d={`M${x - 10} ${EYE_Y + dy} L${x + 10} ${EYE_Y + dy}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
);

const white = (x: number, gaze: Gaze, pupil: number, reach: number) => (
  <g key={x}>
    <circle cx={x} cy={EYE_Y} r={15} fill="#fff" stroke={INK} strokeWidth={5} />
    <circle cx={x + gaze.x * reach} cy={EYE_Y + gaze.y * reach} r={pupil} fill={INK} />
  </g>
);

/** Upper lid across a white eye: bored, smug, side-eye. */
const lidded: EyeDraw = (x, gaze) => (
  <g key={x}>
    <path d={`M${x - 15} ${EYE_Y} A15 15 0 0 0 ${x + 15} ${EYE_Y} Z`} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={x + gaze.x * 8} cy={EYE_Y + 6 + Math.max(0, gaze.y) * 2} r={5.5} fill={INK} />
    <path d={`M${x - 17} ${EYE_Y} L${x + 17} ${EYE_Y}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
  </g>
);

const DRAW: Record<Exclude<Eyes, "shades">, EyeDraw> = {
  dots: (x, g) => <ellipse key={x} cx={x + g.x * 5} cy={EYE_Y + g.y * 5} rx={6} ry={8} fill={INK} />,
  wide: (x, g) => white(x, g, 5.5, 7),
  pin: (x, g) => white(x, g, 2.8, 5),
  happy: (x) => <path key={x} d={`M${x - 11} ${EYE_Y + 4} Q${x} ${EYE_Y - 10} ${x + 11} ${EYE_Y + 4}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />,
  tired: (x, g) => (
    <g key={x}>
      {line(x, 0)}
      <circle cx={x + g.x * 4} cy={EYE_Y + 5} r={4} fill={INK} />
    </g>
  ),
  half: lidded,
  closed: (x) => line(x),
};

function Shades() {
  return (
    <g>
      <rect x={EYE_L - 22} y={EYE_Y - 12} width={44} height={24} rx={10} fill={INK} />
      <rect x={EYE_R - 22} y={EYE_Y - 12} width={44} height={24} rx={10} fill={INK} />
      <path d={`M${EYE_L + 22} ${EYE_Y - 4} L${EYE_R - 22} ${EYE_Y - 4}`} stroke={INK} strokeWidth={5} />
    </g>
  );
}

export function EyePair({ eyes, gaze, openness = 1 }: { eyes: Eyes; gaze: Gaze; openness?: number }) {
  if (eyes === "shades") return <Shades />;
  // Nearly shut reads better as a line than as a squashed sliver.
  const draw = openness < 0.2 ? DRAW.closed : DRAW[eyes] ?? DRAW.dots;
  const squash = openness < 0.2 || openness >= 1 ? "" : `translate(0 ${EYE_Y}) scale(1 ${openness}) translate(0 ${-EYE_Y})`;
  return (
    <g transform={squash}>
      {draw(EYE_L, gaze)}
      {draw(EYE_R, gaze)}
    </g>
  );
}
