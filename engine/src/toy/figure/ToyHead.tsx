import React, { useMemo } from "react";
import * as THREE from "three";
import { Ball, Block, Pill, RoundDrum } from "../shapes";
import type { ToyCast, ToyFace } from "./toyCast";

// The head of a toy figure: a rounded drum with two glossy bead eyes, a
// small mouth and a hair piece cut from the same profile. The origin is the
// neck (the bottom of the head), so a nod pivots where a neck would.

export const HEAD = { radius: 0.2, height: 0.33, corner: 0.085 };
const EYE = { x: 0.078, y: -0.012, radius: 0.03 };
const MOUTH_Y = -0.092;
const FEATURE = "#2A1512";
const frontOf = (x: number) => Math.sqrt(HEAD.radius * HEAD.radius - x * x);

function Eye({ side, face, blink, skin }: { side: 1 | -1; face: ToyFace; blink: number; skin: string }) {
  const x = EYE.x * side;
  const open = face.eyes === "closed" ? 0.1 : Math.max(0.1, blink) * (face.eyes === "wide" ? 1.25 : 1);
  const size = face.eyes === "wide" ? 1.2 : 1;
  const lid = useMemo(() => new THREE.SphereGeometry(EYE.radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), []);
  return (
    <group position={[x, EYE.y, frontOf(x) - 0.008]} rotation={[0, Math.asin(x / HEAD.radius), 0]}>
      <Ball radius={EYE.radius} color="#0E0B10" roughness={0.15} scale={[size, size * open, 0.55]} shadow={false} />
      {open > 0.5 ? (
        <mesh position={[0.008, 0.011, EYE.radius * 0.5]}>
          <sphereGeometry args={[0.0075, 10, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ) : null}
      {face.lid > 0 && open > 0.2 ? (
        // The upper lid: the top half of a slightly larger bead, tipped forward as it closes.
        <mesh geometry={lid} scale={[size * 1.16, size * 1.16, 0.66]} rotation={[(face.lid - 0.5) * 1.7, 0, 0]}>
          <meshStandardMaterial color={skin} roughness={0.72} />
        </mesh>
      ) : null}
    </group>
  );
}

function Brow({ side, kind, color }: { side: 1 | -1; kind: ToyFace["brows"]; color: string }) {
  if (kind === "none") return null;
  const x = EYE.x * side;
  const tilt = kind === "angry" ? 0.38 : kind === "worried" ? -0.34 : 0;
  const raise = kind === "raised" ? 0.02 : 0;
  return (
    <group position={[x, EYE.y + 0.062 + raise, frontOf(x) + 0.002]} rotation={[0, Math.asin(x / HEAD.radius), tilt * side]}>
      <Pill radius={0.008} length={0.04} color={color} rotation={[0, 0, Math.PI / 2]} shadow={false} />
    </group>
  );
}

function Mouth({ kind }: { kind: ToyFace["mouth"] }) {
  const curve = useMemo(() => new THREE.TorusGeometry(0.036, 0.0075, 8, 20, Math.PI * 0.7), []);
  const z = HEAD.radius - 0.003;
  if (kind === "none") return null;
  if (kind === "flat") return <Pill radius={0.0075} length={0.04} color={FEATURE} position={[0, MOUTH_Y, z]} rotation={[0, 0, Math.PI / 2]} shadow={false} />;
  if (kind === "open") return <Ball radius={0.026} color={FEATURE} position={[0, MOUTH_Y - 0.006, z - 0.004]} scale={[1, 1.25, 0.4]} shadow={false} />;
  // The arc starts at 3 o'clock and runs anticlockwise; turn it so it is centred below (smile) or above (frown).
  const turn = (kind === "smile" ? -Math.PI / 2 : Math.PI / 2) - (Math.PI * 0.7) / 2;
  const y = kind === "smile" ? MOUTH_Y + 0.024 : MOUTH_Y - 0.034;
  return (
    <mesh geometry={curve} position={[0, y, z]} rotation={[0, 0, turn]}>
      <meshStandardMaterial color={FEATURE} roughness={0.7} />
    </mesh>
  );
}

function Hair({ cast }: { cast: ToyCast }) {
  if (cast.hair === "bald") return null;
  const shell = { radius: HEAD.radius * 1.075, height: HEAD.height * 1.09, corner: HEAD.corner * 1.15, color: cast.hairColor, roughness: 0.92 };
  const beanie = cast.hair === "beanie";
  return (
    <group>
      <RoundDrum {...shell} from={beanie ? 0.6 : 0.66} to={1} />
      {beanie ? (
        <>
          <RoundDrum radius={HEAD.radius * 1.13} height={0.07} corner={0.03} color={cast.hairColor} roughness={0.95} position={[0, 0.045, 0]} />
          <Ball radius={0.05} color={cast.hairColor} roughness={0.95} position={[0, HEAD.height / 2 + 0.05, 0]} />
        </>
      ) : (
        <RoundDrum {...shell} from={0.38} to={0.7} arc={[Math.PI * 0.7, Math.PI * 1.3]} />
      )}
      {cast.hair === "bun" ? <Ball radius={0.085} color={cast.hairColor} roughness={0.92} position={[0, HEAD.height / 2 + 0.035, -0.07]} /> : null}
      {cast.hair === "long" ? <Block size={[0.38, 0.4, 0.13]} radius={0.06} color={cast.hairColor} roughness={0.92} position={[0, -0.16, -0.145]} /> : null}
    </group>
  );
}

export function ToyHead({ cast, face, blink }: { cast: ToyCast; face: ToyFace; blink: number }) {
  return (
    <group position={[0, HEAD.height / 2 - 0.012, 0]}>
      <RoundDrum radius={HEAD.radius} height={HEAD.height} corner={HEAD.corner} color={cast.skin} roughness={0.72} />
      <Eye side={1} face={face} blink={blink} skin={cast.skin} />
      <Eye side={-1} face={face} blink={blink} skin={cast.skin} />
      <Brow side={1} kind={face.brows} color={cast.hairColor} />
      <Brow side={-1} kind={face.brows} color={cast.hairColor} />
      <Mouth kind={face.mouth} />
      <Hair cast={cast} />
    </group>
  );
}
