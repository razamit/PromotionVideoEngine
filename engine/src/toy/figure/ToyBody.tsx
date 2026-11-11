import React from "react";
import { Ball, Block, Pill, Ring, shade } from "../shapes";
import type { ToyCast } from "./toyCast";

// Torso, arms and legs of a toy figure. Each limb is two capsules on a
// joint, posed in degrees (toyPose.ts). The figure faces +z; its left side
// is +x. Origins are the joints, so every rotation pivots where it should.

const RAD = Math.PI / 180;
export const BODY = {
  torso: [0.36, 0.46, 0.24] as [number, number, number],
  neckY: 0.45,
  shoulder: { x: 0.215, y: 0.37 },
  upperArm: 0.17, foreArm: 0.16, armRadius: 0.058, handRadius: 0.058,
  hipX: 0.088, thigh: 0.21, shin: 0.2, legRadius: 0.075,
};

function Segment({ length, radius, color }: { length: number; radius: number; color: string }) {
  return <Pill radius={radius} length={Math.max(0.01, length - radius)} color={color} position={[0, -length / 2, 0]} />;
}

export function ToyArm({ side, swing, out, elbow, cast, held }: {
  side: 1 | -1; swing: number; out: number; elbow: number; cast: ToyCast; held?: React.ReactNode;
}) {
  const sleeve = cast.top === "hoodie" ? cast.topColor : cast.skin;
  return (
    <group position={[BODY.shoulder.x * side, BODY.shoulder.y, 0]} rotation={[-swing * RAD, 0, out * RAD * side]}>
      <Segment length={BODY.upperArm} radius={BODY.armRadius} color={cast.topColor} />
      <group position={[0, -BODY.upperArm, 0]} rotation={[-elbow * RAD, 0, 0]}>
        <Segment length={BODY.foreArm} radius={BODY.armRadius * 0.96} color={sleeve} />
        <group position={[0, -BODY.foreArm - 0.02, 0]}>
          <Ball radius={BODY.handRadius} color={cast.skin} roughness={0.72} />
          {held}
        </group>
      </group>
    </group>
  );
}

export function ToyLeg({ side, swing, knee, cast }: { side: 1 | -1; swing: number; knee: number; cast: ToyCast }) {
  return (
    <group position={[BODY.hipX * side, 0, 0]} rotation={[-swing * RAD, 0, 0]}>
      <Segment length={BODY.thigh} radius={BODY.legRadius} color={cast.legColor} />
      <group position={[0, -BODY.thigh, 0]} rotation={[knee * RAD, 0, 0]}>
        <Segment length={BODY.shin} radius={BODY.legRadius * 0.94} color={cast.legColor} />
        <group position={[0, -BODY.shin - 0.045, 0.05]}>
          <Block size={[0.15, 0.085, 0.27]} radius={0.04} color={cast.shoeColor} roughness={0.6} />
          <Block size={[0.156, 0.03, 0.276]} radius={0.014} color="#F4F1EA" roughness={0.6} position={[0, -0.034, 0]} />
        </group>
      </group>
    </group>
  );
}

function HoodieDetails({ color }: { color: string }) {
  return (
    <>
      <Ring radius={0.125} tube={0.05} color={color} position={[0, BODY.neckY - 0.012, -0.045]} rotation={[-0.42, 0, 0]} />
      <Block size={[0.23, 0.105, 0.03]} radius={0.014} color={shade(color, 0.86)} position={[0, 0.115, BODY.torso[2] / 2]} />
      {[-1, 1].map((s) => (
        <Pill key={s} radius={0.006} length={0.085} color="#EDE9E0" position={[0.034 * s, 0.33, BODY.torso[2] / 2 + 0.006]} shadow={false} />
      ))}
    </>
  );
}

export function ToyTorso({ cast }: { cast: ToyCast }) {
  return (
    <>
      <Block size={BODY.torso} radius={0.1} color={cast.topColor} position={[0, BODY.torso[1] / 2 - 0.01, 0]} />
      {cast.top === "hoodie" ? <HoodieDetails color={cast.topColor} /> : null}
    </>
  );
}

