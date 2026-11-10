import React, { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import type { CaptionSpec, TimedShot, TimedWord } from "../timeline/types";
import { palette } from "../theme/palette";
import { clampCentreY, safeBox } from "../layout/safeZone";

// One or two words at a time, synced to the narration. Two looks:
// - "reference" (default), measured from a popular cartoon Shorts channel
//   (format-recipe.md, Measured): white heavy sans about 76 px, a thin black
//   outline plus a hard shadow down-right, a fixed line 70.5% down, a hard
//   cut per word, no pop and no colour.
// - "pop": bigger, a pop and small tilt per group, emphasis words in yellow.
// The centre is clamped into the platform safe zone (src/layout/safeZone.ts),
// so a shot's captionY can never push them under TikTok's / Shorts' / Reels'
// own description and buttons.

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

type Group = { text: string; start: number; end: number; emphasis: boolean };

/** Merge a very short word into the next one, at most two words and 14 characters. */
export function groupWords(words: TimedWord[], minSeconds = 0.2): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let count = 0;
  for (const w of words) {
    const fits = current && count < 2 && current.text.length + w.text.length < 14;
    const tooShort = current && current.end - current.start < minSeconds;
    if (current && fits && tooShort && !/[.!?]$/.test(current.text)) {
      current.text += ` ${w.text}`;
      current.end = w.end;
      current.emphasis ||= w.emphasis;
      count += 1;
    } else {
      current = { text: w.text, start: w.start, end: w.end, emphasis: w.emphasis };
      groups.push(current);
      count = 1;
    }
  }
  return groups;
}

/** Rough advance width of Inter Black in em, so long groups shrink to one line instead of wrapping. */
function estimateEm(text: string) {
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

/** Deterministic small tilt per group, -3..3 degrees, never twice the same side in a row. */
function jitterDegrees(index: number) {
  const steps = [-2.4, 1.8, -1.2, 2.8, -3, 1.2, -1.8, 2.2];
  return steps[index % steps.length];
}

/** Font size for this group: `size`, shrunk to fit one line in the safe width. */
export function fitFontSize(text: string, size: number, maxWidth: number) {
  return Math.round(Math.max(size * 0.68, Math.min(size, maxWidth / estimateEm(text))));
}

function captionStyle(fontSize: number, emphasis: boolean, pop: boolean): React.CSSProperties {
  const base: React.CSSProperties = { fontFamily, fontWeight: 900, fontSize, lineHeight: 1.02, textAlign: "center", paintOrder: "stroke fill" };
  if (!pop) {
    // Reference: about 5 px outline and a 3 px hard shadow at 76 px.
    const shadow = Math.max(2, Math.round(fontSize * 0.04));
    return { ...base, letterSpacing: -0.5, color: "#FFFFFF", WebkitTextStroke: `${Math.round(fontSize * 0.13)}px #000`, textShadow: `${shadow}px ${shadow}px 0 #000` };
  }
  const shadow = Math.round(fontSize * 0.07);
  return {
    ...base,
    letterSpacing: -1.5,
    color: emphasis ? palette.alarmYellow : "#FFFFFF",
    // The stroke is centred on the glyph edge; paint-order keeps the fill on
    // top, so about half of it shows as a fat outline.
    WebkitTextStroke: `${Math.round(fontSize * 0.24)}px #000`,
    textShadow: `0 ${shadow}px 0 #000, 0 ${shadow + 6}px 18px rgba(0,0,0,0.45)`,
  };
}

function popTransform(index: number, local: number, fps: number) {
  const pop = spring({ frame: local, fps, config: { damping: 9, stiffness: 340, mass: 0.5 } });
  const tilt = jitterDegrees(index) * (0.6 + 0.4 * pop);
  return `translateY(${(1 - pop) * 40}px) rotate(${tilt}deg) scale(${0.6 + 0.4 * pop})`;
}

export function WordCaptions({ words, shots, spec }: { words: TimedWord[]; shots: TimedShot[]; spec?: CaptionSpec }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const groups = useMemo(() => groupWords(words), [words]);
  const t = frame / fps;
  const shot = shots.find((s) => t >= s.start && t < s.end);
  const index = groups.findIndex((g, i) => t >= g.start && t < (groups[i + 1]?.start ?? g.end + 0.4));
  const group = groups[index];
  if (!group || shot?.hideCaptions) return null;

  const isPop = spec?.style === "pop";
  const size = spec?.size ?? (isPop ? 136 : 76);
  const box = safeBox(width, height);
  const maxWidth = box.right - box.left;
  const fontSize = fitFontSize(group.text, size * (isPop && group.emphasis ? 1.06 : 1), maxWidth);
  const top = clampCentreY(shot?.captionY ?? spec?.y ?? 0.705, fontSize * 1.3, height);
  const motion = isPop ? ` ${popTransform(index, frame - Math.round(group.start * fps), fps)}` : "";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: `${top * 100}%`,
          left: box.left,
          width: maxWidth,
          transform: `translateY(-50%)${motion}`,
          ...captionStyle(fontSize, group.emphasis, isPop),
        }}
      >
        {group.text}
      </div>
    </AbsoluteFill>
  );
}
