import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";
import type { CaptionSpec, TimedLine, TimedShot, TimedWord } from "../timeline/types";
import { clampCentreY, safeBox } from "../layout/safeZone";

// The caption look of the toy style: one whole line at a time in a small
// italic serif, mid-frame, like a film subtitle. A line marked "title" (the
// hook) is set big at the top instead, all its words on screen from its
// first frame, and the word being spoken turns the accent colour.
// *Starred* words keep the accent once they have been said.
// Like WordCaptions, this is drawn outside the camera and clamped into the
// platform safe zone.

const { fontFamily } = loadFont("italic", { weights: ["500", "600"], subsets: ["latin"] });

export const SERIF_DEFAULTS = { size: 60, y: 0.56, titleSize: 98, titleY: 0.2, accent: "#FF4B3A" };
const HOLD_AFTER_LINE = 0.5; // seconds a line stays up after its last word when nothing follows
const FADE_FRAMES = 5;
const SHADOW = "0 2px 4px rgba(0,0,0,0.75), 0 4px 22px rgba(0,0,0,0.55)";

type Shown = { line: TimedLine; until: number };

/** The line on screen at time t: each stays up until the next one starts. */
export function lineAt(lines: TimedLine[], t: number): Shown | null {
  for (let i = 0; i < lines.length; i++) {
    const until = lines[i + 1]?.start ?? lines[i].end + HOLD_AFTER_LINE;
    if (t >= lines[i].start && t < until) return { line: lines[i], until };
  }
  return null;
}

function wordColor(word: TimedWord, next: TimedWord | undefined, t: number, accent: string, karaoke: boolean) {
  const said = t >= word.start;
  const speaking = said && t < (next?.start ?? word.end + 0.15);
  if (karaoke && speaking) return accent;
  return word.emphasis && said ? accent : "#FFFFFF";
}

function Words({ words, t, accent, karaoke }: { words: TimedWord[]; t: number; accent: string; karaoke: boolean }) {
  return (
    <>
      {words.map((word, i) => (
        <span key={i} style={{ color: wordColor(word, words[i + 1], t, accent, karaoke) }}>
          {word.text}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export function SerifCaptions({ words, lines, shots, spec }: { words: TimedWord[]; lines: TimedLine[]; shots: TimedShot[]; spec?: CaptionSpec }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const shown = lineAt(lines, t);
  const shot = shots.find((s) => t >= s.start && t < s.end);
  if (!shown || shown.line.caption === "none" || shot?.hideCaptions) return null;

  const isTitle = shown.line.caption === "title";
  const box = safeBox(width, height);
  const fontSize = isTitle ? spec?.titleSize ?? SERIF_DEFAULTS.titleSize : spec?.size ?? SERIF_DEFAULTS.size;
  const wantY = isTitle ? spec?.titleY ?? SERIF_DEFAULTS.titleY : shot?.captionY ?? spec?.y ?? SERIF_DEFAULTS.y;
  const top = clampCentreY(wantY, fontSize * 2.4, height);
  const local = frame - Math.round(shown.line.start * fps);
  const left = Math.round(shown.until * fps) - frame;
  // The very first line is the hook: it is fully there on frame 0.
  const fadeIn = shown.line.index === 0 ? 1 : interpolate(local, [0, FADE_FRAMES], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = isTitle ? interpolate(left, [0, FADE_FRAMES], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", top: `${top * 100}%`, left: box.left, width: box.right - box.left,
          transform: `translateY(calc(-50% + ${(1 - fadeIn) * 10}px))`, opacity: fadeIn * fadeOut,
          fontFamily, fontStyle: "italic", fontWeight: isTitle ? 600 : 500, fontSize, lineHeight: 1.12,
          letterSpacing: isTitle ? -1 : -0.3, textAlign: "center", textWrap: "balance", textShadow: SHADOW,
        }}
      >
        <Words words={words.filter((w) => w.line === shown.line.index)} t={t} accent={spec?.accent ?? SERIF_DEFAULTS.accent} karaoke={isTitle} />
      </div>
    </AbsoluteFill>
  );
}
