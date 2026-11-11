import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FlatQuad, ToonBox } from "./ToonBox";
import { palette } from "../theme/palette";
import { DepthLayer, plateCatchUp, useCameraState } from "../camera/layers";

// The "colourful 3D world" layer: a three-walled box room rendered with toon
// materials, seen by a camera that dollies slowly for parallax. Characters
// are NOT in here; they are 2D SVG actors layered on top by the scene.
// Depth: the shot's 2D camera move reaches the plate at `plateDepth` (0.5),
// and the three.js camera dollies and trucks for the rest, so the lookAt
// plane lands where the actors are while the back wall moves less and the
// near floor more. That is real perspective parallax, not a scaled picture.
// Units: metres. Floor at y=0, back wall at z=-3, side walls at x=+-2.6.
// Portrait frames are narrow: about 4 m of back wall is visible at the
// default camera, so keep furniture within x=+-2 and z=-2.8..2.

export type Vec3 = [number, number, number];

export type RoomProps = {
  wall?: string;
  sideWall?: string;
  floor?: string;
  /** Warm light patch on the back wall, the reference channel's signature. */
  sunPatch?: boolean;
  /** Camera position at the start and end of the shot. */
  cameraFrom?: Vec3;
  cameraTo?: Vec3;
  lookAt?: Vec3;
  fov?: number;
  /** Share of the shot's 2D move the flat plate takes; the 3D camera makes up the rest. 1 = old flat behaviour. */
  plateDepth?: number;
  children?: React.ReactNode; // furniture from props3d.tsx
};

export type CatchUp = { zoom: number; shiftX: number; shiftY: number };

/** Moves the camera toward lookAt so the focal plane grows by `zoom`, then trucks it to shift the image. */
export function applyCatchUp(camera: THREE.PerspectiveCamera, target: THREE.Vector3, catchUp: CatchUp, aspect: number) {
  const forward = target.clone().sub(camera.position);
  const distance = forward.length();
  forward.normalize();
  const dolly = distance * (1 - 1 / catchUp.zoom);
  camera.position.addScaledVector(forward, dolly);
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  const up = right.clone().cross(forward).normalize();
  const visibleH = 2 * (distance - dolly) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const truck = right.multiplyScalar(-catchUp.shiftX * visibleH * aspect).add(up.multiplyScalar(catchUp.shiftY * visibleH));
  camera.position.add(truck);
  target.add(truck);
}

function DollyCamera({ from, to, lookAt, fov, catchUp }: { from: Vec3; to: Vec3; lookAt: Vec3; fov: number; catchUp: CatchUp }) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  camera.position.set(...(from.map((v, i) => v + (to[i] - v) * t) as Vec3));
  camera.fov = fov;
  const target = new THREE.Vector3(...lookAt);
  applyCatchUp(camera, target, catchUp, width / height);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
}

export function Room3D({
  wall = palette.wallCool, sideWall = palette.wallMint, floor = palette.floorBlue, sunPatch = true,
  cameraFrom = [0.7, 2.4, 5.2], cameraTo = [0.95, 2.3, 4.8], lookAt = [0, 0.9, -1], fov = 62, plateDepth = 0.5, children,
}: RoomProps) {
  const { width, height } = useVideoConfig();
  const catchUp = plateCatchUp(useCameraState(), plateDepth);
  return (
    <DepthLayer depth={plateDepth}>
      <ThreeCanvas width={width} height={height} style={{ position: "absolute", inset: 0 }} gl={{ antialias: true }}>
        <color attach="background" args={[wall]} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 6, 5]} intensity={2.2} />
        <DollyCamera from={cameraFrom} to={cameraTo} lookAt={lookAt} fov={fov} catchUp={catchUp} />
        <ToonBox size={[5.4, 0.1, 9]} position={[0, -0.05, 1.5]} color={floor} outline={0} />
        <ToonBox size={[5.4, 4.2, 0.1]} position={[0, 2.1, -3.05]} color={wall} outline={0} />
        <ToonBox size={[0.1, 4.2, 9]} position={[-2.65, 2.1, 1.5]} color={sideWall} outline={0} />
        <ToonBox size={[0.1, 4.2, 9]} position={[2.65, 2.1, 1.5]} color={sideWall} outline={0} />
        <ToonBox size={[5.4, 0.1, 9]} position={[0, 4.2, 1.5]} color="#F4F4F0" outline={0} />
        <ToonBox size={[5.4, 0.12, 0.04]} position={[0, 0.06, -2.99]} color="#FFFFFF" outline={0.02} />
        {sunPatch ? <FlatQuad size={[1.5, 2.4]} position={[0.9, 2.0, -2.98]} rotation={[0, 0, -0.3]} color={palette.sunPatch} opacity={0.85} /> : null}
        {children}
      </ThreeCanvas>
    </DepthLayer>
  );
}
