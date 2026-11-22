// Sample-exact silence trimming for VO lines.
//
// ffmpeg's silenceremove (8.1) writes one zero sample where the silence it
// keeps meets the signal. With start_silence=0.03 that lands 30 ms into every
// line, right on the first word's onset, and `even` plus the levelling lift it
// 15-24 dB: a one-sample tick at the start of every line, 28-36 dB over the
// sound around it in the slow toy reads. So the trim points are found here
// and cut with atrim, which never touches a sample.

import { execFileSync } from "node:child_process";

/** Mono float samples of any file ffmpeg reads, at `sampleRate`. */
export function decodeMono(file, sampleRate) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-ac", "1", "-ar", String(sampleRate), "-"], {
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 512 * 1024 * 1024,
  });
  // A copy, because a small Buffer can sit at an offset that is not a multiple of 4.
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
}

/** Running RMS over a centred window of `width` samples. */
function runningRms(samples, width) {
  const sums = new Float64Array(samples.length + 1);
  for (let i = 0; i < samples.length; i++) sums[i + 1] = sums[i] + samples[i] * samples[i];
  const half = Math.floor(width / 2);
  const rms = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const a = Math.max(0, i - half);
    const b = Math.min(samples.length, i + half + 1);
    rms[i] = Math.sqrt((sums[b] - sums[a]) / (b - a));
  }
  return rms;
}

/**
 * [start, end) sample range to keep: `leadSeconds` before the first 20 ms
 * window over `thresholdDb` to `tailSeconds` after the last one. The whole
 * file when nothing crosses the threshold.
 */
export function speechBounds(samples, sampleRate, { thresholdDb, leadSeconds = 0.03, tailSeconds = 0.06 }) {
  const rms = runningRms(samples, Math.round(0.02 * sampleRate));
  const threshold = 10 ** (thresholdDb / 20);
  let first = -1;
  let last = -1;
  for (let i = 0; i < rms.length; i++) {
    if (rms[i] > threshold) {
      if (first < 0) first = i;
      last = i;
    }
  }
  if (first < 0) return [0, samples.length];
  const start = Math.max(0, first - Math.round(leadSeconds * sampleRate));
  const end = Math.min(samples.length, last + 1 + Math.round(tailSeconds * sampleRate));
  return [start, end];
}
