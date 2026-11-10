import React, { useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { INK, OUTLINE } from "../theme/palette";
import { DepthLayer } from "../camera/layers";
import { useCaptureToScreen } from "../phone/CaptureMedia";
import { useTextBoxAudit } from "./textBoxAudit";

// Small 2D building blocks scenes share: placing an actor, a taped-on sign
// (the reference labels every prop: "TO DO", "STORAGE", "CAREER DEVELOPMENT
// ROOM"), and a radial burst backdrop for reveal beats.

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

/**
 * Places a child so its bottom centre sits at (x, y), fractions of the frame.
 * `depth` puts it on its own parallax layer: 1 (default) moves with the
 * shot, below 1 is further back, above 1 is a foreground piece.
 */
export function Actor({ x, y, children, z = 0, depth = 1 }: { x: number; y: number; children: React.ReactNode; z?: number; depth?: number }) {
  const placed = (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -100%)", zIndex: z }}>
      {children}
    </div>
  );
  if (depth === 1) return placed;
  return <DepthLayer depth={depth} style={{ zIndex: z, pointerEvents: "none" }}>{placed}</DepthLayer>;
}

/** A label taped onto the world. Short, upper-case, readable with the sound off. Audited like a speech burst (textBoxAudit.ts). */
export function Sign({ text, sub, x, y, rotate = -3, size = 54, color = "#FFFFFF", ink = INK }: {
  text: string; sub?: string; x: number; y: number; rotate?: number; size?: number; color?: string; ink?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  useTextBoxAudit("sign", sub ? `${text} / ${sub}` : text, wordsRef, boxRef, 0);
  return (
    <div ref={boxRef} style={{
      position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      background: color, border: `${OUTLINE}px solid ${INK}`, borderRadius: 14, padding: "14px 26px",
      fontFamily, fontWeight: 900, fontSize: size, color: ink, textAlign: "center", lineHeight: 1.05, whiteSpace: "pre",
    }}>
      <div ref={wordsRef} style={{ display: "inline-block" }}>
        {text}
        {sub ? <div style={{ fontSize: size * 0.42, fontWeight: 800, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

/** Rotating sunburst, for the reveal and the end card. */
export function Burst({ a, b, rays = 18 }: { a: string; b: string; rays?: number }) {
  const frame = useCurrentFrame();
  const slice = 360 / rays;
  const stops = Array.from({ length: rays }, (_, i) => `${i % 2 ? a : b} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");
  return (
    <AbsoluteFill style={{ background: a, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: "45%", width: 3200, height: 3200, marginLeft: -1600, marginTop: -1600,
        background: `conic-gradient(${stops})`, transform: `rotate(${frame * 0.6}deg)` }} />
    </AbsoluteFill>
  );
}

/** A few cartoon flies buzzing around (cx, cy), fractions of the frame. */
export function Flies({ count, cx, cy, spread = 0.12 }: { count: number; cx: number; cy: number; spread?: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = frame / (7 + (i % 3)) + i * 2.4;
        const x = cx + Math.cos(a) * spread * (0.6 + ((i * 37) % 10) / 20);
        const y = cy + Math.sin(a * 1.3) * spread * 0.7;
        const flap = Math.floor(frame / 2 + i) % 2 === 0;
        return (
          <svg key={i} width={60} height={48} viewBox="0 0 60 48" style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%,-50%)", overflow: "visible" }}>
            <ellipse cx={18} cy={flap ? 12 : 18} rx={12} ry={8} fill="#fff" stroke={INK} strokeWidth={4} opacity={0.9} />
            <ellipse cx={42} cy={flap ? 12 : 18} rx={12} ry={8} fill="#fff" stroke={INK} strokeWidth={4} opacity={0.9} />
            <circle cx={30} cy={28} r={11} fill={INK} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
}

/**
 * An expanding ring that marks a real tap on a captured screen. Starts at delayFrames.
 * coords "screen" (default): x, y are fractions of the phone screen or card.
 * coords "capture": x, y are fractions of the capture itself (measure them on
 * the screenshot), and the ring follows the phone's focus zoom, scroll or a
 * CaptureCard's crop.
 */
export function TapRing({ x, y, delayFrames = 0, coords = "screen" }: { x: number; y: number; delayFrames?: number; coords?: "screen" | "capture" }) {
  const local = useCurrentFrame() - delayFrames;
  const { toScreen, zoom } = useCaptureToScreen();
  if (local < 0 || local > 14) return null;
  const at = coords === "capture" ? toScreen(x, y) : { x, y };
  const r = (30 + local * 6) * Math.min(1.6, Math.sqrt(zoom));
  return (
    <div style={{ position: "absolute", left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r,
      borderRadius: "50%", border: `${OUTLINE}px solid ${INK}`, background: "rgba(255,214,10,0.45)", opacity: 1 - local / 15 }} />
  );
}

/** A comic speech burst sized to its text. See speechBurst.tsx. */
export { SpeechBurst } from "./speechBurst";
