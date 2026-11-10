import type React from "react";
import { CardReveal, EndCard, PhoneFocus, PhoneReveal, RoomWithBag } from "@engine/scenes/demoScenes";

// script.json names scenes by these keys; shot.params become the props.
// Register every scene a short uses. An unknown key fails the render loudly.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sceneRegistry: Record<string, React.ComponentType<any>> = {
  roomWithBag: RoomWithBag,
  phoneReveal: PhoneReveal,
  phoneFocus: PhoneFocus,
  cardReveal: CardReveal,
  endCard: EndCard,
};
