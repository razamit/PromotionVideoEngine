import React from "react";
import { INK, OUTLINE, palette } from "../theme/palette";
import type { BodyMove, Enter } from "./entrance";
import { Face, FaceSpec, Look } from "./Face";
import { Hair, HairBack, HairStyle } from "./Hair";
import { Limb, limbEnd } from "./Limb";
import type { Mood } from "./moods";
import { seedFrom } from "./motion";
import type { Pose, PoseKey } from "./pose";
import { BeanMotion, useBeanMotion } from "./useBeanMotion";
import { ARM_LEN, LEG_LEN } from "./walk";

export type { Enter } from "./entrance";
export type { Look } from "./Face";
export type { Mood } from "./moods";
export type { Pose, PoseKey } from "./pose";

// The house character: a big round head, a pill body and stick limbs, all in
// one ink outline. Recognisable from one frame, cheap to pose, and the same
// in every short so the channel has a face (see references/format-recipe.md).
// It is never still: it breathes, blinks and bobs unless `still` is set.

export type BeanProps = {
  skin?: string;
  shirt?: string;
  hair?: HairStyle;
  hairColor?: string;
  tie?: string;
  /** Jacket colour: an open jacket over the shirt, the shirt showing in a V down the middle. */
  jacket?: string;
  /** SVG poking out of the jacket's inside pocket, drawn at the left chest (needs `jacket`). */
  pocketItem?: React.ReactNode;
  /** A named expression; `face` fields override it. */
  mood?: Mood;
  face?: FaceSpec;
  /** Pupil direction in screen space; overrides the mood's. */
  look?: Look;
  /** Shown until the `take` frame, then `mood` snaps in with the take. */
  moodFrom?: Mood;
  /** Frame of a squash-and-stretch "take" (a double take, a shock). */
  take?: number;
  pose?: Pose;
  /** Start pose; the bean moves to `pose` at frame `poseAt`. */
  poseFrom?: Pose;
  poseAt?: number;
  /** Several timed poses, for a wave or a swat and recoil. Wins over pose/poseFrom. */
  poseKeys?: PoseKey[];
  /** Walk at this ground speed, screen px per frame. The cadence matches it so feet do not skate. */
  walk?: number;
  /** Old flag: walk at a default cadence when the speed is unknown. */
  walking?: boolean;
  /** Move itself by `walk` px per frame toward `facing` instead of the scene moving the Actor. */
  travel?: boolean;
  /** Mouth flaps for an on-screen line. */
  talk?: boolean;
  /** Old name for `talk`. */
  talking?: boolean;
  /** Turns off breathing, blinks and the head bob. */
  still?: boolean;
  /** Sets the blink and breath rhythm; defaults to a hash of the look. */
  seed?: number;
  enter?: Enter;
  /** Frame of the shot the entrance starts on, default 0. */
  enterAt?: number;
  /** "right" is the unmirrored drawing. */
  facing?: "left" | "right";
  /** Mirror horizontally (same as facing="left"). */
  flip?: boolean;
  /** Rendered height in px; width follows the 1:2 viewBox. */
  height?: number;
  /** SVG drawn at the right hand, in a 0,0-centred coordinate space. */
  rightHandItem?: React.ReactNode;
  style?: React.CSSProperties;
};

const SHOULDER_Y = 196;
const HIP_Y = 318;
const FEET_Y = 450;
const NECK_Y = 160;

/** Scale and rotate about the feet so the bean stays planted. */
function aboutFeet(rotate: number, scaleX: number, scaleY: number) {
  return `translate(120 ${FEET_Y}) rotate(${rotate}) scale(${scaleX} ${scaleY}) translate(-120 ${-FEET_Y})`;
}

function bodyTransform(body: BodyMove) {
  return `translate(${body.dx} ${body.dy}) ${aboutFeet(body.rotate, body.scaleX, body.scaleY)}`;
}

function Legs({ m }: { m: BeanMotion }) {
  const walking = m.walk.active;
  // While walking, the legs scissor about straight down and the toes point ahead.
  const legL = walking ? m.walk.legSwing : m.pose.legL;
  const legR = walking ? m.walk.legSwing : m.pose.legR;
  const toe = walking ? 1 : undefined;
  const knee = -m.pose.bend * 0.3;
  return (
    <>
      <Limb x={102} y={HIP_Y} len={LEG_LEN} deg={legL} side={-1} bend={knee} end="foot" toe={toe} />
      <Limb x={138} y={HIP_Y} len={LEG_LEN} deg={legR} side={1} bend={knee} end="foot" toe={toe} />
    </>
  );
}

function Arms({ m, item }: { m: BeanMotion; item?: React.ReactNode }) {
  const armL = m.pose.armL - m.walk.armSwing;
  const armR = m.pose.armR - m.walk.armSwing;
  const hand = limbEnd(162, SHOULDER_Y, ARM_LEN, armR, 1);
  return (
    <>
      <Limb x={78} y={SHOULDER_Y} len={ARM_LEN} deg={armL} side={-1} bend={m.pose.bend} end="hand" />
      <Limb x={162} y={SHOULDER_Y} len={ARM_LEN} deg={armR} side={1} bend={m.pose.bend} end="hand" />
      {item ? <g transform={`translate(${hand.x} ${hand.y})`}>{item}</g> : null}
    </>
  );
}

/** An open jacket over the pill body: the shirt shows in a V down the middle. */
function Jacket({ color, shirt, pocketItem }: { color: string; shirt: string; pocketItem?: React.ReactNode }) {
  return (
    <>
      <rect x={70} y={150} width={100} height={190} rx={50} fill={color} stroke={INK} strokeWidth={OUTLINE} />
      {pocketItem ? <g transform="translate(88 206)">{pocketItem}</g> : null}
      <path d="M100 156 L140 156 L128 336 L112 336 Z" fill={shirt} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M100 156 L114 214 L104 222 M140 156 L126 214 L136 222" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M134 270 L158 270" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </>
  );
}

export function Bean(props: BeanProps) {
  const {
    skin = palette.skin[0], shirt = palette.shirts[0], hair = "side", hairColor = palette.hair[0],
    tie, jacket, flip = false, facing, height = 600, walking, talk, talking,
  } = props;
  const flipped = flip || facing === "left";
  const seed = props.seed ?? seedFrom(`${hair}|${hairColor}|${shirt}|${skin}`);
  const m = useBeanMotion({ ...props, height, seed, flipped, walking, talk: Boolean(talk || talking) });
  const head = `translate(0 ${m.idle.headY - m.walk.drop * 0.15}) rotate(${m.idle.headTilt} 120 ${NECK_Y})`;

  return (
    <svg viewBox="0 0 240 480" height={height} width={height / 2} style={{ overflow: "visible", ...props.style }}>
      <g transform={bodyTransform(m.body)}>
        <g transform={flipped ? "translate(240 0) scale(-1 1)" : ""}>
          <g transform={`translate(0 ${m.walk.drop}) ${aboutFeet(m.walk.lean, m.idle.breathX, m.idle.breathY)}`}>
            <g transform={head}><HairBack style={hair} color={hairColor} /></g>
            <Legs m={m} />
            <rect x={70} y={150} width={100} height={190} rx={50} fill={shirt} stroke={INK} strokeWidth={OUTLINE} />
            {jacket ? <Jacket color={jacket} shirt={shirt} pocketItem={props.pocketItem} /> : null}
            {tie ? <path d="M114 166 L126 166 L130 250 L120 264 L110 250 Z" fill={tie} stroke={INK} strokeWidth={4} /> : null}
            <Arms m={m} item={props.rightHandItem} />
            <g transform={head}>
              <circle cx={120} cy={92} r={72} fill={skin} stroke={INK} strokeWidth={OUTLINE} />
              <Hair style={hair} color={hairColor} />
              <Face spec={m.face} talkMouth={m.talkMouth} gaze={m.gaze} openness={m.openness} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
