import React from "react";
import { Block, type Vec3 } from "../shapes";

// The shell of an indoor toy set: a floor, a back wall and two side walls,
// open toward the camera. Sized for a portrait frame, like Room3D: about
// 4 units of back wall are in view, so keep furniture within x = +-1.8.
// Floor at y = 0, back wall at z = -2.2.

export type ToyRoomProps = {
  wall?: string;
  floor?: string;
  /** A strip along the foot of the walls. */
  trim?: string;
  width?: number;
  depth?: number;
  height?: number;
  children?: React.ReactNode;
};

export function ToyRoom({ wall = "#3A417F", floor = "#4A3A63", trim = "#262C66", width = 6, depth = 7, height = 4, children }: ToyRoomProps) {
  const back = -2.2;
  const middle = back + depth / 2;
  return (
    <group>
      <Block size={[width, 0.2, depth]} radius={0.02} color={floor} position={[0, -0.1, middle]} roughness={0.9} />
      <Block size={[width, height, 0.2]} radius={0.02} color={wall} position={[0, height / 2, back - 0.1]} roughness={0.95} />
      <Block size={[0.2, height, depth]} radius={0.02} color={wall} position={[-width / 2 - 0.1, height / 2, middle]} roughness={0.95} />
      <Block size={[0.2, height, depth]} radius={0.02} color={wall} position={[width / 2 + 0.1, height / 2, middle]} roughness={0.95} />
      <Block size={[width, 0.14, 0.05]} radius={0.02} color={trim} position={[0, 0.07, back + 0.025]} />
      {children}
    </group>
  );
}

/** Deterministic scatter in 0..1 for stars and city lights. */
function scatter(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * A window on the back wall. The pane gives off its own light, so it reads
 * as the sky outside: dark blue with stars at night, peach at dawn.
 */
export function ToyWindow({ position = [0, 1.9, -2.19], size = [1.5, 1.7], frame = "#1E2660", sky = "#0E1A55", glow = 0.9, stars = 40, city = true, skyline = "#0A1040" }: {
  position?: Vec3; size?: [number, number]; frame?: string; sky?: string; glow?: number; stars?: number; city?: boolean; skyline?: string;
}) {
  const [w, h] = size;
  const bar = 0.09;
  return (
    <group position={position}>
      <Block size={[w + bar * 2, h + bar * 2, 0.08]} radius={0.03} color={frame} />
      <Block size={[w, h, 0.02]} radius={0.005} color={sky} glow={sky} glowStrength={glow} position={[0, 0, 0.04]} shadow={false} />
      {Array.from({ length: stars }, (_, i) => (
        <mesh key={i} position={[(scatter(i, 1) - 0.5) * w * 0.92, (scatter(i, 2) - 0.2) * h * 0.6, 0.055]}>
          <circleGeometry args={[0.004 + scatter(i, 3) * 0.006, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
      {city ? Array.from({ length: 5 }, (_, i) => {
        const tall = 0.25 + scatter(i, 5) * 0.4;
        return (
          <mesh key={i} position={[(i - 2) * (w / 5), -h / 2 + tall / 2, 0.052]}>
            <planeGeometry args={[w / 5.6, tall]} />
            <meshBasicMaterial color={skyline} />
          </mesh>
        );
      }) : null}
      <Block size={[bar * 0.7, h, 0.07]} radius={0.02} color={frame} position={[0, 0, 0.04]} />
      <Block size={[w, bar * 0.7, 0.07]} radius={0.02} color={frame} position={[0, 0.1, 0.04]} />
      <Block size={[w + bar * 3.4, 0.08, 0.2]} radius={0.03} color={frame} position={[0, -h / 2 - bar, 0.08]} />
    </group>
  );
}

/** A plain door with a round handle, for a wall or a house front. */
export function ToyDoor({ position = [0, 0, -2.18], color = "#C96A3A", frame = "#F2E8D8", handleSide = 1 }: {
  position?: Vec3; color?: string; frame?: string; handleSide?: 1 | -1;
}) {
  return (
    <group position={position}>
      <Block size={[1.06, 2.12, 0.08]} radius={0.03} color={frame} position={[0, 1.04, 0]} />
      <Block size={[0.9, 2, 0.09]} radius={0.03} color={color} position={[0, 1, 0.02]} />
      <Block size={[0.62, 0.62, 0.03]} radius={0.03} color={color} position={[0, 1.45, 0.06]} roughness={0.7} />
      <Block size={[0.62, 0.7, 0.03]} radius={0.03} color={color} position={[0, 0.55, 0.06]} roughness={0.7} />
      <mesh position={[0.34 * handleSide, 1, 0.1]} castShadow>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshStandardMaterial color="#E8C36A" roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}
