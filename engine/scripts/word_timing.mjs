// Word start/end times inside each VO line.
//
// Forced alignment (scripts/align_words.py, Qwen3-ForcedAligner by default)
// is told the script's own words, so captions keep the script's spelling,
// punctuation and *emphasis*; only the times come from the audio. When it is
// off or fails, times are spread over the line by word length, which tracks a
// steady TTS read to within about a tenth of a second.
//
// voice.align defaults to true for engine "mlx" and "file". Results are
// cached in .cache/vo/<hash>.align.json, keyed on the audio bytes and words.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileHash, hashKey, runPythonJob } from "./python_job.mjs";

export const DEFAULT_ALIGNER = "mlx-community/Qwen3-ForcedAligner-0.6B-8bit";

export function shouldAlign(voice) {
  return voice.align ?? (voice.engine === "mlx" || voice.engine === "file");
}

/** Length-weighted estimate: longer words and words before punctuation get more time. */
export function estimateWordTimes(words, start, duration) {
  const weightOf = (w) => w.text.replace(/[^\p{L}\p{N}]/gu, "").length + 2 + (/[.,!?;:]$/.test(w.text) ? 3 : 0);
  const total = words.reduce((sum, w) => sum + weightOf(w), 0);
  let cursor = start;
  return words.map((w) => {
    const span = (weightOf(w) / total) * duration;
    const timed = { text: w.text, emphasis: w.emphasis, start: cursor, end: cursor + span };
    cursor += span;
    return timed;
  });
}

/** Aligned times are trusted only if they are in order and cover most of the line. */
function plausible(times, wordCount, duration) {
  if (!Array.isArray(times) || times.length !== wordCount) return false;
  let previous = 0;
  for (const t of times) {
    if (!Number.isFinite(t.start) || !Number.isFinite(t.end) || t.start < previous - 1e-6 || t.end < t.start) return false;
    previous = t.start;
  }
  const last = times[times.length - 1].end;
  return last > duration * 0.6 && times[0].start < duration * 0.5;
}

function runAligner(model, pending, cacheDir) {
  const job = { model, language: "English", lines: pending.map((p) => ({ audio: p.file, words: p.words })) };
  try {
    return runPythonJob("align_words.py", job, cacheDir);
  } catch (error) {
    console.log(`WARNING: forced alignment failed, using length-spread word times.\n${error.message}`);
    return pending.map(() => ({})); // already warned once; every line falls back
  }
}

/**
 * lines: [{ file, words: [{text}], duration }]. Returns, per line, an array of
 * { start, end } relative to the line's audio, or null where alignment is off
 * or unusable (the caller then estimates).
 */
export function alignLines(voice, lines, cacheDir) {
  if (!shouldAlign(voice)) return lines.map(() => null);
  const model = voice.aligner ?? DEFAULT_ALIGNER;
  const entries = lines.map((line) => {
    const words = line.words.map((w) => w.text);
    const cached = join(cacheDir, `${hashKey({ model, audio: fileHash(line.file), words })}.align.json`);
    return { file: line.file, words, cached, times: existsSync(cached) ? JSON.parse(readFileSync(cached, "utf8")) : null };
  });
  const pending = entries.filter((e) => !e.times);
  if (pending.length > 0) {
    console.log(`align: ${pending.length} line(s) with ${model}`);
    runAligner(model, pending, cacheDir).forEach((result, i) => {
      if (result.error) console.log(`WARNING: line ${entries.indexOf(pending[i])}: ${result.error}; using length-spread word times`);
      else if (Array.isArray(result.words)) writeFileSync(pending[i].cached, JSON.stringify(result.words));
      pending[i].times = result.words ?? null;
    });
  }
  return entries.map((entry, i) => {
    if (plausible(entry.times, lines[i].words.length, lines[i].duration)) return entry.times;
    if (entry.times) console.log(`WARNING: line ${i}: aligned times look wrong, using length-spread word times`);
    return null;
  });
}

/** Absolute word times for one line: aligned when available, estimated otherwise. */
export function timeLineWords(words, start, duration, aligned) {
  if (!aligned) return estimateWordTimes(words, start, duration);
  return words.map((w, i) => ({
    text: w.text,
    emphasis: w.emphasis,
    start: start + Math.min(aligned[i].start, duration),
    end: start + Math.min(aligned[i].end, duration),
  }));
}
