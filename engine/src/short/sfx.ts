import type { CameraMove, SfxCue, SfxEntry, ShotEnter, ShotSfx, TimedShot } from "../timeline/types";

// Turns each shot's `sfx` field into cues placed on the composition's clock.
// The house kit lives in public/sfx/ (scripts/make_sfx.py writes it). Rules,
// levels and examples: references/music-and-sfx.md.

/** A sound with an absolute start, ready for an <Audio> in a <Sequence>. */
export type PlacedCue = {
  key: string;
  file: string;
  volume: number;
  startSec: number;
  /** null: play the file out. */
  durationSec: number | null;
  loop: boolean;
};

/**
 * Default gain per kit file. The kit peaks at -6 dBFS; these sit it under
 * the narration (a whoosh is texture, a ding is a story beat).
 */
export const KIT_LEVELS: Record<string, number> = {
  "sfx/whoosh_a.wav": 0.45,
  "sfx/whoosh_b.wav": 0.45,
  "sfx/zoom_whoosh.wav": 0.5,
  "sfx/pop.wav": 0.5,
  "sfx/phone_buzz.wav": 0.45,
  "sfx/buzz_once.wav": 0.5,
  "sfx/ding.wav": 0.6,
  "sfx/swat.wav": 0.7,
  "sfx/fly_loop.wav": 0.25,
  "sfx/tap.wav": 0.6,
  "sfx/boing.wav": 0.55,
  "sfx/record_scratch.wav": 0.55,
  "sfx/time_skip.wav": 0.5,
  "sfx/tada.wav": 0.55,
  "sfx/honk.wav": 0.5,
};

const AUTO = "auto";
const SILENT = "none";

// The whooshes peak 0.15-0.18 s into the file, so a negative offset lands the
// peak on the cut, where the 6-frame whip or zoom blur moves fastest.
const ENTER_CUES: Partial<Record<ShotEnter, (index: number) => SfxCue>> = {
  whipLeft: (index) => ({ file: index % 2 ? "sfx/whoosh_b.wav" : "sfx/whoosh_a.wav", offset: -0.15 }),
  whipRight: (index) => ({ file: index % 2 ? "sfx/whoosh_b.wav" : "sfx/whoosh_a.wav", offset: -0.15 }),
  zoomBlur: () => ({ file: "sfx/zoom_whoosh.wav", offset: -0.18 }),
};

// crash springs in over ~8 frames: the hit lands mid-punch.
const MOVE_CUES: Partial<Record<CameraMove, SfxCue>> = {
  crash: { file: "sfx/zoom_whoosh.wav", offset: -0.1 },
  snapZoom: { file: "sfx/zoom_whoosh.wav", offset: -0.1 },
  crashOut: { file: "sfx/whoosh_b.wav", offset: -0.05 },
};

/** The automatic cue for a shot: its enter first, then its camera move. */
export function autoCueFor(shot: TimedShot): SfxCue | null {
  const byEnter = shot.enter ? ENTER_CUES[shot.enter] : undefined;
  if (byEnter) return byEnter(shot.index);
  const move = shot.camera?.move;
  return (move && MOVE_CUES[move]) || null;
}

function entriesOf(sfx: ShotSfx | undefined, autoEnabled: boolean): Array<SfxEntry> {
  if (sfx === undefined) return autoEnabled ? [AUTO] : [];
  if (sfx === null || sfx === SILENT) return [];
  return Array.isArray(sfx) ? sfx : [sfx];
}

function toCue(entry: SfxEntry, shot: TimedShot): SfxCue | null {
  if (entry === AUTO) return autoCueFor(shot);
  if (typeof entry === "string") return { file: entry };
  if (!entry || typeof entry.file !== "string") {
    throw new Error(`Shot ${shot.index} (${shot.scene}): an sfx cue needs a "file"`);
  }
  return entry;
}

function place(cue: SfxCue, shot: TimedShot, slot: number): PlacedCue {
  const startSec = shot.start + (cue.offset ?? 0);
  const loop = cue.loop ?? false;
  const untilShotEnd = Math.max(0.05, shot.end - startSec);
  return {
    key: `${shot.index}-${slot}-${cue.file}`,
    file: cue.file,
    volume: cue.volume ?? KIT_LEVELS[cue.file] ?? 1,
    startSec,
    durationSec: cue.duration ?? (loop ? untilShotEnd : null),
    loop,
  };
}

/**
 * Every cue in the short. A shot without `sfx` gets the automatic cue when
 * autoSfx is on; a shot with `sfx` gets exactly what it lists ("auto" in the
 * list adds the automatic one back, even with autoSfx off).
 */
export function placeAllCues(shots: TimedShot[], autoSfx = true): PlacedCue[] {
  return shots.flatMap((shot) =>
    entriesOf(shot.sfx, autoSfx)
      .map((entry) => toCue(entry, shot))
      .filter((cue): cue is SfxCue => cue !== null)
      .map((cue, slot) => place(cue, shot, slot)),
  );
}
