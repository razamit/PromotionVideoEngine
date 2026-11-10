import React, { useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { INK } from "../theme/palette";
import { useTextBoxAudit } from "./textBoxAudit";

// A comic speech burst ("DING!", "BZZT!", "WE QUIT.") whose star is sized
// from the text it holds, so the words always sit inside it.
//
// The old burst had a fixed box (4.2 x 2.6 times the font size). Anything
// longer than about five capitals wrapped onto a second line and spilled out
// of the star, over the character next to it. Now:
// - the text never wraps on its own (use "\n" for a deliberate second line);
// - the star is drawn around the real text box with percentage insets, so
//   the browser's own font metrics size it, not an estimate;
// - a burst too wide for the frame shrinks its font, and its centre is
//   nudged so the star stays inside the frame;
// - it stacks above actors (zIndex), so a head can never cover its words;
// - while rendering it reports where it is and warns when its words or star
//   are cut by the frame edge (camera moves included) or its words sit on
//   the caption line (textBoxAudit.ts; npm run bubbles makes sheets of it).

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

/** The star's inner points sit at this fraction of its radius. */
const INNER = 0.78;
/** How much of the inner ellipse the text may fill, across and down. */
const FILL_X = 0.94;
const FILL_Y = 0.5;
/** Star size relative to the text box: 1 / (INNER * FILL). */
const STAR_X = 1 / (INNER * FILL_X); // about 1.36
const STAR_Y = 1 / (INNER * FILL_Y); // about 2.56
/** Width over height of a one-line star, so long text gets a round burst, not a flat strip. */
const STAR_ASPECT = 1.75;
/** Short words still get a full star: the text box is at least this many em wide (the old fixed star was 4.2 em). */
const MIN_TEXT_EM = 3.1;
/** Keep the star this far inside the frame edge. */
const EDGE_PX = 24;

/** Rough advance width of Inter Black in em (same table as the captions). */
export function estimateEm(text: string) {
  let em = 0;
  for (const ch of text) {
    if (ch === " ") em += 0.26;
    else if (/[.,!?'":;]/.test(ch)) em += 0.3;
    else if (/[ilIjtf1]/.test(ch)) em += 0.36;
    else if (/[mwMW]/.test(ch)) em += 0.92;
    else if (/[A-Z0-9]/.test(ch)) em += 0.72;
    else em += 0.6;
  }
  return em;
}

/** Font size and centre that keep the whole star inside the frame. Pure, so lint and tests can call it. */
export function fitBurst(text: string, x: number, size: number, frameWidth: number) {
  const lines = text.split("\n");
  const textEm = Math.max(MIN_TEXT_EM, ...lines.map(estimateEm));
  const maxStar = frameWidth - EDGE_PX * 2;
  const fontSize = Math.min(size, maxStar / (textEm * STAR_X));
  const half = (textEm * fontSize * STAR_X) / 2 / frameWidth;
  const left = EDGE_PX / frameWidth + half;
  const cx = Math.min(Math.max(x, left), 1 - left);
  return { fontSize, cx, lines: lines.length };
}

function starPoints() {
  return Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 ? INNER : 1;
    const a = (i / 24) * Math.PI * 2;
    return `${50 + Math.cos(a) * 50 * r},${50 + Math.sin(a) * 50 * r}`;
  }).join(" ");
}

export function SpeechBurst({ text, x, y, size = 90, color = "#FFD60A", rotate = -8 }: { text: string; x: number; y: number; size?: number; color?: string; rotate?: number }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const wordsRef = useRef<HTMLSpanElement>(null);
  const starRef = useRef<SVGSVGElement>(null);
  useTextBoxAudit("speech-burst", text, wordsRef, starRef);
  const pop = Math.min(1, frame / 5);
  const fit = fitBurst(text, x, size, width);
  const insetX = `${(-(STAR_X - 1) / 2) * 100}%`;
  return (
    <div style={{ position: "absolute", left: `${fit.cx * 100}%`, top: `${y * 100}%`, zIndex: 30, transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${0.4 + 0.6 * pop})` }}>
      <div style={{ position: "relative", minWidth: `${MIN_TEXT_EM}em`, fontFamily, fontWeight: 900, fontSize: fit.fontSize, lineHeight: 1, color: INK, whiteSpace: "pre", textAlign: "center" }}>
        <svg ref={starRef} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: insetX, top: "50%", transform: "translateY(-50%)", width: `${STAR_X * 100}%`, aspectRatio: `${STAR_ASPECT}`, minHeight: `${STAR_Y * 100}%`, overflow: "visible" }}>
          <polygon points={starPoints()} fill={color} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        </svg>
        <span ref={wordsRef} style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
}
