import { FRAME } from "./safeZone.ts";

// Where the QR end card sits on a 1080x1920 short, and how big each module
// is. Every size comes from the symbol's module count, so a longer URL (a
// higher QR version) gets smaller modules, never fractional ones.
//
// Shared by the renderer (src/overlay/QrCard.tsx) and the Node scripts
// (scripts/qr/: the timeline's layout check, the label limit, the decode
// crop), which import this file directly; so its own imports carry the
// ".ts" extension and it uses no other module.
//
// The limits it keeps (checked by qrLayoutProblems below):
// - modules are whole pixels, black on white; the symbol is at least 400 px wide;
// - a quiet zone of 4 modules of white on all four sides of the symbol;
// - the card is centred on x = 540 and ends (label included) at or above y = 1440;
// - its right edge stays at least 120 px from the frame's right edge;
// - the symbol itself stays left of x = 780, where TikTok's button column
//   starts (from about y = 840 down);
// - the label is one line of at least 30 px inside the card.

export const QR_LIMITS = {
  centreX: FRAME.width / 2,
  maxBottom: 1440,
  minRightMargin: 120,
  buttonColumnX: 780,
  minSymbolPx: 400,
  quietModules: 4,
  minLabelPx: 30,
};

/** The highest QR version the card takes; scripts/qr/qr_matrix.mjs refuses a URL that needs more. */
export const QR_MAX_VERSION = 10;

/** The symbol may be up to this wide; 460 keeps its right edge at 770, clear of the button column. */
const MAX_SYMBOL_PX = 460;
const CARD_BOTTOM = 1424;
const CARD_RADIUS = 28;
const LABEL_MAX_PX = 40;
const LABEL_LINE_PX = 50;
const LABEL_PADDING_BOTTOM = 34;
const LABEL_SIDE_PADDING = 24;
/**
 * Width per character of the label in Inter ExtraBold (800), in em, for the
 * widest plausible text: all capitals with spaces. Measured as ink width
 * on rendered stills of the card (2026-11-25), per character:
 * "SCAN TO GET THE APP" 0.592, "GET STICKY TASKS" 0.602, "DOWNLOAD THE APP"
 * 0.656, "SCAN FOR WOMBAT" 0.672, "MEMO WORKOUT NOW" 0.719 (heavy in M and
 * W); this takes the widest, rounded up. Lowercase text is narrower.
 */
const LABEL_EM_PER_CHAR = 0.72;
/** Scenes keep their text and logos this far from the card (useQrReserve). */
export const QR_RESERVE_MARGIN = 24;
/**
 * The panel drawn in place of the symbol when the render was not verified
 * (QrCard.tsx); the decode check recognises it by this colour. Never black
 * or white, so it cannot be read as modules.
 */
export const QR_PLACEHOLDER_FILL = { css: "#C9D1DB", rgb: [201, 209, 219] as const };

export type Rect = { left: number; top: number; right: number; bottom: number };

export type QrLayout = {
  modulePx: number;
  modules: number;
  quietPx: number;
  card: Rect;
  symbol: Rect;
  radius: number;
  label: { fontSize: number; top: number; lineHeight: number; innerWidth: number };
};

/** Modules per side of a QR symbol of this version. */
export const modulesOfVersion = (version: number) => 17 + 4 * version;

function labelFontSize(label: string, innerWidth: number): number {
  const fitting = Math.floor(innerWidth / (Math.max(1, label.length) * LABEL_EM_PER_CHAR));
  return Math.max(QR_LIMITS.minLabelPx, Math.min(LABEL_MAX_PX, fitting));
}

/** The card for a symbol of `modules` x `modules` and its label. All values are whole pixels. */
export function qrCardLayout(modules: number, label: string): QrLayout {
  const modulePx = Math.floor(MAX_SYMBOL_PX / modules);
  const quietPx = QR_LIMITS.quietModules * modulePx;
  const symbolPx = modules * modulePx;
  const cardWidth = symbolPx + 2 * quietPx;
  const cardHeight = cardWidth + LABEL_LINE_PX + LABEL_PADDING_BOTTOM;
  const left = QR_LIMITS.centreX - Math.floor(cardWidth / 2);
  const top = CARD_BOTTOM - cardHeight;
  const card = { left, top, right: left + cardWidth, bottom: CARD_BOTTOM };
  const symbol = { left: left + quietPx, top: top + quietPx, right: left + quietPx + symbolPx, bottom: top + quietPx + symbolPx };
  const innerWidth = cardWidth - 2 * LABEL_SIDE_PADDING;
  const fontSize = labelFontSize(label, innerWidth);
  return { modulePx, modules, quietPx, card, symbol, radius: CARD_RADIUS, label: { fontSize, top: top + cardWidth, lineHeight: LABEL_LINE_PX, innerWidth } };
}

/**
 * The longest label that stays one line of at least 30 px on every card the
 * allowed versions make: the narrowest card (version 9 with these sizes,
 * not the highest version, because modules are rounded down to whole
 * pixels) with all-capital text.
 */
export function qrLabelMaxChars(): number {
  let narrowest = Infinity;
  for (let version = 1; version <= QR_MAX_VERSION; version++) {
    narrowest = Math.min(narrowest, qrCardLayout(modulesOfVersion(version), "").label.innerWidth);
  }
  return Math.floor(narrowest / (QR_LIMITS.minLabelPx * LABEL_EM_PER_CHAR));
}

/** The card grown by QR_RESERVE_MARGIN: what a scene keeps its text and logos out of. */
export function qrReserveRect(layout: QrLayout): Rect {
  const { card } = layout;
  const m = QR_RESERVE_MARGIN;
  return { left: card.left - m, top: card.top - m, right: card.right + m, bottom: card.bottom + m };
}

/** Every limit above that the layout for this label breaks, as readable lines; empty when it keeps them all. */
export function qrLayoutProblems(layout: QrLayout, label: string, width = FRAME.width): string[] {
  const { card, symbol, modulePx } = layout;
  const problems: string[] = [];
  if (!Number.isInteger(modulePx) || modulePx < 1) problems.push(`module size ${modulePx} px is not a whole pixel`);
  if (symbol.right - symbol.left < QR_LIMITS.minSymbolPx) problems.push(`symbol ${symbol.right - symbol.left} px wide, under ${QR_LIMITS.minSymbolPx}`);
  if (card.bottom > QR_LIMITS.maxBottom) problems.push(`card ends at y ${card.bottom}, below ${QR_LIMITS.maxBottom}`);
  if (width - card.right < QR_LIMITS.minRightMargin) problems.push(`card's right edge ${card.right} is under ${QR_LIMITS.minRightMargin} px from the frame edge`);
  if (symbol.right > QR_LIMITS.buttonColumnX) problems.push(`symbol reaches x ${symbol.right}, past the button column at ${QR_LIMITS.buttonColumnX}`);
  const widest = Math.ceil(label.length * layout.label.fontSize * LABEL_EM_PER_CHAR);
  if (widest > layout.label.innerWidth) {
    problems.push(`label "${label}" needs up to ${widest} px at ${layout.label.fontSize} px but the card has ${layout.label.innerWidth} px; shorten it`);
  }
  return problems;
}
