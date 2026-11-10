import { actionCurve } from "./motion";

// Poses and pose tweens. A pose is five numbers; an animated pose is a list
// of keys, each one an action that starts at its frame with anticipation and
// overshoot (motion.ts actionCurve). Keys add up, so a wave is three keys.

export type Pose = {
  /** Degrees from hanging straight down. Positive swings outward. */
  armL?: number;
  armR?: number;
  legL?: number;
  legR?: number;
  /** Elbow and knee curve, -1..1. */
  bend?: number;
};

export type FullPose = Required<Pose>;

/** A pose the bean moves into, starting at frame `at` of the shot. */
export type PoseKey = { at: number; pose: Pose };

export const REST_POSE: FullPose = { armL: 12, armR: 12, legL: 4, legR: 4, bend: 0.3 };

const FIELDS: (keyof FullPose)[] = ["armL", "armR", "legL", "legR", "bend"];

export function fullPose(pose: Pose | undefined, base: FullPose = REST_POSE): FullPose {
  return { ...base, ...(pose ?? {}) };
}

/**
 * The pose at `frame`. Each key moves every field from the previous key's
 * value to its own; the moves are summed, so a key that starts before the
 * last one has settled blends in instead of snapping.
 */
export function poseAtFrame(keys: PoseKey[], frame: number, fps: number): FullPose {
  if (keys.length === 0) return REST_POSE;
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let previous = fullPose(sorted[0].pose);
  const result = { ...previous };
  for (const key of sorted.slice(1)) {
    const target = fullPose(key.pose, previous);
    const progress = actionCurve(frame - key.at, fps);
    for (const field of FIELDS) result[field] += (target[field] - previous[field]) * progress;
    previous = target;
  }
  return result;
}

/** Turns the props API (pose, poseFrom + poseAt, or poseKeys) into keys. */
export function poseKeysFrom(pose?: Pose, poseFrom?: Pose, poseAt = 0, poseKeys?: PoseKey[]): PoseKey[] {
  if (poseKeys && poseKeys.length > 0) return poseKeys;
  if (poseFrom) return [{ at: 0, pose: poseFrom }, { at: poseAt, pose: pose ?? {} }];
  return [{ at: 0, pose: pose ?? {} }];
}
