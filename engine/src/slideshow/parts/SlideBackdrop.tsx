import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import cartoonOptions from "../../../slideshow/cartoon-options.json";
import { INK, OUTLINE, palette } from "../../theme/palette";
import type { Deck, DeckSlide } from "../deckTypes";
import { designUnit, safeBoxOf } from "../slideGeometry";

// What sits behind a slide's text: a full-frame picture (a frame from one of
// the product's cartoon shorts, or a real photo the brief supplied), or a
// flat cartoon room (a wall and a floor in the house palette) for a slide
// with a character. With neither, the deck's plain background colour shows.

type RoomColours = { wall: string; floor: string };
type PaletteColourName = keyof typeof palette;

const BACKDROPS = cartoonOptions.backdrops as Record<string, { wall: string; floor: string }>;
/** How far above the bottom of the safe box the floor starts, so a character's feet stand on it. */
const FLOOR_RISE_UNITS = 120;
const DEFAULT_PHOTO_DIM = 0.38;

function roomColours(backdropName: string): RoomColours {
  const names = BACKDROPS[backdropName] ?? BACKDROPS.cool;
  return { wall: String(palette[names.wall as PaletteColourName]), floor: String(palette[names.floor as PaletteColourName]) };
}

const CartoonRoom: React.FC<{ deck: Deck; backdropName: string }> = ({ deck, backdropName }) => {
  const box = safeBoxOf(deck.output);
  const unit = designUnit(deck.output);
  const floorTop = box.top + box.height - FLOOR_RISE_UNITS * unit;
  const { wall, floor } = roomColours(backdropName);
  return (
    <AbsoluteFill style={{ background: wall }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: floorTop, bottom: 0, background: floor, borderTop: `${OUTLINE * unit}px solid ${INK}` }} />
    </AbsoluteFill>
  );
};

export const SlideBackdrop: React.FC<{ deck: Deck; slide: DeckSlide }> = ({ deck, slide }) => {
  if (slide.photo) {
    return (
      <AbsoluteFill>
        <Img src={staticFile(slide.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <AbsoluteFill style={{ background: `rgba(0,0,0,${slide.photoDim ?? DEFAULT_PHOTO_DIM})` }} />
      </AbsoluteFill>
    );
  }
  return slide.backdrop ? <CartoonRoom deck={deck} backdropName={slide.backdrop} /> : null;
};
