import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveQrSettings } from "../qr_settings.mjs";
import { chooseQrShot, describeQrShot, qrShotIndexOf } from "../qr_shot.mjs";
import { BRIEF, line, loopLineScript } from "./fixtures.mjs";

test("the last shot carries the card when it is the end card (1.4.0)", () => {
  const choice = chooseQrShot([line("a", "room"), line("b", "endCard")]);
  assert.equal(choice.index, 1);
  assert.equal(choice.isLast, true);
  assert.equal(choice.source, "last");
});

test("the last shot carries the card when no shot is an end card (1.4.0)", () => {
  const choice = chooseQrShot([line("a", "room"), line("b", "trailerEnd")]);
  assert.equal(choice.index, 1);
  assert.equal(choice.isLast, true);
  assert.match(choice.reason, /no shot uses the endCard scene/);
});

test("an end card before a loop line is chosen automatically, and the log says why", () => {
  const lines = loopLineScript();
  const choice = chooseQrShot(lines);
  assert.equal(choice.index, 3);
  assert.equal(choice.lineIndex, 2);
  assert.equal(choice.isLast, false);
  assert.equal(choice.source, "endCard");
  assert.match(describeQrShot(choice, lines), /^qr: card on shot #3 endCard \(line 2, "App name\. Link in bio\."\): the last shot \(#4 questCard\) is not an end card/);
});

test("of two end cards, the last one that ends its line is chosen", () => {
  const choice = chooseQrShot([line("a", "room"), line("b", { scene: "endCard" }, { scene: "endCard" }), line("c", "pingStorm")]);
  assert.equal(choice.index, 2);
});

test("an end card that does not end its line is not chosen automatically", () => {
  const choice = chooseQrShot([line("a", "room"), line("b", "endCard", "loopShot")]);
  assert.equal(choice.index, 2);
  assert.equal(choice.source, "last");
  assert.match(choice.reason, /does not end its line/);
});

test('a shot marked "qr": true carries the card', () => {
  const choice = chooseQrShot([line("a", "room"), line("b", { scene: "brandCard", qr: true }), line("c", "endCard")]);
  assert.equal(choice.index, 1);
  assert.equal(choice.source, "flag");
  assert.equal(choice.isLast, false);
});

test('"qr": false on a shot changes nothing', () => {
  assert.equal(chooseQrShot([line("a", { scene: "endCard", qr: false }), line("b", "room")]).index, 0);
});

test('two shots marked "qr": true are an error', () => {
  const choice = chooseQrShot([line("a", { scene: "room", qr: true }), line("b", { scene: "endCard", qr: true })]);
  assert.match(choice.error, /marks 2 shots with "qr": true \(#0 room, #1 endCard\); only one shot/);
});

test('a shot "qr" that is not a boolean is an error', () => {
  assert.match(chooseQrShot([line("a", { scene: "room", qr: "yes" })]).error, /must be true or false/);
});

test("the settings carry the chosen shot, and an error from it stops them", () => {
  const on = resolveQrSettings({ script: { qrCode: "dentist", lines: loopLineScript() }, brief: BRIEF, folderName: "x" });
  assert.equal(on.status, "on");
  assert.equal(on.shot.index, 3);
  const twoFlags = [line("a", { scene: "room", qr: true }), line("b", { scene: "endCard", qr: true })];
  const failed = resolveQrSettings({ script: { qrCode: "dentist", lines: twoFlags }, brief: BRIEF, folderName: "x" });
  assert.equal(failed.status, "error");
  assert.match(failed.error, /only one shot/);
});

test('shot flags are not read when the QR is off', () => {
  const twoFlags = [line("a", { scene: "room", qr: true }), line("b", { scene: "endCard", qr: true })];
  assert.equal(resolveQrSettings({ script: { qr: false, lines: twoFlags }, brief: BRIEF, folderName: "x" }).status, "off");
});

test("a timeline without qr.shotIndex has its card on the last shot", () => {
  assert.equal(qrShotIndexOf({ qr: {}, shots: [{}, {}, {}] }), 2);
  assert.equal(qrShotIndexOf({ qr: { shotIndex: 1 }, shots: [{}, {}, {}] }), 1);
});
