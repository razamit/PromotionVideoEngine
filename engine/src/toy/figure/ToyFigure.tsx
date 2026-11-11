import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { blinkAt, seedFrom } from "../../characters/motion";
import type { Vec3 } from "../shapes";
import { BODY, ToyArm, ToyLeg, ToyTorso } from "./ToyBody";
import { ToyHead } from "./ToyHead";
import { defaultCast, toyFaces, type ToyCast, type ToyFace, type ToyFaceMood } from "./toyCast";
import { poseFromKeys, toyIdleAt, walkAt, walkPose, type ToyWalk } from "./toyMotion";
import { addPose, fullPose, HIP_HEIGHT, type ToyPose, type ToyPoseKey } from "./toyPose";

// The house character of the toy style: a chunky 3D figure that lives inside
// a ToyStage, so it is lit and shadowed with the set. Alive by default: it
// breathes, blinks and looks around a little on a rhythm set by its seed.

const RAD = Math.PI / 180;

export type ToyFigureProps = {
  cast?: ToyCast;
  /** Feet position on the floor. Ignored while `walk` is set. */
  position?: Vec3;
  /** Degrees about the vertical: 0 faces +z (the default camera), 90 faces +x. Ignored while `walk` is set. */
  facing?: number;
  scale?: number;
  pose?: ToyPose;
  /** Timed poses (frames from the shot's start); each change springs in. Wins over `pose`. */
  poseKeys?: ToyPoseKey[];
  /** Walk from one floor point to another over the shot; the legs keep step with the ground covered. */
  walk?: ToyWalk;
  mood?: ToyFaceMood;
  /** Starts on this mood and switches to `mood` at frame `moodAt`. */
  moodFrom?: ToyFaceMood;
  moodAt?: number;
  /** Override single face fields: { mouth: "smile" }. */
  face?: Partial<ToyFace>;
  /** Something in the right hand, drawn at the hand joint. */
  held?: React.ReactNode;
  /** No breathing or blinking: a statue, a photo. */
  still?: boolean;
  seed?: number;
};

function useFigureState(props: ToyFigureProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const cast = props.cast ?? defaultCast;
  const seed = props.seed ?? seedFrom(`${cast.hair}${cast.hairColor}${cast.topColor}${cast.skin}`);
  const walking = props.walk ? walkAt(props.walk, frame, durationInFrames) : null;
  const idle = toyIdleAt(frame, seed, props.still ?? false);
  let pose = props.poseKeys ? poseFromKeys(props.poseKeys, frame, fps) : fullPose(props.pose);
  if (walking?.moving) pose = addPose(pose, walkPose(walking.phase, props.walk?.energy));
  pose = addPose(pose, { headNod: idle.headNod, headTurn: idle.headTurn, headTilt: idle.sway });
  const moodNow = props.moodFrom && frame < (props.moodAt ?? 0) ? props.moodFrom : props.mood ?? "neutral";
  return {
    cast, pose, breath: idle.breath,
    face: { ...toyFaces[moodNow], ...(props.face ?? {}) },
    blink: blinkAt(frame, seed, props.still ?? false),
    position: walking?.position ?? props.position ?? ([0, 0, 0] as Vec3),
    facing: walking?.facing ?? props.facing ?? 0,
  };
}

export function ToyFigure(props: ToyFigureProps) {
  const { cast, pose, breath, face, blink, position, facing } = useFigureState(props);
  const scale = props.scale ?? 1;
  return (
    <group position={position} rotation={[0, facing * RAD, 0]} scale={[scale, scale, scale]}>
      <group position={[0, HIP_HEIGHT + pose.lift, 0]}>
        <group rotation={[pose.lean * RAD, pose.twist * RAD, 0]} scale={[1 - breath * 0.006, 1 + breath * 0.012, 1 + breath * 0.012]}>
          <ToyTorso cast={cast} />
          <group position={[0, BODY.neckY, 0]} rotation={[pose.headNod * RAD, pose.headTurn * RAD, pose.headTilt * RAD]}>
            <ToyHead cast={cast} face={face} blink={blink} />
          </group>
          <ToyArm side={1} swing={pose.armL} out={pose.armOutL} elbow={pose.elbowL} cast={cast} />
          <ToyArm side={-1} swing={pose.armR} out={pose.armOutR} elbow={pose.elbowR} cast={cast} held={props.held} />
        </group>
        <ToyLeg side={1} swing={pose.legL} knee={pose.kneeL} cast={cast} />
        <ToyLeg side={-1} swing={pose.legR} knee={pose.kneeR} cast={cast} />
      </group>
    </group>
  );
}

/** Carries children along a figure's walk (a suitcase rolled behind, a dog), `behind` units back along the path. */
export function ToyFollower({ walk, behind = 0.4, children }: { walk: ToyWalk; behind?: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const at = walkAt(walk, frame, durationInFrames);
  const turn = at.facing * RAD;
  return (
    <group position={[at.position[0] - Math.sin(turn) * behind, at.position[1], at.position[2] - Math.cos(turn) * behind]} rotation={[0, turn, 0]}>
      {children}
    </group>
  );
}
