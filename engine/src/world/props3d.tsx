import React from "react";
import * as THREE from "three";
import { ToonBox, toonRamp } from "./ToonBox";
import { INK } from "../theme/palette";
import type { Vec3 } from "./Room3D";

// Furniture kit for Room3D. Each prop is a handful of outlined toon boxes.
// Add new props here (one component each) rather than inline in scenes, so
// later shorts can reuse them. Labels and signs belong in the 2D layer.

type At = { position?: Vec3; rotationY?: number };

export function Desk({ position = [0, 0, 0], rotationY = 0, color = "#F2EFE6" }: At & { color?: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <ToonBox size={[1.8, 0.08, 0.9]} position={[0, 0.76, 0]} color={color} />
      <ToonBox size={[0.5, 0.7, 0.85]} position={[0.62, 0.37, 0]} color={color} />
      <ToonBox size={[0.06, 0.72, 0.06]} position={[-0.84, 0.36, 0.38]} color={color} />
      <ToonBox size={[0.06, 0.72, 0.06]} position={[-0.84, 0.36, -0.38]} color={color} />
    </group>
  );
}

export function Door({ position = [0, 0, -2.98], color = "#8DB7FF" }: { position?: Vec3; color?: string }) {
  return (
    <group position={position}>
      <ToonBox size={[1.1, 2.2, 0.06]} position={[0, 1.1, 0]} color={color} />
      <ToonBox size={[0.36, 0.5, 0.02]} position={[0, 1.6, 0.04]} color="#CFE6FF" outline={0.02} />
      <ToonBox size={[0.18, 0.05, 0.05]} position={[0.38, 1.05, 0.06]} color="#D9D9D9" outline={0.015} />
    </group>
  );
}

export function Shelf({ position = [0, 0, 0], rotationY = 0 }: At) {
  const books = ["#FF7A59", "#FFD166", "#4CC9F0", "#7B61FF", "#F15BB5"];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[0.4, 1.0, 1.6].map((y) => (
        <ToonBox key={y} size={[1.2, 0.05, 0.4]} position={[0, y, 0]} color="#3A4A8C" />
      ))}
      {books.map((c, i) => (
        <ToonBox key={c} size={[0.14, 0.42, 0.3]} position={[-0.45 + i * 0.18, 1.24, 0]} color={c} outline={0.02} />
      ))}
    </group>
  );
}

export function TrashCan({ position = [0, 0, 0], color = "#6C7A89" }: { position?: Vec3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 0.7, 24]} />
        <meshToonMaterial color={color} gradientMap={toonRamp()} />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={[1.08, 1.04, 1.08]}>
        <cylinderGeometry args={[0.28, 0.22, 0.7, 24]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/** A lumpy bin bag. `swell` 1..2 grows it for "it got worse" beats. */
export function TrashBag({ position = [0, 0, 0], swell = 1, color = "#2B2B33" }: { position?: Vec3; swell?: number; color?: string }) {
  return (
    <group position={position} scale={[swell, swell, swell]}>
      <mesh position={[0, 0.32, 0]} scale={[1, 0.9, 1]}>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshToonMaterial color={color} gradientMap={toonRamp()} />
      </mesh>
      <mesh position={[0, 0.32, 0]} scale={[1.07, 0.97, 1.07]}>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
      <ToonBox size={[0.12, 0.16, 0.12]} position={[0, 0.66, 0]} color={color} outline={0.02} />
    </group>
  );
}

export function Couch({ position = [0, 0, 0], rotationY = 0, color = "#E4572E" }: At & { color?: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <ToonBox size={[2.2, 0.42, 0.9]} position={[0, 0.3, 0]} color={color} />
      <ToonBox size={[2.2, 0.7, 0.25]} position={[0, 0.75, -0.34]} color={color} />
      <ToonBox size={[0.25, 0.55, 0.9]} position={[-1.1, 0.55, 0]} color={color} />
      <ToonBox size={[0.25, 0.55, 0.9]} position={[1.1, 0.55, 0]} color={color} />
      <ToonBox size={[0.9, 0.14, 0.7]} position={[-0.5, 0.57, 0.05]} color="#F4D35E" outline={0.025} />
    </group>
  );
}

export function Plant({ position = [0, 0, 0] }: { position?: Vec3 }) {
  return (
    <group position={position}>
      <ToonBox size={[0.36, 0.4, 0.36]} position={[0, 0.2, 0]} color="#C8553D" />
      <ToonBox size={[0.5, 0.6, 0.12]} position={[0, 0.72, 0]} color="#5FAD56" outline={0.025} />
      <ToonBox size={[0.12, 0.6, 0.5]} position={[0, 0.72, 0]} color="#4C9A4A" outline={0.025} />
    </group>
  );
}

export function WallWindow({ position = [0, 2.1, -2.97], night = false }: { position?: Vec3; night?: boolean }) {
  return (
    <group position={position}>
      <ToonBox size={[1.3, 1.1, 0.06]} color="#FFFFFF" outline={0.03} />
      <ToonBox size={[1.12, 0.92, 0.07]} position={[0, 0, 0.01]} color={night ? "#1B2A6B" : "#9ED8FF"} outline={0} />
      <ToonBox size={[0.05, 0.92, 0.08]} position={[0, 0, 0.02]} color="#FFFFFF" outline={0} />
    </group>
  );
}
