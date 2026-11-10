#!/usr/bin/env bash
# Bubble check for the self-review (references/self-review.md, "Speech
# bubbles"): renders a half-scale preview with the render log on, collects
# what every SpeechBurst and Sign reported while rendering (src/scenes/textBoxAudit.ts
# logs a "seen" line every 10 frames and a warning when its words or star are
# cut by the frame edge or its words sit on the caption line), then writes
# out/bubblecheck/:
#   sheet_K.png  one tile per bubble or sign appearance (middle frame), labelled
#   index.md     appearance, frames, text, problems, an empty Verdict column
#   render.log   the raw render log
# Exits 1 when any bubble's WORDS are cut by the frame edge.
# Usage: scripts/bubble_check.sh
set -euo pipefail
ENGINE="$(cd "$(dirname "$0")/.." && pwd)"
SHORT="${SHORT_DIR:-$PWD}"
cd "$SHORT"
remotion() { node "$ENGINE/bin/short.mjs" remotion "$@"; }
OUT=out/bubblecheck
VENV="$HOME/.cache/cartoon-shorts/venv-review"

ensure_venv() {
  if [[ ! -x "$VENV/bin/python" ]] || ! "$VENV/bin/python" -c "import PIL" 2>/dev/null; then
    echo "creating $VENV (Pillow)" >&2
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --disable-pip-version-check pillow
  fi
}

main() {
  rm -rf "$OUT"; mkdir -p "$OUT/frames"
  echo "rendering a 0.5-scale bubble preview ($OUT/audit.mp4)" >&2
  remotion render Short "$OUT/audit.mp4" --scale=0.5 --log=verbose > "$OUT/render.log" 2>&1 || { tail -20 "$OUT/render.log" >&2; exit 2; }
  ensure_venv
  "$VENV/bin/python" -I "$ENGINE/scripts/bubble_sheet.py" "$OUT/render.log" "$OUT/audit.mp4" "$OUT"
}

main "$@"
