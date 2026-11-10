import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Bean } from "../characters/Bean";
import type { FaceSpec } from "../characters/Face";
import { CartoonPhone } from "../phone/CartoonPhone";
import { CaptureCard, type CardEntrance } from "../phone/CaptureCard";
import type { CaptureCrop, CaptureFocus } from "../phone/captureGeometry";
import { Plate } from "../camera/layers";
import { SAFE_ZONE } from "../layout/safeZone";
import { Room3D } from "../world/Room3D";
import { Desk, Door, Shelf, TrashBag } from "../world/props3d";
import { Actor, Burst, Sign, TapRing } from "./kit";
import { brand, palette } from "../theme/palette";

// Smoke-test scenes for the engine's example short (example/script.json),
// plus EndCard, which every short uses. A real short keeps its own scenes
// in its scenes/ folder and registers them in its scenes/registry.ts.

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

/** `foreground` adds an over-the-shoulder head on a 1.5x parallax layer. */
export function RoomWithBag({ swell = 1, face = { eyes: "tired", mouth: "flat" } as FaceSpec, foreground = false }: { swell?: number; face?: FaceSpec; foreground?: boolean }) {
  return (
    <AbsoluteFill>
      <Room3D sunPatch>
        <Door position={[-1.3, 0, -2.98]} />
        <Shelf position={[1.7, 0, -2.7]} />
        <Desk position={[0.9, 0, -1.4]} />
        <TrashBag position={[-0.9, 0, 0.4]} swell={swell} />
      </Room3D>
      <Sign text="TAKE OUT" sub="since tuesday" x={0.3} y={0.62} rotate={-6} size={44} />
      <Actor x={0.68} y={0.92}>
        <Bean height={880} shirt={palette.shirts[1]} hair="bowl" face={face} pose={{ armL: 8, armR: 30 }} />
      </Actor>
      {foreground ? (
        <Actor x={0.08} y={1.32} depth={1.5}>
          <Bean height={1500} shirt={palette.shirts[2]} hair="spiky" face={{ eyes: "dots", mouth: "flat" }} flip />
        </Actor>
      ) : null}
    </AbsoluteFill>
  );
}

export function PhoneReveal({ src, buzzing = true, videoStart = 0 }: { src: string; buzzing?: boolean; videoStart?: number }) {
  return (
    <AbsoluteFill>
      <Burst a={palette.alarmRed} b="#FF5A4F" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 120 }}>
        <CartoonPhone src={src} height={1350} buzzing={buzzing} tilt={-4} videoStart={videoStart} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

type Tap = { x: number; y: number; at: number }; // capture fractions, seconds into the shot
const backdrops = { red: [palette.alarmRed, "#FF5A4F"], teal: [palette.wallMint, "#A7E0C8"], night: [palette.nightBlue, palette.nightPurple] };

/** The real app zoomed in the cartoon phone: focus -> focusTo in capture fractions, a tap in capture fractions. */
export function PhoneFocus({ src, videoStart = 0, focus, focusTo, tap, colors = "teal", buzzing = false, tilt = -3 }: {
  src: string; videoStart?: number; focus?: CaptureFocus; focusTo?: CaptureFocus; tap?: Tap;
  colors?: keyof typeof backdrops; buzzing?: boolean; tilt?: number;
}) {
  const { fps } = useVideoConfig();
  const [a, b] = backdrops[colors];
  return (
    <AbsoluteFill>
      <Plate><Burst a={a} b={b} /></Plate>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 160 }}>
        <CartoonPhone src={src} height={1420} videoStart={videoStart} focus={focus} focusTo={focusTo} buzzing={buzzing} tilt={tilt}>
          {tap ? <TapRing coords="capture" x={tap.x} y={tap.y} delayFrames={Math.round(tap.at * fps)} /> : null}
        </CartoonPhone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * A crop of a real capture, big, on a burst: the readable insert for a
 * notification or a task row. Centred on the platform safe zone (38 px left
 * of the frame centre). `width` is the card's px width before the camera
 * move: size it for the move's peak scale (references/remotion-engine.md,
 * "Camera moves"). 820 keeps the card whole under a full push (1.16x) with
 * the default wiggle; 880 clipped the left edge.
 */
export function CardReveal({ src, crop, videoStart = 0, colors = "red", entrance = "pop", wiggle = true, tap, y = 0.4, width = 820 }: {
  src: string; crop: CaptureCrop; videoStart?: number; colors?: keyof typeof backdrops; entrance?: CardEntrance;
  wiggle?: boolean; tap?: Tap; y?: number; width?: number;
}) {
  const centreX = (SAFE_ZONE.left + 1 - SAFE_ZONE.right) / 2;
  const { fps } = useVideoConfig();
  const [a, b] = backdrops[colors];
  return (
    <AbsoluteFill>
      <Plate><Burst a={a} b={b} /></Plate>
      <div style={{ position: "absolute", left: `${centreX * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -50%)" }}>
        <CaptureCard src={src} crop={crop} width={width} videoStart={videoStart} entrance={entrance} wiggle={wiggle}>
          {tap ? <TapRing coords="capture" x={tap.x} y={tap.y} delayFrames={Math.round(tap.at * fps)} /> : null}
        </CaptureCard>
      </div>
    </AbsoluteFill>
  );
}

export function EndCard({ name = "Sticky Tasks", line = "Link in bio" }: { name?: string; line?: string }) {
  return (
    <AbsoluteFill>
      <Burst a={brand.accent} b={brand.accentBright} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36, paddingBottom: 380 }}>
        <Img src={staticFile("brand/icon.png")} style={{ width: 300, height: 300, borderRadius: 66, border: "9px solid #141414" }} />
        <div style={{ fontFamily, fontWeight: 900, fontSize: 120, color: "#fff", WebkitTextStroke: "18px #000", paintOrder: "stroke fill" }}>{name}</div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 64, color: "#fff", WebkitTextStroke: "12px #000", paintOrder: "stroke fill" }}>{line}</div>
      </AbsoluteFill>
      <Actor x={0.8} y={0.98}>
        <Bean height={620} shirt={palette.shirts[1]} hair="bowl" face={{ eyes: "happy", mouth: "grin" }} pose={{ armR: 150, armL: 20 }} />
      </Actor>
    </AbsoluteFill>
  );
}
