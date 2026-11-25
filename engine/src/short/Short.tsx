import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, staticFile, useVideoConfig } from "remotion";
import { CameraRig } from "../camera/CameraRig";
import { DISSOLVE_FRAMES, ENTER_FRAMES } from "../camera/moves";
import { SerifCaptions } from "../captions/SerifCaptions";
import { WordCaptions } from "../captions/WordCaptions";
import { qrCardLayout, qrReserveRect } from "../layout/qrGeometry";
import { QrCard } from "../overlay/QrCard";
import { QrReserveProvider, type QrReserve } from "../overlay/qrReserve";
import { sceneRegistry } from "@short/scenes/registry";
import type { MusicSpec, QrSpec, TimedShot, TimedWord, Timeline } from "../timeline/types";
import { musicGainPerFrame } from "./musicDuck";
import { placeAllCues, type PlacedCue } from "./sfx";

// The whole short: narration, optional music bed (ducked under the words),
// one <Sequence> per shot (scene inside a CameraRig), sound effects, and
// captions on top. Captions sit outside the camera so they never zoom or
// shake with the world. Sound rules: src/short/sfx.ts. A short with a QR
// (timeline.qr) draws the QR card over its shot (qr.shotIndex, else the
// last shot) at the caption level, tells that shot's scene where the card
// sits (useQrReserve), keeps the captions above the card while it is up,
// and, when the shot was held to give the code time, freezes its last frame
// over the hold. The card goes with the cut out of its shot; the build
// already moved every later shot, word and sound past the hold.

// A shot followed by a dissolve, whip or zoomBlur keeps playing a few frames
// longer, under the next shot as it enters, so a transition never shows
// black; later Sequences paint on top.
// `holdFrames` (the QR shot of a short with a QR): the shot's final frames
// repeat its last original frame, camera move included; so do the frames
// under the next shot's entrance.
export function ShotView({ shot, next, fps, holdFrames = 0 }: { shot: TimedShot; next?: TimedShot; fps: number; holdFrames?: number }) {
  const Scene = sceneRegistry[shot.scene];
  if (!Scene) throw new Error(`Scene "${shot.scene}" is not in the short's scenes/registry.ts`);
  const from = Math.round(shot.start * fps);
  const duration = Math.max(1, Math.round(shot.end * fps) - from);
  const overlap = !next?.enter || next.enter === "cut" ? 0 : next.enter === "dissolve" ? DISSOLVE_FRAMES : ENTER_FRAMES;
  const sceneFrames = Math.max(1, duration - holdFrames);
  const rig = (
    <CameraRig camera={shot.camera} enter={shot.enter} durationInFrames={sceneFrames}>
      <Scene {...(shot.params ?? {})} />
    </CameraRig>
  );
  return (
    <Sequence from={from} durationInFrames={duration + overlap} name={`${shot.index} ${shot.scene}`}>
      {holdFrames > 0 ? <Freeze frame={sceneFrames - 1} active={(f) => f >= sceneFrames}>{rig}</Freeze> : rig}
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

/** The QR shot, with the card's place handed to its scene and its hold frozen. */
function QrShotView({ shot, next, fps, qr, reserve }: { shot: TimedShot; next?: TimedShot; fps: number; qr: QrSpec; reserve: QrReserve | null }) {
  return (
    <QrReserveProvider reserve={reserve}>
      <ShotView shot={shot} next={next} fps={fps} holdFrames={qr.holdFrames} />
    </QrReserveProvider>
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
  const { qr } = timeline;
  const reserve = useMemo(() => (qr ? qrReserveRect(qrCardLayout(qr.modules.length, qr.label)) : null), [qr]);
  // Captions keep above the card while it is up; undefined (no change at all) without a QR.
  const keepAbove = qr && reserve ? { fromSec: qr.startSec, untilSec: qr.endSec, bottomPx: reserve.top } : undefined;
  const qrIndex = qr ? (qr.shotIndex ?? timeline.shots.length - 1) : -1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {timeline.shots.map((shot, i) => (
        i === qrIndex && qr ? (
          <QrShotView key={shot.index} shot={shot} next={timeline.shots[i + 1]} fps={fps} qr={qr} reserve={reserve} />
        ) : (
          <ShotView key={shot.index} shot={shot} next={timeline.shots[i + 1]} fps={fps} />
        )
      ))}
      {cues.map((cue) => (
        <CueAudio key={cue.key} cue={cue} fps={fps} />
      ))}
      {timeline.voFile ? <Audio src={staticFile(timeline.voFile)} /> : null}
      {timeline.music ? <MusicBed music={timeline.music} words={timeline.words} /> : null}
      {timeline.captions?.style === "serif" && timeline.lines ? (
        <SerifCaptions words={timeline.words} lines={timeline.lines} shots={timeline.shots} spec={timeline.captions} keepAbove={keepAbove} />
      ) : (
        <WordCaptions words={timeline.words} shots={timeline.shots} spec={timeline.captions} keepAbove={keepAbove} />
      )}
      {qr ? <QrCard qr={qr} words={timeline.words} /> : null}
    </AbsoluteFill>
  );
}
