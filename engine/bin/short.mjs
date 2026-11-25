#!/usr/bin/env node
// One command for every short: `npm run <command>` inside a short calls this
// (its package.json maps each script here), with the short's folder as the
// current directory. It points the engine at that short and runs the step.
//
//   node engine/bin/short.mjs <command> [args...]   (from inside a short)
//
// Commands: timeline, table, music, lint, typecheck, check, studio, still,
// render, finish, review, bubbles, frames, qr, and remotion (pass-through to the Remotion
// CLI with the short wired in: `npm run remotion -- still Short out/f.png --frame=90`).
// A short whose timeline has a QR end card (scripts/qr/qr_render_flow.mjs):
// `render` (and a full-size `remotion render` to a video file) checks the
// timeline against the QR settings and that the QR's URL answers 302, and
// only then lets the renderer draw the real code; `render` and `finish`
// decode the QR from the file afterwards. Everything else (studio, still,
// review, bubbles, partial or scaled renders) draws a placeholder and makes
// no request. `qr` runs every QR check again.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, linkSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { isFlagValue } from "../scripts/remotion_args.mjs";
import { describeEnvFileRefusal, envFilesSettingQrVerified } from "../scripts/qr/qr_env_file_guard.mjs";

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHORT = resolve(process.env.SHORT_DIR ?? process.cwd());
const REMOTION = join(ENGINE, "node_modules", ".bin", "remotion");
const ENTRY = join(ENGINE, "src", "index.ts");
// One engine serves shorts from many projects; two can share a folder name,
// so per-short files in the engine are keyed on name plus a hash of the path.
const SHORT_KEY = `${basename(SHORT)}-${createHash("sha1").update(SHORT).digest("hex").slice(0, 8)}`;
const env = { ...process.env, SHORT_DIR: SHORT, ENGINE_DIR: ENGINE, SHORT_KEY };
// Only the QR gate may hand the renderer a verified QR (src/overlay/qrVerification.ts); one left in a shell must not leak in.
delete env.REMOTION_QR_VERIFIED;

function run(cmd, args, cwd = SHORT, extraEnv = {}) {
  const result = spawnSync(cmd, args, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/**
 * Serve the engine's shared public files (sound kit, brand) and the short's
 * own from one folder, short/.public, the short's files winning. Files are
 * hard links: no extra disk space, and Remotion copies them like any file
 * (it skips symlinks when it bundles the public folder).
 */
function mergedPublicDir() {
  const target = join(SHORT, ".public");
  rmSync(target, { recursive: true, force: true });
  const mirror = (from, to) => {
    if (!existsSync(from)) return;
    mkdirSync(to, { recursive: true });
    for (const name of readdirSync(from)) {
      if (name === ".DS_Store") continue;
      const source = join(from, name);
      const dest = join(to, name);
      if (statSync(source).isDirectory()) mirror(source, dest);
      else {
        rmSync(dest, { force: true });
        try {
          linkSync(source, dest);
        } catch {
          copyFileSync(source, dest); // engine and short on different volumes
        }
      }
    }
  };
  mirror(join(ENGINE, "public"), target);
  mirror(join(SHORT, "public"), target);
  return target;
}

/** The short's scene files sit outside the engine; a node_modules link lets them (and tsc) find the engine's packages. */
function linkNodeModules() {
  const link = join(SHORT, "node_modules");
  if (existsSync(link) || isSymlink(link)) return;
  symlinkSync(join(ENGINE, "node_modules"), link);
}

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/** A tsconfig for this short: the engine's settings, plus "@short" and package lookups from the engine. */
function shortTsconfig() {
  const file = join(ENGINE, `.tsconfig.${SHORT_KEY}.json`);
  writeFileSync(file, JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: {
      baseUrl: ".",
      paths: { "@engine/*": ["src/*"], "@short/*": [`${SHORT}/*`] },
    },
    include: ["src", "remotion.config.ts", `${SHORT}/scenes`, `${SHORT}/generated`],
  }, null, 2));
  return file;
}

/** An env file that sets the QR gate's variable would win over the gate (scripts/qr/qr_env_file_guard.mjs): stop first. */
function refuseUnsafeEnvFiles(remotionArgs) {
  const unsafeEnvFiles = envFilesSettingQrVerified(ENGINE, remotionArgs);
  if (!unsafeEnvFiles.length) return;
  console.error(describeEnvFileRefusal(unsafeEnvFiles));
  process.exit(1);
}

/** Remotion CLI with the short wired in. Output paths are taken relative to the short. */
function remotion(args, extraEnv = {}) {
  const [command, ...rest] = args;
  refuseUnsafeEnvFiles(rest);
  const outputs = command === "render" || command === "still";
  const fixed = rest.map((arg, i) => {
    if (!outputs || arg.startsWith("-") || arg === "Short") return arg;
    if (isFlagValue(rest, i)) return arg; // value of a flag like --frames 1-9
    return isAbsolute(arg) ? arg : resolve(SHORT, arg);
  });
  run(REMOTION, [command, ENTRY, ...fixed, `--public-dir=${mergedPublicDir()}`], ENGINE, extraEnv);
}

// The QR modules load only on the commands that need them, so a QR library
// missing from an engine that was not reinstalled cannot break the others.
const qrRenderFlow = () => import("../scripts/qr/qr_render_flow.mjs");

/** render (or the pass-through `remotion render`) through the QR gate; `render` checks the timeline even for previews. */
async function gatedRender(remotionArgs, alwaysCheckTimeline) {
  refuseUnsafeEnvFiles(remotionArgs);
  const { renderWithQrGate } = await qrRenderFlow();
  await renderWithQrGate({ shortDir: SHORT, remotionArgs, renderWith: remotion, alwaysCheckTimeline });
}

/** finish, with the QR timeline check before it and the decode check on the finished file after it. */
async function finishShort(args) {
  const { finishWithQrCheck } = await qrRenderFlow();
  const files = args.length ? args : ["out/short.mp4", "out/short_final.mp4"];
  await finishWithQrCheck({ shortDir: SHORT, files, runFinish: (finishFiles) => bash("finish.sh", finishFiles) });
}

async function qrCommand(args) {
  const { runQrCommand } = await import("../scripts/qr/qr_command.mjs");
  process.exit(await runQrCommand(SHORT, args[0]));
}

const node = (script, args) => run(process.execPath, [join(ENGINE, "scripts", script), ...args]);
const bash = (script, args) => run("bash", [join(ENGINE, "scripts", script), ...args]);

const commands = {
  timeline: (a) => node("build_timeline.mjs", a),
  table: (a) => node("review_table.mjs", a),
  music: (a) => node("make_music.mjs", a),
  lint: (a) => node("lint_shots.mjs", a),
  typecheck: () => run(join(ENGINE, "node_modules", ".bin", "tsc"), ["--noEmit", "-p", shortTsconfig()], ENGINE),
  check: (a) => { commands.typecheck(a); commands.lint(a); },
  studio: (a) => remotion(["studio", ...a]),
  still: (a) => remotion(["still", "Short", ...(a.some((x) => !x.startsWith("-")) ? a : ["out/still.png", ...a])]),
  render: (a) => gatedRender(["render", "Short", ...(a.some((x) => !x.startsWith("-")) ? a : ["out/short.mp4", ...a])], true),
  finish: (a) => finishShort(a),
  review: (a) => bash("review_frames.sh", a),
  bubbles: (a) => bash("bubble_check.sh", a),
  // A full-size pass-through render to a video file makes a postable file too, so it goes through the same gate.
  remotion: (a) => (a[0] === "render" ? gatedRender(a, false) : remotion(a)),
  // Caption-free frames of this short's scenes, saved in frames/ for slideshows (scripts/slideshow/scene_frames.mjs).
  frames: (a) => node(join("slideshow", "scene_frames.mjs"), [`--public-dir=${mergedPublicDir()}`, ...a]),
  // Every QR check: settings, redirect, decode of out/short_final.mp4 (else out/short.mp4, or [file]), social_text.md.
  qr: (a) => qrCommand(a),
};

const [command, ...args] = process.argv.slice(2);
if (!commands[command]) {
  console.error(`usage: short.mjs <${Object.keys(commands).join("|")}> [args]`);
  process.exit(2);
}
if (!existsSync(join(SHORT, "script.json"))) {
  console.error(`${SHORT} has no script.json; run this from inside a short`);
  process.exit(2);
}
linkNodeModules();
await commands[command](args);
