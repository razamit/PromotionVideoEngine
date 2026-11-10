#!/usr/bin/env bash
# Final pass for upload: loudness to -14 LUFS (TikTok, Shorts, Reels all
# normalise near there), true peak -2 dBTP (the reference measures -2.1),
# H.264 high profile, faststart. A gentle compressor first tightens the
# loudness range toward the reference's 2-3 LU; two-pass loudnorm after it.
# Usage: scripts/finish.sh in.mp4 out.mp4
set -euo pipefail
IN="$1"; OUT="$2"
COMP="acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=2"
if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  echo "no audio stream in $IN; copying video with faststart only"
  ffmpeg -v error -y -i "$IN" -c copy -movflags +faststart "$OUT"; exit 0
fi
STATS=$(ffmpeg -hide_banner -i "$IN" -af "$COMP,loudnorm=I=-14:TP=-2:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$IN" \
  -af "$COMP,loudnorm=I=-14:TP=-2:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -c:v libx264 -profile:v high -crf 18 -preset slow -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "wrote $OUT"
