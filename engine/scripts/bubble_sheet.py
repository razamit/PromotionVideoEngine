#!/usr/bin/env python3
"""Render log + preview video -> speech bubble and sign contact sheets and index.md.

Called by scripts/bubble_check.sh. Reads the lines SpeechBurst logs while
rendering ("[speech-burst-seen]" / "[sign-seen]" every 10 frames, warnings
without -seen),
groups them into appearances (same text, frames less than 15 apart), takes
the middle frame of each from the preview, and lays them out six to a sheet
at about phone size, each labelled with time, text and any problem.

Usage: bubble_sheet.py <render.log> <preview.mp4> <out_dir>
       bubble_sheet.py <render.log> --log-only   (summary only, e.g. on the final render's out/render.log)
Exit 1 when any appearance has its words cut by the frame edge for 6 frames or more.
Frame ranges start about 5 frames into a burst's shot: the audit skips the
pop-in. Take the middle frame of a range for a still, not its ends.
"""

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

LINE = re.compile(r'\[(speech-burst|sign)(-seen)?\] "(.*?)" (?:(WORDS CUT by the frame edge|shape cut by the frame edge|words on the caption line) )?frame (\d+) \(([\d.]+) s\)')
GAP_FRAMES = 15
# A problem on fewer frames than this is a camera move or a shot transition
# passing through, not a placement fault; it is listed but not flagged.
MIN_PROBLEM_FRAMES = 6
COLUMNS, ROWS = 3, 2
TILE_WIDTH = 360
LABEL_HEIGHT = 84
PAD = 10


def parse(log_text):
    """(text, frame, seconds, problem or None) for every bubble line in the log."""
    events = []
    for match in LINE.finditer(log_text):
        kind, _seen, text, problem, frame, seconds = match.groups()
        events.append((f"{'SIGN ' if kind == 'sign' else ''}{text}", int(frame), float(seconds), problem))
    return events


def appearances(events):
    """Group events into runs of one text on screen."""
    by_text = {}
    for text, frame, seconds, problem in events:
        by_text.setdefault(text, []).append((frame, seconds, problem))
    runs = []
    for text, items in by_text.items():
        items.sort(key=lambda item: item[0])
        current = None
        for frame, seconds, problem in items:
            if current is None or frame - current["last"] > GAP_FRAMES:
                current = {"text": text, "first": frame, "last": frame, "t0": seconds, "t1": seconds, "problems": {}}
                runs.append(current)
            current["last"], current["t1"] = frame, seconds
            if problem:
                current["problems"][problem] = current["problems"].get(problem, 0) + 1
    for run in runs:
        run["transient"] = {name: n for name, n in run["problems"].items() if n < MIN_PROBLEM_FRAMES}
        run["problems"] = {name: n for name, n in run["problems"].items() if n >= MIN_PROBLEM_FRAMES}
    runs.sort(key=lambda run: run["first"])
    return runs


def extract(video, frames, frames_dir):
    """One PNG per requested frame number, in order."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for index, frame in enumerate(frames):
        path = frames_dir / f"b_{index:03d}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vf", f"select=eq(n\\,{frame}),scale={TILE_WIDTH}:-2",
                        "-fps_mode", "vfr", "-frames:v", "1", str(path)], check=True)
        paths.append(path)
    return paths


def font(size):
    for name in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def tile_label(run):
    short = {"WORDS CUT by the frame edge": "WORDS CUT", "shape cut by the frame edge": "shape cut", "words on the caption line": "on caption"}
    problems = ", ".join(f"{short[name]} x{count}" for name, count in run["problems"].items()) or "no warning"
    return [f'#{run["n"]}  {run["t0"]:.1f}-{run["t1"]:.1f} s', f'"{run["text"]}"'[:34], problems[:46]]


def sheets(runs, paths, out_dir):
    if not paths:
        return []
    tile_height = Image.open(paths[0]).height
    cell_w, cell_h = TILE_WIDTH + PAD, tile_height + LABEL_HEIGHT + PAD
    per_sheet, written = COLUMNS * ROWS, []
    small, bold = font(17), font(19)
    for start in range(0, len(runs), per_sheet):
        sheet = Image.new("RGB", (COLUMNS * cell_w + PAD, ROWS * cell_h + PAD), "white")
        draw = ImageDraw.Draw(sheet)
        for slot, (run, path) in enumerate(zip(runs[start:start + per_sheet], paths[start:start + per_sheet])):
            x, y = PAD + (slot % COLUMNS) * cell_w, PAD + (slot // COLUMNS) * cell_h
            sheet.paste(Image.open(path), (x, y))
            bad = "WORDS CUT by the frame edge" in run["problems"]
            colour = "#C62828" if bad else ("#B26A00" if run["problems"] else "#1B5E20")
            for line_no, line in enumerate(tile_label(run)):
                draw.text((x, y + tile_height + 4 + line_no * 25), line, fill=colour if line_no == 2 else "black", font=bold if line_no == 1 else small)
        path = out_dir / f"sheet_{start // per_sheet + 1}.png"
        sheet.save(path)
        written.append(path)
    return written


def write_index(runs, out_dir):
    rows = ["# Speech bubbles", "", "| # | Time | Frames | Text | Problems | Verdict |", "|---|---|---|---|---|---|"]
    for run in runs:
        problems = ", ".join(f"{name} x{count}" for name, count in run["problems"].items()) or "none"
        if run["transient"]:
            problems += " (passing: " + ", ".join(f"{name} x{count}" for name, count in run["transient"].items()) + ")"
        rows.append(f'| {run["n"]} | {run["t0"]:.1f}-{run["t1"]:.1f} s | {run["first"]}-{run["last"]} | {run["text"]} | {problems} | |')
    rows += ["", "Verdict: OK, or what is wrong (words cut, shape cut, on a face, under a caption, unreadable). SIGN rows are taped-on signs."]
    (out_dir / "index.md").write_text("\n".join(rows) + "\n")


def main():
    log_only = len(sys.argv) > 2 and sys.argv[2] == "--log-only"
    runs = appearances(parse(Path(sys.argv[1]).read_text(errors="replace")))
    for number, run in enumerate(runs, 1):
        run["n"] = number
    written = []
    if not log_only:
        video, out_dir = Path(sys.argv[2]), Path(sys.argv[3])
        paths = extract(video, [(run["first"] + run["last"]) // 2 for run in runs], out_dir / "frames")
        written = sheets(runs, paths, out_dir)
        write_index(runs, out_dir)
    cut = [run for run in runs if "WORDS CUT by the frame edge" in run["problems"]]
    flagged = [run for run in runs if run["problems"]]
    print(f"{len(runs)} bubble appearances, {len(flagged)} with warnings, {len(cut)} with words cut; sheets: {', '.join(p.name for p in written) or 'none'}")
    for run in flagged:
        print(f'  #{run["n"]} {run["t0"]:.1f} s "{run["text"]}": {", ".join(run["problems"])}')
    sys.exit(1 if cut else 0)


if __name__ == "__main__":
    main()
