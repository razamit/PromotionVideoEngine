// Where a real capture lands on screen, worked out from script.json alone,
// so the lint can tell whether a UI element is shown whole before anything
// is rendered. This repeats, in plain JS, the math of:
//   src/phone/captureGeometry.ts        coverSize, focusRect, scrollRect
//   src/phone/CartoonPhone.tsx          the bean phone's body and bezel
//   src/toy/overlay/phoneGeometry.ts    the floating phone's body and bezel
//   src/toy/overlay/CaptureCallout.tsx  the callout's default size and place
//   src/camera/moves.ts                 the peak scale of each camera move
// Change one of those and this file changes with it.

import { spawnSync } from "node:child_process";
import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { publicFile } from "./paths.mjs";

export const FRAME = { width: 1080, height: 1920 };
const ANDROID_CAPTURE = [1080, 2400];
const OUTLINE = 9; // src/theme/palette.ts

/** Body proportions of the two phones. `bezel` is a fraction of the height; x and y are the default centre. */
export const PHONES = {
  floating: { height: 1000, bezel: 0.014, outline: 0, x: 0.465, y: 0.36 },
  cartoon: { height: 1300, bezel: 0.018, outline: OUTLINE },
};
export const CALLOUT = { width: 800, x: 0.465, y: 0.3 };

const sizes = new Map();

function pngSize(file) {
  const header = Buffer.alloc(24);
  const handle = openSync(file, "r");
  readSync(handle, header, 0, 24, 0);
  closeSync(handle);
  const isPng = header.readUInt32BE(0) === 0x89504e47;
  return isPng ? [header.readUInt32BE(16), header.readUInt32BE(20)] : null;
}

function probedSize(file) {
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", file], { encoding: "utf8" });
  const [width, height] = (probe.stdout ?? "").trim().split("x").map(Number);
  return width > 0 && height > 0 ? [width, height] : null;
}

/** Pixel size of a capture under public/: the script's own `captureSize`, else read from the file, else 1080x2400. */
export function captureSizeOf(src, override) {
  if (Array.isArray(override) && override.length === 2) return override;
  if (!sizes.has(src)) {
    const file = publicFile(src);
    const size = existsSync(file) ? pngSize(file) ?? probedSize(file) : null;
    sizes.set(src, size ?? ANDROID_CAPTURE);
  }
  return sizes.get(src);
}

/** The glass of a phone `height` px tall, in px. */
export function phoneScreen(kind, height) {
  const body = PHONES[kind];
  const width = Math.round((height * 9) / 19.5);
  const edge = Math.round(height * body.bezel) + body.outline;
  return { width: width - 2 * edge, height: height - 2 * edge };
}

/** The capture's rectangle inside `box`: cover, then a focus zoom (clamped to the capture's edges) or a scroll. */
function captureRect(box, capture, { focus, scroll = 0 }) {
  const cover = Math.max(box.width / capture[0], box.height / capture[1]);
  const zoom = focus ? Math.max(1, focus.zoom ?? 1) : 1;
  const width = capture[0] * cover * zoom;
  const height = capture[1] * cover * zoom;
  if (!focus) return { width, height, left: (box.width - width) / 2, top: ((box.height - height) * scroll) / 100 };
  const clamp = (value, min) => Math.min(0, Math.max(min, value));
  return {
    width,
    height,
    left: clamp(box.width / 2 - focus.x * width, box.width - width),
    top: clamp(box.height / 2 - focus.y * height, box.height - height),
  };
}

/** The part of the capture `box` shows, in capture fractions, plus the capture's rectangle in box px. */
export function visibleWindow(box, capture, view) {
  const rect = captureRect(box, capture, view);
  return { x: -rect.left / rect.width, y: -rect.top / rect.height, w: box.width / rect.width, h: box.height / rect.height, rect };
}

/** The largest focus zoom at which `element` still fits the box in both directions. */
export function maxWholeZoom(box, capture, element) {
  const atCover = visibleWindow(box, capture, {});
  return Math.min(atCover.w / element.w, atCover.h / element.h);
}

export const isRect = (r) => Boolean(r) && ["x", "y", "w", "h"].every((k) => typeof r[k] === "number") && r.w > 0 && r.h > 0;

/** True when `inner` lies inside `outer` (both {x, y, w, h}), give or take `slack`. */
export function contains(outer, inner, slack = 0) {
  return inner.x >= outer.x - slack && inner.y >= outer.y - slack
    && inner.x + inner.w <= outer.x + outer.w + slack && inner.y + inner.h <= outer.y + outer.h + slack;
}

const PEAK_SCALE = {
  push: (a) => 1 + 0.16 * a,
  pull: (a) => 1 + 0.16 * a,
  crash: (a) => 1 + 0.5 * a,
  crashOut: (a) => 1.06 + 1.1 * a,
  snapZoom: (a) => 1 + 0.75 * a,
  panLeft: () => 1.14,
  panRight: () => 1.14,
  tiltUp: () => 1.14,
  tiltDown: () => 1.14,
};

/**
 * A box in frame px ({left, top, right, bottom}) as far out as the shot's
 * camera move ever takes it. The move is a 2D scale about the camera focus
 * plus, for pans and tilts, a slide of 5% of the frame either way.
 */
export function boxAtPeak(box, camera = {}) {
  const move = camera.move ?? "hold";
  const amount = camera.amount ?? 1;
  const scale = (PEAK_SCALE[move] ?? (() => 1.035))(amount);
  const focusX = (camera.focusX ?? 0.5) * FRAME.width;
  const focusY = (camera.focusY ?? 0.5) * FRAME.height;
  const slideX = /^pan/.test(move) ? 0.05 * amount * FRAME.width : 0;
  const slideY = /^tilt/.test(move) ? 0.05 * amount * FRAME.height : 0;
  return {
    left: focusX + (box.left - focusX) * scale - slideX,
    right: focusX + (box.right - focusX) * scale + slideX,
    top: focusY + (box.top - focusY) * scale - slideY,
    bottom: focusY + (box.bottom - focusY) * scale + slideY,
    scale,
  };
}

/** A box `width` x `height` px centred on (x, y) in frame fractions. */
export function centredBox(x, y, width, height) {
  const left = x * FRAME.width - width / 2;
  const top = y * FRAME.height - height / 2;
  return { left, top, right: left + width, bottom: top + height };
}

/** The sides of the frame a box sticks out of, e.g. ["right"]. */
export function sidesOutside(box, slack = 1) {
  const out = [];
  if (box.left < -slack) out.push("left");
  if (box.right > FRAME.width + slack) out.push("right");
  if (box.top < -slack) out.push("top");
  if (box.bottom > FRAME.height + slack) out.push("bottom");
  return out;
}
