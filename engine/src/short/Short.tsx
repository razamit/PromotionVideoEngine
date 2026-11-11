import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { CameraRig } from "../camera/CameraRig";
import { DISSOLVE_FRAMES, ENTER_FRAMES } from "../camera/moves";
import { SerifCaptions } from "../captions/SerifCaptions";
import { WordCaptions } from "../captions/WordCaptions";
import { sceneRegistry } from "@short/scenes/registry";
import type { MusicSpec, TimedShot, TimedWord, Timeline } from "../timeline/types";
import { musicGainPerFrame } from "./musicDuck";
import { placeAllCues, type PlacedCue } from "./sfx";

// The whole short: narration, optional music bed (ducked under the words),
// one <Sequence> per shot (scene inside a CameraRig), sound effects, and
// captions on top. Captions sit outside the camera so they never zoom or
// shake with the world. Sound rules: src/short/sfx.ts.

// A shot followed by a dissolve, whip or zoomBlur keeps playing a few frames
// longer, under the next shot as it enters, so a transition never shows
// black; later Sequences paint on top.
function ShotView({ shot, next, fps }: { shot: TimedShot; next?: TimedShot; fps: number }) {
  const Scene = sceneRegistry[shot.scene];
  if (!Scene) throw new Error(`Scene "${shot.scene}" is not in the short's scenes/registry.ts`);
  const from = Math.round(shot.start * fps);
  const duration = Math.max(1, Math.round(shot.end * fps) - from);
  const overlap = !next?.enter || next.enter === "cut" ? 0 : next.enter === "dissolve" ? DISSOLVE_FRAMES : ENTER_FRAMES;
  return (
    <Sequence from={from} durationInFrames={duration + overlap} name={`${shot.index} ${shot.scene}`}>
      <CameraRig camera={shot.camera} enter={shot.enter} durationInFrames={duration}>
        <Scene {...(shot.params ?? {})} />
      </CameraRig>
    </Sequence>
  );
}

const TAIL_FADE_FRAMES = 3; // a cue cut short fades out instead of clicking

function CueAudio({ cue, fps }: { cue: PlacedCue; fps: number }) {
  const startFrame = Math.round(cue.startSec * fps);
  const from = Math.max(0, startFrame);
  const trimBefore = from - startFrame; // a lead-in before frame 0 is skipped, not shifted
  const frames = cue.durationSec === null ? undefined : Math.max(1, Math.round(cue.durationSec * fps) - trimBefore);
  const volume = frames === undefined
    ? cue.volume
    : (f: number) => cue.volume * Math.min(1, Math.max(0, (frames - f) / TAIL_FADE_FRAMES));
  return (
    <Sequence from={from} durationInFrames={frames} name={`sfx ${cue.file}`} layout="none">
      <Audio src={staticFile(cue.file)} volume={volume} loop={cue.loop} trimBefore={trimBefore || undefined} />
    </Sequence>
  );
}

function MusicBed({ music, words }: { music: MusicSpec; words: TimedWord[] }) {
  const { fps, durationInFrames } = useVideoConfig();
  const gains = useMemo(
    () => musicGainPerFrame(music, words, fps, durationInFrames),
    [music, words, fps, durationInFrames],
  );
  return (
    <Audio
      src={staticFile(music.file)}
      loop={music.loop}
      volume={(f) => gains[Math.min(gains.length - 1, Math.max(0, f))]}
    />
  );
}

export function Short({ timeline }: { timeline: Timeline }) {
  const { fps } = useVideoConfig();
  const cues = useMemo(() => placeAllCues(timeline.shots, timeline.autoSfx ?? true), [timeline]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {timeline.shots.map((shot, i) => (
        <ShotView key={shot.index} shot={shot} next={timeline.shots[i + 1]} fps={fps} />
      ))}
      {cues.map((cue) => (
        <CueAudio key={cue.key} cue={cue} fps={fps} />
      ))}
      {timeline.voFile ? <Audio src={staticFile(timeline.voFile)} /> : null}
      {timeline.music ? <MusicBed music={timeline.music} words={timeline.words} /> : null}
      {timeline.captions?.style === "serif" && timeline.lines ? (
        <SerifCaptions words={timeline.words} lines={timeline.lines} shots={timeline.shots} spec={timeline.captions} />
      ) : (
        <WordCaptions words={timeline.words} shots={timeline.shots} spec={timeline.captions} />
      )}
    </AbsoluteFill>
  );
}
