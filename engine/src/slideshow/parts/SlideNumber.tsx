import React from "react";
import type { DeckStyle } from "../deckTypes";
import { SLIDE_FONT_WEIGHT } from "../slideFont";
import { OutlinedText } from "./OutlinedText";

// The position of a slide in a numbered list ("1", "2", "3"), drawn large and
// on its own above the line, so a viewer swiping through a list sees where
// they are before they read anything.

export const SlideNumber: React.FC<{ number: string; fontSize: number; style: DeckStyle }> = ({ number, fontSize, style }) => (
  <OutlinedText text={number} fontSize={fontSize} color={style.text} outlineColor={style.outline} weight={SLIDE_FONT_WEIGHT.line} />
);
