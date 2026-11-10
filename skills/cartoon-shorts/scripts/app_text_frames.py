#!/usr/bin/env python3
"""Frames of every shot that shows a real app capture, for a text legibility pass.

For each short folder given, reads generated/timeline.json, finds the
shots whose params reference a capture under app/, and pulls one full-size
frame from out/short_final.mp4 at 70% of the shot (after zooms and pops have
landed). Writes, into <short>/out/textcheck/:

  shot_NN.png   the full 1080x1920 frame
  sheet_K.png   six frames per sheet at 360x640, about the size a phone shows them
  index.md      one row per frame: shot, time, scene, capture, crop or focus

A rerun keeps what a reviewer wrote in index.md: each filled Verdict cell
(matched by shot number), any text above the table and any notes below it.
A verdict whose shot is no longer an app shot moves below the table. Folders
without generated/timeline.json (music-tests, scratch folders a
`shorts/*/` glob picks up) are skipped with a note.

Rule of thumb (references/app-footage.md): app body text should be about
28 px tall or more in the full frame. On the sheets that is about 9 px; if
you have to squint at a sheet tile, open the full frame and measure.

Usage:
  python3 <skill>/scripts/app_text_frames.py <short folder> [...]
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

TILE = (360, 640)
PER_SHEET = 6


def capture_of(params):
    """The first app/ path anywhere in the shot's params, or None."""
    text = json.dumps(params or {})
    start = text.find('"app/')
    return None if start < 0 else text[start + 1:text.find('"', start + 1)]


def framing_of(params):
    for key in ("crop", "focus", "focusTo"):
        if key in (params or {}):
            return f"{key} {json.dumps(params[key])}"
    return "full capture"


def grab(video, seconds, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{seconds:.3f}", "-i", str(video),
                    "-frames:v", "1", str(out)], check=True)


def write_sheets(rows, folder):
    for k in range(0, len(rows), PER_SHEET):
        chunk = rows[k:k + PER_SHEET]
        sheet = Image.new("RGB", (TILE[0] * 3, (TILE[1] + 28) * 2), "white")
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(chunk):
            x, y = (i % 3) * TILE[0], (i // 3) * (TILE[1] + 28)
            sheet.paste(Image.open(row["file"]).resize(TILE), (x, y + 28))
            draw.text((x + 6, y + 6), f"#{row['index']} {row['time']:.1f}s {row['capture'].split('/')[-1]}", fill="black")
        sheet.save(folder / f"sheet_{k // PER_SHEET + 1}.png")


def read_index(path):
    """Text above the table, the Verdict cell per shot ("#12"), and text below the table."""
    if not path.exists():
        return [], {}, []
    head, verdicts, tail, state = [], {}, [], "head"
    for line in path.read_text().splitlines():
        is_row = line.lstrip().startswith("|")
        if state == "head" and is_row:
            state = "table"
        elif state == "table" and not is_row:
            state = "tail"
        if state == "head":
            head.append(line)
        elif state == "tail":
            tail.append(line)
        else:
            cells = line.strip().strip("|").split("|", 5)
            if len(cells) == 6 and cells[0].strip().startswith("#") and cells[5].strip():
                verdicts[cells[0].strip()] = cells[5].strip()
    return head, verdicts, tail


def write_index(path, rows):
    head, verdicts, tail = read_index(path)
    lines = head + ["| Shot | Time | Scene | Capture | Framing | Verdict |", "|---|---|---|---|---|---|"]
    kept = 0
    for r in rows:
        verdict = verdicts.pop(f"#{r['index']}", "")
        kept += bool(verdict)
        lines.append(f"| #{r['index']} | {r['time']:.1f} s | {r['scene']} | {r['capture']} | {r['framing']} | {verdict} |")
    if verdicts:
        lines += ["", "Verdicts kept from shots that are no longer app shots (renumbered or cut):", ""]
        lines += [f"- {shot}: {verdict}" for shot, verdict in verdicts.items()]
    path.write_text("\n".join(lines + tail).rstrip("\n") + "\n")
    return kept, len(verdicts)


def review(short):
    timeline_file = short / "generated" / "timeline.json"
    if not timeline_file.exists():
        print(f"{short.name}: no generated/timeline.json, not a short, skipped")
        return
    timeline = json.loads(timeline_file.read_text())
    video = short / "out" / "short_final.mp4"
    if not video.exists():
        print(f"{short.name}: no out/short_final.mp4, skipped")
        return
    folder = short / "out" / "textcheck"
    folder.mkdir(parents=True, exist_ok=True)
    rows = []
    for shot in timeline["shots"]:
        capture = capture_of(shot.get("params"))
        if not capture:
            continue
        seconds = shot["start"] + 0.7 * (shot["end"] - shot["start"])
        out = folder / f"shot_{shot['index']:02d}.png"
        grab(video, seconds, out)
        rows.append({"index": shot["index"], "time": seconds, "scene": shot["scene"],
                     "capture": capture, "framing": framing_of(shot.get("params")), "file": out})
    write_sheets(rows, folder)
    kept, moved = write_index(folder / "index.md", rows)
    print(f"{short.name}: {len(rows)} app shots, {(len(rows) + PER_SHEET - 1) // PER_SHEET} sheets in {folder}"
          f" ({kept} verdicts kept{f', {moved} moved below the table' if moved else ''})")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        path = Path(arg).resolve()
        if path.is_dir():
            review(path)
        else:
            print(f"{arg}: not a folder, skipped")


if __name__ == "__main__":
    main()
