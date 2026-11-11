import { hash01, snap } from "../../characters/motion";
import { fullPose, mixPose, type ToyPose, type ToyPoseKey } from "./toyPose";
import type { Vec3 } from "../shapes";

// Frame-based life for a toy figure: breathing, a walk cycle tied to the
// distance covered (so the feet do not skate) and springy pose changes. As
// in characters/motion.ts, everything is a pure function of the frame and a
// seed, so a render repeats exactly.

export type ToyIdle = { breath: number; headNod: number; headTurn: number; sway: number };

export function toyIdleAt(frame: number, seed: number, still: boolean): ToyIdle {
  if (still) return { breath: 0, headNod: 0, headTurn: 0, sway: 0 };
  const period = 70 + Math.floor(hash01(seed, 1) * 26);
  const phase = (frame / period) * Math.PI * 2 + hash01(seed, 2) * Math.PI * 2;
  return {
    breath: Math.sin(phase),
    headNod: Math.sin(phase - 0.8) * 1.6,
    headTurn: Math.sin(phase * 0.43 + hash01(seed, 3) * 6) * 3,
    sway: Math.sin(phase * 0.5) * 0.8,
  };
}

/** World units covered by one full walk cycle (two steps) at the default leg swing. */
export const STRIDE = 0.86;

/** The joint offsets of a walk at `phase` (radians; 2 pi is two steps). `energy` 1 is a walk, 1.6 a run. */
export function walkPose(phase: number, energy = 1): ToyPose {
  const swing = Math.sin(phase);
  const leg = 30 * energy;
  const kneeOf = (s: number) => 10 + 46 * energy * Math.max(0, Math.sin(s - 0.9));
  return {
    legL: leg * swing, legR: -leg * swing,
    kneeL: kneeOf(phase + Math.PI), kneeR: kneeOf(phase),
    armL: -26 * energy * swing, armR: 26 * energy * swing,
    elbowL: 26 + 34 * (energy - 1), elbowR: 26 + 34 * (energy - 1),
    lean: 5 + 7 * (energy - 1), twist: 5 * swing,
    lift: 0.016 * energy * Math.abs(Math.cos(phase)) - 0.012,
  };
}

export type ToyWalk = {
  from: Vec3;
  to: Vec3;
  /** 1 walk (default), 1.6 run. A run also covers the ground with longer steps. */
  energy?: number;
  /** Frames to wait before setting off, and frames before the end to arrive. */
  startAt?: number;
  arriveBefore?: number;
};

export type WalkState = { position: Vec3; facing: number; phase: number; moving: boolean };

/** Where a walking figure is at `frame` of a shot `duration` frames long, which way it faces and where in the cycle it is. */
export function walkAt(walk: ToyWalk, frame: number, duration: number): WalkState {
  const start = walk.startAt ?? 0;
  const end = Math.max(start + 1, duration - (walk.arriveBefore ?? 0));
  const t = Math.min(1, Math.max(0, (frame - start) / (end - start)));
  const [dx, dy, dz] = [walk.to[0] - walk.from[0], walk.to[1] - walk.from[1], walk.to[2] - walk.from[2]];
  const distance = Math.hypot(dx, dz);
  const stride = STRIDE * (0.8 + 0.2 * (walk.energy ?? 1));
  return {
    position: [walk.from[0] + dx * t, walk.from[1] + dy * t, walk.from[2] + dz * t],
    facing: (Math.atan2(dx, dz) * 180) / Math.PI,
    phase: ((distance * t) / stride) * Math.PI * 2,
    moving: t > 0 && t < 1,
  };
}

/** The pose at `frame` from timed keys: each change springs in with a little overshoot. */
export function poseFromKeys(keys: ToyPoseKey[], frame: number, fps: number) {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let pose = fullPose(sorted[0]?.pose);
  for (let i = 1; i < sorted.length; i++) {
    if (frame < sorted[i].at) break;
    pose = mixPose(pose, fullPose(sorted[i].pose), snap(frame - sorted[i].at, fps, 13, 150));
  }
  return pose;
}
