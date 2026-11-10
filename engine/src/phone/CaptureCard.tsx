import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { INK, OUTLINE } from "../theme/palette";
import { cropHeight, cropRect, type CaptureCrop, type CaptureSize } from "./captureGeometry";
import { CaptureMedia, CaptureSpaceProvider, useCaptureSize } from "./CaptureMedia";

// A region of a REAL capture shown big, as a card with the house outline:
// the notification banner, one task row, the Done / Snooze buttons. It is
// the readable version of a phone shot (episode 1's notification card read
// well where the full phone did not). Crop and scale only: the pixels are
// the capture's. `crop` is in capture fractions, so measure it once on the
// screenshot (or a still of the recording) and it works at any width.

export type CardEntrance = "pop" | "drop" | "slideUp" | "none";

export type CaptureCardProps = {
  /** Screenshot or recording under public/, e.g. "app/banner.mp4". */
  src: string;
  /** Region to show, capture fractions: x, y of the top-left corner, w, h. */
  crop: CaptureCrop;
  /** Outer card width in px, outline included (height follows the crop). Size it for the camera move's peak scale. */
  width?: number;
  /** Pixel size of the capture file. Read from the file when omitted. */
  captureSize?: CaptureSize;
  /** For a video src: seconds into the recording to start from. */
  videoStart?: number;
  entrance?: CardEntrance;
  delayFrames?: number;
  /** Resting tilt in degrees. */
  tilt?: number;
  /** A small alarm wobble, for a nagging notification. */
  wiggle?: boolean;
  radius?: number;
  children?: React.ReactNode; // overlays in capture space, e.g. <TapRing coords="capture">
};

function entranceTransform(entrance: CardEntrance, local: number, fps: number) {
  if (entrance === "none") return { transform: "", opacity: 1 };
  const s = spring({ frame: local, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const opacity = interpolate(local, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (entrance === "drop") return { transform: `translateY(${(1 - s) * -900}px)`, opacity };
  if (entrance === "slideUp") return { transform: `translateY(${(1 - s) * 900}px)`, opacity };
  return { transform: `scale(${0.3 + 0.7 * s})`, opacity };
}

export function CaptureCard({
  src, crop, width = 1000, captureSize, videoStart = 0, entrance = "pop", delayFrames = 0,
  tilt = -3, wiggle = false, radius = 44, children,
}: CaptureCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const capture = useCaptureSize(src, captureSize);
  const local = frame - delayFrames;
  if (local < 0) return null;
  // The card is border-box (Remotion's global style), so the capture fills the
  // box inside the outline; sizing it to the outer box lost 2 x OUTLINE px on
  // the right and bottom edges of every crop.
  const inner = width - 2 * OUTLINE;
  const box = { width: inner, height: Math.round(cropHeight(inner, crop, capture)) };
  const rect = cropRect(box, crop);
  const enter = entranceTransform(entrance, local, fps);
  const rotate = tilt + (wiggle ? Math.sin(frame * 2.2) * 2.5 : 0);
  return (
    <div style={{ position: "relative", transform: `${enter.transform} rotate(${rotate}deg)`, opacity: enter.opacity }}>
      <div style={{
        position: "relative", width: box.width + 2 * OUTLINE, height: box.height + 2 * OUTLINE, boxSizing: "border-box", overflow: "hidden", borderRadius: radius,
        border: `${OUTLINE}px solid ${INK}`, background: "#000", boxShadow: `10px 14px 0 rgba(0,0,0,0.28)`,
      }}>
        <CaptureMedia src={src} rect={rect} videoStart={videoStart} />
        <CaptureSpaceProvider value={{ rect, box, zoom: 1 }}>{children}</CaptureSpaceProvider>
      </div>
    </div>
  );
}
