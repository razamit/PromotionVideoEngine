import type React from "react";
import { Easing, interpolate, spring } from "remotion";
import type { CameraSpec, ShotEnter } from "../timeline/types";

// The shot moves as pure functions of the frame: scale about the focus point
// and a translate in percent of the frame. CameraRig applies the result to
// the whole shot; depth layers (layers.tsx) re-scale it per layer.

export type MoveTransform = { scale: number; x: number; y: number };

const ease = Easing.bezier(0.33, 0, 0.2, 1);
const snappy = { damping: 14, stiffness: 260, mass: 0.6 };

/** Two hard punch-ins: one at the cut, one just before the middle of the shot. */
function snapZoom(frame: number, duration: number, fps: number, a: number) {
  const first = spring({ frame, fps, config: { damping: 18, stiffness: 420, mass: 0.4 } });
  const secondAt = Math.round(duration * 0.42);
  const second = spring({ frame: frame - secondAt, fps, config: { damping: 18, stiffness: 420, mass: 0.4 } });
  return 1 + a * (0.3 * first + 0.45 * second);
}

export function moveTransform(camera: CameraSpec, frame: number, duration: number, fps: number): MoveTransform {
  const p = interpolate(frame, [0, Math.max(1, duration - 1)], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const a = camera.amount ?? 1;
  switch (camera.move) {
    case "push":
      return { scale: 1 + 0.16 * a * p, x: 0, y: 0 };
    case "pull":
      return { scale: 1 + 0.16 * a * (1 - p), x: 0, y: 0 };
    case "crash":
      return { scale: 1 + 0.5 * a * spring({ frame, fps, config: snappy }), x: 0, y: 0 };
    case "crashOut": // opens very tight on the focus, springs back to a medium
      return { scale: 1.06 + 1.1 * a * (1 - spring({ frame, fps, config: { damping: 16, stiffness: 140, mass: 0.7 } })), x: 0, y: 0 };
    case "snapZoom":
      return { scale: snapZoom(frame, duration, fps, a), x: 0, y: 0 };
    case "panLeft":
      return { scale: 1.14, x: interpolate(p, [0, 1], [5, -5]) * a, y: 0 };
    case "panRight":
      return { scale: 1.14, x: interpolate(p, [0, 1], [-5, 5]) * a, y: 0 };
    case "tiltUp":
      return { scale: 1.14, x: 0, y: interpolate(p, [0, 1], [-5, 5]) * a };
    case "tiltDown":
      return { scale: 1.14, x: 0, y: interpolate(p, [0, 1], [5, -5]) * a };
    default:
      return { scale: 1 + 0.035 * p, x: 0, y: 0 };
  }
}

export function shakeOffset(frame: number, amount: number) {
  if (!amount) return { x: 0, y: 0 };
  return {
    x: (Math.sin(frame * 2.1) + Math.sin(frame * 5.3) * 0.5) * amount,
    y: (Math.cos(frame * 1.7) + Math.sin(frame * 4.1) * 0.5) * amount,
  };
}

/** Frames the outgoing shot keeps playing under a "dissolve" enter (0.15 s at 30 fps, as measured in the reference). */
export const DISSOLVE_FRAMES = 5;
/** Frames a whip or zoomBlur enter takes. */
export const ENTER_FRAMES = 6;

export function enterStyle(enter: ShotEnter, frame: number): React.CSSProperties {
  const frames = enter === "dissolve" ? DISSOLVE_FRAMES : ENTER_FRAMES;
  if (enter === "cut" || frame >= frames) return {};
  const t = interpolate(frame, [0, frames], [1, 0], { easing: Easing.out(Easing.cubic) });
  if (enter === "dissolve") return { opacity: 1 - t };
  if (enter === "zoomBlur") return { transform: `scale(${1 + 0.6 * t})`, filter: `blur(${18 * t}px)` };
  const dir = enter === "whipLeft" ? 1 : -1;
  return { transform: `translateX(${dir * 70 * t}%)`, filter: `blur(${26 * t}px)` };
}
