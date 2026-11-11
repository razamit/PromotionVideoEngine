import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { applyCatchUp, type CatchUp } from "../../world/Room3D";
import type { Vec3 } from "../shapes";

// The toy stage's camera. Everything in this style is 3D (the figures are in
// the scene, not pasted on top), so the whole of a shot's camera move in
// script.json (push, crash, pan) becomes a real dolly and truck here, on top
// of the scene's own from -> to flight.

export type ToyCameraSpec = {
  /** Camera position at the start of the shot. */
  from: Vec3;
  /** Where it ends; default is `from` (the shot's script move still applies). */
  to?: Vec3;
  /** The point it looks at; put it on the subject. */
  lookAt: Vec3;
  lookAtTo?: Vec3;
  /** Vertical field of view. 30-38 reads as a long lens (flatter, more cinematic), 50+ as wide. Default 36. */
  fov?: number;
  /** Small hand-held drift in world units. Default 0.012; 0 locks it. */
  sway?: number;
};

const ease = Easing.bezier(0.3, 0, 0.2, 1);
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function ToyCamera({ spec, catchUp }: { spec: ToyCameraSpec; catchUp: CatchUp }) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const t = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const sway = spec.sway ?? 0.012;
  const [x, y, z] = mix(spec.from, spec.to ?? spec.from, t);
  camera.position.set(x + Math.sin(frame / 37) * sway, y + Math.sin(frame / 29 + 1.3) * sway * 0.7, z);
  camera.fov = spec.fov ?? 36;
  const target = new THREE.Vector3(...mix(spec.lookAt, spec.lookAtTo ?? spec.lookAt, t));
  applyCatchUp(camera, target, catchUp, width / height);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
}
