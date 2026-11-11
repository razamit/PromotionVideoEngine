#!/usr/bin/env python3
"""Frames of every shot that shows a real app capture, for two verdicts each.

For each short folder given, reads generated/timeline.json, finds the
shots whose params reference a capture under app/, and pulls one full-size
frame from out/short_final.mp4 at 70% of the shot (after zooms and pops have
landed), or halfway through a callout that leaves before the cut
(`untilSeconds`). Writes, into <short>/out/textcheck/:

  shot_NN.png     the full 1080x1920 frame
  element_NN.png  the element the shot declares, cut from the capture itself
                  with its box outlined: what "whole" looks like
  sheet_K.png     six frames per sheet at 360x640, about the size a phone
                  shows them, each with its element underneath
  index.md        one row per frame, with two cells to fill in:
                    Readable?  yes / no: the text reads at phone size
                    Whole?     yes / no: every edge of the element is on
                               screen (its last button, the end of its text)

Both must be yes. A 1.6x zoom makes a banner readable and cuts its
right-hand button off; the first toy short passed a readable-only check
that way (2026-11-10).

  app_text_frames.py <short folder> [...]           pull frames, write the sheets and index.md
  app_text_frames.py --check <short folder> [...]   exit 1 unless every row says yes twice

--check also fails when out/short_final.mp4 is newer than index.md (the
frames are from an older render). A rerun keeps a row's verdicts only while
its capture and framing are unchanged; a changed row starts empty and its
old verdicts move below the table. Text above the table and notes below it
are kept. Folders without generated/timeline.json are skipped with a note.

Rule of thumb (references/app-footage.md): app body text should be about
28 px tall or more in the full frame. On the sheets that is about 9 px; if
you have to squint at a sheet tile, open the full frame and measure.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

TILE = (360, 640)
LABEL = 28
STRIP = 124  # room under a tile for the element cut from the capture
PER_SHEET = 6
HEADER = "| Shot | Time | Scene | Capture | Framing | Readable? | Whole? |"
VIDEO = (".mp4", ".mov", ".webm")


def capture_of(params):
    """The first app/ path anywhere in the shot's params, or None."""
    text = json.dumps(params or {})
    start = text.find('"app/')
    return None if start < 0 else text[start + 1:text.find('"', start + 1)]


def framing_part(params, name=""):
    if "crop" in params:
        return f"{name}crop {json.dumps(params['crop'])}"
    if "focus" in params:
        landing = f" to {json.dumps(params['focusTo'])}" if "focusTo" in params else ""
        return f"{name}focus {json.dumps(params['focus'])}{landing}"
    return f"{name}whole capture" if name else ""


def framing_of(params):
    """How the capture is framed: the shot's own crop or focus, its floating phone, its callout."""
    params = params or {}
    parts = [framing_part(params)]
    if isinstance(params.get("phone"), dict):
        parts.append(framing_part(params["phone"], "phone "))
    if isinstance(params.get("callout"), dict):
        parts.append(framing_part(params["callout"], "callout "))
    return "; ".join(p for p in parts if p) or "full capture"


def element_of(params):
    """(capture, box, videoStart) of the element the shot says it shows, or None when it declares none."""
    params = params or {}
    callout, phone = params.get("callout") or {}, params.get("phone") or {}
    for holder, box in ((callout, callout.get("element") or callout.get("crop")), (phone, phone.get("element")), (params, params.get("element"))):
        if isinstance(box, dict) and isinstance(holder.get("src"), str):
            return holder["src"], box, holder.get("videoStart", 0)
    return None


def sample_seconds(shot):
    """Seconds into the shot to look at: 70% in, or the middle of a callout that fades out before the cut."""
    callout = (shot.get("params") or {}).get("callout")
    late = 0.7 * (shot["end"] - shot["start"])
    if not isinstance(callout, dict) or "untilSeconds" not in callout:
        return late
    middle = (callout.get("atSeconds", 0) + callout["untilSeconds"]) / 2
    return max(0.0, min(late, middle))


def grab(video, seconds, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, seconds):.3f}", "-i", str(video),
                    "-frames:v", "1", str(out)], check=True)


def element_image(short, element, seconds_in, out):
    """The declared element cut from the capture with a margin, its box in red. Returns `out`, or None."""
    src, box, video_start = element
    source = short / "public" / src
    if not source.exists():
        return None
    if source.suffix.lower() in VIDEO:
        grab(source, video_start + seconds_in, out)
        source = out
    capture = Image.open(source).convert("RGB")
    w, h = capture.size
    left, top, right, bottom = box["x"] * w, box["y"] * h, (box["x"] + box["w"]) * w, (box["y"] + box["h"]) * h
    margin = 0.03 * w
    region = (max(0, left - margin), max(0, top - margin), min(w, right + margin), min(h, bottom + margin))
    ImageDraw.Draw(capture).rectangle((left, top, right, bottom), outline=(230, 30, 40), width=4)
    capture.crop(tuple(int(v) for v in region)).save(out)
    return out


def write_sheets(rows, folder):
    row_height = LABEL + TILE[1] + STRIP
    for k in range(0, len(rows), PER_SHEET):
        chunk = rows[k:k + PER_SHEET]
        sheet = Image.new("RGB", (TILE[0] * 3, row_height * ((len(chunk) + 2) // 3)), "white")
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(chunk):
            x, y = (i % 3) * TILE[0], (i // 3) * row_height
            sheet.paste(Image.open(row["file"]).resize(TILE), (x, y + LABEL))
            draw.text((x + 6, y + 6), f"#{row['index']} {row['time']:.1f}s {row['capture'].split('/')[-1]}", fill="black")
            below = y + LABEL + TILE[1]
            if row["element"]:
                element = Image.open(row["element"])
                element.thumbnail((TILE[0] - 12, STRIP - 26))
                sheet.paste(element, (x + 6, below + 20))
                draw.text((x + 6, below + 4), "must be whole (from the capture):", fill=(200, 30, 40))
            else:
                draw.text((x + 6, below + 4), "no element declared", fill="gray")
        sheet.save(folder / f"sheet_{k // PER_SHEET + 1}.png")


def parse_row(line):
    """A table row -> (shot, {capture, framing, readable, whole}). Reads the older one-verdict table too."""
    cells = [c.strip() for c in line.strip().strip("|").split("|", 6)]
    if len(cells) < 6 or not cells[0].startswith("#"):
        return None
    whole = cells[6] if len(cells) > 6 else ""
    return cells[0], {"capture": cells[3], "framing": cells[4], "readable": cells[5], "whole": whole}


def read_index(path):
    """Text above the table, the rows by shot ("#12"), and text below the table."""
    if not path.exists():
        return [], {}, []
    head, rows, tail, state = [], {}, [], "head"
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
        elif parse_row(line):
            shot, row = parse_row(line)
            rows[shot] = row
    return head, rows, tail


def write_index(path, rows):
    head, old, tail = read_index(path)
    lines = head + [HEADER, "|---|---|---|---|---|---|---|"]
    kept, dropped = 0, []
    for r in rows:
        before = old.pop(f"#{r['index']}", None)
        same = before and before["capture"] == r["capture"] and before["framing"] == r["framing"]
        readable, whole = (before["readable"], before["whole"]) if same else ("", "")
        kept += bool(readable or whole)
        if before and not same and (before["readable"] or before["whole"]):
            dropped.append((f"#{r['index']}", before, "framing changed"))
        lines.append(f"| #{r['index']} | {r['time']:.1f} s | {r['scene']} | {r['capture']} | {r['framing']} | {readable} | {whole} |")
    dropped += [(shot, row, "no longer an app shot") for shot, row in old.items() if row["readable"] or row["whole"]]
    if dropped:
        lines += ["", "Verdicts not carried over (answer again on the new frame):", ""]
        lines += [f"- {shot} ({why}): readable {row['readable'] or '-'}, whole {row['whole'] or '-'}, was {row['framing']}" for shot, row, why in dropped]
    path.write_text("\n".join(lines + tail).rstrip("\n") + "\n")
    return kept, len(dropped)


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
        seconds_in = sample_seconds(shot)
        out = folder / f"shot_{shot['index']:02d}.png"
        grab(video, shot["start"] + seconds_in, out)
        element = element_of(shot.get("params"))
        cut = element_image(short, element, seconds_in, folder / f"element_{shot['index']:02d}.png") if element else None
        rows.append({"index": shot["index"], "time": shot["start"] + seconds_in, "scene": shot["scene"], "capture": capture,
                     "framing": framing_of(shot.get("params")), "file": out, "element": cut})
    write_sheets(rows, folder)
    kept, dropped = write_index(folder / "index.md", rows)
    print(f"{short.name}: {len(rows)} app shots, {(len(rows) + PER_SHEET - 1) // PER_SHEET} sheets in {folder}"
          f" ({kept} rows kept their verdicts{f', {dropped} need a new one' if dropped else ''})")
    print(f"  fill Readable? and Whole? (yes / no) in {folder / 'index.md'}, then run this with --check")


def check(short):
    """True when every app shot of the short has both verdicts and both say yes."""
    index = short / "out" / "textcheck" / "index.md"
    video = short / "out" / "short_final.mp4"
    if not index.exists():
        print(f"{short.name}: FAIL no out/textcheck/index.md; run app_text_frames.py on it first")
        return False
    if video.exists() and video.stat().st_mtime > index.stat().st_mtime:
        print(f"{short.name}: FAIL out/short_final.mp4 is newer than the frames; rerun app_text_frames.py and answer again")
        return False
    _, rows, _ = read_index(index)
    bad = [(shot, name, row[key]) for shot, row in rows.items() for key, name in (("readable", "Readable?"), ("whole", "Whole?"))
           if not row[key].lower().startswith("yes")]
    for shot, name, value in bad:
        print(f"{short.name}: FAIL {shot} {name} {value or '(empty)'}")
    if not bad:
        print(f"{short.name}: ok, {len(rows)} app shots readable and whole")
    return not bad


def main():
    args = [a for a in sys.argv[1:] if a != "--check"]
    checking = len(args) != len(sys.argv) - 1
    if not args:
        sys.exit(__doc__)
    passed = True
    for arg in args:
        path = Path(arg).resolve()
        if not path.is_dir():
            print(f"{arg}: not a folder, skipped")
        elif checking:
            passed = check(path) and passed
        else:
            review(path)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
