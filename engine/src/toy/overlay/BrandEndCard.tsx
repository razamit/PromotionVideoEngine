import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SAFE_ZONE, safeBox } from "../../layout/safeZone";
import { centredSafeWidth, FitAboveQr } from "../../overlay/FitAboveQr";
import { useQrReserve } from "../../overlay/qrReserve";
import { displayFont, labelFont } from "./fonts";

// The end card of a toy short: a soft light background, the app's mark, a
// small tagline, one big slogan and a call to action. Unlike the bean
// style's soft "link in bio" card this one says what to do, because a 25 s
// short has no second chance. Everything on it is a claim: the slogan, the
// button and the note must be true for the app (app-series.md). In a short
// with a QR the stack moves above the QR card, centred on the card's axis
// (x = 540) and narrowed to stay inside the safe zone: the headline gets
// smaller first, then FitAboveQr scales the whole stack if it still does
// not fit.

export type BrandEndCardProps = {
  /** The app's name, set as a wordmark. Or pass `logo`, an image under public/. */
  name?: string;
  logo?: string;
  /** One small line under the mark. */
  tagline?: string;
  /** The slogan, one entry per line; the last line takes the accent colour. Two short lines read best. */
  headline: string[];
  /** The button's words, e.g. "Get the app". */
  cta?: string;
  /** Small print under the button, e.g. "Free on the App Store". Only if it is true. */
  note?: string;
  accent?: string;
  ink?: string;
  /** Centre and edge colours of the background glow. */
  background?: [string, string];
};

const STEP = 5; // frames between the parts appearing

function Rise({ order, children }: { order: number; children: React.ReactNode }) {
  const frame = useCurrentFrame() - order * STEP;
  const { fps } = useVideoConfig();
  const p = frame <= 0 ? 0 : spring({ frame, fps, config: { damping: 18, stiffness: 190, mass: 0.6 } });
  return <div style={{ opacity: Math.min(1, Math.max(0, frame / 4)), transform: `translateY(${(1 - p) * 46}px)` }}>{children}</div>;
}

/** Font size that fits the longest headline line into `width` px (Anton is about 0.47 em per character). */
function headlineSize(lines: string[], width: number) {
  const longest = Math.max(1, ...lines.map((line) => line.length));
  return Math.round(Math.min(300, width / (longest * 0.47)));
}

type StackProps = Required<Pick<BrandEndCardProps, "headline" | "accent" | "ink">> & Omit<BrandEndCardProps, "headline" | "accent" | "ink" | "background"> & {
  usable: number;
  size: number;
  /** Fixed line heights, so the stack's height is known (the QR layout needs it). */
  fixedLines?: boolean;
};

/** The parts of the card, top to bottom, as siblings of whatever column holds them. */
function BrandStack({ name, logo, tagline, headline, cta, note, accent, ink, usable, size, fixedLines = false }: StackProps) {
  const lines = (lineHeight: number) => (fixedLines ? { lineHeight } : {});
  return (
    <>
      <Rise order={0}>
        {logo
          ? <Img src={staticFile(logo)} style={{ height: 150, maxWidth: usable, objectFit: "contain" }} />
          : <div style={{ fontFamily: displayFont, fontSize: 96, letterSpacing: 6, color: accent, textTransform: "uppercase", fontStyle: "italic", ...lines(1.15) }}>{name}</div>}
      </Rise>
      {tagline ? <Rise order={3}><div style={{ fontFamily: labelFont, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: ink, textTransform: "uppercase", ...lines(1.2) }}>{tagline}</div></Rise> : null}
      <div>
        {headline.map((line, i) => (
          <Rise key={line} order={1 + i}>
            <div style={{ fontFamily: displayFont, fontSize: size, lineHeight: 0.98, color: i === headline.length - 1 ? accent : ink, textTransform: "uppercase", whiteSpace: "nowrap" }}>{line}</div>
          </Rise>
        ))}
      </div>
      {cta ? (
        <Rise order={4}>
          <div style={{ fontFamily: labelFont, fontWeight: 800, fontSize: 46, color: "#FFFFFF", background: accent, borderRadius: 999, padding: "26px 64px", boxShadow: "0 14px 30px rgba(0,0,0,0.18)", ...lines(1.2) }}>{cta}</div>
        </Rise>
      ) : null}
      {note ? <Rise order={5}><div style={{ fontFamily: labelFont, fontWeight: 700, fontSize: 32, color: ink, ...lines(1.2) }}>{note}</div></Rise> : null}
    </>
  );
}

const STACK_GAP = 30;
/** In a QR short the headline gives way first, down to this size; FitAboveQr scales the whole stack after that. */
const QR_HEADLINE_MIN_PX = 120;

/** Height of BrandStack with fixedLines, in px, without the headline: the other parts at their fixed line heights and every gap. */
function heightWithoutHeadline({ logo, tagline, cta, note }: BrandEndCardProps): number {
  const parts = [
    logo ? 150 : 96 * 1.15,
    tagline ? 34 * 1.2 : null,
    cta ? 46 * 1.2 + 2 * 26 : null,
    note ? 32 * 1.2 : null,
  ].filter((part): part is number => part !== null);
  return parts.reduce((sum, part) => sum + part, 0) + STACK_GAP * parts.length;
}

/**
 * The headline size in a QR short: as big as it would be, unless the stack
 * would then be taller than the band above the card. The big slogan shrinks
 * before the small print does, so the note and the button stay readable.
 */
function headlineSizeAboveQr(props: BrandEndCardProps, size: number, band: number): number {
  const room = (band - heightWithoutHeadline(props)) / (props.headline.length * 0.98);
  return Math.round(Math.max(Math.min(size, QR_HEADLINE_MIN_PX), Math.min(size, room)));
}

/**
 * Width of the column's box in px. Without a QR it is the safe box's width
 * (the column is centred in the safe box). With one it is the widest column
 * centred on the QR card's axis, x = 540, that stays inside the safe box.
 */
function columnWidth(frameWidth: number, qrOn: boolean): number {
  return qrOn ? centredSafeWidth() : frameWidth * (1 - SAFE_ZONE.left - SAFE_ZONE.right);
}

/** The end card. With a QR (useQrReserve) the stack moves into the band above the card, centred on the card, and shrinks to fit it. */
export function BrandEndCard(props: BrandEndCardProps) {
  const { headline, accent = "#FF4B1F", ink = "#151B36", background = ["#FFF7EC", "#F3D5B5"] } = props;
  const { width } = useVideoConfig();
  const reserve = useQrReserve();
  const boxWidth = columnWidth(width, reserve !== null);
  const usable = boxWidth - 40;
  const size = headlineSize(headline, usable);
  const bandTop = Math.round(safeBox().top);
  const stack = { ...props, accent, ink, usable, size: reserve ? headlineSizeAboveQr(props, size, reserve.top - bandTop) : size };
  const sidePadding = { paddingLeft: `${SAFE_ZONE.left * 100}%`, paddingRight: `${SAFE_ZONE.right * 100}%` };
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${background[0]} 0%, ${background[1]} 100%)` }}>
      {reserve ? (
        <FitAboveQr reserve={reserve} name="BrandEndCard" top={bandTop} maxWidth={boxWidth}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: STACK_GAP }}>
            <BrandStack {...stack} fixedLines />
          </div>
        </FitAboveQr>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", gap: STACK_GAP, ...sidePadding, paddingBottom: 260 }}>
          <BrandStack {...stack} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
