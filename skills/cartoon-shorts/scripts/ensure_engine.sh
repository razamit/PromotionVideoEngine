#!/usr/bin/env bash
# Make sure the shared engine is installed at its stable home and current.
#
#   ensure_engine.sh                 sync from this plugin copy if it changed, npm ci if needed
#   ensure_engine.sh --link <dir>    developer mode: make the home a symlink to a checkout's engine/
#   ensure_engine.sh --unlink        leave developer mode (the next run copies the plugin's engine)
#   ensure_engine.sh --where         print the engine home and exit
#
# Why a stable home: an installed plugin lives in a folder whose path changes
# with every version, and old versions are deleted. Every short's package.json
# points at the engine home instead, so shorts keep working across updates.
# Home: $CARTOON_SHORTS_HOME/engine, default ~/.cache/cartoon-shorts/engine.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_ROOT="$(cd "$SKILL_DIR/../.." && pwd)"
SOURCE="$PLUGIN_ROOT/engine"
HOME_DIR="${CARTOON_SHORTS_HOME:-$HOME/.cache/cartoon-shorts}"
TARGET="$HOME_DIR/engine"

case "${1:-}" in
  --where) echo "$TARGET"; exit 0 ;;
  --link)
    CHECKOUT="$(cd "${2:?usage: ensure_engine.sh --link <path to the engine folder of a checkout>}" && pwd)"
    [[ -f "$CHECKOUT/bin/short.mjs" ]] || { echo "not an engine folder: $CHECKOUT" >&2; exit 1; }
    mkdir -p "$HOME_DIR"
    if [[ -e "$TARGET" && ! -L "$TARGET" ]]; then mv "$TARGET" "$TARGET.bak.$(date +%s)"; fi
    ln -sfn "$CHECKOUT" "$TARGET"
    [[ -d "$CHECKOUT/node_modules" ]] || (cd "$CHECKOUT" && npm ci --no-audit --no-fund --loglevel=error)
    echo "engine linked: $TARGET -> $CHECKOUT (edits there reach every short at its next render)"
    exit 0 ;;
  --unlink)
    if [[ -L "$TARGET" ]]; then rm "$TARGET"; echo "unlinked; run again to install the plugin's engine"; else echo "not linked"; fi
    exit 0 ;;
esac

if [[ -L "$TARGET" ]]; then
  echo "engine: developer link $TARGET -> $(readlink "$TARGET")"
  exit 0
fi

[[ -f "$SOURCE/bin/short.mjs" ]] || { echo "engine source missing at $SOURCE" >&2; exit 1; }
command -v node >/dev/null || { echo "Node.js is required (https://nodejs.org)" >&2; exit 1; }
command -v ffmpeg >/dev/null || echo "warning: ffmpeg not found; finish, review and clip tools need it" >&2

# A fingerprint of the engine source (every file except node_modules).
fingerprint() {
  (cd "$1" && find . -path ./node_modules -prune -o -path './.tsconfig.*' -prune -o -type f -print \
    | LC_ALL=C sort | xargs shasum 2>/dev/null | shasum | cut -c1-16)
}
lockhash() { [[ -f "$1/package-lock.json" ]] && shasum "$1/package-lock.json" | cut -c1-16 || echo none; }

WANT="$(fingerprint "$SOURCE")"
HAVE="$(cat "$TARGET/.engine-fingerprint" 2>/dev/null || true)"
if [[ "$WANT" != "$HAVE" ]]; then
  OLD_LOCK="$(lockhash "$TARGET" 2>/dev/null || echo none)"
  mkdir -p "$TARGET"
  rsync -a --delete --exclude node_modules --exclude '.tsconfig.*' --exclude .engine-fingerprint "$SOURCE/" "$TARGET/"
  if [[ "$OLD_LOCK" != "$(lockhash "$TARGET")" || ! -d "$TARGET/node_modules" ]]; then
    echo "engine: installing packages (one time per engine version)..."
    (cd "$TARGET" && npm ci --no-audit --no-fund --loglevel=error)
  fi
  echo "$WANT" > "$TARGET/.engine-fingerprint"
  echo "engine: updated at $TARGET"
else
  [[ -d "$TARGET/node_modules" ]] || (cd "$TARGET" && npm ci --no-audit --no-fund --loglevel=error)
  echo "engine: current at $TARGET"
fi
