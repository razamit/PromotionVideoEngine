import React, { createContext, useContext } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useCameraState } from "@engine/camera/layers";
import { estimateEm } from "@engine/scenes/speechBurst";
import { Sign, SpeechBurst } from "@engine/scenes/kit";
import { OUTLINE } from "@engine/theme/palette";

// Text that has to stay inside its own half of the split, whatever the
// camera does. The shot's move zooms the whole split, so a tag or a burst
// placed in a panel's own box gets pushed past the divider or the frame
// edge by a crash, and a narrow panel can be thinner than its tag. These
// helpers work in on-screen pixels: they find the part of a panel that is
// visible right now (after the camera, inside the divider and the frame)
// and fit the text into it.

/** The panel a child is drawn in, as fractions of the frame width before the camera. */
export const PanelContext = createContext<{ x0: number; x1: number }>({ x0: 0, x1: 1 });

/** Half the divider bar's width (splitFrame.tsx draws it 22 px wide). */
export const DIVIDER_HALF = 11;
/** Keep text this far inside its panel's visible edges. */
const EDGE = 18;

/** Maps between pre-camera (content) pixels and on-screen pixels for the shot's current move. */
export function useScreenMap() {
  const cam = useCameraState();
  const { width, height } = useVideoConfig();
  const fx = cam.focusX * width;
  const fy = cam.focusY * height;
  const tx = (cam.x / 100) * width;
  const ty = (cam.y / 100) * height;
  return {
    scale: cam.scale,
    width,
    height,
    screenX: (c: number) => fx + tx + cam.scale * (c - fx),
    screenY: (c: number) => fy + ty + cam.scale * (c - fy),
    contentX: (s: number) => fx + (s - fx - tx) / cam.scale,
    contentY: (s: number) => fy + (s - fy - ty) / cam.scale,
  };
}
type ScreenMap = ReturnType<typeof useScreenMap>;

/** The on-screen px span of a panel that is visible now: inside the divider bars and the frame. */
export function visibleSpan(map: ScreenMap, x0: number, x1: number) {
  const left = map.screenX(x0 * map.width + (x0 > 0 ? DIVIDER_HALF : 0));
  const right = map.screenX(x1 * map.width - (x1 < 1 ? DIVIDER_HALF : 0));
  return { left: Math.max(0, left), right: Math.min(map.width, right) };
}

/** A full-frame layer that cancels the shot's move, so what is inside it sits still on screen. */
export function ScreenLocked({ children }: { children: React.ReactNode }) {
  const cam = useCameraState();
  const k = 1 / cam.scale;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40, transformOrigin: `${cam.focusX * 100}% ${cam.focusY * 100}%`, transform: `translate(${-cam.x * k}%, ${-cam.y * k}%) scale(${k})` }}>
      {children}
    </AbsoluteFill>
  );
}

const TAG_MAX = 50;
const TAG_MIN = 24;
/** The tags' on-screen centre line, and how far below it a burst must start (half a 50 px tag plus its tilt). */
export const TAG_Y = 0.165;
const TAG_HALF_H = 62;
/** Inter Black runs a little wider than the caption table, and the tag is tilted. */
const TAG_EM_FUDGE = 1.08;
const TAG_ROT = 0.07; // sin of the 4 degree tilt

/** Font size that fits a tilted sign into `avail` px, from its width a*size + b. */
function tagSizeFor(text: string, avail: number) {
  const a = estimateEm(text) * TAG_EM_FUDGE + 1.05 * TAG_ROT;
  const b = 2 * 26 + 2 * OUTLINE + (28 + 2 * OUTLINE) * TAG_ROT;
  return (avail - b) / a;
}

/**
 * The "LEFT YOU" / "RIGHT YOU" tag: still on screen, centred on the visible
 * part of its panel, as big as fits (up to 50 px). It fades out when its
 * panel is too thin to hold it, rather than spilling over the divider.
 */
export function PanelTag({ text, x0, x1, color, rotate, y = TAG_Y }: { text: string; x0: number; x1: number; color: string; rotate: number; y?: number }) {
  const map = useScreenMap();
  const span = visibleSpan(map, x0, x1);
  const fit = tagSizeFor(text, span.right - span.left - 2 * EDGE);
  const size = Math.max(TAG_MIN, Math.min(TAG_MAX, fit));
  const opacity = Math.min(1, Math.max(0, (fit - (TAG_MIN - 4)) / 4));
  if (opacity <= 0) return null;
  const cx = (span.left + span.right) / 2 / map.width;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <Sign text={text} x={cx} y={y} size={size} rotate={rotate} color={color} />
    </div>
  );
}

/** speechBurst.tsx's star geometry, for the fit below. */
const STAR_X = 1 / (0.78 * 0.94);
const STAR_Y = 1 / (0.78 * 0.5);
const STAR_ASPECT = 1.75;
const MIN_TEXT_EM = 3.1;
const BURST_ROT = 1.08; // the default -8 degree tilt widens the upright box
const BURST_MIN = 24;

/**
 * A SpeechBurst drawn in a panel's 820 px box (x, y as fractions of that
 * box, like the rest of SideBeat). It shrinks so the star fits the visible
 * part of its panel and slides sideways to stay inside it, so a zoom or a
 * narrowing panel never pushes it over the divider or off the frame. It
 * also stays below the panel's tag, which does not zoom with the shot.
 */
export function PanelBurst({ text, x = 0.5, y, size, color, rotate = -8, innerW }: {
  text: string; x?: number; y: number; size: number; color?: string; rotate?: number; innerW: number;
}) {
  const { x0, x1 } = useContext(PanelContext);
  const map = useScreenMap();
  const span = visibleSpan(map, x0, x1);
  const boxLeft = x0 * map.width + ((x1 - x0) * map.width) / 2 - innerW / 2;
  const em = Math.max(MIN_TEXT_EM, ...text.split("\n").map(estimateEm)) * 1.05;
  const perPx = em * STAR_X * BURST_ROT * map.scale; // on-screen star width per px of font
  const fontSize = Math.max(BURST_MIN, Math.min(size, (span.right - span.left - 2 * EDGE) / perPx));
  const half = (perPx * fontSize) / 2 + EDGE;
  const want = map.screenX(boxLeft + x * innerW);
  const lo = span.left + half;
  const hi = span.right - half;
  const sx = lo <= hi ? Math.min(Math.max(want, lo), hi) : (span.left + span.right) / 2;
  const halfH = (Math.max(STAR_Y, (em * STAR_X) / STAR_ASPECT) * fontSize * map.scale) / 2 + EDGE;
  const sy = Math.max(map.screenY(y * map.height), TAG_Y * map.height + TAG_HALF_H + halfH);
  return <SpeechBurst text={text} x={(map.contentX(sx) - boxLeft) / innerW} y={map.contentY(sy) / map.height} size={fontSize} color={color} rotate={rotate} />;
}
