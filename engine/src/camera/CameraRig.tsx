import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CameraSpec, ShotEnter } from "../timeline/types";
import { enterStyle, moveTransform, shakeOffset } from "./moves";
import { CameraProvider, type CameraState } from "./layers";

// Every shot is wrapped in a CameraRig, so nothing ever sits still. The move
// is a 2D transform of the whole composited shot, which is where the actors
// (depth 1) live. The rig also publishes the move through CameraProvider:
// Room3D's plate takes half of it in 2D and makes up the rest by dollying
// its three.js camera, so the room has real perspective parallax against
// the actors, and <Foreground> layers take more than all of it.
// Moves are in moves.ts; layers in layers.tsx.

export function CameraRig({ camera, enter = "cut", durationInFrames, children }: {
  camera?: CameraSpec;
  enter?: ShotEnter;
  durationInFrames: number;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec: CameraSpec = camera ?? { move: "hold" };
  const m = moveTransform(spec, frame, durationInFrames, fps);
  const s = shakeOffset(frame, spec.shake ?? 0);
  const state: CameraState = { ...m, focusX: spec.focusX ?? 0.5, focusY: spec.focusY ?? 0.5, parallax: spec.parallax ?? 1 };
  const origin = `${state.focusX * 100}% ${state.focusY * 100}%`;
  return (
    <CameraProvider value={state}>
      <AbsoluteFill style={{ overflow: "hidden", ...enterStyle(enter, frame) }}>
        <AbsoluteFill
          style={{
            transformOrigin: origin,
            transform: `translate(${m.x + s.x / 10.8}%, ${m.y + s.y / 19.2}%) scale(${m.scale})`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </CameraProvider>
  );
}
