import React from "react";
import { Ball, Block, Drum, Pill, Ring, shade, type Vec3 } from "../shapes";

// Things a story is told with: running shoes, a suitcase, a banknote, a mug.
// `scale` makes one big enough for an insert shot (a pair of shoes filling
// the frame). Each sits on the floor at its position.

type At = { position?: Vec3; turn?: number; scale?: number };
const RAD = Math.PI / 180;

function Sneaker({ x, color, sole }: { x: number; color: string; sole: string }) {
  return (
    <group position={[x, 0, 0]}>
      <Block size={[0.2, 0.05, 0.5]} radius={0.024} color={sole} position={[0, 0.025, 0]} roughness={0.6} />
      <Block size={[0.19, 0.13, 0.48]} radius={0.06} color={color} position={[0, 0.105, 0]} roughness={0.75} />
      <Block size={[0.17, 0.15, 0.24]} radius={0.06} color={color} position={[0, 0.175, -0.11]} roughness={0.75} />
      <Block size={[0.12, 0.03, 0.2]} radius={0.012} color={shade(color, 1.25)} position={[0, 0.172, 0.07]} rotation={[0.42, 0, 0]} />
      {[0, 1, 2].map((i) => (
        <Pill key={i} radius={0.008} length={0.1} color="#FFFFFF" position={[0, 0.172 + i * 0.022, 0.13 - i * 0.05]} rotation={[0, 0, Math.PI / 2]} shadow={false} />
      ))}
    </group>
  );
}

/** A pair of running shoes, toes toward +z. */
export function ToySneakers({ position = [0, 0, 0], turn = 0, scale = 1, color = "#F26A2E", sole = "#F4F1EA" }: At & { color?: string; sole?: string }) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]} scale={scale}>
      <Sneaker x={-0.14} color={color} sole={sole} />
      <group rotation={[0, -0.12, 0]}><Sneaker x={0.14} color={color} sole={sole} /></group>
    </group>
  );
}

/** A hard-shell cabin suitcase on two wheels with its handle out. `lean` (degrees) tips it back for pulling. */
export function ToySuitcase({ position = [0, 0, 0], turn = 0, scale = 1, color = "#B8322E", lean = 0 }: At & { color?: string; lean?: number }) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]} scale={scale}>
      <group rotation={[-lean * RAD, 0, 0]}>
        <Block size={[0.46, 0.66, 0.26]} radius={0.06} color={color} position={[0, 0.4, 0]} roughness={0.5} />
        {[-0.12, 0, 0.12].map((x) => <Block key={x} size={[0.03, 0.6, 0.27]} radius={0.012} color={shade(color, 0.8)} position={[x, 0.4, 0]} roughness={0.5} />)}
        {[-0.1, 0.1].map((x) => <Pill key={x} radius={0.012} length={0.42} color="#C9CCD6" position={[x, 0.95, -0.08]} roughness={0.35} />)}
        <Block size={[0.26, 0.04, 0.05]} radius={0.018} color="#2B2B33" position={[0, 1.18, -0.08]} />
        {[-0.17, 0.17].map((x) => <Drum key={x} radius={0.045} height={0.04} color="#1D1D22" position={[x, 0.045, -0.06]} rotation={[0, 0, Math.PI / 2]} />)}
      </group>
    </group>
  );
}

/** A banknote, flat in the x-y plane. Rotate and move it per frame for a note that flutters away. */
export function ToyBanknote({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color = "#3FA35B" }: { position?: Vec3; rotation?: Vec3; scale?: number; color?: string }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Block size={[0.62, 0.3, 0.012]} radius={0.005} color={color} roughness={0.9} />
      <Block size={[0.54, 0.22, 0.016]} radius={0.006} color={shade(color, 1.22)} roughness={0.9} shadow={false} />
      <Drum radius={0.075} height={0.02} color={shade(color, 0.82)} rotation={[Math.PI / 2, 0, 0]} shadow={false} />
    </group>
  );
}

export function ToyMug({ position = [0, 0, 0], scale = 1, color = "#F4F1EA" }: At & { color?: string }) {
  return (
    <group position={position} scale={scale}>
      <Drum radius={0.07} height={0.15} color={color} position={[0, 0.075, 0]} roughness={0.4} />
      <Drum radius={0.058} height={0.01} color="#4A2C1A" position={[0, 0.151, 0]} roughness={0.3} shadow={false} />
      <Ring radius={0.04} tube={0.012} color={color} position={[0.085, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} roughness={0.4} />
    </group>
  );
}

/** A soft ball of light with no geometry behind it, e.g. the glow of a phone screen in a dark room. */
export function ToyGlowOrb({ position = [0, 0, 0], radius = 0.1, color = "#FFFFFF" }: { position?: Vec3; radius?: number; color?: string }) {
  return <Ball radius={radius} color={color} glow={color} glowStrength={2} position={position} shadow={false} />;
}
