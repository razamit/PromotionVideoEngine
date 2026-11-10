#!/usr/bin/env bash
# Contact sheets for the self-review (references/self-review.md): one frame
# every 0.5 s, 4x5 per sheet, each labelled with its time, shot index and
# scene, written to out/review/sheet_NN.png. Also out/review/first_frame.png
# (full size, the thumbnail most feeds show) and out/review/shots.txt.
#
# Video: the given file, else out/short.mp4 when nothing in scenes/, public/ or
# the timeline is newer, else a fast preview render at 0.4 scale.
# Labels are drawn with Pillow (this ffmpeg has no drawtext), in a venv at
# ~/.cache/cartoon-shorts/venv-review that is created on first run.
# Usage: scripts/review_frames.sh [video.mp4]
set -euo pipefail
ENGINE="$(cd "$(dirname "$0")/.." && pwd)"
SHORT="${SHORT_DIR:-$PWD}"
cd "$SHORT"
remotion() { node "$ENGINE/bin/short.mjs" remotion "$@"; }
TIMELINE=generated/timeline.json
OUT=out/review
STEP=0.5
VENV="$HOME/.cache/cartoon-shorts/venv-review"
[[ -f "$TIMELINE" ]] || { echo "no $TIMELINE; run npm run timeline first" >&2; exit 1; }

is_current() { [[ -f "$1" ]] && [[ -z "$(find scenes generated public script.json -newer "$1" -type f -print -quit 2>/dev/null)" ]]; }

pick_video() {
  if [[ -n "${1:-}" ]]; then echo "$1"; return; fi
  if is_current out/short.mp4; then echo out/short.mp4; return; fi
  if is_current out/preview.mp4; then echo out/preview.mp4; return; fi
  echo "rendering a 0.4-scale preview (out/preview.mp4)" >&2
  remotion render Short out/preview.mp4 --scale=0.4 --log=error >&2
  echo out/preview.mp4
}

ensure_venv() {
  if [[ ! -x "$VENV/bin/python" ]] || ! "$VENV/bin/python" -c "import PIL" 2>/dev/null; then
    echo "creating $VENV (Pillow)" >&2
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --disable-pip-version-check pillow
  fi
}

first_frame() {
  local video="$1" width
  width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$video")
  if [[ "$width" -ge 1080 ]]; then
    ffmpeg -v error -y -i "$video" -frames:v 1 "$OUT/first_frame.png"
  else
    remotion still Short "$OUT/first_frame.png" --frame=0 --log=error
  fi
}

main() {
  local video fps every
  video=$(pick_video "${1:-}")
  echo "reviewing $video"
  rm -rf "$OUT"; mkdir -p "$OUT/frames"
  fps=$(node -e "console.log(require('$SHORT/$TIMELINE').fps ?? 30)")
  every=$(python3 -c "print(max(1, round($fps * $STEP)))")
  ffmpeg -v error -y -i "$video" -vf "select='not(mod(n\,$every))',scale=300:-2" -fps_mode vfr "$OUT/frames/f_%04d.png"
  first_frame "$video"
  ensure_venv
  "$VENV/bin/python" -I "$ENGINE/scripts/contact_sheet.py" "$OUT/frames" "$TIMELINE" "$OUT" \
    "$(python3 -c "print($every / $fps)")" "$ENGINE/src/layout/safeZone.ts"
  rm -rf "$OUT/frames"
  ls "$OUT"
}

main "$@"
