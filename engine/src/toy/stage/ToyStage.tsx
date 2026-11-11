import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { DepthLayer, plateCatchUp, useCameraState } from "../../camera/layers";
import type { Vec3 } from "../shapes";
import { resolveLook, type ToyLook, type ToyMood } from "./lighting";
import { ToyCamera, type ToyCameraSpec } from "./ToyCamera";

// The stage of the toy style: one lit three.js scene per shot, with soft
// shadows, fog and a vignette. Figures, sets and props all go inside it as
// children (figure/ToyFigure.tsx, props/). Flat things the viewer reads (the
// floating phone, stamps, readouts, the end card) are drawn over it by the
// scene, in overlay/.

export type ToyStageProps = {
  mood?: ToyMood;
  /** Change single values of the mood, e.g. { keyStrength: 0.6 }. */
  look?: Partial<ToyLook>;
  camera: ToyCameraSpec;
  children?: React.ReactNode;
};

const SHADOW_AREA = 7; // half-width of the square the key light casts shadows over, world units

function StageLights({ look }: { look: ToyLook }) {
  return (
    <>
      <hemisphereLight args={[look.skyColor, look.groundColor, look.skyStrength]} />
      <directionalLight
        color={look.keyColor} intensity={look.keyStrength} position={look.keyFrom} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={7}
        shadow-camera-left={-SHADOW_AREA} shadow-camera-right={SHADOW_AREA} shadow-camera-top={SHADOW_AREA} shadow-camera-bottom={-SHADOW_AREA}
        shadow-camera-near={0.5} shadow-camera-far={30}
      />
      <directionalLight color={look.fillColor} intensity={look.fillStrength} position={[0.6, 2.2, 6]} />
      <fog attach="fog" args={[look.fogColor, look.fogNear, look.fogFar]} />
    </>
  );
}

/** A small warm or coloured light with no shadow: a bedside lamp, a clock face, a phone screen on a face. */
export function Practical({ position, color = "#FFB36B", strength = 6, reach = 6 }: { position: Vec3; color?: string; strength?: number; reach?: number }) {
  return <pointLight position={position} color={color} intensity={strength} distance={reach} decay={1.6} />;
}

export function ToyStage({ mood = "night", look: overrides, camera, children }: ToyStageProps) {
  const { width, height } = useVideoConfig();
  const look = resolveLook(mood, overrides);
  // Depth 0: the 2D camera move of the shot is undone for this layer and
  // handed to the three.js camera instead, so a push is a real dolly.
  const catchUp = plateCatchUp(useCameraState(), 0);
  return (
    <DepthLayer depth={0}>
      <AbsoluteFill style={{ background: look.backdrop }} />
      <ThreeCanvas
        width={width} height={height} style={{ position: "absolute", inset: 0 }}
        shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ antialias: true, alpha: true, toneMappingExposure: look.exposure }}
      >
        <StageLights look={look} />
        <ToyCamera spec={camera} catchUp={catchUp} />
        {children}
      </ThreeCanvas>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 46%, rgba(${look.vignetteColor}, 0) 45%, rgba(${look.vignetteColor}, ${look.vignette}) 100%)`, pointerEvents: "none" }} />
    </DepthLayer>
  );
}
