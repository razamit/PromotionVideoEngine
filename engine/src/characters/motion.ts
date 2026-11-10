import { spring } from "remotion";

// Frame-based motion for the house character: idle life (breathing, blinks,
// head bob), talking mouth flaps and pose tweens with anticipation and
// overshoot. Everything is a pure function of the frame and a seed, so a
// render is identical every time and two beans in one shot never move in
// lockstep. No Math.random anywhere.

/** Stable 0..1 value for (seed, n). A cheap integer hash, not crypto. */
export function hash01(seed: number, n = 0): number {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(n | 0, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** A seed from any string, so each cast member gets its own rhythm by default. */
export function seedFrom(text: string): number {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type Idle = {
  /** Body scale about the feet: about 1.5% up and down on each breath. */
  breathX: number;
  breathY: number;
  /** Head offset in viewBox units and head tilt in degrees. */
  headY: number;
  headTilt: number;
};

const NO_IDLE: Idle = { breathX: 1, breathY: 1, headY: 0, headTilt: 0 };

export function idleAt(frame: number, seed: number, still: boolean): Idle {
  if (still) return NO_IDLE;
  const period = 62 + Math.floor(hash01(seed, 1) * 24);
  const phase = (frame / period) * Math.PI * 2 + hash01(seed, 2) * Math.PI * 2;
  const breath = Math.sin(phase);
  return {
    breathX: 1 - breath * 0.008,
    breathY: 1 + breath * 0.015,
    headY: Math.sin(phase - 0.7) * 2.2,
    headTilt: Math.sin(phase * 0.5 + hash01(seed, 3) * 6) * 1.4,
  };
}

/**
 * Eye openness, 1 open to 0 shut. Blinks every 2.2 to 4 s on a schedule set
 * by the seed, 4 frames each (half, shut, shut, half), and about one blink in
 * four is a double blink.
 */
export function blinkAt(frame: number, seed: number, still: boolean): number {
  if (still || frame < 0) return 1;
  const period = 66 + Math.floor(hash01(seed, 4) * 54);
  const local = (frame + Math.floor(hash01(seed, 5) * period)) % period;
  const cycle = Math.floor((frame + Math.floor(hash01(seed, 5) * period)) / period);
  const double = hash01(seed, 100 + cycle) < 0.25;
  const shape = (t: number) => (t === 0 || t === 3 ? 0.35 : t === 1 || t === 2 ? 0 : 1);
  if (local < 4) return shape(local);
  if (double && local >= 6 && local < 10) return shape(local - 6);
  return 1;
}

/** Mouth while talking: a new syllable every 3 frames, "open", "o" or shut. */
export function talkMouthAt(frame: number, seed: number): "open" | "o" | null {
  const roll = hash01(seed, 1000 + Math.floor(frame / 3));
  if (roll < 0.45) return "open";
  if (roll < 0.75) return "o";
  return null;
}

/** Spring with overshoot used for every snappy action. */
export function snap(frame: number, fps: number, damping = 10, stiffness = 190): number {
  if (frame <= 0) return 0;
  return spring({ frame, fps, config: { damping, stiffness, mass: 0.7 } });
}

const ANTICIPATION_FRAMES = 4;
const ANTICIPATION = 0.18;

/**
 * Progress of one action that starts at frame 0: a small move the wrong way
 * over 4 frames (anticipation), then a spring past the target and back
 * (overshoot). 0 before the action, settles at 1.
 */
export function actionCurve(frame: number, fps: number): number {
  if (frame <= 0) return 0;
  if (frame < ANTICIPATION_FRAMES) {
    return -ANTICIPATION * Math.sin(((frame / ANTICIPATION_FRAMES) * Math.PI) / 2);
  }
  return -ANTICIPATION + (1 + ANTICIPATION) * snap(frame - ANTICIPATION_FRAMES, fps);
}

/** Screen px per frame for an Actor that moves from x0 to x1 (frame fractions) in `frames`. */
export function walkSpeed(x0: number, x1: number, frames: number, frameWidth = 1080): number {
  return (Math.abs(x1 - x0) * frameWidth) / Math.max(1, frames);
}
