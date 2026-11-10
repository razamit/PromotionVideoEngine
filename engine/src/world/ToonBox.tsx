import React, { useMemo } from "react";
import * as THREE from "three";
import { INK } from "../theme/palette";

// Cel shading for the 3D world: a three-step toon ramp plus an ink outline
// drawn as an inverted hull (a slightly larger back-face copy in black).
// This is what makes a three.js room sit next to flat 2D characters.

let ramp: THREE.DataTexture | null = null;
export function toonRamp() {
  if (ramp) return ramp;
  const tones = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(tones, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

export type BoxProps = {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  /** Outline thickness in world units. 0 for none (walls, floors). */
  outline?: number;
};

export function ToonBox({ size, position = [0, 0, 0], rotation = [0, 0, 0], color, outline = 0.035 }: BoxProps) {
  const hull = useMemo(() => size.map((s) => (s + outline * 2) / s) as [number, number, number], [size, outline]);
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={size} />
        <meshToonMaterial color={color} gradientMap={toonRamp()} />
      </mesh>
      {outline > 0 ? (
        <mesh scale={hull}>
          <boxGeometry args={size} />
          <meshBasicMaterial color={INK} side={THREE.BackSide} />
        </mesh>
      ) : null}
    </group>
  );
}

/** A flat coloured quad, e.g. a sunlight patch or a poster on a wall. */
export function FlatQuad({ size, position, rotation = [0, 0, 0], color, opacity = 1 }: {
  size: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}
