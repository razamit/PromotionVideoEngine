import React, { useLayoutEffect } from "react";
import { continueRender, delayRender, getRemotionEnvironment, Internals, useCurrentFrame, useVideoConfig } from "remotion";

// Render-time check for text drawn in a shape (speech bursts, taped-on
// signs): it logs where the shape is and warns when its words are cut by the
// frame edge, when the shape is, or when the words sit on the caption line.
// Camera moves are included, because it measures the final on-screen boxes.
//
// Remotion prints browser console lines in the render log: warnings at the
// default log level, the "seen" lines (every 10 frames) only with
// --log=verbose. scripts/bubble_check.sh (npm run bubbles) turns both into
// contact sheets.
//
// It measures after the frame has laid out (two animation frames, held with
// delayRender), because a layout effect runs before the camera's transforms
// are in place and reads bogus boxes.

/** The caption line band, as fractions of the frame height. */
export const CAPTION_BAND = { top: 0.655, bottom: 0.755 };

export type TextBoxKind = "speech-burst" | "sign";

export const PROBLEMS = {
  wordsCut: "WORDS CUT by the frame edge",
  shapeCut: "shape cut by the frame edge",
  onCaption: "words on the caption line",
} as const;

type Box = { left: number; right: number; top: number; bottom: number };

/**
 * Words may pass the frame edge by this many px before they count as cut:
 * the box of tilted text is the upright box around it, whose corners are
 * empty, and a line box has space above the capitals.
 */
const WORDS_SLACK_PX = 14;

/** What is wrong with a measured text box, or null. Pure, for tests. */
export function textBoxProblem(words: Box, shape: Box, width: number, height: number): string | null {
  const outside = (r: Box, slack = 0) => r.left < -slack || r.right > width + slack || r.top < -slack || r.bottom > height + slack;
  if (outside(words, WORDS_SLACK_PX)) return PROBLEMS.wordsCut;
  if (outside(shape)) return PROBLEMS.shapeCut;
  if (words.bottom > height * CAPTION_BAND.top && words.top < height * CAPTION_BAND.bottom) return PROBLEMS.onCaption;
  return null;
}

/**
 * Audits one text box while rendering. wordsRef wraps just the words;
 * shapeRef is the drawn shape around them (the same element for a sign).
 * Skips the first `settleFrames` local frames, while the shape pops in.
 */
export function useTextBoxAudit(kind: TextBoxKind, text: string, wordsRef: React.RefObject<Element | null>, shapeRef: React.RefObject<Element | null>, settleFrames = 5) {
  const frame = useCurrentFrame();
  const absolute = Internals.useTimelinePosition();
  const { width, height, fps } = useVideoConfig();
  useLayoutEffect(() => {
    if (!getRemotionEnvironment().isRendering || frame < settleFrames) return; // the Studio preview is scaled
    const label = text.replace(/\n/g, " / ");
    const handle = delayRender(`${kind} audit "${label}"`);
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const words = wordsRef.current?.getBoundingClientRect();
        const shape = shapeRef.current?.getBoundingClientRect();
        if (words && shape) {
          const r = Math.round;
          const where = `frame ${absolute} (${(absolute / fps).toFixed(2)} s); shape x ${r(shape.left)}..${r(shape.right)}, y ${r(shape.top)}..${r(shape.bottom)}; words y ${r(words.top)}..${r(words.bottom)} of ${width}x${height}`;
          if (absolute % 10 === 0) console.log(`[${kind}-seen] "${label}" ${where}`);
          const problem = textBoxProblem(words, shape, width, height);
          if (problem) console.warn(`[${kind}] "${label}" ${problem} ${where}`);
        }
        continueRender(handle);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
  });
}
