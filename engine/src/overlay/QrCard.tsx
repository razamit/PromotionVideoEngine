import React, { useMemo } from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { qrCardLayout, type QrLayout } from "../layout/qrGeometry";
import type { QrSpec, TimedWord } from "../timeline/types";
import { QrPlaceholderFace } from "./QrPlaceholderFace";
import { qrAuditFrames } from "./qrAuditFrames";
import { useQrTextAudit } from "./qrTextAudit";
import { isQrVerified } from "./qrVerification";

// The QR end card: pure black modules on a white rounded card, the label
// under the symbol. Short.tsx draws it at the caption level, outside every
// CameraRig, for the whole last shot, so it never scales or shakes with the
// camera. It comes in over qr.enterFrames (fade and a small grow); after
// that it has no transform at all and every module sits on whole pixels.
// The real modules are painted only in a render that `npm run render`
// verified (qrVerification.ts); everywhere else the symbol's place holds a
// placeholder panel (QrPlaceholderFace.tsx) of the same size.
// Geometry: src/layout/qrGeometry.ts. Timing and hold: scripts/qr/qr_hold.mjs.

const { fontFamily } = loadFont("normal", { weights: ["800"], subsets: ["latin"] });

const INK = "#000000";
const PAPER = "#FFFFFF";
const LABEL_INK = "#16181D";
const ENTER_FROM_SCALE = 0.94;

/** One SVG path for every dark module, in whole pixels: each run of black in a row is one rectangle. */
export function modulesPath(rows: string[], modulePx: number): string {
  const parts: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== "1") { x += 1; continue; }
      const start = x;
      while (x < row.length && row[x] === "1") x += 1;
      parts.push(`M${start * modulePx} ${y * modulePx}h${(x - start) * modulePx}v${modulePx}h${-(x - start) * modulePx}z`);
    }
  });
  return parts.join("");
}

function entranceStyle(frame: number, enterFrames: number): React.CSSProperties {
  if (frame >= enterFrames) return {};
  const progress = (frame + 1) / (enterFrames + 1);
  return { opacity: progress, transform: `scale(${ENTER_FROM_SCALE + (1 - ENTER_FROM_SCALE) * progress})` };
}

function SymbolFace({ layout, qr }: { layout: QrLayout; qr: QrSpec }) {
  const { card, symbol, modulePx } = layout;
  const path = useMemo(() => modulesPath(qr.modules, modulePx), [qr.modules, modulePx]);
  const size = symbol.right - symbol.left;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges"
      style={{ position: "absolute", left: symbol.left - card.left, top: symbol.top - card.top, display: "block" }}>
      <rect x={0} y={0} width={size} height={size} fill={PAPER} />
      <path d={path} fill={INK} />
    </svg>
  );
}

function CardFace({ layout, qr, verified }: { layout: QrLayout; qr: QrSpec; verified: boolean }) {
  const { card, label } = layout;
  return (
    <>
      {verified ? <SymbolFace layout={layout} qr={qr} /> : <QrPlaceholderFace layout={layout} code={qr.code} fontFamily={fontFamily} />}
      <div style={{
        position: "absolute", left: 0, right: 0, top: label.top - card.top, height: label.lineHeight,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily, fontWeight: 800, fontSize: label.fontSize, lineHeight: 1, color: LABEL_INK, whiteSpace: "nowrap",
      }}>
        {qr.label}
      </div>
    </>
  );
}

function QrCardBody({ qr, layout, auditFrames }: { qr: QrSpec; layout: QrLayout; auditFrames: number[] }) {
  const frame = useCurrentFrame();
  const { card, radius } = layout;
  const verified = useMemo(() => isQrVerified(qr), [qr]);
  useQrTextAudit(card, auditFrames);
  return (
    <div data-qr-card="" style={{
      position: "absolute", left: card.left, top: card.top, width: card.right - card.left, height: card.bottom - card.top,
      background: PAPER, borderRadius: radius, boxShadow: "0 8px 28px rgba(0,0,0,0.22)", overflow: "hidden",
      ...entranceStyle(frame, qr.enterFrames),
    }}>
      <CardFace layout={layout} qr={qr} verified={verified} />
    </div>
  );
}

/** The card for the timeline's qr, from qr.startSec to qr.endSec. `words` are the short's, for the text audit. */
export function QrCard({ qr, words }: { qr: QrSpec; words: TimedWord[] }) {
  const { fps } = useVideoConfig();
  const layout = useMemo(() => qrCardLayout(qr.modules.length, qr.label), [qr.modules.length, qr.label]);
  const from = Math.round(qr.startSec * fps);
  const windowFrames = Math.max(1, Math.round(qr.endSec * fps) - from);
  const auditFrames = useMemo(() => qrAuditFrames(qr, words, fps, windowFrames), [qr, words, fps, windowFrames]);
  return (
    <Sequence from={from} durationInFrames={windowFrames} name="qr card" layout="none">
      <QrCardBody qr={qr} layout={layout} auditFrames={auditFrames} />
    </Sequence>
  );
}
