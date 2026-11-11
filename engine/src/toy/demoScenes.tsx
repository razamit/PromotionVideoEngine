import React from "react";
import { AbsoluteFill } from "remotion";
import { ToyFigure, ToyFollower } from "./figure/ToyFigure";
import type { ToyFaceMood } from "./figure/toyCast";
import type { ToyWalk } from "./figure/toyMotion";
import { toyPoses, type ToyPose } from "./figure/toyPose";
import { BrandEndCard, type BrandEndCardProps } from "./overlay/BrandEndCard";
import { SceneOverlays, type OverlayParams } from "./overlay/SceneOverlays";
import { ToyAlarmClock, ToyBed, ToyLamp, ToyNightstand } from "./props/bedroom";
import { ToySneakers, ToySuitcase } from "./props/items";
import { ToyBush, ToyHouse, ToyStreet, ToyTree } from "./props/outdoor";
import { ToyDoor, ToyRoom, ToyWindow } from "./props/room";
import { Block } from "./shapes";
import type { ToyMood } from "./stage/lighting";
import type { ToyCameraSpec } from "./stage/ToyCamera";
import { ToyStage } from "./stage/ToyStage";

// Starter scenes of the toy style, used by the engine's example-toy short
// (the smoke test new_short.sh --style toy copies). They show the pattern: a
// ToyStage with a set and a figure, a few named camera angles, and
// <SceneOverlays> so script.json can add a readout, a ticket, a stamp or the
// floating phone per shot. A real short keeps its own scenes in scenes/.

const SEAT = 0.45; // top of the ToyBed mattress

const bedroomAngles: Record<string, ToyCameraSpec> = {
  wide: { from: [0.55, 1.3, 4.4], to: [0.4, 1.22, 3.9], lookAt: [0.1, 0.95, 0] },
  close: { from: [-0.35, 1.2, 2.3], to: [-0.25, 1.18, 2.05], lookAt: [0, 1.08, 0.1], fov: 30 },
  /** The figure low in the frame, room above its head for the floating phone. */
  low: { from: [0.25, 1.45, 3.7], to: [0.2, 1.45, 3.4], lookAt: [0.05, 1.7, 0] },
  clock: { from: [0.35, 0.95, 0.9], to: [0.5, 0.9, 0.6], lookAt: [1.1, 0.62, -1.1], fov: 32 },
};

const bedroomPoses: Record<string, ToyPose> = {
  sit: toyPoses.sit(SEAT),
  slump: toyPoses.slump(SEAT),
  hold: { ...toyPoses.sit(SEAT), ...toyPoses.hold },
};

export type ToyBedroomProps = OverlayParams & {
  angle?: keyof typeof bedroomAngles;
  pose?: keyof typeof bedroomPoses;
  mood?: ToyFaceMood;
  light?: ToyMood;
  time?: string;
};

export function ToyBedroom({ angle = "wide", pose = "sit", mood = "tired", light = "night", time = "5:00", ...overlays }: ToyBedroomProps) {
  return (
    <AbsoluteFill>
      <ToyStage mood={light} camera={bedroomAngles[angle]}>
        <ToyRoom>
          <ToyWindow position={[1.0, 2.0, -2.19]} />
          <ToyBed position={[0, 0, -0.9]} />
          <ToyNightstand position={[1.15, 0, -1.2]} />
          <ToyLamp position={[1.28, 0.5, -1.28]} />
          <ToyAlarmClock position={[1.04, 0.5, -1.06]} turn={-18} time={time} />
        </ToyRoom>
        <ToyFigure position={[0, 0, 0.1]} pose={bedroomPoses[pose]} mood={mood} />
      </ToyStage>
      <SceneOverlays {...overlays} />
    </AbsoluteFill>
  );
}

const gateRun: ToyWalk = { from: [1.5, 0, 0.4], to: [-1.9, 0, 0.4], energy: 1.6 };

/** A terminal at sunrise: "you" runs for the gate with a suitcase. */
export function ToyGate(overlays: OverlayParams) {
  return (
    <AbsoluteFill>
      <ToyStage mood="terminal" look={{ backdrop: "linear-gradient(180deg, #F6B26B 0%, #FAD3A0 55%, #E6E8EE 100%)" }} camera={{ from: [1.0, 1.15, 5.2], to: [-1.0, 1.1, 4.9], lookAt: [1.0, 0.85, 0.3], lookAtTo: [-1.3, 0.85, 0.3] }}>
        <Block size={[14, 0.2, 9]} radius={0.02} color="#D8D3C8" position={[0, -0.1, 1]} roughness={0.6} />
        <Block size={[14, 0.5, 0.3]} radius={0.04} color="#3A3F4F" position={[0, 0.25, -2.4]} />
        {[-4.5, -1.5, 1.5, 4.5].map((x) => <Block key={x} size={[0.3, 4.4, 0.3]} radius={0.04} color="#3A3F4F" position={[x, 2.2, -2.4]} />)}
        <Block size={[14, 0.4, 0.3]} radius={0.04} color="#3A3F4F" position={[0, 4.2, -2.4]} />
        {[-2.4, 1.4].map((x) => <Block key={x} size={[1.9, 0.14, 0.5]} radius={0.05} color="#4A5578" position={[x, 0.45, -1.5]} />)}
        <ToyFigure walk={gateRun} mood="determined" pose={toyPoses.pull} />
        <ToyFollower walk={gateRun} behind={0.52}><ToySuitcase lean={24} position={[-0.2, 0, 0]} /></ToyFollower>
      </ToyStage>
      <SceneOverlays {...overlays} />
    </AbsoluteFill>
  );
}

const streetWalk: ToyWalk = { from: [-2.4, 0, 1.2], to: [1.9, 0, 1.2] };

/** The payoff: a street at sunrise, "you" out and moving. `run` makes it a run. */
export function ToyStreetScene({ run = false, mood = "happy", ...overlays }: OverlayParams & { run?: boolean; mood?: ToyFaceMood }) {
  return (
    <AbsoluteFill>
      <ToyStage mood="dawn" camera={{ from: [-0.9, 1.15, 6.4], to: [0.5, 1.1, 6.1], lookAt: [-0.9, 0.9, 1.2], lookAtTo: [0.6, 0.9, 1.2] }}>
        <ToyStreet />
        <ToyHouse position={[-1.6, 0, -2.6]} />
        <ToyHouse position={[3.2, 0, -3.4]} wall="#E3E9D2" roof="#5C7A8A" />
        <ToyTree position={[1.1, 0, -1.6]} />
        <ToyBush position={[-0.2, 0, -0.4]} />
        <ToyBush position={[2.3, 0, -0.5]} scale={0.8} />
        <ToyFigure walk={{ ...streetWalk, energy: run ? 1.6 : 1 }} mood={mood} />
      </ToyStage>
      <SceneOverlays {...overlays} />
    </AbsoluteFill>
  );
}

/** A close insert on one prop by the front door, the place a ticket and a stamp land. */
export function ToyDoorstep({ light = "lamp", ...overlays }: OverlayParams & { light?: ToyMood }) {
  return (
    <AbsoluteFill>
      <ToyStage mood={light} camera={{ from: [0.95, 0.75, 2.7], to: [0.75, 0.62, 2.35], lookAt: [0, 0.2, 0], fov: 32 }}>
        <ToyRoom wall="#E9DCC6" floor="#B98A5E" trim="#F6F0E4" />
        <ToyDoor position={[-0.9, 0, -2.18]} />
        <ToySneakers scale={1.5} turn={18} position={[0, 0, 0]} />
      </ToyStage>
      <SceneOverlays {...overlays} />
    </AbsoluteFill>
  );
}

export function ToyEndCard(props: BrandEndCardProps) {
  return <BrandEndCard {...props} />;
}
