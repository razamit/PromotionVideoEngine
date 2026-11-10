import React from "react";
import { Composition } from "remotion";
import { Short } from "./short/Short";
import timelineJson from "@short/generated/timeline.json";
import type { Timeline } from "./timeline/types";

// One composition, 1080x1920 at 30 fps, sized from the short's generated
// timeline. "@short" is the short being rendered (remotion.config.ts maps it
// from SHORT_DIR, set by bin/short.mjs). Run `npm run timeline` after every
// script.json edit.

const timeline = timelineJson as unknown as Timeline;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    durationInFrames={timeline.durationInFrames}
    fps={timeline.fps}
    width={1080}
    height={1920}
    defaultProps={{ timeline }}
  />
);
