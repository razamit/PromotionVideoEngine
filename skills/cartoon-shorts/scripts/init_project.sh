#!/usr/bin/env bash
# Set up a project (an app's repo) for cartoon shorts: creates .cartoon-shorts/
# with the series file template and a config. Safe to re-run; never overwrites.
#   init_project.sh [shortsDir]     shortsDir defaults to "shorts"
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DIR="$PROJECT/.cartoon-shorts"
mkdir -p "$DIR"
[[ -f "$DIR/app-series.md" ]] || cp "$HERE/../references/app-series.md" "$DIR/app-series.md"
[[ -f "$DIR/config.json" ]] || printf '{\n  "shortsDir": "%s"\n}\n' "${1:-shorts}" > "$DIR/config.json"
[[ -f "$DIR/README.md" ]] || cat > "$DIR/README.md" <<'MD'
# Cartoon shorts: this project's settings

Read by the cartoon-shorts skill (Claude Code plugin) before every episode.

- `app-series.md`: what a short may claim about this app (with sources),
  the house cast, the story backlog, and the voice and music of every built
  episode.
- `config.json`: `shortsDir`, where new shorts are created.
- Any other `.md` here (for example `capture-notes.md` for how to capture
  this app, `publishing-notes.md` for links and post text rules) is read too
  and overrides the skill's general guidance for this project.
MD
echo "ready: $DIR (fill in app-series.md before the first script)"
