// script.json `voice` -> one trimmed audio file per VO line in public/vo/.
//
// Engines:
//   say      macOS `say`, timing drafts only (robotic; never ship it)
//   mlx      local mlx-audio model through scripts/tts_mlx.py (the series narrator)
//   command  any CLI: voice.command with {text_file} and {out} placeholders
//   file     you supply public/vo/line_NN.wav (your own read); used as is
//
// Synthesised lines are cached in .cache/vo/<hash>.wav, keyed on the text and
// every voice setting (and the reference clip's bytes), so a re-run only
// re-synthesises lines whose text or voice changed. Every synthesised line is
// then levelled to LINE_LUFS on its way to public/vo/, so no line jumps out
// (Kokoro lines differ by 2 dB and trail off; `voice.even` also compresses
// inside the line).

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { extname, isAbsolute, join, resolve } from "node:path";
import { fileHash, hashKey, runPythonJob } from "./python_job.mjs";
import { ENGINE } from "./paths.mjs";

const SAMPLE_RATE = 48000;
const LINE_LUFS = -20;
const MAX_LINE_GAIN_DB = 24; // the `even` compressor alone takes about 12 dB off a Kokoro line
// voice.even: a gentle speech compressor before levelling, for voices whose
// level sags inside a line. On Kokoro af_heart it halves the drop on a trailing word.
const EVEN_FILTER = "acompressor=threshold=-34dB:ratio=4:attack=3:release=150";
const CACHE_VERSION = 1; // bump when trimming or post-processing changes
const TRIM_SILENCE =
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03," +
  "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse";

// Friendly script.json keys -> generate() keyword names. voice.options passes anything else.
const MLX_KEYS = {
  voice: "voice", instruct: "instruct", speed: "speed", lang: "lang_code", seed: "seed",
  temperature: "temperature", exaggeration: "exaggeration", cfgWeight: "cfg_weight", refText: "ref_text",
};

export const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const pad2 = (n) => String(n).padStart(2, "0");

/** Integrated loudness in LUFS (ffmpeg ebur128). Lines shorter than 0.4 s may read as -70. */
export function loudnessOf(file) {
  const { stderr } = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" });
  const matches = [...(stderr ?? "").matchAll(/^\s+I:\s+(-?[\d.]+) LUFS/gm)];
  if (matches.length === 0) throw new Error(`could not measure loudness of ${file}`);
  return parseFloat(matches[matches.length - 1][1]);
}

/** Copy a cached line to public/vo/ at LINE_LUFS, peaks held under -1 dBFS. */
function levelInto(cached, out, voice) {
  let source = cached;
  if (voice.even) {
    source = `${out}.even.wav`;
    run("ffmpeg", ["-v", "error", "-y", "-i", cached, "-af", EVEN_FILTER, source]);
  }
  const measured = loudnessOf(source);
  const gain = measured < -60 ? 0 : Math.max(-MAX_LINE_GAIN_DB, Math.min(MAX_LINE_GAIN_DB, LINE_LUFS - measured));
  run("ffmpeg", ["-v", "error", "-y", "-i", source, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=false`, "-ar", String(SAMPLE_RATE), out]);
  if (source !== cached) rmSync(source, { force: true });
}

export function durationOf(file) {
  const out = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return parseFloat(out.trim());
}

/** Trim leading and trailing silence; voice.tempo speeds the read up without changing pitch. */
function toTrimmedWav(input, output, tempo) {
  const filters = [TRIM_SILENCE];
  if (tempo && tempo !== 1) filters.push(`atempo=${Number(tempo).toFixed(3)}`);
  const partial = `${output}.part.wav`;
  run("ffmpeg", ["-v", "error", "-y", "-i", input, "-af", filters.join(","), "-ar", String(SAMPLE_RATE), "-ac", "1", partial]);
  renameSync(partial, output);
}

/** A path from script.json: absolute, ~/, else relative to the short, else to the engine (the shared voice reference). */
export function resolvePath(path, baseDir) {
  const expanded = path.startsWith("~/") ? join(homedir(), path.slice(2)) : path;
  if (isAbsolute(expanded)) return expanded;
  const inShort = resolve(baseDir, expanded);
  return existsSync(inShort) ? inShort : resolve(ENGINE, expanded);
}

/** generate() options for engine "mlx". refText defaults to the clip's sibling .txt file. */
export function mlxOptions(voice, baseDir) {
  const options = {};
  for (const [key, name] of Object.entries(MLX_KEYS)) if (voice[key] !== undefined) options[name] = voice[key];
  if (voice.refAudio) {
    options.ref_audio = resolvePath(voice.refAudio, baseDir);
    if (!existsSync(options.ref_audio)) throw new Error(`voice.refAudio not found: ${options.ref_audio}`);
    const transcript = options.ref_audio.slice(0, -extname(options.ref_audio).length) + ".txt";
    if (options.ref_text === undefined && existsSync(transcript)) options.ref_text = readFileSync(transcript, "utf8").trim();
  }
  return { ...options, ...(voice.options ?? {}) };
}

function cacheKey(voice, options, text) {
  const settings = { ...voice, align: undefined, aligner: undefined, even: undefined, options };
  if (options.ref_audio) settings.refAudioHash = fileHash(options.ref_audio);
  delete settings.refAudio;
  return hashKey({ v: CACHE_VERSION, settings, text });
}

function synthesiseOne(voice, text, rawFile, workDir) {
  const textFile = join(workDir, `${rawFile.split("/").pop()}.txt`);
  writeFileSync(textFile, text);
  if (voice.engine === "say") {
    const args = ["-f", textFile, "-o", rawFile];
    if (voice.voice) args.push("-v", voice.voice);
    if (voice.rate) args.push("-r", String(voice.rate));
    run("say", args);
  } else if (voice.engine === "command") {
    const cmd = voice.command.replaceAll("{text_file}", textFile).replaceAll("{out}", rawFile);
    execFileSync("/bin/sh", ["-c", cmd], { stdio: "inherit" });
  } else {
    throw new Error(`unknown voice.engine ${voice.engine}`);
  }
  rmSync(textFile, { force: true });
}

function synthesiseMlx(voice, items, options, cacheDir) {
  if (!voice.model) throw new Error('voice.engine "mlx" needs voice.model, e.g. "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16"');
  console.log(`voice: synthesising ${items.length} line(s) with ${voice.model}`);
  const lines = items.map((item) => ({ text: item.text, out: item.cached.replace(/\.wav$/, ".raw.wav") }));
  const reports = runPythonJob("tts_mlx.py", { model: voice.model, options, lines }, cacheDir);
  if (reports.length !== lines.length) throw new Error(`tts_mlx.py returned ${reports.length} of ${lines.length} lines`);
  const seconds = reports.reduce((sum, r) => sum + r.seconds, 0);
  console.log(`voice: ${seconds.toFixed(1)}s of synthesis for ${items.length} line(s)`);
  lines.forEach((line, i) => {
    toTrimmedWav(line.out, items[i].cached, voice.tempo);
    rmSync(line.out, { force: true });
  });
}

function synthesiseMissing(voice, items, options, cacheDir) {
  if (voice.engine === "mlx") return synthesiseMlx(voice, items, options, cacheDir);
  for (const item of items) {
    const raw = item.cached.replace(/\.wav$/, ".raw.aiff");
    synthesiseOne(voice, item.text, raw, cacheDir);
    toTrimmedWav(raw, item.cached, voice.tempo);
    rmSync(raw, { force: true });
  }
}

/** One audio file per line, in order: public/vo/line_NN.wav. */
export function renderLineAudio(voice, texts, { voDir, cacheDir, baseDir }) {
  mkdirSync(voDir, { recursive: true });
  const outOf = (i) => join(voDir, `line_${pad2(i)}.wav`);
  if (voice.engine === "file") {
    texts.forEach((_, i) => {
      if (!existsSync(outOf(i))) throw new Error(`voice.engine=file but ${outOf(i)} is missing`);
    });
    return texts.map((_, i) => outOf(i));
  }
  mkdirSync(cacheDir, { recursive: true });
  const options = voice.engine === "mlx" ? mlxOptions(voice, baseDir) : {};
  const plan = texts.map((text, i) => ({ text, out: outOf(i), cached: join(cacheDir, `${cacheKey(voice, options, text)}.wav`) }));
  const missing = plan.filter((item) => !existsSync(item.cached));
  if (missing.length > 0) synthesiseMissing(voice, missing, options, cacheDir);
  plan.forEach((item) => levelInto(item.cached, item.out, voice));
  console.log(`voice: ${voice.engine}, ${plan.length - missing.length} line(s) from cache, ${missing.length} new`);
  return plan.map((item) => item.out);
}
