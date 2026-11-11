import type React from "react";
import { ToyBedroom, ToyDoorstep, ToyEndCard, ToyGate, ToyStreetScene } from "@engine/toy/demoScenes";

// script.json names scenes by these keys; shot.params become the props.
// These are the engine's toy-style starter scenes. Replace them with the
// short's own (scenes/<folder>/*.tsx) as it takes shape.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sceneRegistry: Record<string, React.ComponentType<any>> = {
  toyBedroom: ToyBedroom,
  toyGate: ToyGate,
  toyStreet: ToyStreetScene,
  toyDoorstep: ToyDoorstep,
  endCard: ToyEndCard,
};
