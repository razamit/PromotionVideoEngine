import React from "react";
import { AbsoluteFill } from "remotion";
import type { SlideLayoutProps } from "../deckTypes";
import { OutlinedText } from "../parts/OutlinedText";
import { SlideNumber } from "../parts/SlideNumber";
import { cropAspect, ScreenshotCrop } from "../parts/ScreenshotCrop";
import { SLIDE_FONT_WEIGHT } from "../slideFont";
import { containSize, designUnit, fitFontSize, safeBoxOf, type PixelBox } from "../slideGeometry";

// One line of text with a real screenshot (whole, or cropped to the element
// the line talks about). The text zone is reserved even on the clean variant,
// so the screenshot sits in the same place in both sets and the publisher has
// room to type the line in TikTok.

/** Share of the safe box's height kept for the line of text. */
const TEXT_ZONE_SHARE = 0.26;
/** Extra share when the slide carries a list number above the line. */
const NUMBER_ZONE_SHARE = 0.13;
const NUMBER_SIZE_UNITS = 170;
const GAP_SHARE = 0.035;

type StackGeometry = { textZone: PixelBox; shot: PixelBox };

/** Text zone and screenshot stacked and centred in the safe box; text above unless it is asked for below. */
function stackGeometry(safe: PixelBox, shotAspect: number, textBelow: boolean, hasNumber: boolean): StackGeometry {
  const textHeight = safe.height * (TEXT_ZONE_SHARE + (hasNumber ? NUMBER_ZONE_SHARE : 0));
  const gap = safe.height * GAP_SHARE;
  const shotSize = containSize(safe.width, safe.height - textHeight - gap, shotAspect);
  const top = safe.top + (safe.height - (textHeight + gap + shotSize.height)) / 2;
  const shotTop = textBelow ? top : top + textHeight + gap;
  const textTop = textBelow ? top + shotSize.height + gap : top;
  return {
    textZone: { left: safe.left, top: textTop, width: safe.width, height: textHeight },
    shot: { left: safe.left + (safe.width - shotSize.width) / 2, top: shotTop, ...shotSize },
  };
}

export const ScreenshotSlide: React.FC<SlideLayoutProps> = ({ deck, slide, showText }) => {
  if (!slide.screenshot) return null;
  const unit = designUnit(deck.output);
  const textBelow = slide.textPosition === "bottom";
  const { textZone, shot } = stackGeometry(safeBoxOf(deck.output), cropAspect(slide.screenshot), textBelow, Boolean(slide.number));
  const lineSize = fitFontSize(slide.text ?? "", textZone.width, 3, 84 * unit, 46 * unit);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: shot.left, top: shot.top }}>
        <ScreenshotCrop screenshot={slide.screenshot} width={shot.width} height={shot.height} cornerRadius={30 * unit} />
      </div>
      {showText && slide.text ? (
        <div style={{
          position: "absolute", ...textZone, display: "flex", flexDirection: "column", gap: 18 * unit,
          justifyContent: textBelow ? "flex-start" : "flex-end", alignItems: "center",
        }}>
          {slide.number ? <SlideNumber number={slide.number} fontSize={NUMBER_SIZE_UNITS * unit} style={deck.style} /> : null}
          <OutlinedText text={slide.text} fontSize={lineSize} color={deck.style.text} outlineColor={deck.style.outline} weight={SLIDE_FONT_WEIGHT.line} />
          {slide.subtext ? (
            <OutlinedText text={slide.subtext} fontSize={44 * unit} color={deck.style.text} outlineColor={deck.style.outline} weight={SLIDE_FONT_WEIGHT.note} />
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
