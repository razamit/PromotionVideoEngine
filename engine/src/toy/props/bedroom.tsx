import React, { useMemo } from "react";
import * as THREE from "three";
import { Block, Drum, Pill, type Vec3 } from "../shapes";
import { Practical } from "../stage/ToyStage";

// Bedroom furniture for the toy style. Every piece sits on the floor at its
// `position` and faces +z unless `turn` (degrees) says otherwise.

type At = { position?: Vec3; turn?: number };
const RAD = Math.PI / 180;

/**
 * A bed along z, pillow at the far end. The top of the mattress is at
 * y = 0.45, which is the seat height for toyPoses.sit(0.45).
 */
export function ToyBed({ position = [0, 0, 0], turn = 0, frame = "#5B3A2E", sheet = "#E9E4F5", blanket = ["#D9534F", "#E8A33D", "#3D7DD9", "#49A66A"] }: At & {
  frame?: string; sheet?: string; blanket?: string[];
}) {
  const stripes = blanket.length;
  const length = 1.25;
  return (
    <group position={position} rotation={[0, turn * RAD, 0]}>
      <Block size={[1.3, 0.22, 2.2]} radius={0.05} color={frame} position={[0, 0.13, 0]} />
      <Block size={[1.22, 0.2, 2.1]} radius={0.08} color={sheet} position={[0, 0.34, 0]} />
      <Block size={[1.36, 0.85, 0.12]} radius={0.05} color={frame} position={[0, 0.5, -1.1]} />
      <Block size={[0.62, 0.13, 0.36]} radius={0.06} color="#FFFFFF" position={[0, 0.49, -0.78]} />
      {blanket.map((color, i) => (
        <Block key={i} size={[1.28, 0.1, length / stripes + 0.01]} radius={0.04} color={color} position={[0, 0.42, 0.42 - length / 2 + (length / stripes) * (i + 0.5)]} roughness={0.95} />
      ))}
    </group>
  );
}

/** A bedside table with one drawer. Top at y = 0.5. */
export function ToyNightstand({ position = [0, 0, 0], turn = 0, color = "#7A2E2A" }: At & { color?: string }) {
  return (
    <group position={position} rotation={[0, turn * RAD, 0]}>
      <Block size={[0.6, 0.5, 0.46]} radius={0.04} color={color} position={[0, 0.25, 0]} />
      <Block size={[0.48, 0.16, 0.03]} radius={0.012} color={color} position={[0, 0.34, 0.235]} roughness={0.6} />
      <Drum radius={0.022} height={0.03} color="#E8C36A" roughness={0.35} position={[0, 0.34, 0.26]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/** A table lamp. `on` lights the shade and adds a warm practical light around it. */
export function ToyLamp({ position = [0, 0, 0], on = true, shade = "#FFD9A0", light = "#FFA85A", strength = 5 }: {
  position?: Vec3; on?: boolean; shade?: string; light?: string; strength?: number;
}) {
  return (
    <group position={position}>
      <Drum radius={0.085} height={0.03} color="#2B2B3A" position={[0, 0.015, 0]} />
      <Pill radius={0.014} length={0.2} color="#2B2B3A" position={[0, 0.14, 0]} />
      <Drum radius={0.15} topRadius={0.09} height={0.2} color={shade} glow={on ? light : undefined} glowStrength={1.6} position={[0, 0.33, 0]} shadow={false} />
      {on ? <Practical position={[0, 0.34, 0.05]} color={light} strength={strength} reach={5} /> : null}
    </group>
  );
}

/** Text drawn on a canvas, for the few places where a prop itself shows digits. Labels a viewer must read stay in the 2D overlays. */
function useTextTexture(text: string, color: string, background: string) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    g.fillStyle = background;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = color;
    g.font = "bold 190px Menlo, Courier New, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 140);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [text, color, background]);
}

/** A digital alarm clock whose digits glow. `time` is what it shows, e.g. "5:00". */
export function ToyAlarmClock({ position = [0, 0, 0], turn = 0, time = "5:00", color = "#FF4A3D", body = "#1A1A22" }: At & { time?: string; color?: string; body?: string }) {
  const face = useTextTexture(time, color, "#120606");
  return (
    <group position={position} rotation={[0, turn * RAD, 0]}>
      <Block size={[0.34, 0.17, 0.12]} radius={0.03} color={body} position={[0, 0.085, 0]} roughness={0.5} />
      <mesh position={[0, 0.088, 0.0615]}>
        <planeGeometry args={[0.28, 0.12]} />
        <meshBasicMaterial map={face} toneMapped={false} />
      </mesh>
      <Practical position={[0, 0.1, 0.25]} color={color} strength={0.6} reach={1.6} />
    </group>
  );
}
