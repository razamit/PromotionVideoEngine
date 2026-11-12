import React from "react";
import { Composition } from "remotion";
import type { Deck, SlideVariant } from "./deckTypes";
import { PREVIEW_FPS, previewDurationInFrames, SlideshowPreview, type SlideshowPreviewProps } from "./SlideshowPreview";
import { SlideView } from "./SlideView";

// The slideshow's own Remotion entry, separate from the video Shorts entry
// (src/index.ts, src/Root.tsx), which it never touches. The deck arrives as
// input props from scripts/slideshow/render_deck.mjs; the frame takes its
// size from the deck, so one bundle renders every aspect.

export type SlideStillProps = { deck: Deck; slideIndex: number; variant: SlideVariant };

const PLACEHOLDER_DECK: Deck = {
  product: { name: "Product" },
  format: "none",
  output: {
    aspect: "9:16", width: 1080, height: 1920, safeMargins: { top: 0.12, bottom: 0.25, left: 0.06, right: 0.15 },
    imageFormat: "jpeg", extension: "jpg", jpegQuality: 92, primaryText: "baked",
  },
  style: { background: "#111214", text: "#ffffff", outline: "#000000" },
  slides: [{ id: "01-hook", role: "hook", layout: "text", text: "No slideshow loaded" }],
};

const SlideStill: React.FC<SlideStillProps> = ({ deck, slideIndex, variant }) => (
  <SlideView deck={deck} slide={deck.slides[slideIndex]} variant={variant} />
);

export const SlideshowRoot: React.FC = () => (
  <>
    <Composition
      id="Slide"
      component={SlideStill}
      durationInFrames={1}
      fps={PREVIEW_FPS}
      width={PLACEHOLDER_DECK.output.width}
      height={PLACEHOLDER_DECK.output.height}
      defaultProps={{ deck: PLACEHOLDER_DECK, slideIndex: 0, variant: "baked" as SlideVariant }}
      calculateMetadata={({ props }) => ({ width: props.deck.output.width, height: props.deck.output.height })}
    />
    <Composition
      id="SlideshowPreview"
      component={SlideshowPreview}
      durationInFrames={1}
      fps={PREVIEW_FPS}
      width={PLACEHOLDER_DECK.output.width}
      height={PLACEHOLDER_DECK.output.height}
      defaultProps={{ deck: PLACEHOLDER_DECK, secondsPerSlide: 2.5 } satisfies SlideshowPreviewProps}
      calculateMetadata={({ props }) => ({
        width: props.deck.output.width, height: props.deck.output.height, durationInFrames: previewDurationInFrames(props),
      })}
    />
  </>
);
