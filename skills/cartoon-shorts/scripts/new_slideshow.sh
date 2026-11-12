#!/usr/bin/env bash
# Start a new TikTok photo-mode slideshow in the current project.
#   new_slideshow.sh [--format <name>] [--brief <path>] [--from-short <short>] <slug>
# --format picks the template (default things-that-fixed; list them with
# `npm run formats` inside any slideshow, or see references/slideshow-formats.md).
# --brief points at a product brief other than .cartoon-shorts/product-brief.md,
# for a repo that holds more than one product.
# --from-short names one of the product's cartoon shorts as the slideshow's
# source: its real captures are found by file name and its frames are the
# default for scene: slides (see short_digest.sh for what the short offers).
# The slideshow lands in <project>/<slideshowsDir>/<product>/<slug>/, where
# slideshowsDir comes from .cartoon-shorts/config.json ("slideshows" if unset)
# and <product> is the brief's product name.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
bash "$HERE/ensure_engine.sh"
ENGINE="$(bash "$HERE/ensure_engine.sh" --where)"
[[ -f "$ENGINE/scripts/slideshow/scaffold_deck.mjs" ]] || { echo "the installed engine has no slideshow mode; update the plugin" >&2; exit 1; }
node "$ENGINE/scripts/slideshow/scaffold_deck.mjs" "$@"
