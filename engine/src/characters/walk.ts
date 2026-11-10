// The walk cycle. Legs scissor, arms swing against them, the body drops
// when the legs spread so the feet stay on the floor line, and the cadence
// follows the travel speed so the feet do not skate. Angles in degrees,
// distances in Bean viewBox units (the figure is 480 units tall).

export const LEG_LEN = 124;
export const ARM_LEN = 100;

const BASE_SWING = 24;
const MIN_PERIOD = 10;
const MAX_PERIOD = 36;
/** Cadence for the old `walking` flag, which never said how fast. */
const DEFAULT_PERIOD = 20;

export type WalkState = {
  /** Added to both legs (they scissor) and taken from both arms. */
  legSwing: number;
  armSwing: number;
  /** Downward body offset that keeps the lower foot on the floor. */
  drop: number;
  /** Forward lean in degrees, toward the facing direction. */
  lean: number;
  /** True while walking, so the feet point forward instead of out. */
  active: boolean;
};

export const NO_WALK: WalkState = { legSwing: 0, armSwing: 0, drop: 0, lean: 0, active: false };

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Frames per full cycle (two steps) and swing amplitude for a ground speed.
 * One cycle covers 4 * LEG_LEN * sin(swing) units; when the cadence clamps,
 * the swing grows or shrinks instead so the stride still matches.
 */
function strideFor(unitsPerFrame: number | null) {
  if (!unitsPerFrame || unitsPerFrame <= 0) return { period: DEFAULT_PERIOD, swing: BASE_SWING };
  const ideal = (4 * LEG_LEN * Math.sin(rad(BASE_SWING))) / unitsPerFrame;
  const period = Math.min(MAX_PERIOD, Math.max(MIN_PERIOD, ideal));
  const sine = Math.min(0.7, (unitsPerFrame * period) / (4 * LEG_LEN));
  return { period, swing: (Math.asin(sine) * 180) / Math.PI };
}

/**
 * @param unitsPerFrame ground speed in viewBox units, or null for the
 *   default cadence.
 * @param legRest the legs' rest angle from the pose, so the drop is
 *   measured against how the bean was standing.
 */
export function walkAt(frame: number, unitsPerFrame: number | null, legRest: number): WalkState {
  const { period, swing } = strideFor(unitsPerFrame);
  const phase = (frame / period) * Math.PI * 2;
  const legSwing = Math.sin(phase) * swing;
  const standing = LEG_LEN * Math.cos(rad(legRest));
  const drop = standing - LEG_LEN * Math.cos(rad(legRest + legSwing));
  // A little extra lift on the passing position reads as a springy step.
  const lift = Math.abs(Math.cos(phase)) * 3;
  return { legSwing, armSwing: legSwing * 0.8, drop: drop - lift, lean: 4, active: true };
}

/** Converts screen px per frame to viewBox units for a bean `height` px tall. */
export function pxToUnits(px: number, height: number): number {
  return (px * 480) / height;
}
