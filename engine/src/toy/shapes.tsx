import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Building blocks of the toy style: soft matte "clay" meshes with rounded
// edges that cast and receive shadows. No outlines and no toon ramp; the
// look comes from the lighting (stage/lighting.ts). Units are the same as
// Room3D: a figure is about 1.3 units tall.

export type Vec3 = [number, number, number];
export type Placed = { position?: Vec3; rotation?: Vec3; scale?: number | Vec3 };

export type ClayProps = {
  color: string;
  /** 1 is chalk, 0.2 is glossy plastic. Default 0.8. */
  roughness?: number;
  /** A colour the surface gives off by itself (a lamp shade, a clock digit, a lit window). */
  glow?: string;
  glowStrength?: number;
};

export function Clay({ color, roughness = 0.8, glow, glowStrength = 1 }: ClayProps) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0} emissive={glow ?? "#000000"} emissiveIntensity={glow ? glowStrength : 0} />;
}

type ShapeProps = Placed & ClayProps & { shadow?: boolean };

function Shape({ geometry, position, rotation, scale, shadow = true, ...clay }: ShapeProps & { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} castShadow={shadow} receiveShadow>
      <Clay {...clay} />
    </mesh>
  );
}

/** A box with rounded edges. `radius` defaults to a soft bevel that suits its size. */
export function Block({ size, radius, ...rest }: ShapeProps & { size: Vec3; radius?: number }) {
  const [w, h, d] = size;
  const bevel = Math.min(radius ?? Math.min(w, h, d) * 0.18, Math.min(w, h, d) / 2 - 0.0005);
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 4, Math.max(0.001, bevel)), [w, h, d, bevel]);
  return <Shape geometry={geometry} {...rest} />;
}

/** A capsule along y: `length` is the straight part, so the whole pill is length + 2 x radius. */
export function Pill({ radius, length, ...rest }: ShapeProps & { radius: number; length: number }) {
  const geometry = useMemo(() => new THREE.CapsuleGeometry(radius, length, 6, 20), [radius, length]);
  return <Shape geometry={geometry} {...rest} />;
}

export function Ball({ radius, ...rest }: ShapeProps & { radius: number }) {
  const geometry = useMemo(() => new THREE.SphereGeometry(radius, 28, 20), [radius]);
  return <Shape geometry={geometry} {...rest} />;
}

/** A cylinder along y; `topRadius` makes a cone or a lamp shade. */
export function Drum({ radius, height, topRadius, ...rest }: ShapeProps & { radius: number; height: number; topRadius?: number }) {
  const geometry = useMemo(() => new THREE.CylinderGeometry(topRadius ?? radius, radius, height, 36), [radius, height, topRadius]);
  return <Shape geometry={geometry} {...rest} />;
}

/** A ring (torus) lying flat in the x-z plane: a hood, a rim, a tyre. `arc` keeps part of the turn. */
export function Ring({ radius, tube, arc = Math.PI * 2, ...rest }: ShapeProps & { radius: number; tube: number; arc?: number }) {
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, tube, 12, 32, arc).rotateX(Math.PI / 2), [radius, tube, arc]);
  return <Shape geometry={geometry} {...rest} />;
}

/** A colour made darker (factor below 1) or lighter (above 1), for a pocket, a sole or a shadow side. */
export function shade(color: string, factor: number): string {
  const c = new THREE.Color(color);
  return `#${c.setRGB(Math.min(1, c.r * factor), Math.min(1, c.g * factor), Math.min(1, c.b * factor)).getHexString()}`;
}

/**
 * A cylinder with rounded top and bottom edges, turned on a lathe: the head
 * of a figure, a mug, a stool. `from`/`to` (0 bottom, 1 top) keep only part
 * of the height and `arc` only part of the turn (radians, 0 is the front),
 * which is how the hair pieces are cut from the same profile.
 */
export function RoundDrum({ radius, height, corner, from = 0, to = 1, arc, ...rest }: ShapeProps & {
  radius: number; height: number; corner: number; from?: number; to?: number; arc?: [number, number];
}) {
  const geometry = useMemo(() => {
    const points = roundDrumProfile(radius, height, corner).filter((p) => p.y >= (from - 0.5) * height - 1e-6 && p.y <= (to - 0.5) * height + 1e-6);
    return new THREE.LatheGeometry(points, 44, arc?.[0] ?? 0, arc ? arc[1] - arc[0] : Math.PI * 2);
  }, [radius, height, corner, from, to, arc?.[0], arc?.[1]]);
  return <Shape geometry={geometry} {...rest} />;
}

/** Profile of a rounded cylinder from the bottom centre to the top centre, y centred on 0. */
export function roundDrumProfile(radius: number, height: number, corner: number): THREE.Vector2[] {
  const half = height / 2;
  const steps = 8;
  const points: THREE.Vector2[] = [new THREE.Vector2(0.0001, -half)];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(radius - corner + Math.sin(a) * corner, -half + corner - Math.cos(a) * corner));
  }
  const rows = 10;
  for (let i = 1; i < rows; i++) points.push(new THREE.Vector2(radius, -half + corner + ((height - 2 * corner) * i) / rows));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(radius - corner + Math.cos(a) * corner, half - corner + Math.sin(a) * corner));
  }
  points.push(new THREE.Vector2(0.0001, half));
  return points;
}
