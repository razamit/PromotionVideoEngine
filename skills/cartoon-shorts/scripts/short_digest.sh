#!/usr/bin/env bash
# Print what one of this project's cartoon shorts offers a slideshow: its hook
# and script, the notes behind its claims, the real captures it used with
# ready-made crops, and its saved caption-free frames.
#   short_digest.sh <short folder or slug>
# Run it from inside the product's repo. Read the output before proposing
# slideshows "from the short" (references/slideshow-mode.md, "From a short").
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
bash "$HERE/ensure_engine.sh" >/dev/null
ENGINE="$(bash "$HERE/ensure_engine.sh" --where)"
node "$ENGINE/scripts/slideshow/short_digest.mjs" "$@"
