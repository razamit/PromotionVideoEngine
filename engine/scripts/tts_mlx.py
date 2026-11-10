#!/usr/bin/env python3
"""Synthesise narration lines with a local mlx-audio TTS model.

Called by build_timeline.mjs with the venv python (CARTOON_SHORTS_PY):

    python tts_mlx.py job.json

job.json:
    {
      "model": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16",
      "options": {"ref_audio": "/abs/narrator.wav", "ref_text": "...", ...},
      "lines": [{"text": "Spoken words.", "out": "/abs/line_00.raw.wav"}]
    }

"options" go straight to the model's generate() call, so each model's own
keyword names apply (instruct, voice, speed, lang_code, exaggeration,
cfg_weight, temperature, ref_audio, ref_text...). A ref_audio path is loaded
once at the model's sample rate. The model loads once for all lines.
"seed" is ours, not the model's: when set, the random generator is re-seeded
before every line, so a line renders the same on every run.

Prints one JSON object per line on stdout: {"out", "seconds", "audio_seconds"}.
Everything else (model progress) goes to stderr.
"""

import json
import sys
import time

import numpy as np

# Model loaders print progress on stdout; our JSON goes to the real stdout.
RESULTS = sys.stdout
sys.stdout = sys.stderr


def emit(record):
    RESULTS.write(json.dumps(record) + "\n")
    RESULTS.flush()


def load_reference(options, sample_rate):
    """Replace a ref_audio path with a mono array at the model's rate."""
    path = options.get("ref_audio")
    if isinstance(path, str):
        from mlx_audio.stt.utils import load_audio

        options["ref_audio"] = load_audio(path, sr=sample_rate)
    return options


def synthesise(model, text, options):
    """Run generate() and join every segment it yields into one array."""
    chunks = []
    for result in model.generate(text=text, **options):
        chunks.append(np.array(result.audio, dtype=np.float32).reshape(-1))
    if not chunks:
        raise RuntimeError(f"model returned no audio for: {text!r}")
    return np.concatenate(chunks)


def write_wav(path, audio, sample_rate):
    from mlx_audio.audio_io import write

    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak > 1.0:
        audio = audio / peak * 0.98
    write(path, audio, sample_rate, format="wav")


def run_job(job):
    from mlx_audio.tts.utils import load_model

    model = load_model(job["model"])
    sample_rate = model.sample_rate
    options = load_reference(dict(job.get("options") or {}), sample_rate)
    options.setdefault("verbose", False)
    seed = options.pop("seed", None)
    for line in job["lines"]:
        started = time.time()
        if seed is not None:
            import mlx.core as mx

            mx.random.seed(int(seed))
        audio = synthesise(model, line["text"], options)
        write_wav(line["out"], audio, sample_rate)
        report = {
            "out": line["out"],
            "seconds": round(time.time() - started, 3),
            "audio_seconds": round(audio.size / sample_rate, 3),
        }
        emit(report)


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: tts_mlx.py job.json")
    with open(sys.argv[1], encoding="utf8") as handle:
        job = json.load(handle)
    run_job(job)


if __name__ == "__main__":
    main()
