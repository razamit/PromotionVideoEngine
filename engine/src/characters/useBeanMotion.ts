import { useCurrentFrame, useVideoConfig } from "remotion";
import { combineMoves, BodyMove, Enter, entranceAt, NO_MOVE, takeAt } from "./entrance";
import { FaceSpec, Gaze, gazeFor, Look } from "./Face";
import { BLINKLESS } from "./Eyes";
import { faceFor, Mood } from "./moods";
import { blinkAt, Idle, idleAt, talkMouthAt } from "./motion";
import { FullPose, Pose, PoseKey, poseAtFrame, poseKeysFrom } from "./pose";
import { NO_WALK, pxToUnits, walkAt, WalkState } from "./walk";

// Everything about a Bean that changes with the frame, worked out in one
// place so Bean.tsx only draws. Frame 0 is the first frame of the shot.

export type MotionInput = {
  height: number;
  seed: number;
  flipped: boolean;
  still?: boolean;
  enter?: Enter;
  enterAt?: number;
  take?: number;
  mood?: Mood;
  moodFrom?: Mood;
  face?: FaceSpec;
  look?: Look;
  pose?: Pose;
  poseFrom?: Pose;
  poseAt?: number;
  poseKeys?: PoseKey[];
  walk?: number;
  walking?: boolean;
  travel?: boolean;
  talk?: boolean;
};

export type BeanMotion = {
  body: BodyMove;
  idle: Idle;
  walk: WalkState;
  pose: FullPose;
  face: FaceSpec;
  gaze: Gaze;
  openness: number;
  talkMouth: "open" | "o" | null;
};

function walkState(input: MotionInput, frame: number, enterWalking: boolean): WalkState {
  const speed = input.walk && input.walk > 0 ? input.walk : 0;
  if (!speed && !input.walking && !enterWalking) return NO_WALK;
  return walkAt(frame, speed ? pxToUnits(speed, input.height) : null, 0);
}

function bodyMove(input: MotionInput, frame: number, fps: number): BodyMove {
  const entrance = entranceAt(input.enter, frame - (input.enterAt ?? 0), fps, input.height);
  const take = takeAt(input.take === undefined ? null : frame - input.take);
  const travelled = input.travel && input.walk ? pxToUnits(input.walk * frame, input.height) : 0;
  const travel = { ...NO_MOVE, dx: input.flipped ? -travelled : travelled };
  return combineMoves(combineMoves(entrance, take), travel);
}

export function useBeanMotion(input: MotionInput): BeanMotion {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const body = bodyMove(input, frame, fps);
  const beforeTake = input.take !== undefined && frame < input.take && input.moodFrom;
  const face = faceFor(beforeTake ? input.moodFrom : input.mood, input.face);
  const eyes = face.eyes ?? "dots";
  return {
    body,
    idle: idleAt(frame, input.seed, Boolean(input.still)),
    walk: walkState(input, frame, body.walking),
    pose: poseAtFrame(poseKeysFrom(input.pose, input.poseFrom, input.poseAt, input.poseKeys), frame, fps),
    face,
    gaze: gazeFor(input.look ?? face.look, input.flipped),
    openness: BLINKLESS.includes(eyes) ? 1 : blinkAt(frame, input.seed, Boolean(input.still)),
    talkMouth: input.talk ? talkMouthAt(frame, input.seed) : null,
  };
}
