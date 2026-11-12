import React from "react";
import { AbsoluteFill } from "remotion";
import type { DeckSlide, SlideLayoutProps } from "../deckTypes";
import { OutlinedText } from "../parts/OutlinedText";
import { SlideCharacter } from "../parts/SlideCharacter";
import { SlideNumber } from "../parts/SlideNumber";
import { SLIDE_FONT_WEIGHT } from "../slideFont";
import { designUnit, fitFontSize, fitFontSizeInBox, safeBoxOf, SLIDE_LINE_HEIGHT, type PixelBox } from "../slideGeometry";

// One line of text, over whatever the slide has behind it (a plain colour, a
// cartoon frame, a photo). With a character, the line takes the upper part
// of the safe box and the character stands under it. The hook slide and
// every "say it in words" slide use this.

const VERTICAL_ALIGNMENT = { top: "flex-start", middle: "center", bottom: "flex-end" } as const;
const NUMBER_SIZE_UNITS = 230;
/** The list number is smaller when it shares the slide with a character or a picture. */
const NUMBER_SIZE_SHARED_UNITS = 170;
/** Over a picture, a line at the top or bottom keeps to this share of the safe box (about three lines), so the picture's subject stays clear. */
const PICTURE_TEXT_SHARE = 0.27;
const GAP_UNITS = 36;
/** Share of the safe box's height a character stands in. */
const CHARACTER_SHARE = 0.52;

/** The height the line may fill when something else needs the rest of the safe box, or null when it has the box to itself. */
function heightLimitForLine(slide: DeckSlide, box: PixelBox, numberHeight: number, gap: number): number | null {
  if (slide.character) return box.height * (1 - CHARACTER_SHARE) - gap - numberHeight;
  const besidePicture = Boolean(slide.photo) && (slide.textPosition === "top" || slide.textPosition === "bottom");
  return besidePicture ? box.height * PICTURE_TEXT_SHARE : null;
}

export const TextSlide: React.FC<SlideLayoutProps> = ({ deck, slide, showText }) => {
  const box = safeBoxOf(deck.output);
  const unit = designUnit(deck.output);
  const isHook = slide.role === "hook";
  const gap = GAP_UNITS * unit;
  const characterHeight = slide.character ? box.height * CHARACTER_SHARE : 0;
  const sharesTheSlide = Boolean(slide.character || slide.photo);
  const numberSize = (sharesTheSlide ? NUMBER_SIZE_SHARED_UNITS : NUMBER_SIZE_UNITS) * unit;
  const numberHeight = slide.number ? numberSize * SLIDE_LINE_HEIGHT + gap : 0;
  const heightLimit = heightLimitForLine(slide, box, numberHeight, gap);
  const maxLineSize = (isHook ? 124 : 100) * unit;
  const lineSize = heightLimit === null
    ? fitFontSize(slide.text ?? "", box.width, isHook ? 5 : 6, maxLineSize, 56 * unit)
    : fitFontSizeInBox(slide.text ?? "", box.width, heightLimit, maxLineSize, 48 * unit);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", ...box, display: "flex", flexDirection: "column" }}>
        <div style={{
          flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap,
          justifyContent: VERTICAL_ALIGNMENT[slide.textPosition ?? "middle"], alignItems: "center",
        }}>
          {showText && slide.number ? <SlideNumber number={slide.number} fontSize={numberSize} style={deck.style} /> : null}
          {showText ? (
            <OutlinedText text={slide.text ?? ""} fontSize={lineSize} color={deck.style.text} outlineColor={deck.style.outline} weight={SLIDE_FONT_WEIGHT.line} />
          ) : null}
          {showText && slide.subtext ? (
            <OutlinedText text={slide.subtext} fontSize={52 * unit} color={deck.style.text} outlineColor={deck.style.outline} weight={SLIDE_FONT_WEIGHT.note} />
          ) : null}
        </div>
        {slide.character ? (
          <div style={{ height: characterHeight, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
            <SlideCharacter character={slide.character} height={characterHeight} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
