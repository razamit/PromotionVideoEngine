#!/usr/bin/env bash
# Start a new cartoon short in the current project.
#   new_short.sh [--style bean|toy] <slug> [dest_dir]
# --style picks the starter: bean (default, the 2D bean characters, 45-60 s
# story) or toy (3D toy figures in a lit set, 20-30 s, references/toy-style.md).
# dest_dir defaults to <project>/<shortsDir>/<slug>, where <project> is the git
# root of the current folder (or the folder itself) and shortsDir comes from
# <project>/.cartoon-shorts/config.json ("shorts" if unset). It installs or
# updates the shared engine (ensure_engine.sh), copies the engine's example
# short (a smoke-test script.json, demo scenes registry and two demo captures
# in public/app/; delete those once the short has its own) and writes the
# short's package.json, whose npm scripts run the engine from its stable home.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
STYLE="bean"
if [[ "${1:-}" == "--style" ]]; then STYLE="${2:?--style needs bean or toy}"; shift 2; fi
case "$STYLE" in
  bean) STARTER="example" ;;
  toy) STARTER="example-toy" ;;
  *) echo "unknown style: $STYLE (use bean or toy)" >&2; exit 1 ;;
esac
SLUG="${1:?usage: new_short.sh [--style bean|toy] <slug> [dest_dir]}"
PROJECT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CONFIG="$PROJECT/.cartoon-shorts/config.json"
SHORTS_DIR="shorts"
if [[ -f "$CONFIG" ]]; then
  SHORTS_DIR="$(node -e 'const c=require(process.argv[1]); process.stdout.write(c.shortsDir||"shorts")' "$CONFIG")"
fi
DEST="${2:-$PROJECT/$SHORTS_DIR/$SLUG}"
if [[ -e "$DEST/script.json" ]]; then echo "already exists: $DEST" >&2; exit 1; fi
[[ -f "$PROJECT/.cartoon-shorts/app-series.md" ]] || echo "note: no .cartoon-shorts/app-series.md in $PROJECT yet; run init_project.sh and fill it in before writing claims" >&2

bash "$HERE/ensure_engine.sh"
ENGINE="$(bash "$HERE/ensure_engine.sh" --where)"

mkdir -p "$DEST"
[[ -d "$ENGINE/$STARTER" ]] || { echo "the installed engine has no $STARTER starter; update the plugin" >&2; exit 1; }
rsync -a --exclude out --exclude .cache --exclude .public --exclude public/vo --exclude node_modules "$ENGINE/$STARTER/" "$DEST/"
(cd "$DEST" && node -e '
const [slug] = process.argv.slice(1);
const engine = "\"${CARTOON_SHORTS_HOME:-$HOME/.cache/cartoon-shorts}/engine/bin/short.mjs\"";
const cmds = ["timeline","table","music","lint","typecheck","check","studio","still","render","finish","review","bubbles","frames","remotion"];
const pkg = { name: slug, private: true,
  description: "One cartoon short. Runs on the shared cartoon-shorts engine (installed by the cartoon-shorts Claude Code plugin).",
  scripts: Object.fromEntries(cmds.map((c) => [c, `node ${engine} ${c}`])) };
require("fs").writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
' "$SLUG")
printf 'out/\npublic/vo/\n.cache/\npublic/music/takes/\n.public/\nnode_modules\n' > "$DEST/.gitignore"
echo "ready: $DEST ($STYLE style)"
[[ -x "${CARTOON_SHORTS_PY:-$HOME/.cache/cartoon-shorts/venv-audio/bin/python}" ]] || echo "note: no local TTS venv; npm run timeline will fall back to macOS say. Setup: references/voice-and-audio.md"
echo "next: cd $DEST, edit script.json, then npm run timeline && npm run studio"
