import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { Deck } from "./deckTypes";
import { SlideView } from "./SlideView";
import { designUnit } from "./slideGeometry";

// The slides timed out as a video, for review on a computer. It is stamped as
// a preview on every frame: the deliverable is the image files, uploaded as a
// native photo post, never this video.

export type SlideshowPreviewProps = { deck: Deck; secondsPerSlide: number };

export const PREVIEW_FPS = 30;

export function previewDurationInFrames({ deck, secondsPerSlide }: SlideshowPreviewProps): number {
  const renderable = deck.slides.filter((slide) => !slide.blocked).length;
  return Math.max(1, Math.round(renderable * secondsPerSlide * PREVIEW_FPS));
}

export const SlideshowPreview: React.FC<SlideshowPreviewProps> = ({ deck, secondsPerSlide }) => {
  const { fps } = useVideoConfig();
  const unit = designUnit(deck.output);
  const framesPerSlide = Math.round(secondsPerSlide * fps);
  const slides = deck.slides.filter((slide) => !slide.blocked);
  return (
    <AbsoluteFill>
      {slides.map((slide, index) => (
        <Sequence key={slide.id} from={index * framesPerSlide} durationInFrames={framesPerSlide}>
          <SlideView deck={deck} slide={slide} variant="baked" />
          <div style={{
            position: "absolute", left: 0, right: 0, top: 0, padding: `${22 * unit}px ${30 * unit}px`, background: "#ffcc00",
            color: "#111", font: `700 ${30 * unit}px sans-serif`, display: "flex", justifyContent: "space-between",
          }}>
            <span>PREVIEW FOR REVIEW ONLY. Upload the images, not this video.</span>
            <span>{index + 1} / {slides.length}</span>
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
