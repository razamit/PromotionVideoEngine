// Where TikTok, YouTube Shorts and Instagram Reels draw their own UI over a
// 1080x1920 short: the follow / search tabs at the top, the like / comment /
// share column on the right, and the account name, description, sound and
// nav bar along the bottom. Anything that must be read (captions, a focused
// app capture) stays inside the rest of the frame.
//
// Sources (checked 2026-11-03):
// - reap.video/blog/short-form-video-safe-zones: working margins for all
//   three apps on a 1080x1920 master: top ~15%, left and right 10-15%,
//   bottom 25-35%. It notes the platforms only publish ad safe zones.
// - socialync.io/tools/safe-zones: the ad zones themselves (TikTok bottom
//   660 px, right 120 px; Shorts bottom 672 px, right 192 px; Reels bottom
//   35%). Ads add a CTA bar, so organic posts lose less at the bottom.
// The numbers below are the organic-post zone: the bottom quarter and the
// right 13% are covered, the top 12% holds the tabs.

export const FRAME = { width: 1080, height: 1920 };

/** Covered margins as fractions of the frame. */
export const SAFE_ZONE = {
  top: 0.12, // 230 px: For You / Following tabs, Shorts search bar
  bottom: 0.25, // 480 px: account, description, sound line, nav bar
  left: 0.06, // 65 px
  right: 0.13, // 140 px: like / comment / share / remix column
};

/** The readable box in px, for a frame of the given size. */
export function safeBox(width = FRAME.width, height = FRAME.height) {
  return {
    top: height * SAFE_ZONE.top,
    bottom: height * (1 - SAFE_ZONE.bottom),
    left: width * SAFE_ZONE.left,
    right: width * (1 - SAFE_ZONE.right),
  };
}

/**
 * Clamps a vertical centre (fraction of the frame) so a block of
 * `blockHeight` px stays inside the safe zone.
 */
export function clampCentreY(y: number, blockHeight: number, height = FRAME.height) {
  const box = safeBox(FRAME.width, height);
  const half = blockHeight / 2;
  const min = (box.top + half) / height;
  const max = (box.bottom - half) / height;
  return Math.min(max, Math.max(min, y));
}
