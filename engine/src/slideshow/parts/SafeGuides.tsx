import React from "react";
import { AbsoluteFill } from "remotion";
import type { DeckOutput } from "../deckTypes";
import { safeBoxOf } from "../slideGeometry";

// Review overlay (`npm run guides`): tints the margins TikTok's own UI covers
// and outlines the safe box, so a reviewer sees at a glance whether text or a
// screenshot strays into them. Never part of a deliverable.

const COVERED_TINT = "rgba(255, 45, 85, 0.38)";

export const SafeGuides: React.FC<{ output: DeckOutput }> = ({ output }) => {
  const box = safeBoxOf(output);
  const right = output.width - box.left - box.width;
  const bottom = output.height - box.top - box.height;
  const zone: React.CSSProperties = { position: "absolute", background: COVERED_TINT };
  return (
    <AbsoluteFill>
      <div style={{ ...zone, left: 0, top: 0, width: output.width, height: box.top }} />
      <div style={{ ...zone, left: 0, top: box.top + box.height, width: output.width, height: bottom }} />
      <div style={{ ...zone, left: 0, top: box.top, width: box.left, height: box.height }} />
      <div style={{ ...zone, left: box.left + box.width, top: box.top, width: right, height: box.height }} />
      <div style={{ position: "absolute", ...box, border: "4px dashed #34c759", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: box.left, top: box.top + box.height + 12, color: "#fff", font: "600 30px sans-serif" }}>
        Covered by TikTok's UI. Review only.
      </div>
    </AbsoluteFill>
  );
};
