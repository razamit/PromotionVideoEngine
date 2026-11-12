import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import type { SlideLayoutProps } from "../deckTypes";
import { OutlinedText } from "../parts/OutlinedText";
import { SLIDE_FONT_WEIGHT } from "../slideFont";
import { designUnit, fitFontSize, safeBoxOf } from "../slideGeometry";

// The last slide: the product name from the brief, an optional plain line
// under it, and the product's real icon when the brief supplies one. No
// button, badge or store chrome is drawn.

const ICON_SIZE_UNITS = 230;
/** Corner rounding of an app icon, as a share of its size. */
const ICON_CORNER_RATIO = 0.225;

export const EndSlide: React.FC<SlideLayoutProps> = ({ deck, slide, showText }) => {
  const box = safeBoxOf(deck.output);
  const unit = designUnit(deck.output);
  const iconSize = ICON_SIZE_UNITS * unit;
  const name = slide.text ?? deck.product.name;
  const textStyle = { color: deck.style.text, outlineColor: deck.style.outline };
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", ...box, display: "flex", flexDirection: "column", gap: 40 * unit, justifyContent: "center", alignItems: "center" }}>
        {deck.product.icon ? (
          <Img src={staticFile(deck.product.icon)} style={{ width: iconSize, height: iconSize, borderRadius: iconSize * ICON_CORNER_RATIO }} />
        ) : null}
        {showText ? <OutlinedText text={name} fontSize={fitFontSize(name, box.width, 2, 150 * unit, 72 * unit)} weight={SLIDE_FONT_WEIGHT.line} {...textStyle} /> : null}
        {showText && slide.subtext ? <OutlinedText text={slide.subtext} fontSize={fitFontSize(slide.subtext, box.width, 2, 76 * unit, 46 * unit)} weight={SLIDE_FONT_WEIGHT.note} {...textStyle} /> : null}
      </div>
    </AbsoluteFill>
  );
};
