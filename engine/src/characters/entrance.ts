import { snap } from "./motion";

// Entrances and takes: whole-body moves timed from the start of the shot.
// All offsets are in Bean viewBox units; scales and rotations pivot on the
// feet so the bean stays planted where the Actor put it.

export type Enter = "pop" | "slideLeft" | "slideRight" | "drop";

export type BodyMove = {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  /** Degrees, clockwise, about the feet. */
  rotate: number;
  /** True while sliding in, so the legs walk instead of gliding. */
  walking: boolean;
};

export const NO_MOVE: BodyMove = { dx: 0, dy: 0, scaleX: 1, scaleY: 1, rotate: 0, walking: false };

/** Far enough to start off a 1080 px frame from anywhere, in screen px. */
const OFFSCREEN_PX = 1400;
const DROP_FRAMES = 9;

function pop(t: number, fps: number): BodyMove {
  const s = snap(t, fps, 11, 170);
  // Stretch on the way up, then settle: reads as a squashy pop, not a zoom.
  const stretch = (1 - Math.min(1, s)) * 0.25;
  return { ...NO_MOVE, scaleX: s * (1 - stretch), scaleY: s * (1 + stretch), rotate: (1 - s) * -10 };
}

/** "slideLeft" walks in from the left edge, "slideRight" from the right. */
function slide(t: number, fps: number, fromLeft: boolean, unitsPerPx: number): BodyMove {
  const p = snap(t, fps, 15, 90);
  const sign = fromLeft ? -1 : 1;
  const remaining = 1 - p;
  return {
    ...NO_MOVE,
    dx: sign * remaining * OFFSCREEN_PX * unitsPerPx,
    // Leans into the move, then rocks back past upright as it stops.
    rotate: -sign * Math.max(-0.4, remaining) * 9,
    walking: remaining > 0.04,
  };
}

function drop(t: number, unitsPerPx: number): BodyMove {
  if (t < DROP_FRAMES) {
    const fall = t / DROP_FRAMES;
    return { ...NO_MOVE, dy: -(1 - fall * fall) * OFFSCREEN_PX * 1.4 * unitsPerPx, scaleX: 0.9, scaleY: 1.12 };
  }
  const since = t - DROP_FRAMES;
  const squash = 0.24 * Math.exp(-since / 3.2) * Math.cos(since * 0.85);
  return { ...NO_MOVE, scaleX: 1 + squash * 0.7, scaleY: 1 - squash };
}

/**
 * The body move for an entrance at frame `t` of its start (negative is
 * before it). Before the entrance the bean waits off screen or at scale 0.
 */
export function entranceAt(enter: Enter | undefined, t: number, fps: number, height: number): BodyMove {
  if (!enter) return NO_MOVE;
  const unitsPerPx = 480 / height;
  const time = Math.max(0, t);
  switch (enter) {
    case "pop":
      return pop(time, fps);
    case "slideLeft":
      return slide(time, fps, true, unitsPerPx);
    case "slideRight":
      return slide(time, fps, false, unitsPerPx);
    case "drop":
      return drop(time, unitsPerPx);
  }
}

/** A "take": a quick stretch up, a squash back down and a settle, 14 frames from `t` = 0. */
export function takeAt(t: number | null): BodyMove {
  if (t === null || t < 0 || t > 16) return NO_MOVE;
  const wobble = 0.16 * Math.exp(-t / 4) * Math.cos(t * 0.75);
  const hop = t < 6 ? -Math.sin((t / 6) * Math.PI) * 26 : 0;
  return { ...NO_MOVE, dy: hop, scaleX: 1 - wobble * 0.55, scaleY: 1 + wobble };
}

/** Composes two body moves (offsets add, scales multiply). */
export function combineMoves(a: BodyMove, b: BodyMove): BodyMove {
  return {
    dx: a.dx + b.dx,
    dy: a.dy + b.dy,
    scaleX: a.scaleX * b.scaleX,
    scaleY: a.scaleY * b.scaleY,
    rotate: a.rotate + b.rotate,
    walking: a.walking || b.walking,
  };
}
