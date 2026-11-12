import React from "react";
import { AbsoluteFill } from "remotion";
import type { Deck, DeckPanel, SlideLayoutProps } from "../deckTypes";
import { OutlinedText } from "../parts/OutlinedText";
import { cropAspect, ScreenshotCrop } from "../parts/ScreenshotCrop";
import { SLIDE_FONT_WEIGHT } from "../slideFont";
import { containSize, designUnit, fitFontSize, safeBoxOf } from "../slideGeometry";

// Two panels stacked, each a label over a real screenshot crop or a line of
// text: before and after, or two steps side by side in time. An optional
// heading sits above both.

const HEADING_SHARE = 0.16;
const LABEL_HEIGHT_UNITS = 64;

type PanelProps = { deck: Deck; panel: DeckPanel; width: number; height: number; showText: boolean };

const SplitPanel: React.FC<PanelProps> = ({ deck, panel, width, height, showText }) => {
  const unit = designUnit(deck.output);
  const labelHeight = LABEL_HEIGHT_UNITS * unit;
  const mediaHeight = height - labelHeight;
  const textStyle = { color: deck.style.text, outlineColor: deck.style.outline };
  const shotSize = panel.screenshot ? containSize(width, mediaHeight, cropAspect(panel.screenshot)) : null;
  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: labelHeight, width: "100%" }}>
        {showText && panel.label ? <OutlinedText text={panel.label} fontSize={44 * unit} weight={SLIDE_FONT_WEIGHT.line} {...textStyle} /> : null}
      </div>
      <div style={{ height: mediaHeight, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {panel.screenshot && shotSize ? (
          <ScreenshotCrop screenshot={panel.screenshot} width={shotSize.width} height={shotSize.height} cornerRadius={26 * unit} />
        ) : null}
        {!panel.screenshot && showText && panel.text ? (
          <OutlinedText text={panel.text} fontSize={fitFontSize(panel.text, width, 4, 72 * unit, 44 * unit)} weight={SLIDE_FONT_WEIGHT.line} {...textStyle} />
        ) : null}
      </div>
    </div>
  );
};

export const SplitSlide: React.FC<SlideLayoutProps> = ({ deck, slide, showText }) => {
  const box = safeBoxOf(deck.output);
  const unit = designUnit(deck.output);
  const gap = 28 * unit;
  const headingHeight = slide.text ? box.height * HEADING_SHARE : 0;
  const panelHeight = (box.height - headingHeight - gap) / 2;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", ...box, display: "flex", flexDirection: "column" }}>
        <div style={{ height: headingHeight, display: "flex", alignItems: "center" }}>
          {showText && slide.text ? (
            <OutlinedText text={slide.text} fontSize={fitFontSize(slide.text, box.width, 2, 76 * unit, 44 * unit)} color={deck.style.text} outlineColor={deck.style.outline} weight={SLIDE_FONT_WEIGHT.line} />
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap }}>
          {(slide.panels ?? []).map((panel, panelIndex) => (
            <SplitPanel key={panelIndex} deck={deck} panel={panel} width={box.width} height={panelHeight} showText={showText} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
