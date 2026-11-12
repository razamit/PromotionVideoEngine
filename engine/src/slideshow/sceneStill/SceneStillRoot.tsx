import React from "react";
import { AbsoluteFill, Composition, useVideoConfig } from "remotion";
import timelineJson from "@short/generated/timeline.json";
import { ShotView } from "../../short/Short";
import type { Timeline } from "../../timeline/types";

// A short's scenes with nothing on top: no captions, no voice, no music. A
// slideshow uses one frame of this as a slide's picture (the `scene:` field),
// so the art made for the videos is reused instead of redrawn. Rendered by
// `short.mjs scene-still`, from inside the short the frame comes from.

const timeline = timelineJson as unknown as Timeline;

const ScenesOnly: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {timeline.shots.map((shot, index) => (
        <ShotView key={shot.index} shot={shot} next={timeline.shots[index + 1]} fps={fps} />
      ))}
    </AbsoluteFill>
  );
};

export const SceneStillRoot: React.FC = () => (
  <Composition id="SceneStill" component={ScenesOnly} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
);
