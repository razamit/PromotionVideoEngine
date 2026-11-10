import React, { createContext, useContext, useEffect, useState } from "react";
import { Img, OffthreadVideo, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { ANDROID_CAPTURE, captureToBox, type Box, type CaptureRect, type CaptureSize } from "./captureGeometry";

// Draws a REAL capture (PNG/JPG screenshot or MP4 recording under public/)
// at an exact pixel rectangle inside its box, and tells overlays where the
// capture went. Only ever crops and scales the capture; nothing is drawn.

export const isVideo = (src: string) => /\.(mp4|mov|webm)$/i.test(src);

/**
 * The capture's pixel size: `override` if given, else read from the file
 * (the render waits for it), so an iOS 1080x2348 or a cropped 1080x1720
 * capture is never stretched. Falls back to 1080x2400 if the file can't load.
 */
export function useCaptureSize(src: string | undefined, override?: CaptureSize): CaptureSize {
  const [size, setSize] = useState<CaptureSize | null>(null);
  const needed = Boolean(src) && !override;
  // Created during the first render, as Remotion recommends, so the frame waits.
  const [handle] = useState(() => (needed ? delayRender(`capture size of ${src}`) : null));
  useEffect(() => {
    if (!src || handle === null) return;
    const done = (w: number, h: number) => { setSize(w && h ? [w, h] : ANDROID_CAPTURE); continueRender(handle); };
    if (isVideo(src)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight);
      video.onerror = () => done(0, 0);
      video.src = staticFile(src);
    } else {
      const image = new Image();
      image.onload = () => done(image.naturalWidth, image.naturalHeight);
      image.onerror = () => done(0, 0);
      image.src = staticFile(src);
    }
  }, [src, handle]);
  return override ?? size ?? ANDROID_CAPTURE;
}

export function CaptureMedia({ src, rect, videoStart = 0 }: { src: string; rect: CaptureRect; videoStart?: number }) {
  const { fps } = useVideoConfig();
  const style: React.CSSProperties = {
    position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height,
    maxWidth: "none", display: "block", objectFit: "cover", // cover only matters if a size is wrong: crop, never stretch
  };
  return isVideo(src)
    ? <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(videoStart * fps)} style={style} />
    : <Img src={staticFile(src)} style={style} />;
}

type CaptureSpace = { rect: CaptureRect; box: Box; zoom: number } | null;
const CaptureSpaceContext = createContext<CaptureSpace>(null);
export const CaptureSpaceProvider = CaptureSpaceContext.Provider;

/**
 * Maps capture fractions to fractions of the enclosing phone screen or card,
 * following its scroll, focus zoom or crop. Outside a capture it returns the
 * point unchanged. `zoom` is how much the capture is magnified (1 = cover).
 */
export function useCaptureToScreen() {
  const space = useContext(CaptureSpaceContext);
  return {
    zoom: space?.zoom ?? 1,
    toScreen: (x: number, y: number) => (space ? captureToBox(space.rect, space.box, x, y) : { x, y }),
  };
}
