import type { MusicSpec, TimedWord } from "../timeline/types";

// Music ducking from the word times: the bed dips by `duckDb` while the
// narrator talks and comes back up in the gaps. Words closer than JOIN_GAP
// merge into one phrase so the bed does not pump between words.

const JOIN_GAP = 0.35; // s: shorter pauses stay ducked
const ATTACK = 0.12; // s: ramp down, finished as the first word starts
const RELEASE = 0.4; // s: ramp back up after the phrase ends
const DEFAULT_DUCK_DB = 0; // the reference bed never ducks (format-recipe.md, Measured); set duckDb to opt in

export type Span = [number, number];

export function speechSpans(words: TimedWord[], joinGap = JOIN_GAP): Span[] {
  const spans: Span[] = [];
  for (const word of words) {
    const last = spans[spans.length - 1];
    if (last && word.start - last[1] <= joinGap) last[1] = Math.max(last[1], word.end);
    else spans.push([word.start, word.end]);
  }
  return spans;
}

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** 0 in silence, 1 while words are spoken, smooth ramps either side. */
export function speechActivity(t: number, spans: Span[]): number {
  let level = 0;
  for (const [start, end] of spans) {
    if (t >= start && t <= end) return 1;
    if (t < start) level = Math.max(level, smooth((t - (start - ATTACK)) / ATTACK));
    else level = Math.max(level, smooth(1 - (t - end) / RELEASE));
  }
  return level;
}

function edgeFade(t: number, total: number, fadeIn: number, fadeOut: number): number {
  const fin = fadeIn > 0 ? Math.min(1, t / fadeIn) : 1;
  const fout = fadeOut > 0 ? Math.min(1, Math.max(0, (total - t) / fadeOut)) : 1;
  return fin * fout;
}

/** Linear music gain for every frame of the short, for a volume callback. */
export function musicGainPerFrame(music: MusicSpec, words: TimedWord[], fps: number, frames: number): number[] {
  const spans = speechSpans(words);
  const duckDb = music.duckDb ?? DEFAULT_DUCK_DB;
  const total = frames / fps;
  const gains: number[] = [];
  for (let frame = 0; frame < frames; frame++) {
    const t = frame / fps;
    const db = duckDb * speechActivity(t, spans);
    const fade = edgeFade(t, total, music.fadeIn ?? 0.3, music.fadeOut ?? 1.0);
    gains.push(Math.min(1, music.volume * 10 ** (db / 20) * fade));
  }
  return gains;
}
