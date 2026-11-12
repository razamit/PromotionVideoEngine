import React from "react";
import { Img, staticFile } from "remotion";
import { cropRect } from "../../phone/captureGeometry";
import type { DeckScreenshot } from "../deckTypes";

// A region of a REAL screenshot, cropped and scaled only. No device frame and
// no drawn UI: the pixels are the product's own. The rounded corners and the
// hairline are the only things added.

export type ScreenshotCropProps = { screenshot: DeckScreenshot; width: number; height: number; cornerRadius: number };

/** Width over height of the cropped region, in screen pixels. */
export function cropAspect(screenshot: DeckScreenshot): number {
  const [captureWidth, captureHeight] = screenshot.size;
  return (screenshot.crop.w * captureWidth) / (screenshot.crop.h * captureHeight);
}

export const ScreenshotCrop: React.FC<ScreenshotCropProps> = ({ screenshot, width, height, cornerRadius }) => {
  const rect = cropRect({ width, height }, screenshot.crop);
  return (
    <div style={{
      position: "relative", width, height, overflow: "hidden", borderRadius: cornerRadius, flexShrink: 0,
      boxShadow: "0 0 0 2px rgba(255,255,255,0.14)", background: "#000",
    }}>
      <Img src={staticFile(screenshot.src)} style={{
        position: "absolute", left: rect.left, top: rect.top, width: rect.width, height: rect.height, maxWidth: "none", display: "block",
      }} />
    </div>
  );
};
