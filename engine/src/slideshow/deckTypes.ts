// The shape of generated/slideshow.json, written by
// scripts/slideshow/compile_deck.mjs from a slideshow.md and a product brief.
// Everything product-specific arrives through this data; nothing in
// src/slideshow knows any product.

export type SafeMargins = { top: number; bottom: number; left: number; right: number };

/** A region of a screenshot, as fractions of its width and height. */
export type CropRegion = { x: number; y: number; w: number; h: number };

/** A real screenshot staged under the slideshow's public folder. */
export type DeckScreenshot = { src: string; size: [number, number]; crop: CropRegion };

export type DeckPanel = { label?: string; text?: string; screenshot?: DeckScreenshot };

/** A house character on a slide: the cast member's look from the brief, plus this slide's mood and gesture. */
export type DeckCharacter = {
  hair?: string;
  hairColor?: number | string;
  shirt?: number | string;
  skin?: number | string;
  mood: string;
  gesture: string;
  facing: "left" | "right";
};

export type SlideLayoutName = "text" | "screenshot" | "split" | "end";

export type DeckSlide = {
  id: string;
  role: string;
  layout: SlideLayoutName;
  /** A list position ("1", "2"): drawn large, above the line. */
  number?: string;
  text?: string;
  subtext?: string;
  textPosition?: "top" | "middle" | "bottom";
  screenshot?: DeckScreenshot;
  /** The slide's full-frame picture: a frame from one of the product's cartoon shorts, or a real photo the brief supplied. */
  photo?: string;
  /** How much the picture is darkened, 0 to 1. */
  photoDim?: number;
  character?: DeckCharacter;
  /** A flat cartoon room behind the slide (cool, mint, warm, night). */
  backdrop?: string;
  panels?: DeckPanel[];
  /** Set when a needed screenshot is missing; the slide is not rendered. */
  blocked?: string;
};

export type DeckOutput = {
  aspect: string;
  width: number;
  height: number;
  safeMargins: SafeMargins;
  imageFormat: "jpeg" | "png" | "webp";
  extension: string;
  jpegQuality: number;
  primaryText: "baked" | "native";
};

export type DeckStyle = { background: string; text: string; outline: string };

export type Deck = {
  product: { name: string; descriptor?: string; icon?: string };
  format: string;
  topic?: string;
  output: DeckOutput;
  style: DeckStyle;
  slides: DeckSlide[];
};

/** baked: text drawn on the slide. clean: no text, for typing it in TikTok. guides: baked plus the covered margins. */
export type SlideVariant = "baked" | "clean" | "guides";

export type SlideLayoutProps = { deck: Deck; slide: DeckSlide; showText: boolean };
