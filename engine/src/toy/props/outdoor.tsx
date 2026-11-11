import React from "react";
import { Ball, Block, Drum, type Vec3 } from "../shapes";

// Outdoor pieces for the toy style: ground, a pavement, a small house, a
// bush and a tree. An outdoor shot has no room shell; the sky is the
// mood's backdrop (stage/lighting.ts), so "dawn" gives a sunrise street.

type At = { position?: Vec3; turn?: number; scale?: number };
const RAD = Math.PI / 180;

/** A lawn with a pavement running along x in front of it. Walk figures along the pavement (z about 1). */
export function ToyStreet({ grass = "#6FA356", pavement = "#D9CBB8", road = "#8C8478", length = 30 }: { grass?: string; pavement?: string; road?: string; length?: number }) {
  return (
    <group>
      <Block size={[length, 0.2, 14]} radius={0.02} color={grass} position={[0, -0.1, -6.6]} roughness={0.95} />
      <Block size={[length, 0.22, 1.7]} radius={0.03} color={pavement} position={[0, -0.1, 1.2]} roughness={0.9} />
      <Block size={[length, 0.16, 8]} radius={0.02} color={road} position={[0, -0.12, 6]} roughness={0.95} />
    </group>
  );
}

/** A small house with a gable roof, a door and one window, facing +z. About 3 wide and 3.6 tall. */
export function ToyHouse({ position = [0, 0, -2.5], turn = 0, scale = 1, wall = "#F2DFC4", roof = "#B5533C", door = "#7A4A32", pane = "#FFE9B0", lit = true }: At & {
  wall?: string; roof?: string; door?: string; pane?: string; lit?: boolean;
}) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]} scale={scale}>
      <Block size={[3, 2.2, 2.6]} radius={0.05} color={wall} position={[0, 1.1, 0]} roughness={0.92} />
      {[-1, 1].map((side) => (
        <Block key={side} size={[2.15, 0.16, 3]} radius={0.05} color={roof} position={[0.8 * side, 2.72, 0]} rotation={[0, 0, -0.68 * side]} />
      ))}
      <Block size={[2.2, 1.0, 2.5]} radius={0.05} color={wall} position={[0, 2.4, 0]} scale={[1, 1, 0.99]} roughness={0.92} />
      <Block size={[0.7, 1.4, 0.08]} radius={0.03} color={door} position={[-0.7, 0.7, 1.31]} />
      <Block size={[0.9, 0.8, 0.08]} radius={0.03} color="#FFFFFF" position={[0.65, 1.25, 1.31]} />
      <Block size={[0.76, 0.66, 0.05]} radius={0.02} color={pane} glow={lit ? pane : undefined} glowStrength={0.9} position={[0.65, 1.25, 1.34]} shadow={false} />
    </group>
  );
}

/** A low clump of leaves. */
export function ToyBush({ position = [0, 0, 0], scale = 1, color = "#4E8F45" }: At & { color?: string }) {
  return (
    <group position={position} scale={scale}>
      <Ball radius={0.42} color={color} roughness={0.95} position={[0, 0.3, 0]} scale={[1.2, 0.85, 1]} />
      <Ball radius={0.32} color={color} roughness={0.95} position={[0.45, 0.24, 0.1]} />
      <Ball radius={0.3} color={color} roughness={0.95} position={[-0.42, 0.22, 0.12]} />
    </group>
  );
}

export function ToyTree({ position = [0, 0, 0], scale = 1, leaves = "#5C9A4C", trunk = "#7A5236" }: At & { leaves?: string; trunk?: string }) {
  return (
    <group position={position} scale={scale}>
      <Drum radius={0.14} topRadius={0.1} height={1.3} color={trunk} position={[0, 0.65, 0]} />
      <Ball radius={0.75} color={leaves} roughness={0.95} position={[0, 1.85, 0]} />
      <Ball radius={0.5} color={leaves} roughness={0.95} position={[0.5, 1.5, 0.15]} />
      <Ball radius={0.48} color={leaves} roughness={0.95} position={[-0.48, 1.55, 0.1]} />
    </group>
  );
}

/** A street lamp; `on` makes the head glow. */
export function ToyStreetLamp({ position = [0, 0, 0], on = false }: { position?: Vec3; on?: boolean }) {
  return (
    <group position={position}>
      <Drum radius={0.05} height={2.6} color="#3A3F4F" position={[0, 1.3, 0]} />
      <Block size={[0.5, 0.12, 0.2]} radius={0.04} color="#3A3F4F" position={[0.2, 2.62, 0]} />
      <Block size={[0.3, 0.05, 0.14]} radius={0.02} color="#FFE9B0" glow={on ? "#FFD27A" : undefined} glowStrength={1.8} position={[0.26, 2.55, 0]} shadow={false} />
    </group>
  );
}
