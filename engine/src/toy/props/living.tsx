import React from "react";
import { Block, Drum, type Vec3 } from "../shapes";

// Living-room furniture for the toy style. Seat heights match toyPoses.sit().

type At = { position?: Vec3; turn?: number };
const RAD = Math.PI / 180;

/** A two-seat couch facing +z. The seat is at y = 0.42: toyPoses.sit(0.42). */
export function ToyCouch({ position = [0, 0, 0], turn = 0, color = "#3F4A5F", cushion = "#E8A33D" }: At & { color?: string; cushion?: string }) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]}>
      <Block size={[2.1, 0.3, 0.95]} radius={0.08} color={color} position={[0, 0.2, 0]} roughness={0.95} />
      <Block size={[1.66, 0.14, 0.8]} radius={0.06} color={color} position={[0, 0.36, 0.05]} roughness={0.95} />
      <Block size={[2.1, 0.75, 0.3]} radius={0.1} color={color} position={[0, 0.62, -0.36]} roughness={0.95} />
      {[-1, 1].map((side) => <Block key={side} size={[0.26, 0.5, 0.95]} radius={0.09} color={color} position={[0.94 * side, 0.45, 0]} roughness={0.95} />)}
      <Block size={[0.42, 0.42, 0.14]} radius={0.06} color={cushion} position={[0.55, 0.62, -0.16]} rotation={[-0.25, 0, 0.1]} roughness={0.95} />
    </group>
  );
}

/** A low table. Top at y = 0.4. */
export function ToyCoffeeTable({ position = [0, 0, 0], turn = 0, color = "#8A5A3C" }: At & { color?: string }) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]}>
      <Block size={[1.1, 0.07, 0.6]} radius={0.03} color={color} position={[0, 0.365, 0]} />
      {[[-0.46, -0.22], [0.46, -0.22], [-0.46, 0.22], [0.46, 0.22]].map(([x, z]) => (
        <Drum key={`${x}${z}`} radius={0.03} height={0.34} color={color} position={[x, 0.17, z]} />
      ))}
    </group>
  );
}

/** A round rug. */
export function ToyRug({ position = [0, 0, 0], radius = 1.2, color = "#5A4A8A" }: { position?: Vec3; radius?: number; color?: string }) {
  return <Drum radius={radius} height={0.02} color={color} position={[position[0], position[1] + 0.012, position[2]]} roughness={1} />;
}
