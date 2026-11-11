#!/usr/bin/env node
// script.json -> narration audio + generated/timeline.json (both in the short).
//
// Each VO line becomes its own audio file (public/vo/line_NN.wav), trimmed of
// leading and trailing silence and measured with ffprobe (voice_engines.mjs).
// Shots split their line's time by weight, so the cut rhythm follows the
// narration. Word times come from forced alignment where it is on, otherwise
// they are spread by word length (word_timing.mjs).
//
// voice.engine:
//   say      macOS `say`, for timing drafts only (robotic; never ship it)
//   mlx      local mlx-audio model (the series narrator; references/voice-and-audio.md)
//   file     you supply public/vo/line_NN.wav (your own read, an export)
//   command  any CLI: voice.command with {text_file} and {out} placeholders
//   none     no audio; durations from voice.wpm, for a silent animatic
//
// Usage: node scripts/build_timeline.mjs [script.json]

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { SHORT, TIMELINE_FILE } from "./paths.mjs";
import { durationOf, renderLineAudio, run } from "./voice_engines.mjs";
import { alignLines, timeLineWords } from "./word_timing.mjs";

const VO_DIR = join(SHORT, "public", "vo");
const CACHE_DIR = join(SHORT, ".cache", "vo");
const OUT_JSON = TIMELINE_FILE;
const SAMPLE_RATE = 48000;

function parseWords(vo) {
  return vo.split(/\s+/).filter(Boolean).map((raw) => ({
    text: raw.replace(/\*/g, ""),
    emphasis: /\*/.test(raw),
  }));
}

const spokenText = (vo) => vo.replace(/\*/g, "");

// The end card's title is about 900 px wide: a full crash (1.5x) pushes it
// off both edges, so a punch-in on it defaults to a soft one (1.075x).
const PUNCH_INS = new Set(["crash", "crashOut", "snapZoom"]);
const END_CARD_PUNCH_AMOUNT = 0.15;

function withCameraDefaults(shot) {
  const camera = shot.camera;
  if (shot.scene !== "endCard" || !camera || !PUNCH_INS.has(camera.move) || camera.amount !== undefined) return shot;
  return { ...shot, camera: { ...camera, amount: END_CARD_PUNCH_AMOUNT } };
}

function splitShots(line, lineIndex, start, end, firstIndex) {
  const total = line.shots.reduce((sum, s) => sum + (s.weight ?? 1), 0);
  let cursor = start;
  return line.shots.map((shot, i) => {
    const span = ((shot.weight ?? 1) / total) * (end - start);
    const timed = { ...withCameraDefaults(shot), index: firstIndex + i, lineIndex, start: cursor, end: cursor + span };
    cursor += span;
    return timed;
  });
}

function concatenate(files, gaps, output) {
  const inputs = files.flatMap((f) => ["-i", f]);
  const pads = files.map((_, i) => `[${i}]apad=pad_dur=${gaps[i].toFixed(3)}[p${i}]`).join(";");
  const joined = files.map((_, i) => `[p${i}]`).join("") + `concat=n=${files.length}:v=0:a=1[out]`;
  run("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${pads};${joined}`, "-map", "[out]", "-ar", String(SAMPLE_RATE), output]);
}

/** Audio, duration and (when available) aligned word times for every line. */
function measureLines(script, voice, baseDir) {
  const lineWords = script.lines.map((line) => parseWords(line.vo));
  if (voice.engine === "none") {
    return lineWords.map((words) => ({ words, file: null, aligned: null, duration: (words.length / (voice.wpm ?? 170)) * 60 }));
  }
  const files = renderLineAudio(voice, script.lines.map((line) => spokenText(line.vo)), { voDir: VO_DIR, cacheDir: CACHE_DIR, baseDir });
  const lines = files.map((file, i) => ({ words: lineWords[i], file, duration: durationOf(file) }));
  const aligned = alignLines(voice, lines, CACHE_DIR);
  return lines.map((line, i) => ({ ...line, aligned: aligned[i] }));
}

function layoutLines(script, measured) {
  const defaultGap = script.gapAfterLine ?? 0.12; // reference: 0.15-0.25 s between sentences, never more
  const words = [], shots = [], gaps = [], lines = [];
  let cursor = 0;
  script.lines.forEach((line, i) => {
    const { duration, aligned } = measured[i];
    const gap = line.gapAfter ?? defaultGap;
    gaps.push(gap);
    words.push(...timeLineWords(measured[i].words, cursor, duration, aligned).map((w) => ({ ...w, line: i })));
    lines.push({ index: i, start: cursor, end: cursor + duration, caption: line.caption ?? (script.style === "toy" && i === 0 ? "title" : "line") });
    shots.push(...splitShots(line, i, cursor, cursor + duration + gap, shots.length));
    cursor += duration + gap;
  });
  const files = measured.map((m) => m.file).filter(Boolean);
  const alignedCount = measured.filter((m) => m.aligned).length;
  return { words, lines, shots, files, gaps, spoken: cursor, alignedCount };
}

function report(script, words, shots, totalSeconds) {
  const body = shots.slice(0, -1).filter((s) => !s.hideCaptions); // end card holds on purpose
  const longest = Math.max(0, ...body.map((s) => s.end - s.start));
  console.log(`${script.lines.length} lines, ${words.length} words, ${shots.length} shots`);
  console.log(`length ${totalSeconds.toFixed(1)}s, ${((words.length / totalSeconds) * 60).toFixed(0)} wpm, longest shot ${longest.toFixed(2)}s`);
  const toy = script.style === "toy";
  const maxShot = toy ? 2.6 : 2.2;
  if (longest > maxShot) console.log(`WARNING: a shot runs past ${maxShot}s; split it or give it a stronger camera move`);
  if (toy && totalSeconds > 35) console.log("WARNING: over 35s; a toy short is 20-30s (references/toy-style.md)");
  if (!toy && totalSeconds > 62) console.log("WARNING: over 62s; YouTube Shorts and the 45-60s target both want it shorter");
}

function main() {
  const scriptPath = resolve(SHORT, process.argv[2] ?? "script.json");
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  const voice = script.voice ?? { engine: "none" };
  const fps = script.fps ?? 30;
  mkdirSync(VO_DIR, { recursive: true });
  mkdirSync(dirname(OUT_JSON), { recursive: true });

  const measured = measureLines(script, voice, dirname(scriptPath));
  const { words, lines, shots, files, gaps, spoken, alignedCount } = layoutLines(script, measured);
  const tail = script.tailSeconds ?? 1.2;
  shots[shots.length - 1].end += tail;
  const totalSeconds = spoken + tail;

  let voFile = null;
  if (files.length > 0) {
    concatenate(files, gaps, join(SHORT, "public", "vo.wav"));
    voFile = "vo.wav";
  }
  const timeline = {
    title: script.title,
    style: script.style ?? "bean",
    fps,
    durationInFrames: Math.ceil(totalSeconds * fps),
    voFile,
    music: script.music ?? null,
    autoSfx: script.autoSfx ?? true,
    captions: script.captions ?? (script.style === "toy" ? { style: "serif" } : undefined),
    wordTiming: alignedCount === 0 ? "estimated" : alignedCount === measured.length ? "aligned" : "mixed",
    words,
    lines,
    shots,
  };
  writeFileSync(OUT_JSON, JSON.stringify(timeline, null, 2));
  report(script, words, shots, totalSeconds);
  if (files.length > 0) console.log(`word times: ${alignedCount} of ${measured.length} lines force-aligned`);
}

main();
