import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import type { MoveTransform } from "./moves";

// Layered parallax. CameraRig moves the whole shot (that is depth 1, where
// the actors live) and publishes the move here. A layer wrapped in
// <DepthLayer depth={d}> re-scales that move to d of its strength: the room
// plate sits at 0.5 (moves half as much, it is far away), a foreground prop
// at 1.4 (moves more, it is close). The correction is applied inside the
// rig's transform, so a scene that uses no layers moves exactly as before.

export type CameraState = MoveTransform & {
  /** Zoom origin, fractions of the frame. */
  focusX: number;
  focusY: number;
  /** Spread multiplier from the shot's camera spec: 0 is flat, 1 default. */
  parallax: number;
};

const still: CameraState = { scale: 1, x: 0, y: 0, focusX: 0.5, focusY: 0.5, parallax: 1 };
const CameraContext = createContext<CameraState>(still);

export const CameraProvider = CameraContext.Provider;

/** The shot's current 2D move. Outside a CameraRig it is the identity. */
export function useCameraState() {
  return useContext(CameraContext);
}

/** The move a layer at `depth` should show (scale and translate in % of frame). */
export function layerMove(state: CameraState, depth: number): MoveTransform {
  const d = Math.max(0, 1 + (depth - 1) * state.parallax);
  return { scale: 1 + (state.scale - 1) * d, x: state.x * d, y: state.y * d };
}

/** The transform that turns the rig's move into the layer's move when nested inside the rig. */
export function correctionTransform(state: CameraState, depth: number) {
  const want = layerMove(state, depth);
  const k = want.scale / state.scale;
  const tx = (want.x - state.x) / state.scale;
  const ty = (want.y - state.y) / state.scale;
  return { transform: `translate(${tx}%, ${ty}%) scale(${k})`, transformOrigin: `${state.focusX * 100}% ${state.focusY * 100}%` };
}

/** A full-frame layer that moves at `depth` times the shot's camera move. */
export function DepthLayer({ depth, children, style }: { depth: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const state = useCameraState();
  if (depth === 1 || state.parallax === 0) return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{ ...style, ...correctionTransform(state, depth) }}>{children}</AbsoluteFill>;
}

/** Backdrop depth: a flat plate (Burst, a drawn wall) behind the actors. */
export function Plate({ depth = 0.5, children }: { depth?: number; children: React.ReactNode }) {
  return <DepthLayer depth={depth}>{children}</DepthLayer>;
}

/** Foreground depth: a prop between the camera and the actors (a doorframe, a plant, a hand). */
export function Foreground({ depth = 1.4, children }: { depth?: number; children: React.ReactNode }) {
  return <DepthLayer depth={depth}>{children}</DepthLayer>;
}

/**
 * What a 3D plate at `depth` must add itself so that points on its focal
 * plane (the camera's lookAt) land where the actors' depth-1 move puts
 * them: an extra zoom about the frame centre and an image shift in frame
 * fractions. Room3D turns these into a dolly and a truck of its camera.
 */
export function plateCatchUp(state: CameraState, depth: number) {
  const layer = layerMove(state, depth);
  const zoom = state.scale / layer.scale;
  const shiftX = (state.x - layer.x) / 100 / layer.scale + (zoom - 1) * (0.5 - state.focusX);
  const shiftY = (state.y - layer.y) / 100 / layer.scale + (zoom - 1) * (0.5 - state.focusY);
  return { zoom, shiftX, shiftY };
}
