#!/usr/bin/env python3
"""Forced-align the script's own words to each narration line's audio.

Called by build_timeline.mjs with the venv python (CARTOON_SHORTS_PY):

    python align_words.py job.json

job.json:
    {
      "model": "mlx-community/Qwen3-ForcedAligner-0.6B-8bit",
      "language": "English",
      "lines": [{"audio": "/abs/line_00.wav", "words": ["This", "trash", "bag"]}]
    }

The aligner is told the exact script text, never an ASR guess, so the result
has one start/end pair per script word, in order. Script words that hold no
letters or digits (a lone dash) get a zero-length slot at the previous end.

Prints one JSON object per line on stdout, in job order:
    {"words": [{"start": 0.0, "end": 0.31}, ...]}  or  {"error": "..."}
"""

import json
import sys

RESULTS = sys.stdout
sys.stdout = sys.stderr  # keep loader chatter off our JSON channel


def emit(record):
    RESULTS.write(json.dumps(record) + "\n")
    RESULTS.flush()


def token_counts(processor, words):
    """How many aligner tokens each script word becomes (usually 1, or 0)."""
    return [len(processor.tokenize_space_lang(word)) for word in words]


def map_to_words(items, counts):
    """Fold aligner items back onto script words, keeping their order."""
    if sum(counts) != len(items):
        raise ValueError(f"aligner returned {len(items)} tokens, expected {sum(counts)}")
    timed, cursor, last_end = [], 0, 0.0
    for count in counts:
        if count == 0:
            timed.append({"start": last_end, "end": last_end})
            continue
        group = items[cursor : cursor + count]
        cursor += count
        start = max(float(group[0].start_time), last_end)
        end = max(float(group[-1].end_time), start)
        timed.append({"start": round(start, 3), "end": round(end, 3)})
        last_end = end
    return timed


def align_line(aligner, line, language):
    words = line["words"]
    counts = token_counts(aligner.aligner_processor, words)
    result = aligner.generate(line["audio"], text=" ".join(words), language=language)
    timed = map_to_words(list(result.items), counts)
    if timed and timed[-1]["end"] <= 0:
        raise ValueError("aligner put every word at 0 s")
    return timed


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: align_words.py job.json")
    with open(sys.argv[1], encoding="utf8") as handle:
        job = json.load(handle)
    from mlx_audio.stt.utils import load

    aligner = load(job.get("model") or "mlx-community/Qwen3-ForcedAligner-0.6B-8bit")
    language = job.get("language", "English")
    for line in job["lines"]:
        try:
            emit({"words": align_line(aligner, line, language)})
        except Exception as error:  # one bad line must not sink the others
            emit({"error": f"{type(error).__name__}: {error}"})


if __name__ == "__main__":
    main()
