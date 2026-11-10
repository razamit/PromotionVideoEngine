import React from "react";
import { INK, palette } from "../theme/palette";
import { EyePair, Eyes, Gaze } from "./Eyes";
import { BrowPair, Brows, Mouth, MouthShape } from "./Mouth";

export type { Eyes, Gaze } from "./Eyes";
export type { Brows, Mouth } from "./Mouth";

export type Look = "left" | "right" | "camera" | "up" | "down";

export type FaceSpec = {
  eyes?: Eyes;
  mouth?: Mouth;
  brows?: Brows;
  /** Where the pupils point, in screen space. Default "camera". */
  look?: Look;
  sweat?: boolean;
  blush?: boolean;
  /** A tear running down one cheek. */
  tear?: boolean;
  /** The red cross-shaped anger mark on the forehead. */
  anger?: boolean;
};

// Face drawn on a head centred at (120, 92) with radius 72.

const GAZE: Record<Look, Gaze> = {
  camera: { x: 0, y: 0 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

export function gazeFor(look: Look | undefined, flipped: boolean): Gaze {
  const gaze = GAZE[look ?? "camera"];
  return flipped ? { x: -gaze.x, y: gaze.y } : gaze;
}

function Extras({ spec }: { spec: FaceSpec }) {
  return (
    <g>
      {spec.blush ? (
        <g fill={palette.face.blush} opacity={0.7}>
          <ellipse cx={78} cy={112} rx={12} ry={7} />
          <ellipse cx={162} cy={112} rx={12} ry={7} />
        </g>
      ) : null}
      {spec.sweat ? <path d="M176 40 Q186 58 176 66 Q166 58 176 40 Z" fill={palette.face.sweat} stroke={INK} strokeWidth={4} /> : null}
      {spec.tear ? <path d="M146 100 Q156 124 148 134 Q138 126 146 100 Z" fill={palette.face.tear} stroke={INK} strokeWidth={4} /> : null}
      {spec.anger ? (
        <g stroke={palette.face.anger} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M150 36 Q158 44 166 36 M150 56 Q158 48 166 56 M146 40 Q154 46 146 52 M170 40 Q162 46 170 52" />
        </g>
      ) : null}
    </g>
  );
}

export type FaceProps = {
  spec: FaceSpec;
  /** Legacy: true shows the open mouth. Prefer `talkMouth`. */
  talking?: boolean;
  /** Mouth override for this frame while talking (Bean's `talk`). */
  talkMouth?: "open" | "o" | null;
  /** Pupil direction; defaults to spec.look unflipped. */
  gaze?: Gaze;
  /** Eye openness for blinks, 1 open to 0 shut. */
  openness?: number;
};

export function Face({ spec, talking = false, talkMouth, gaze, openness = 1 }: FaceProps) {
  const base = spec.mouth ?? "smile";
  const flap = talkMouth !== undefined ? talkMouth : talking ? "open" : null;
  const mouth = flap && base !== "scream" ? flap : base;
  const eyesGaze = gaze ?? gazeFor(spec.look, false);
  // The whole face slides a few units toward the gaze, like a small head turn.
  return (
    <g transform={`translate(${eyesGaze.x * 5} ${eyesGaze.y * 3})`}>
      <EyePair eyes={spec.eyes ?? "dots"} gaze={eyesGaze} openness={openness} />
      <BrowPair brows={spec.brows ?? "none"} />
      <MouthShape mouth={mouth} />
      <Extras spec={spec} />
    </g>
  );
}
