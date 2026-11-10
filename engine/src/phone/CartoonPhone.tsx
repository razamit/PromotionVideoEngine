import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INK, OUTLINE } from "../theme/palette";
import { focusRect, mixFocus, scrollRect, type CaptureFocus, type CaptureSize } from "./captureGeometry";
import { CaptureMedia, CaptureSpaceProvider, useCaptureSize } from "./CaptureMedia";

// A cartoon phone in the house outline style with the REAL app inside it.
// The bezel is drawn; the screen never is. `src` must be a real capture
// (screenshot or screen recording) under public/app/, made with// your capture tooling (references/app-footage.md). Do not redraw app UI, notifications or system chrome.
//
// At 60% of the frame width app text is too small to read on a real phone,
// so a phone shot that matters zooms the capture with `focus` (and
// `focusTo` to move during the shot). Overlays placed with capture
// coordinates (TapRing coords="capture") follow the zoom.

export type CartoonPhoneProps = {
  /** Path under public/, e.g. "app/home.png" or "app/nag.mp4". Omit for a phone that is off (black glass, no UI). */
  src?: string;
  /** Phone height in px. Width follows a 9:19.5 body. */
  height?: number;
  /** Pixel size of the capture file. Read from the file when omitted. */
  captureSize?: CaptureSize;
  /** Pan through a tall capture: y from..to in percent (0 top, 100 bottom). Ignored when `focus` is set. */
  scrollFrom?: number;
  scrollTo?: number;
  /** Zoom into the capture: {x, y} in capture fractions goes to the screen centre, zoom 2 = twice the cover size. */
  focus?: CaptureFocus;
  /** Where the focus ends; eased over the first 80% of the shot, then held so the text can be read. */
  focusTo?: CaptureFocus;
  /** For a video src: seconds into the recording to start from. */
  videoStart?: number;
  /** Wiggle and buzz lines, for a ringing or nagging phone. */
  buzzing?: boolean;
  tilt?: number;
  children?: React.ReactNode; // overlays inside the screen, e.g. <NotificationDrop>, <TapRing coords="capture">
};

function BuzzLines({ width, height }: { width: number; height: number }) {
  const frame = useCurrentFrame();
  if (Math.floor(frame / 3) % 2 === 1) return null;
  const line = (x: number, y: number, dx: number) => (
    <path key={`${x}-${y}`} d={`M${x} ${y} l${dx} -14 M${x} ${y + 40} l${dx} 0 M${x} ${y + 80} l${dx} 14`} stroke={INK} strokeWidth={OUTLINE} strokeLinecap="round" />
  );
  return (
    <svg width={width + 200} height={height} style={{ position: "absolute", left: -100, top: 0, overflow: "visible" }}>
      {line(60, height * 0.3, -40)}
      {line(width + 140, height * 0.3, 40)}
    </svg>
  );
}

/** The capture's rectangle on the screen at this frame: focus zoom if set, else the scroll. */
function useScreenRect(screen: { width: number; height: number }, props: CartoonPhoneProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const capture = useCaptureSize(props.src, props.captureSize);
  if (props.focus) {
    const t = interpolate(frame, [0, Math.max(1, durationInFrames * 0.8)], [0, 1], {
      extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.2, 1),
    });
    const focus = props.focusTo ? mixFocus(props.focus, props.focusTo, t) : props.focus;
    return { rect: focusRect(screen, capture, focus), zoom: Math.max(1, focus.zoom) };
  }
  const posY = interpolate(frame, [0, durationInFrames], [props.scrollFrom ?? 0, props.scrollTo ?? 0], { extrapolateRight: "clamp" });
  return { rect: scrollRect(screen, capture, posY), zoom: 1 };
}

export function CartoonPhone(props: CartoonPhoneProps) {
  const { src, height = 1300, videoStart = 0, buzzing = false, tilt = 0, children } = props;
  const frame = useCurrentFrame();
  const width = Math.round((height * 9) / 19.5);
  const bezel = Math.round(height * 0.018);
  const screen = { width: width - 2 * (bezel + OUTLINE), height: height - 2 * (bezel + OUTLINE) };
  const { rect, zoom } = useScreenRect(screen, props);
  const wiggle = buzzing ? Math.sin(frame * 2.4) * 4 : 0;

  return (
    <div style={{ position: "relative", width, height, transform: `rotate(${tilt + wiggle}deg)` }}>
      {buzzing ? <BuzzLines width={width} height={height} /> : null}
      <div style={{ position: "absolute", inset: 0, borderRadius: width * 0.16, background: "#1D1D22", border: `${OUTLINE}px solid ${INK}`, boxSizing: "border-box", padding: bezel }}>
        <div style={{ position: "relative", width: screen.width, height: screen.height, borderRadius: width * 0.13, overflow: "hidden", background: "#000" }}>
          {!src ? (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #2A2A33 0%, #0E0E12 60%)" }} />
          ) : (
            <CaptureMedia src={src} rect={rect} videoStart={videoStart} />
          )}
          <CaptureSpaceProvider value={{ rect, box: screen, zoom }}>{children}</CaptureSpaceProvider>
        </div>
      </div>
    </div>
  );
}

/** Slides a REAL notification crop (cut from a capture, never drawn) down from the top of the screen. */
export function NotificationDrop({ src, delayFrames = 0, widthPercent = 94 }: { src: string; delayFrames?: number; widthPercent?: number }) {
  const frame = useCurrentFrame() - delayFrames;
  const y = interpolate(frame, [0, 7], [-120, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  if (frame < 0) return null;
  return <Img src={staticFile(src)} style={{ position: "absolute", top: "2.5%", left: `${(100 - widthPercent) / 2}%`, width: `${widthPercent}%`, transform: `translateY(${y}%)`, filter: "drop-shadow(0 10px 14px rgba(0,0,0,.35))" }} />;
}
