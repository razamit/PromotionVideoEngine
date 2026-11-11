import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SAFE_ZONE } from "../../layout/safeZone";
import { displayFont, labelFont } from "./fonts";

// The end card of a toy short: a soft light background, the app's mark, a
// small tagline, one big slogan and a call to action. Unlike the bean
// style's soft "link in bio" card this one says what to do, because a 25 s
// short has no second chance. Everything on it is a claim: the slogan, the
// button and the note must be true for the app (app-series.md).

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

export function BrandEndCard({ name, logo, tagline, headline, cta, note, accent = "#FF4B1F", ink = "#151B36", background = ["#FFF7EC", "#F3D5B5"] }: BrandEndCardProps) {
  const { width } = useVideoConfig();
  const usable = width * (1 - SAFE_ZONE.left - SAFE_ZONE.right) - 40;
  const size = headlineSize(headline, usable);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${background[0]} 0%, ${background[1]} 100%)` }}>
      <AbsoluteFill style={{
        alignItems: "center", justifyContent: "center", textAlign: "center", gap: 30,
        paddingLeft: `${SAFE_ZONE.left * 100}%`, paddingRight: `${SAFE_ZONE.right * 100}%`, paddingBottom: 260,
      }}>
        <Rise order={0}>
          {logo
            ? <Img src={staticFile(logo)} style={{ height: 150, maxWidth: usable, objectFit: "contain" }} />
            : <div style={{ fontFamily: displayFont, fontSize: 96, letterSpacing: 6, color: accent, textTransform: "uppercase", fontStyle: "italic" }}>{name}</div>}
        </Rise>
        {tagline ? <Rise order={3}><div style={{ fontFamily: labelFont, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: ink, textTransform: "uppercase" }}>{tagline}</div></Rise> : null}
        <div>
          {headline.map((line, i) => (
            <Rise key={line} order={1 + i}>
              <div style={{ fontFamily: displayFont, fontSize: size, lineHeight: 0.98, color: i === headline.length - 1 ? accent : ink, textTransform: "uppercase", whiteSpace: "nowrap" }}>{line}</div>
            </Rise>
          ))}
        </div>
        {cta ? (
          <Rise order={4}>
            <div style={{ fontFamily: labelFont, fontWeight: 800, fontSize: 46, color: "#FFFFFF", background: accent, borderRadius: 999, padding: "26px 64px", boxShadow: "0 14px 30px rgba(0,0,0,0.18)" }}>{cta}</div>
          </Rise>
        ) : null}
        {note ? <Rise order={5}><div style={{ fontFamily: labelFont, fontWeight: 700, fontSize: 32, color: ink }}>{note}</div></Rise> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
