#!/usr/bin/env node
// script.json + generated/timeline.json -> warnings and errors about the
// cut, before anything is rendered: repeated angles, long or static shots, a
// weak first frame, captions under the platform UI, unreadable app screens,
// no sound effects, length and pace, em dashes and risky claim words.
// Every finding names the shot (timeline index, as in `npm run review`), its
// start time and a fix. Exit code 1 only when there are errors.
// Usage: node scripts/lint_shots.mjs [script.json]

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { ENGINE, SHORT, TIMELINE_FILE, publicFile } from "./paths.mjs";

const SCRIPT_FILE = join(SHORT, process.argv[2] ?? "script.json");
const SAFE_ZONE_FILE = join(ENGINE, "src", "layout", "safeZone.ts");

const LIMITS = {
  maxShotSeconds: 2.2,
  maxFirstShotSeconds: 1.5,
  minSeconds: 45,
  maxSeconds: 62,
  minWpm: 195,
  maxWpm: 230,
  minPhoneHeight: 1500,
  readableFocusZoom: 1.6, // a focus zoom this tight reads at any phone height
  maxAngleRepeats: 2,
  maxSceneUses: 4,
  captionHalfHeight: 0.03, // 104 px type with stroke, as a fraction of 1920
  defaultCaptionY: 0.64,
  frameHeight: 1920,
};
const DEFAULT_SAFE_ZONE = { top: 0.12, bottom: 0.75 };
const EM_DASH = "\u2014";
const CLAIM_WORDS = /(^|[^\p{L}])(never|always|best|guaranteed?|forever)(?=$|[^\p{L}])|#1\b/giu;

const findings = [];
const fmt = (t) => `${t.toFixed(1)}s`;
const tag = (shot) => `#${shot.index} ${fmt(shot.start)} ${shot.scene}`;
const moveOf = (shot) => shot.camera?.move ?? "hold";
const paramsKey = (params) => JSON.stringify(sortKeys(params ?? {}));

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

function add(level, rule, where, message, hint) {
  findings.push({ level, rule, where, message, hint });
}

function readJson(file, what) {
  if (!existsSync(file)) {
    console.error(`ERROR missing ${what}: ${file}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Reads top/bottom from src/layout/safeZone.ts when it exists (fractions or px of 1920). */
function loadSafeZone() {
  if (!existsSync(SAFE_ZONE_FILE)) return { ...DEFAULT_SAFE_ZONE, source: "default" };
  const code = readFileSync(SAFE_ZONE_FILE, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  const source = code.match(/SAFE_ZONE\s*=\s*\{([^}]*)\}/)?.[1] ?? code;
  const pick = (name) => {
    const match = source.match(new RegExp(`${name}\\w*["']?\\s*[:=]\\s*([0-9.]+)`, "i"));
    if (!match) return null;
    const value = parseFloat(match[1]);
    return value > 1 ? value / LIMITS.frameHeight : value;
  };
  const top = pick("top") ?? DEFAULT_SAFE_ZONE.top;
  const bottom = pick("bottom") ?? DEFAULT_SAFE_ZONE.bottom;
  // A "bottom" written as the covered band (0.25) rather than the edge (0.75).
  const bottomEdge = bottom < 0.5 ? 1 - bottom : bottom;
  return { top, bottom: bottomEdge, source: "src/layout/safeZone.ts" };
}

function checkFreshness(script, timeline) {
  if (statSync(SCRIPT_FILE).mtimeMs > statSync(TIMELINE_FILE).mtimeMs) {
    add("warn", "stale", "timeline", "script.json is newer than timeline.json", "run `npm run timeline` first");
  }
  const scriptShots = script.lines.reduce((n, line) => n + line.shots.length, 0);
  if (scriptShots !== timeline.shots.length) {
    add("error", "stale", "timeline", `script has ${scriptShots} shots, timeline has ${timeline.shots.length}`,
      "run `npm run timeline` first");
  }
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

const list = (shots) => shots.map((s) => `#${s.index}@${fmt(s.start)}`).join(" ");

function checkRepeats(shots) {
  const exact = groupBy(shots, (s) => `${s.scene}|${paramsKey(s.params)}|${moveOf(s)}`);
  for (const group of exact.values()) {
    if (group.length <= LIMITS.maxAngleRepeats) continue;
    add("warn", "repeat-exact", `${group[0].scene} x${group.length}`,
      `same scene, params and camera move: ${list(group)}`,
      "change the framing or what the character does in each repeat");
  }
  // A scene param that changes the framing (angle, camera preset, which
  // capture, which crop) makes it a different angle.
  const framing = (s) => JSON.stringify(["angle", "camera", "src", "crop"].map((k) => s.params?.[k] ?? null));
  const angles = groupBy(shots, (s) => `${s.scene}|${framing(s)}|${moveOf(s)}`);
  for (const group of angles.values()) {
    if (group.length <= LIMITS.maxAngleRepeats) continue;
    add("warn", "repeat-angle", `${group[0].scene} ${moveOf(group[0])} x${group.length}`,
      `same scene and camera move ${group.length} times: ${list(group)}`,
      "a running gag is a character beat (new pose, reaction, angle), not the same shot again");
  }
  checkSceneUses(shots);
}

function checkSceneUses(shots) {
  for (const group of groupBy(shots, (s) => s.scene).values()) {
    if (group.length <= LIMITS.maxSceneUses) continue;
    add("warn", "scene-overuse", `${group[0].scene} x${group.length}`, `scene used ${group.length} times: ${list(group)}`,
      "running gag 2-3 times; cut some or show the beat from another scene (over the shoulder, reaction, insert)");
  }
}

function checkConsecutive(shots) {
  for (let i = 1; i < shots.length; i += 1) {
    const [prev, shot] = [shots[i - 1], shots[i]];
    if (prev.scene !== shot.scene || paramsKey(prev.params) !== paramsKey(shot.params)) continue;
    add("warn", "consecutive", tag(shot), `identical scene and params to #${prev.index}; reads as one long shot`,
      "change a param (pose, stage, video time) or cut to a reaction in between");
  }
}

function checkPacing(shots) {
  const last = shots[shots.length - 1];
  for (const shot of shots) {
    const length = shot.end - shot.start;
    const exempt = shot === last || shot.hideCaptions;
    if (!exempt && length > LIMITS.maxShotSeconds) {
      add("warn", "long-shot", tag(shot), `${length.toFixed(2)}s, over ${LIMITS.maxShotSeconds}s`,
        "split it into two shots (weight) or move part of the line to another angle");
    }
    if (moveOf(shot) === "hold" && !shot.camera?.shake) {
      add("warn", "static", tag(shot), "camera move hold with no shake", "use push/crash/pan, or add shake for panic");
    }
  }
}

function checkHook(shots) {
  const first = shots[0];
  const length = first.end - first.start;
  const move = moveOf(first);
  if (length > LIMITS.maxFirstShotSeconds) {
    add("warn", "hook", tag(first), `first shot runs ${length.toFixed(2)}s`, "cut to a second angle by 1.5s");
  }
  if (move === "hold" || move === "pull") {
    add("warn", "hook", tag(first), `first shot uses ${move}`, "open on push or crash toward a big subject");
  }
  if (move === "crash") {
    add("warn", "hook", tag(first), "crash starts at scale 1, so frame 0 is the wide before the punch-in",
      "frame 0 is the thumbnail: make the subject big at scale 1, or open on push already framed tight");
  }
  if (first.hideCaptions) add("warn", "hook", tag(first), "no caption on frame 0", "the hook line must be readable muted");
  if (first.enter && first.enter !== "cut") {
    add("warn", "hook", tag(first), `first shot enters with ${first.enter}; frame 0 is a blur`, "use a hard cut");
  }
}

function groupWords(words, minSeconds = 0.28) {
  // Same rule as src/captions/WordCaptions.tsx groupWords().
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
      current = { text: w.text, start: w.start, end: w.end };
      groups.push(current);
      count = 1;
    }
  }
  return groups;
}

function checkCaptionZone(shots, words, zone) {
  const groups = groupWords(words);
  const epsilon = 1e-6;
  for (const shot of shots) {
    if (shot.hideCaptions) continue;
    const shown = groups.filter((g) => g.start < shot.end && g.end > shot.start);
    if (shown.length === 0) continue;
    const y = shot.captionY ?? LIMITS.defaultCaptionY;
    const top = y - LIMITS.captionHalfHeight;
    const bottom = y + LIMITS.captionHalfHeight;
    if (top >= zone.top - epsilon && bottom <= zone.bottom + epsilon) continue;
    add("warn", "caption-zone", tag(shot),
      `captionY ${y} puts "${shown[0].text}" at ${top.toFixed(2)}-${bottom.toFixed(2)}, outside ${zone.top.toFixed(2)}-${zone.bottom.toFixed(2)}`,
      `keep captionY between ${(zone.top + LIMITS.captionHalfHeight).toFixed(2)} and ${(zone.bottom - LIMITS.captionHalfHeight).toFixed(2)}; move the phone, not the caption`);
  }
}

const isAppShot = (shot) => typeof shot.params?.src === "string" && /(^|\/)app\//.test(shot.params.src);

/** The zoom the shot lands on and holds for reading (focusTo, else focus), or 0 without one. */
function landingZoom(params) {
  const landing = params.focusTo ?? params.focus;
  return typeof landing?.zoom === "number" ? landing.zoom : 0;
}

function checkLegibility(shots) {
  for (const shot of shots.filter(isAppShot)) {
    const params = shot.params;
    const framed = params.focus !== undefined || params.crop !== undefined;
    const zoomedIn = landingZoom(params) >= LIMITS.readableFocusZoom;
    const height = params.height ?? params.phoneHeight;
    const problems = [];
    if (!framed) problems.push("no focus or crop");
    if (height === undefined && !framed) problems.push("phone height not set");
    if (height !== undefined && height < LIMITS.minPhoneHeight && !zoomedIn) problems.push(`phone height ${height}`);
    if (problems.length === 0) continue;
    add("warn", "legibility", `${tag(shot)} ${params.src}`, problems.join(", "),
      `the app text must read at phone size: crop/focus on the one UI element that matters (focus zoom >= ${LIMITS.readableFocusZoom}), or phone height >= ${LIMITS.minPhoneHeight}`);
  }
}

function checkSfx(timeline) {
  // Short.tsx adds a whoosh to whips, zoomBlur and crash-type moves unless
  // the script sets "autoSfx": false, so only explicit cues are counted here.
  const autoOn = timeline.autoSfx !== false;
  const isNone = (sfx) => sfx === "none" || sfx === null;
  const placed = timeline.shots.filter((s) => s.sfx && !isNone(s.sfx)).length;
  if (placed === 0) {
    add("warn", "sfx", "whole short", autoOn ? "only automatic whooshes, no sound on any key action" : "no sound effects at all",
      "add sfx on the phone buzz, the swat or tap and the twist (music-and-sfx.md)");
  }
  checkSfxFiles(timeline);
  if (autoOn) return;
  const bareWhips = timeline.shots.filter((s) => s.enter && s.enter !== "cut" && s.enter !== "dissolve" && !s.sfx);
  if (bareWhips.length > 0) {
    add("warn", "sfx", `${bareWhips.length} transitions`, `whip or zoom with no sfx: ${list(bareWhips)}`, "give each a whoosh");
  }
}

/** A cue path that is not under public/ only fails at render time (a 404), so catch it here. */
function checkSfxFiles(timeline) {
  const files = (sfx) => [sfx].flat().map((cue) => (typeof cue === "string" ? cue : cue?.file)).filter((f) => f && f !== "auto" && f !== "none");
  for (const shot of timeline.shots) {
    const missing = files(shot.sfx).filter((f) => !existsSync(publicFile(f)));
    if (missing.length > 0) add("error", "sfx-file", `#${shot.index}`, `no such file: public/${missing.join(", public/")}`, "fix the path (kit files end in .wav)");
  }
}

function checkLengthAndPace(timeline) {
  const seconds = timeline.durationInFrames / timeline.fps;
  const wpm = (timeline.words.length / seconds) * 60;
  if (seconds < LIMITS.minSeconds || seconds > LIMITS.maxSeconds) {
    add("warn", "length", "whole short", `${seconds.toFixed(1)}s, outside ${LIMITS.minSeconds}-${LIMITS.maxSeconds}s`,
      "cut or add lines; 50-60s is the target");
  }
  if (wpm < LIMITS.minWpm || wpm > LIMITS.maxWpm) {
    add("warn", "pace", "whole short", `${wpm.toFixed(0)} wpm, outside ${LIMITS.minWpm}-${LIMITS.maxWpm}`,
      "change the voice speed or the word count; about 215 wpm is the reference pace");
  }
  return { seconds, wpm };
}

function checkText(script, timeline) {
  script.lines.forEach((line, i) => {
    const first = timeline.shots.find((s) => s.lineIndex === i);
    const where = `line ${i + 1} ${first ? fmt(first.start) : ""}`.trim();
    if (line.vo.includes(EM_DASH)) {
      add("error", "em-dash", where, `em dash in "${line.vo}"`, "rewrite as two sentences or use a comma");
    }
    const claims = [...line.vo.matchAll(CLAIM_WORDS)].map((m) => m[0].replace(/^[^\p{L}#]+/u, ""));
    if (claims.length > 0) {
      add("warn", "claim", where, `"${claims.join('", "')}" in "${line.vo.replace(/\*/g, "")}"`,
        "check it against the claims list in references/app-series.md");
    }
  });
  if ((script.title ?? "").includes(EM_DASH) || (script.notes ?? "").includes(EM_DASH)) {
    add("error", "em-dash", "title/notes", "em dash in script title or notes", "rewrite without it");
  }
}

function printFindings() {
  const byRule = groupBy(findings, (f) => `${f.level}|${f.rule}`);
  const ordered = [...byRule.values()].sort((a, b) => (a[0].level === b[0].level ? 0 : a[0].level === "error" ? -1 : 1));
  for (const group of ordered) {
    const hints = new Set(group.map((f) => f.hint));
    for (const f of group) {
      const label = f.level === "error" ? "ERROR" : "WARN ";
      console.log(`${label} ${f.rule.padEnd(13)} ${f.where}: ${f.message}${hints.size > 1 ? `\n      fix: ${f.hint}` : ""}`);
    }
    if (hints.size === 1) console.log(`      fix: ${group[0].hint}`);
  }
}

function main() {
  const script = readJson(SCRIPT_FILE, "script");
  const timeline = readJson(TIMELINE_FILE, "timeline (run `npm run timeline`)");
  const shots = timeline.shots;
  const zone = loadSafeZone();
  checkFreshness(script, timeline);
  checkHook(shots);
  checkRepeats(shots);
  checkConsecutive(shots);
  checkPacing(shots);
  checkCaptionZone(shots, timeline.words, zone);
  checkLegibility(shots);
  checkSfx(timeline);
  const { seconds, wpm } = checkLengthAndPace(timeline);
  checkText(script, timeline);
  printFindings();
  const errors = findings.filter((f) => f.level === "error").length;
  console.log(`\n${shots.length} shots, ${seconds.toFixed(1)}s, ${wpm.toFixed(0)} wpm, safe zone ${zone.top.toFixed(2)}-${zone.bottom.toFixed(2)} (${zone.source})`);
  console.log(`${errors} errors, ${findings.length - errors} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
