import React from "react";
import cartoonOptions from "../../../slideshow/cartoon-options.json";
import { Bean } from "../../characters/Bean";
import type { HairStyle } from "../../characters/Hair";
import type { Mood } from "../../characters/moods";
import type { Pose } from "../../characters/pose";
import { palette } from "../../theme/palette";
import type { DeckCharacter } from "../deckTypes";

// The house character from the videos, standing on a slide: the same bean,
// with the look the brief's cast gives it and one mood and gesture for this
// slide. It is held still (no blink or breath), since a slide is one frame.

const GESTURES = cartoonOptions.gestures as Record<string, Pose>;

/** A cast colour is a position in the house palette (0, 1, 2) or a colour of its own ("#2ED3B7"). */
function castColour(value: number | string | undefined, houseColours: string[]): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? houseColours[value % houseColours.length] : value;
}

export const SlideCharacter: React.FC<{ character: DeckCharacter; height: number }> = ({ character, height }) => (
  <Bean
    still
    height={height}
    mood={character.mood as Mood}
    pose={GESTURES[character.gesture] ?? GESTURES.rest}
    facing={character.facing}
    hair={character.hair as HairStyle | undefined}
    hairColor={castColour(character.hairColor, palette.hair)}
    shirt={castColour(character.shirt, palette.shirts)}
    skin={castColour(character.skin, palette.skin)}
  />
);
