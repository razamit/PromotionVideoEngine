#!/usr/bin/env node
// script.json music.generate -> a bed composed for this episode, at its length.
//
// Runs ACE-Step 1.5 locally (scripts/music_acestep.py) for one or more takes,
// each with its own seed, then levels every take to the narration's loudness
// so music.volume keeps meaning "gain under the voice" (0.126 = -18 dB, the
// reference). Takes land in public/music/takes/, the picked one is copied to
// music.file. Raw generations are cached in .cache/music/, so a re-run with
// the same prompt, seed and length costs nothing.
//
// Run after `npm run timeline` (it needs the length and public/vo.wav).
// Usage: node scripts/make_music.mjs [--pick N]

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { ENGINE, SHORT, TIMELINE_FILE } from "./paths.mjs";
import { hashKey } from "./python_job.mjs";
import { loudnessOf, run } from "./voice_engines.mjs";

const ROOT = SHORT;
const CACHE_DIR = join(SHORT, ".cache", "music");
const TAKES_DIR = join(SHORT, "public", "music", "takes");
const ACESTEP = process.env.CARTOON_SHORTS_ACESTEP || join(homedir(), ".cache", "cartoon-shorts", "acestep", "ACE-Step-1.5");
const GENERATOR_VERSION = 1; // bump when music_acestep.py SETTINGS change

function plannedTakes(generate, duration) {
  const count = generate.takes ?? 1;
  return Array.from({ length: count }, (_, i) => {
    const take = { caption: generate.prompt, seed: (generate.seed ?? 4101) + i, bpm: generate.bpm, keyscale: generate.key };
    const raw = join(CACHE_DIR, `${hashKey({ v: GENERATOR_VERSION, ...take, duration })}.wav`);
    return { ...take, raw, out: join(TAKES_DIR, `take_${i + 1}.wav`) };
  });
}

function generateMissing(takes, duration) {
  const missing = takes.filter((t) => !existsSync(t.raw));
  if (missing.length === 0) return console.log(`music: ${takes.length} take(s) from cache`);
  const python = join(ACESTEP, ".venv", "bin", "python");
  if (!existsSync(python)) throw new Error(`${python} not found. Install ACE-Step (references/music-and-sfx.md) or set CARTOON_SHORTS_ACESTEP`);
  mkdirSync(CACHE_DIR, { recursive: true });
  const jobFile = join(CACHE_DIR, `job_${process.pid}.json`);
  const job = { acestep: ACESTEP, duration, takes: missing.map(({ caption, seed, bpm, keyscale, raw }) => ({ caption, seed, bpm, keyscale, out: raw })) };
  writeFileSync(jobFile, JSON.stringify(job));
  console.log(`music: generating ${missing.length} take(s) of ${duration}s with ACE-Step (about 25 s to load, 25-40 s per take)`);
  try {
    const out = execFileSync(python, [join(ENGINE, "scripts", "music_acestep.py"), jobFile], {
      cwd: ACESTEP,
      env: { ...process.env, ACESTEP_LM_BACKEND: "mlx", TOKENIZERS_PARALLELISM: "false" },
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 64 * 1024 * 1024,
    });
    const reports = out.toString().split("\n").filter((row) => row.startsWith('{"out"')).map((row) => JSON.parse(row));
    reports.forEach((r) => console.log(`music: ${r.out.split("/").pop()} in ${r.seconds}s`));
  } finally {
    rmSync(jobFile, { force: true });
  }
}

/** Gain the raw take to the voice's integrated loudness, peaks held under -1 dBFS. */
function levelTake(take, voiceLufs) {
  const gain = voiceLufs - loudnessOf(take.raw);
  run("ffmpeg", ["-v", "error", "-y", "-i", take.raw, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=false`, "-ar", "48000", take.out]);
  return gain;
}

function main() {
  const script = JSON.parse(readFileSync(join(ROOT, "script.json"), "utf8"));
  const music = script.music;
  if (!music?.generate?.prompt) throw new Error('script.json needs music.generate.prompt (see references/music-and-sfx.md)');
  const timelinePath = TIMELINE_FILE;
  const voPath = join(ROOT, "public", "vo.wav");
  if (!existsSync(timelinePath) || !existsSync(voPath)) throw new Error("run `npm run timeline` first: the bed is generated to the short's length and voice level");
  const timeline = JSON.parse(readFileSync(timelinePath, "utf8"));
  // ACE-Step writes its own ending 1.5-3 s before the requested length, so ask for 5 s more than the short.
  const duration = Math.ceil(timeline.durationInFrames / timeline.fps) + 5;

  const takes = plannedTakes(music.generate, duration);
  generateMissing(takes, duration);
  mkdirSync(TAKES_DIR, { recursive: true });
  const voiceLufs = loudnessOf(voPath);
  takes.forEach((take, i) => console.log(`music: take_${i + 1} seed ${take.seed}, ${levelTake(take, voiceLufs).toFixed(1)} dB to the voice's ${voiceLufs.toFixed(1)} LUFS`));

  const pickArg = process.argv.indexOf("--pick");
  const pick = pickArg > 0 ? Number(process.argv[pickArg + 1]) : music.generate.pick ?? 1;
  if (!takes[pick - 1]) throw new Error(`no take ${pick}; music.generate.takes is ${takes.length}`);
  const bed = join(ROOT, "public", music.file ?? "music/bed.wav");
  mkdirSync(dirname(bed), { recursive: true });
  copyFileSync(takes[pick - 1].out, bed);
  console.log(`music: take_${pick} -> public/${music.file ?? "music/bed.wav"}, played at volume ${music.volume ?? 1} (${(20 * Math.log10(music.volume ?? 1)).toFixed(1)} dB under the voice)`);
}

main();
