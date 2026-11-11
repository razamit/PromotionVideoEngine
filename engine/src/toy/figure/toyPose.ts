// The joints of a toy figure, in degrees, and the named poses scenes start
// from. A pose only lists what differs from standing with the arms down.

export type ToyPose = {
  /** Shoulder swing: positive lifts the arm forward (90 points at the camera when facing it, 170 is overhead). */
  armL?: number;
  armR?: number;
  /** Shoulder raise sideways, away from the body. */
  armOutL?: number;
  armOutR?: number;
  /** Elbow bend: the forearm folds forward and up. */
  elbowL?: number;
  elbowR?: number;
  /** Hip swing: positive lifts the leg forward (90 is a seated thigh). */
  legL?: number;
  legR?: number;
  /** Knee bend: the shin folds back. */
  kneeL?: number;
  kneeR?: number;
  /** Head: turn left/right (positive is the figure's left), nod (positive looks down), tilt to the shoulder. */
  headTurn?: number;
  headNod?: number;
  headTilt?: number;
  /** Torso: lean forward (positive) or back, twist about the spine. */
  lean?: number;
  twist?: number;
  /** Raises or lowers the hips in world units (negative for a crouch or a seat). */
  lift?: number;
};

export type ToyPoseKey = { at: number; pose: ToyPose };

const JOINTS: (keyof ToyPose)[] = [
  "armL", "armR", "armOutL", "armOutR", "elbowL", "elbowR", "legL", "legR", "kneeL", "kneeR",
  "headTurn", "headNod", "headTilt", "lean", "twist", "lift",
];

export const REST_POSE: Required<ToyPose> = {
  armL: 0, armR: 0, armOutL: 7, armOutR: 7, elbowL: 8, elbowR: 8, legL: 0, legR: 0, kneeL: 0, kneeR: 0,
  headTurn: 0, headNod: 0, headTilt: 0, lean: 0, twist: 0, lift: 0,
};

export function fullPose(pose: ToyPose | undefined): Required<ToyPose> {
  return { ...REST_POSE, ...(pose ?? {}) };
}

export function mixPose(from: Required<ToyPose>, to: Required<ToyPose>, t: number): Required<ToyPose> {
  const mixed = { ...from };
  for (const joint of JOINTS) mixed[joint] = from[joint] + (to[joint] - from[joint]) * t;
  return mixed;
}

export function addPose(base: Required<ToyPose>, extra: ToyPose): Required<ToyPose> {
  const sum = { ...base };
  for (const joint of JOINTS) sum[joint] = base[joint] + (extra[joint] ?? 0);
  return sum;
}

/** How far the hips drop when seated on a surface `seatHeight` above the floor. */
export const HIP_HEIGHT = 0.5;
const THIGH_RADIUS = 0.075;

/** Named starting points. Spread one and override joints: { ...toyPoses.sit(0.45), armR: 60 }. */
export const toyPoses = {
  stand: {} as ToyPose,
  /** Seated on something `seatHeight` high (a bed is about 0.45, a chair 0.42), hands on the knees. */
  sit: (seatHeight: number): ToyPose => ({
    legL: 86, legR: 86, kneeL: 84, kneeR: 84, armL: 28, armR: 28, elbowL: 34, elbowR: 34,
    lift: seatHeight + THIGH_RADIUS - HIP_HEIGHT,
  }),
  /** Seated and worn out: shoulders forward, head down. */
  slump: (seatHeight: number): ToyPose => ({
    legL: 84, legR: 84, kneeL: 80, kneeR: 80, armL: 20, armR: 20, elbowL: 22, elbowR: 22, lean: 11, headNod: 12,
    lift: seatHeight + THIGH_RADIUS - HIP_HEIGHT,
  }),
  /** Both hands up in front of the chest, as if holding a phone. */
  hold: { armL: 42, armR: 42, elbowL: 96, elbowR: 96, armOutL: -4, armOutR: -4, headNod: 12 } as ToyPose,
  /** One arm reaching forward (the right one): hitting snooze, pressing a button. */
  reach: { armR: 82, elbowR: 6, lean: 10, twist: -10 } as ToyPose,
  /** Both arms up. */
  cheer: { armL: 165, armR: 165, armOutL: 18, armOutR: 18, elbowL: 10, elbowR: 10, headNod: -10, lean: -4 } as ToyPose,
  /** A beaten shrug: arms hang, head tilts. */
  shrug: { armOutL: 22, armOutR: 22, elbowL: 50, elbowR: 50, headTilt: 10 } as ToyPose,
  /** Pulling a suitcase behind with the right hand. */
  pull: { armR: -34, elbowR: 4, armL: 18, elbowL: 30, lean: 8 } as ToyPose,
};
