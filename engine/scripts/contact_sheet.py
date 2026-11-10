#!/usr/bin/env python3
"""Frames every 0.5 s -> labelled contact sheets for the self-review.

Called by scripts/review_frames.sh, which extracts the frames with ffmpeg.
The local ffmpeg has no drawtext filter, so the labels are drawn here with
Pillow. Each tile shows the frame with the platform safe-zone lines drawn
across it, and under it the timestamp, the shot index (timeline index, the
same one `npm run lint` prints) and the scene with its camera move. A teal
bar over a tile marks the first frame of a new shot.

Usage: contact_sheet.py <frames_dir> <timeline.json> <out_dir> <step_seconds> [safeZone.ts]
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLUMNS, ROWS = 4, 5
TILE_WIDTH = 300
LABEL_HEIGHT = 70
GAP = 10
HEADER_HEIGHT = 56
DEFAULT_SAFE_ZONE = (0.12, 0.75)
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
BACKGROUND, INK, MUTED = (24, 24, 27), (250, 250, 250), (170, 170, 180)
NEW_SHOT, SAFE_LINE = (45, 180, 170), (255, 70, 70)


def load_font(size):
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def load_safe_zone(path):
    """Same reading as lint_shots.mjs: top/bottom as fractions or px of 1920."""
    if not path or not Path(path).exists():
        return DEFAULT_SAFE_ZONE
    code = re.sub(r"/\*.*?\*/|//[^\n]*", "", Path(path).read_text(), flags=re.DOTALL)
    block = re.search(r"SAFE_ZONE\s*=\s*\{([^}]*)\}", code)
    source = block.group(1) if block else code

    def pick(name, fallback):
        match = re.search(rf"{name}\w*[\"']?\s*[:=]\s*([0-9.]+)", source, re.IGNORECASE)
        if not match:
            return fallback
        value = float(match.group(1))
        return value / 1920 if value > 1 else value

    top = pick("top", DEFAULT_SAFE_ZONE[0])
    bottom = pick("bottom", DEFAULT_SAFE_ZONE[1])
    return top, (1 - bottom if bottom < 0.5 else bottom)


def shot_at(shots, t):
    for shot in shots:
        if shot["start"] <= t < shot["end"]:
            return shot
    return shots[-1]


def label_for(shot, t, is_new):
    move = (shot.get("camera") or {}).get("move", "hold")
    enter = shot.get("enter")
    extra = f" +{enter}" if enter and enter != "cut" else ""
    return f"{t:5.1f}s  #{shot['index']}{'  NEW' if is_new else ''}", f"{shot['scene']} {move}{extra}"


def draw_tile(frame_path, shot, t, is_new, safe_zone, fonts):
    frame = Image.open(frame_path).convert("RGB")
    height = round(frame.height * TILE_WIDTH / frame.width)
    frame = frame.resize((TILE_WIDTH, height), Image.LANCZOS)
    tile = Image.new("RGB", (TILE_WIDTH, height + LABEL_HEIGHT), BACKGROUND)
    tile.paste(frame, (0, 0))
    draw = ImageDraw.Draw(tile)
    for fraction in safe_zone:
        y = round(fraction * height)
        draw.line([(0, y), (TILE_WIDTH, y)], fill=SAFE_LINE, width=2)
    if is_new:
        draw.rectangle([0, 0, TILE_WIDTH, 7], fill=NEW_SHOT)
    first, second = label_for(shot, t, is_new)
    draw.text((8, height + 6), first, font=fonts["big"], fill=INK)
    draw.text((8, height + 38), second, font=fonts["small"], fill=MUTED)
    return tile


def build_sheet(tiles, number, time_range, fonts):
    tile_w, tile_h = tiles[0].size
    width = COLUMNS * tile_w + (COLUMNS + 1) * GAP
    height = HEADER_HEIGHT + ROWS * tile_h + (ROWS + 1) * GAP
    sheet = Image.new("RGB", (width, height), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    header = f"sheet {number:02d}   {time_range[0]:.1f}s to {time_range[1]:.1f}s   red lines: caption safe zone"
    draw.text((GAP, 14), header, font=fonts["big"], fill=INK)
    for i, tile in enumerate(tiles):
        col, row = i % COLUMNS, i // COLUMNS
        sheet.paste(tile, (GAP + col * (tile_w + GAP), HEADER_HEIGHT + GAP + row * (tile_h + GAP)))
    return sheet


def write_shot_list(shots, out_dir):
    lines = []
    for shot in shots:
        move = (shot.get("camera") or {}).get("move", "hold")
        src = (shot.get("params") or {}).get("src", "")
        lines.append(f"#{shot['index']:<3} {shot['start']:6.2f}s  {shot['end'] - shot['start']:4.2f}s  "
                     f"{shot['scene']:<20} {move:<9} {src}".rstrip())
    (out_dir / "shots.txt").write_text("\n".join(lines) + "\n")


def main():
    frames_dir, timeline_file, out_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    step = float(sys.argv[4])
    safe_zone = load_safe_zone(sys.argv[5] if len(sys.argv) > 5 else None)
    shots = json.loads(timeline_file.read_text())["shots"]
    fonts = {"big": load_font(24), "small": load_font(20)}
    frames = sorted(frames_dir.glob("f_*.png"))
    per_sheet = COLUMNS * ROWS
    previous_index = None
    for sheet_start in range(0, len(frames), per_sheet):
        tiles, times = [], []
        for offset, frame_path in enumerate(frames[sheet_start:sheet_start + per_sheet]):
            t = (sheet_start + offset) * step
            shot = shot_at(shots, t)
            tiles.append(draw_tile(frame_path, shot, t, shot["index"] != previous_index, safe_zone, fonts))
            previous_index = shot["index"]
            times.append(t)
        number = sheet_start // per_sheet + 1
        build_sheet(tiles, number, (times[0], times[-1]), fonts).save(out_dir / f"sheet_{number:02d}.png")
    write_shot_list(shots, out_dir)
    print(f"wrote {(len(frames) + per_sheet - 1) // per_sheet} sheets and shots.txt to {out_dir}")


if __name__ == "__main__":
    main()
