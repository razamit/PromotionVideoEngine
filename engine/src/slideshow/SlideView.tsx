import React from "react";
import { AbsoluteFill } from "remotion";
import type { Deck, DeckSlide, SlideLayoutName, SlideLayoutProps, SlideVariant } from "./deckTypes";
import { EndSlide } from "./layouts/EndSlide";
import { ScreenshotSlide } from "./layouts/ScreenshotSlide";
import { SplitSlide } from "./layouts/SplitSlide";
import { TextSlide } from "./layouts/TextSlide";
import { SafeGuides } from "./parts/SafeGuides";
import { SlideBackdrop } from "./parts/SlideBackdrop";

// One slide, in one of its three variants. Layouts are the only code here;
// which layout a slide uses, and in what order, is data from the format.

const LAYOUTS: Record<SlideLayoutName, React.FC<SlideLayoutProps>> = {
  text: TextSlide,
  screenshot: ScreenshotSlide,
  split: SplitSlide,
  end: EndSlide,
};

export const SlideView: React.FC<{ deck: Deck; slide: DeckSlide; variant: SlideVariant }> = ({ deck, slide, variant }) => {
  const Layout = LAYOUTS[slide.layout] ?? TextSlide;
  return (
    <AbsoluteFill style={{ background: deck.style.background }}>
      <SlideBackdrop deck={deck} slide={slide} />
      <Layout deck={deck} slide={slide} showText={variant !== "clean"} />
      {variant === "guides" ? <SafeGuides output={deck.output} /> : null}
    </AbsoluteFill>
  );
};
