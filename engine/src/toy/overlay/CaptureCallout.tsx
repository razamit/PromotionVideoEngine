import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptureMedia, CaptureSpaceProvider, useCaptureSize } from "../../phone/CaptureMedia";
import { cropHeight, cropRect, type CaptureCrop, type CaptureSize } from "../../phone/captureGeometry";
import { SAFE_CENTRE_X, cropOnPhone, type PhonePlace } from "./phoneGeometry";

// One whole element of a real capture (a notification, a settings row, a
// task row) lifted out of the floating phone and shown large, so the phone
// keeps the whole screenshot while the text the line talks about reads.
//
// It exists because zooming the phone cannot do both: a full-width element
// is about 92% of the capture's width and a 1.6x zoom shows 62% of it, so
// the element loses its right-hand end (toy-style.md, "One element, large
// and whole"). The toy-style cousin of phone/CaptureCard: a soft shadow, no
// ink outline. Only a crop of the capture is drawn, never new UI.

export type CaptureCalloutProps = {
  /** Screenshot or recording under public/, normally the one on the phone. */
  src: string;
  /** The element's box on the capture, capture fractions, measured on its own edges so nothing is cut. */
  crop: CaptureCrop;
  /** Only when `crop` is wider than the element: the element's own box, so the lint checks it is inside the crop. Not drawn. */
  element?: CaptureCrop;
  captureSize?: CaptureSize;
  videoStart?: number;
  /** Outer width in px; the height follows the crop. 800 clears the frame edge through a full push. */
  width?: number;
  /** Centre, fractions of the frame. */
  x?: number;
  y?: number;
  /** Corner radius as a fraction of the width; match the element's own corners. */
  corner?: number;
  /** Frame of the shot at which it pops out, and the frame by which it has faded away again. */
  at?: number;
  until?: number;
  /** pop grows out of `from`; none is already there (a shot that continues the last one). */
  entrance?: "pop" | "none";
  /** Where it grows from: centre in frame fractions and a starting scale. Worked out from `outOf` when omitted. */
  from?: { x: number; y: number; scale: number };
  /** The floating phone it is lifted out of, so it grows from the element's place on that screen. */
  outOf?: PhonePlace;
  tilt?: number;
  /** Overlays in capture space, e.g. a SoftTap. */
  children?: React.ReactNode;
};

const FADE = 5; // frames

export function CaptureCallout(props: CaptureCalloutProps) {
  const { src, crop, captureSize, videoStart = 0, width = 800, x = SAFE_CENTRE_X, y = 0.3, corner = 0.07, at = 0, until, entrance = "pop", outOf, tilt = -1.5, children } = props;
  const { fps, width: frameWidth, height: frameHeight } = useVideoConfig();
  const shotFrame = useCurrentFrame();
  const capture = useCaptureSize(src, captureSize);
  const frame = shotFrame - at;
  const fadeOut = until === undefined ? 1 : Math.min(1, Math.max(0, (until - shotFrame) / FADE));
  if (frame < 0 || fadeOut <= 0) return null;
  const box = { width, height: Math.round(cropHeight(width, crop, capture)) };
  const rect = cropRect(box, crop);
  const from = props.from ?? (outOf ? cropOnPhone(outOf, crop, capture, width, { width: frameWidth, height: frameHeight }) : { x, y, scale: 0.5 });
  const grown = entrance === "none" ? 1 : spring({ frame, fps, config: { damping: 15, stiffness: 190, mass: 0.6 } });
  const fadeIn = entrance === "none" ? 1 : Math.min(1, (frame + 1) / 4);
  const mix = (a: number, b: number) => a + (b - a) * grown;
  return (
    <div style={{
      position: "absolute", left: `${mix(from.x, x) * 100}%`, top: `${mix(from.y, y) * 100}%`, width: box.width, height: box.height,
      transform: `translate(-50%, -50%) rotate(${tilt * grown}deg) scale(${mix(from.scale, 1)})`, opacity: fadeIn * fadeOut,
      borderRadius: width * corner, overflow: "hidden", background: "#FFFFFF",
      boxShadow: "0 34px 80px rgba(0,0,0,0.5), 0 8px 22px rgba(0,0,0,0.3), 0 0 0 5px rgba(255,255,255,0.92)",
    }}>
      <CaptureMedia src={src} rect={rect} videoStart={videoStart} />
      <CaptureSpaceProvider value={{ rect, box, zoom: 1 / crop.w }}>{children}</CaptureSpaceProvider>
    </div>
  );
}
