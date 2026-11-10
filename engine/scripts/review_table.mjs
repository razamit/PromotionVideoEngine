#!/usr/bin/env node
// generated/timeline.json + script.json -> out/review.md: the table
// the owner approves before scenes are built (time, VO, caption groups, shots,
// camera, app captures). Run after `npm run timeline`.
// Usage: node scripts/review_table.mjs [script.json]

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SHORT, TIMELINE_FILE } from "./paths.mjs";

const ROOT = SHORT;
const script = JSON.parse(readFileSync(join(ROOT, process.argv[2] ?? "script.json"), "utf8"));
const timeline = JSON.parse(readFileSync(TIMELINE_FILE, "utf8"));

// Same grouping rule as src/captions/WordCaptions.tsx groupWords().
function groupWords(words, minSeconds = 0.28) {
  const groups = [];
  let current = null;
  let count = 0;
  for (const w of words) {
    const fits = current && count < 2 && current.text.length + w.text.length < 14;
    const tooShort = current && current.end - current.start < minSeconds;
    if (current && fits && tooShort && !/[.!?]$/.test(current.text)) {
      current.text += ` ${w.text}`;
      current.end = w.end;
      count += 1;
    } else {
      current = { text: w.emphasis ? w.text.toUpperCase() : w.text, start: w.start, end: w.end };
      groups.push(current);
      count = 1;
    }
  }
  return groups;
}

const fmt = (t) => t.toFixed(1);
const cell = (s) => String(s).replaceAll("|", "/");
const groups = groupWords(timeline.words);
const captures = new Set();

const rows = script.lines.map((line, i) => {
  const shots = timeline.shots.filter((s) => s.lineIndex === i);
  const start = shots[0].start;
  const end = shots[shots.length - 1].end;
  const caps = groups.filter((g) => g.start >= start - 0.01 && g.start < end).map((g) => g.text).join(" / ");
  const shotText = shots.map((s) => `${s.scene} (${fmt(s.end - s.start)}s)`).join(", ");
  const camera = shots.map((s) => (s.camera?.move ?? "hold") + (s.enter && s.enter !== "cut" ? ` +${s.enter}` : "")).join(", ");
  const app = shots.map((s) => s.params?.src).filter(Boolean);
  app.forEach((a) => captures.add(a));
  return `| ${i + 1} | ${fmt(start)}-${fmt(end)} | ${cell(line.vo.replace(/\*/g, ""))} | ${cell(caps)} | ${cell(shotText)} | ${camera} | ${app.join(", ") || "-"} |`;
});

const words = timeline.words.length;
const seconds = timeline.durationInFrames / timeline.fps;
const md = [
  `# ${script.title}`,
  "",
  `${fmt(seconds)} s, ${words} words, ${timeline.shots.length} shots, voice: ${script.voice?.engine ?? "none"} (times move once the final voice is in).`,
  "",
  script.notes ? `Notes: ${script.notes}\n` : "",
  "| # | Time | VO | Captions | Shots | Camera | App capture |",
  "|---|---|---|---|---|---|---|",
  ...rows,
  "",
  "## App captures this short needs",
  "",
  ...[...captures].map((c) => `- \`public/${c}\``),
  "",
].join("\n");

mkdirSync(join(ROOT, "out"), { recursive: true });
writeFileSync(join(ROOT, "out", "review.md"), md);
console.log(`wrote out/review.md (${rows.length} lines, ${captures.size} captures)`);
