import assert from "node:assert/strict";
import { test } from "node:test";
import { planMidQrWindow, planQrWindow, qrCheckSeconds } from "../qr_hold.mjs";
import { holdInMiddle } from "../qr_middle_hold.mjs";
import { chooseQrShot } from "../qr_shot.mjs";
import { copy, FPS, layOut, line, loopLineScript } from "./fixtures.mjs";

const MIN_SECONDS = 2.5;

test("last shot: a short last shot is held at the end (1.4.0 numbers)", () => {
  const window = planQrWindow({ lastShotStartSec: 10, lastShotEndSec: 11, durationInFrames: 330, fps: FPS, minSeconds: MIN_SECONDS });
  assert.deepEqual(window, { startFrame: 300, fullFrom: 305, endFrame: 380, holdFrames: 50, durationInFrames: 380, lastShotEndSec: 380 / FPS });
});

test("middle shot: a long enough shot gets no hold and its window ends at the cut", () => {
  const window = planMidQrWindow({ shotStartSec: 10, shotEndSec: 13, fps: FPS, minSeconds: MIN_SECONDS });
  assert.deepEqual(window, { startFrame: 300, fullFrom: 305, endFrame: 390, holdFrames: 0 });
});

test("middle shot: a short shot is held at its cut until the code was fully visible minSeconds", () => {
  const window = planMidQrWindow({ shotStartSec: 10, shotEndSec: 12, fps: FPS, minSeconds: MIN_SECONDS });
  assert.deepEqual(window, { startFrame: 300, fullFrom: 305, endFrame: 380, holdFrames: 20 });
  assert.equal(window.endFrame - window.fullFrom, 75);
});

test("middle hold: later shots, words and lines move by the hold; earlier ones stay", () => {
  const laidOut = layOut(loopLineScript());
  const before = copy(laidOut);
  const choice = chooseQrShot(loopLineScript());
  const placed = holdInMiddle(laidOut, choice, MIN_SECONDS);
  const hold = placed.window.holdFrames;
  assert.ok(hold > 0, "the 2.12 s end card needs a hold");
  const shift = hold / FPS;
  assert.equal(placed.durationInFrames, before.durationInFrames + hold);
  assert.deepEqual(placed.voHold, { lineIndex: 2, seconds: shift });
  // before the QR shot: unchanged
  assert.deepEqual(laidOut.shots.slice(0, 3), before.shots.slice(0, 3));
  assert.deepEqual(laidOut.words.filter((w) => w.line <= 2), before.words.filter((w) => w.line <= 2));
  assert.deepEqual(laidOut.lines.slice(0, 3), before.lines.slice(0, 3));
  // the QR shot: same start, end later by the hold
  assert.equal(laidOut.shots[3].start, before.shots[3].start);
  assert.equal(Math.round(laidOut.shots[3].end * FPS), Math.round(before.shots[3].end * FPS) + hold);
  // after it: everything later by exactly the hold, frame for frame
  const loopShot = laidOut.shots[4];
  assert.equal(Math.round(loopShot.start * FPS), Math.round(before.shots[4].start * FPS) + hold);
  assert.equal(Math.round(loopShot.end * FPS), Math.round(before.shots[4].end * FPS) + hold);
  for (const [i, word] of laidOut.words.entries()) {
    if (word.line !== 3) continue;
    assert.ok(Math.abs(word.start - (before.words[i].start + shift)) < 1e-9);
    assert.ok(Math.abs(word.end - (before.words[i].end + shift)) < 1e-9);
  }
  assert.ok(Math.abs(laidOut.lines[3].start - (before.lines[3].start + shift)) < 1e-9);
  // the next shot starts on the card's last frame + 1
  assert.equal(Math.round(loopShot.start * FPS), placed.window.endFrame);
  assert.equal(placed.window.endFrame - placed.window.fullFrom, 75);
});

test("middle hold: nothing moves when the QR shot is long enough", () => {
  const script = [line("a", "room"), line("b", { scene: "endCard", weight: 1 }), line("c", "loop")];
  const laidOut = layOut(script);
  laidOut.shots[1].end += 1; // a 3.12 s end card
  laidOut.shots[2].start += 1;
  const before = copy(laidOut);
  const placed = holdInMiddle(laidOut, chooseQrShot(script), MIN_SECONDS);
  assert.equal(placed.window.holdFrames, 0);
  assert.equal(placed.voHold, null);
  assert.equal(placed.durationInFrames, before.durationInFrames);
  assert.deepEqual(laidOut, before);
});

test("middle hold: a marked shot that does not end its line and needs a hold is an error", () => {
  const script = [line("a", "room"), line("b", { scene: "endCard", qr: true }, "loop")];
  const laidOut = layOut(script);
  const before = copy(laidOut);
  const placed = holdInMiddle(laidOut, chooseQrShot(script), MIN_SECONDS);
  assert.match(placed.error, /not the last shot of its line, so the hold would cut into the voice/);
  assert.deepEqual(laidOut, before, "nothing was moved");
});

test("the decode frame is the middle of the fully visible window, wherever it is", () => {
  const qr = { startSec: 300 / FPS, endSec: 380 / FPS, enterFrames: 5 };
  assert.equal(qrCheckSeconds(qr, FPS), (342 + 0.5) / FPS);
});
