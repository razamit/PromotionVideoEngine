// Repair lines cached by 1.3.1 and earlier, so they can be re-trimmed without
// synthesising them again.
//
// Those caches hold the trimmed line, not the raw model output. Re-synthesis
// is not an option for every voice: VoxCPM2 ignores its seed, so a posted
// short would come back with a different read.
//
// Each of those lines carries two of silenceremove's stray samples
// (vo_trim.mjs). At the model's own rate the trim wrote "a, s, a, b": one
// near-silent sample s, then the sample before it again. That happens at
// index round(0.03 * rate) - 1 and at length - round(0.06 * rate), and the line
// was then resampled to 48 kHz. ffmpeg's 2x and 3x resampling keeps every
// source sample as an output sample, so the pattern can still be read exactly
// in the 48 kHz file: the stray sample is s, the next source sample is the
// value it replaced. The repair checks for that pattern at each likely model
// rate and, where it is found, adds back (value - s) times the resampler's
// impulse response, which is what the stray sample took out. Nothing else in
// the line changes, and a line without the pattern is left as it is. Lines
// with voice.tempo are not touched: atempo ran after the trim and smeared the
// click into the read (8 dB over its surroundings in quick-draw and
// dry-cleaner-suit, against 28-36 dB in the toy shorts without tempo).

import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { decodeMono } from "./vo_trim.mjs";

const SAMPLE_RATE = 48000;
const MODEL_RATES = [24000, 16000, 48000]; // Kokoro, Qwen3-TTS and Chatterbox write 24 kHz
const SEARCH = 2; // source samples either side of the expected index
const kernels = new Map();

/** 48 kHz response of ffmpeg's default resampler to one sample at `rate`, and where its peak sits. */
function kernelFor(rate) {
  if (kernels.has(rate)) return kernels.get(rate);
  const at = 200;
  const impulse = new Float32Array(400);
  impulse[at] = 1;
  const raw = execFileSync("ffmpeg", ["-v", "error", "-f", "f32le", "-ar", String(rate), "-ac", "1", "-i", "-", "-f", "f32le", "-ar", String(SAMPLE_RATE), "-"], {
    input: Buffer.from(impulse.buffer),
  });
  const response = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  const kernel = { response, centre: at * (SAMPLE_RATE / rate) };
  kernels.set(rate, kernel);
  return kernel;
}

/** The "a, s, a" pattern at source index k (48 kHz step `step`): the amount s took out, or null. */
function strayAt(samples, k, step) {
  const [before, stray, after] = [samples[(k - 1) * step], samples[k * step], samples[(k + 1) * step]];
  if (before === undefined || after === undefined) return null;
  const tolerance = Math.max(2e-4, 0.01 * Math.abs(before));
  if (Math.abs(before - after) > tolerance || Math.abs(stray) >= 0.5 * Math.abs(before) || Math.abs(before) < 1e-3) return null;
  return after - stray;
}

/** Cancels the stray sample silenceremove left near source index `expected(rate)`; true when found. */
function cancelStray(samples, expected) {
  for (const rate of MODEL_RATES) {
    const step = SAMPLE_RATE / rate;
    const centre = expected(rate);
    for (let k = centre - SEARCH; k <= centre + SEARCH; k++) {
      const amount = strayAt(samples, k, step);
      if (amount === null) continue;
      const { response, centre: peak } = kernelFor(rate);
      for (let j = 0; j < response.length; j++) {
        const i = k * step - peak + j;
        if (i >= 0 && i < samples.length) samples[i] += amount * response[j];
      }
      return true;
    }
  }
  return false;
}

/** Write a 1.3.1-trimmed line with its stray samples cancelled; returns how many were found (0-2). */
export function repairLegacyTrim(input, output, { tempo } = {}) {
  const samples = Float64Array.from(decodeMono(input, SAMPLE_RATE));
  let repaired = 0;
  if (!tempo || Number(tempo) === 1) {
    const sourceLength = (rate) => Math.round((samples.length * rate) / SAMPLE_RATE);
    if (cancelStray(samples, (rate) => Math.round(0.03 * rate) - 1)) repaired++;
    if (cancelStray(samples, (rate) => sourceLength(rate) - Math.round(0.06 * rate))) repaired++;
  }
  // Through a file, not stdin: a long line piped into ffmpeg hung once in 64 runs.
  const floats = `${output}.f32`;
  writeFileSync(floats, Buffer.from(Float32Array.from(samples).buffer));
  try {
    execFileSync("ffmpeg", ["-v", "error", "-nostdin", "-y", "-f", "f32le", "-ar", String(SAMPLE_RATE), "-ac", "1", "-i", floats, output], { stdio: ["ignore", "pipe", "pipe"] });
  } finally {
    rmSync(floats, { force: true });
  }
  return repaired;
}
