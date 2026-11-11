#!/usr/bin/env bash
# Final pass for upload: loudness to -14 LUFS (TikTok, Shorts, Reels all
# normalise near there), true peak -2 dBTP (the reference measures -2.1),
# H.264 high profile, faststart. A gentle compressor first tightens the
# loudness range toward the reference's 2-3 LU; two-pass loudnorm after it.
#
# The peak is checked on the encoded AAC, not on the levelled audio: the
# encoder can add peaks of its own. A square-wave music bed levelled to
# -2.0 dBTP came out of the 192k encode at +0.3 to +2.2 dBTP (2026-11-11).
# So the audio is encoded on its own, measured, and encoded again at a
# higher bitrate and then under a limiter until it holds. The step fails
# when no attempt gets under -1 dBTP.
# Usage: scripts/finish.sh in.mp4 out.mp4
set -euo pipefail
IN="$1"; OUT="$2"
COMP="acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=2"
TARGET_PEAK=-2        # dBTP the levelling aims for
ACCEPT_PEAK=-1.7      # an encode at or under this is taken as it is
FAIL_PEAK=-1          # the best encode over this fails the step
# Each attempt: "bitrate limiter-ceiling-in-dB" (0 = no limiter).
ATTEMPTS=("192k 0" "256k 0" "256k -3" "320k -4" "320k -6")

if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  echo "no audio stream in $IN; copying video with faststart only"
  ffmpeg -v error -y -i "$IN" -c copy -movflags +faststart "$OUT"; exit 0
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/cartoon-finish.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

# Integrated loudness and true peak of a file, as "I Peak".
loudness_and_peak() {
  ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
    | awk '/^ +I:/ {i=$2} /^ +Peak:/ {p=$2} END {print i, p}'
}
at_most() { awk -v a="$1" -v b="$2" 'BEGIN {exit !(a <= b)}'; }

# Compressor plus two-pass loudnorm, written as a 24-bit WAV for the encodes.
level_audio() {
  local stats
  stats=$(ffmpeg -hide_banner -i "$IN" -af "$COMP,loudnorm=I=-14:TP=$TARGET_PEAK:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  get() { echo "$stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
  ffmpeg -v error -y -i "$IN" -vn \
    -af "$COMP,loudnorm=I=-14:TP=$TARGET_PEAK:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
    -ar 48000 -c:a pcm_s24le "$1"
}

# Encodes the levelled WAV to AAC; a ceiling below 0 puts a limiter in front.
encode_audio() {
  local bitrate="$1" ceiling="$2" output="$3" filter=()
  if [ "$ceiling" != "0" ]; then
    local linear; linear=$(awk -v db="$ceiling" 'BEGIN {printf "%.4f", 10 ^ (db / 20)}')
    filter=(-af "alimiter=limit=${linear}:attack=1:release=60:level=disabled")
  fi
  ffmpeg -v error -y -i "$WORK/levelled.wav" ${filter[@]+"${filter[@]}"} -c:a aac -b:a "$bitrate" -ar 48000 "$output"
}

# Tries each attempt in turn, keeps the lowest peak in $WORK/audio.m4a and
# stops at the first one that holds. Sets BEST_PEAK and BEST_SETTING.
encode_until_peak_holds() {
  BEST_PEAK=""; BEST_SETTING=""
  local attempt bitrate ceiling peak
  for attempt in "${ATTEMPTS[@]}"; do
    read -r bitrate ceiling <<<"$attempt"
    encode_audio "$bitrate" "$ceiling" "$WORK/attempt.m4a"
    peak=$(loudness_and_peak "$WORK/attempt.m4a" | awk '{print $2}')
    if [ -z "$BEST_PEAK" ] || at_most "$peak" "$BEST_PEAK"; then
      BEST_PEAK="$peak"; BEST_SETTING="aac $bitrate, limiter ${ceiling/#0/off}"
      mv "$WORK/attempt.m4a" "$WORK/audio.m4a"
    fi
    if at_most "$peak" "$ACCEPT_PEAK"; then return 0; fi
    echo "finish: aac $bitrate, limiter ${ceiling/#0/off}: true peak $peak dBTP, over $ACCEPT_PEAK; trying the next setting"
  done
}

level_audio "$WORK/levelled.wav"
encode_until_peak_holds
if ! at_most "$BEST_PEAK" "$FAIL_PEAK"; then
  echo "finish: FAILED. Best true peak is $BEST_PEAK dBTP ($BEST_SETTING), over $FAIL_PEAK dBTP. Nothing written to $OUT." >&2
  echo "finish: lower the music bed or the sound effects in the mix and render again." >&2
  exit 1
fi

ffmpeg -v error -y -i "$IN" -i "$WORK/audio.m4a" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -profile:v high -crf 18 -preset slow -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart "$OUT"

read -r FINAL_LOUDNESS FINAL_PEAK <<<"$(loudness_and_peak "$OUT")"
echo "    I:         $FINAL_LOUDNESS LUFS"
echo "    Peak:      $FINAL_PEAK dBTP ($BEST_SETTING)"
if ! at_most "$FINAL_PEAK" "$FAIL_PEAK"; then
  echo "finish: FAILED. $OUT measures $FINAL_PEAK dBTP, over $FAIL_PEAK dBTP." >&2
  exit 1
fi
if ! at_most "$FINAL_PEAK" "$ACCEPT_PEAK"; then
  echo "finish: warning: true peak $FINAL_PEAK dBTP is over the $TARGET_PEAK dBTP target (under the $FAIL_PEAK limit)"
fi
echo "wrote $OUT"
