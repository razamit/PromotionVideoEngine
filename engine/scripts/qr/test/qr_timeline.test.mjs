import assert from "node:assert/strict";
import { test } from "node:test";
import { keepAboveAt } from "../../../src/captions/keepAbove.ts";
import { resolveQrSettings } from "../qr_settings.mjs";
import { qrTimelineMismatch } from "../qr_timeline_check.mjs";
import { addQrToTimeline, qrShotCaptionWarning } from "../qr_timeline.mjs";
import { BRIEF, copy, FPS, layOut, line, loopLineScript } from "./fixtures.mjs";

const MATRIX = { version: 2, size: 25, rows: Array(25).fill("0".repeat(25)) };
const QR_KEYS_1_4_0 = ["code", "url", "label", "version", "modules", "startSec", "endSec", "enterFrames", "holdFrames"];

function planFor(lines) {
  const settings = resolveQrSettings({ script: { qrCode: "test", lines }, brief: BRIEF, folderName: "x" });
  return { settings, matrix: MATRIX };
}

/** Runs addQrToTimeline without its console line. */
function addQuietly(plan, laidOut) {
  const log = console.log;
  console.log = () => {};
  try {
    return addQrToTimeline(plan, laidOut, () => null);
  } finally {
    console.log = log;
  }
}

test("last shot: the qr block, the hold and the length are those of 1.4.0", () => {
  const lines = [line("a", "room"), line("b", "endCard")];
  const laidOut = layOut(lines);
  const before = copy(laidOut);
  const part = addQuietly(planFor(lines), laidOut);
  assert.deepEqual(Object.keys(part.qr), QR_KEYS_1_4_0, "no shotIndex for the last shot");
  // 1.4.0: card from the last shot's start, held at the end until 75 frames are fully visible
  const startFrame = Math.round(before.shots[1].start * FPS);
  assert.equal(part.qr.startSec, startFrame / FPS);
  assert.equal(part.qr.endSec, (startFrame + 5 + 75) / FPS);
  assert.equal(part.durationInFrames, startFrame + 80);
  assert.equal(part.qr.holdFrames, startFrame + 80 - Math.round(before.shots[1].end * FPS));
  assert.equal(part.voHold, null);
  assert.deepEqual(laidOut.words, before.words);
});

test("middle shot: the qr block names the shot and the window is that shot", () => {
  const lines = loopLineScript();
  const laidOut = layOut(lines);
  const part = addQuietly(planFor(lines), laidOut);
  assert.equal(part.qr.shotIndex, 3);
  assert.equal(part.qr.startSec, Math.round(laidOut.shots[3].start * FPS) / FPS);
  assert.equal(Math.round(part.qr.endSec * FPS), Math.round(laidOut.shots[4].start * FPS));
  assert.equal(part.voHold.lineIndex, 2);
  assert.ok(part.qr.holdFrames > 0);
});

test("stale check: a 1.4.0 timeline with the card on the last shot still matches", () => {
  const lines = [line("a", "room"), line("b", "endCard")];
  const plan = planFor(lines);
  const timeline = { fps: FPS, shots: layOut(lines).shots, qr: { code: "test", url: "https://example.com/st/test", label: plan.settings.label, startSec: 2, endSec: 4.8, enterFrames: 5, holdFrames: 0 } };
  assert.equal(qrTimelineMismatch(plan.settings, timeline), null);
});

test("stale check: a timeline with the card on another shot than the script chooses is out of date", () => {
  const lines = loopLineScript();
  const plan = planFor(lines);
  const old = { fps: FPS, shots: layOut(lines).shots, qr: { code: "test", url: "https://example.com/st/test", label: plan.settings.label, startSec: 6, endSec: 9, enterFrames: 5, holdFrames: 0 } };
  assert.match(qrTimelineMismatch(plan.settings, old), /QR card is on shot #4 but script.json now puts it on shot #3/);
  assert.equal(qrTimelineMismatch(plan.settings, { ...old, qr: { ...old.qr, shotIndex: 3 } }), null);
});

test("caption warning: names the QR shot, and only words while the card is up", () => {
  const lines = [line("a", "room"), line("b", "endCard"), line("c", "loop")];
  const laidOut = layOut(lines);
  const part = addQuietly(planFor(lines), laidOut);
  const timeline = { qr: part.qr, shots: laidOut.shots, words: laidOut.words, lines: laidOut.lines };
  assert.match(qrShotCaptionWarning(timeline), /^WARNING: the QR shot #1 \(endCard\) has spoken words \("one two"\)/);
  laidOut.shots[1].hideCaptions = true;
  assert.equal(qrShotCaptionWarning(timeline), null);
});

test("captions keep above the card only while it is up", () => {
  const keep = { fromSec: 10, untilSec: 12.5, bottomPx: 900 };
  assert.equal(keepAboveAt(keep, 9.99), undefined);
  assert.equal(keepAboveAt(keep, 10), 900);
  assert.equal(keepAboveAt(keep, 12.49), 900);
  assert.equal(keepAboveAt(keep, 12.5), undefined);
  assert.equal(keepAboveAt({ fromSec: 10, bottomPx: 900 }, 99), 900, "no untilSec: to the end, as in 1.4.0");
});

test("QR off: nothing is added or moved, even with a loop line after the end card", () => {
  const lines = loopLineScript();
  const laidOut = layOut(lines);
  const before = copy(laidOut);
  const settings = resolveQrSettings({ script: { qr: false, lines }, brief: BRIEF, folderName: "x" });
  const part = addQuietly({ settings, matrix: null }, laidOut);
  assert.deepEqual(part, { qr: null, durationInFrames: before.durationInFrames, music: null, voHold: null });
  assert.deepEqual(laidOut, before);
});
