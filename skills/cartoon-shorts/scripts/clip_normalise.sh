#!/bin/zsh
# clip_normalise.sh raw.mp4 out.mp4 [strip.png]
# Re-encodes a screen recording (adb screenrecord or simctl recordVideo, both
# variable frame rate with unreliable timestamps) to constant 30 fps H.264
# that every player and editor accepts, and writes a six-frame contact strip
# so the clip can be checked without watching it.
set -e
in=$1; out=$2; strip=${3:-${out%.*}_strip.png}
[ -f "$in" ] || { echo "no input $in"; exit 1; }
ffmpeg -y -v error -fflags +igndts -i "$in" -vf "fps=30,format=yuv420p" \
  -c:v libx264 -crf 18 -preset slow -movflags +faststart -an "$out"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
tmp=$(mktemp -d)
i=0
for frac in 0.05 0.25 0.45 0.6 0.8 0.97; do
  t=$(python3 -c "print(round($dur*$frac, 2))")
  ffmpeg -y -v error -ss "$t" -i "$out" -frames:v 1 -vf scale=270:-1 "$tmp/f$i.png"
  i=$((i+1))
done
ffmpeg -y -v error -i "$tmp/f0.png" -i "$tmp/f1.png" -i "$tmp/f2.png" -i "$tmp/f3.png" -i "$tmp/f4.png" -i "$tmp/f5.png" \
  -filter_complex hstack=inputs=6 "$strip"
rm -rf "$tmp"
echo "$out: ${dur}s, $(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$out" | head -1); strip $strip"
