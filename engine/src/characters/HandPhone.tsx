import React from "react";
import { INK } from "../theme/palette";

/**
 * A phone for a Bean's hand: pass it as `rightHandItem` or `leftHandItem`.
 * Hand items live inside the Bean's SVG, so this must be SVG; CartoonPhone is
 * HTML and renders nothing there. The screen stays dark or glows, never UI.
 */
export function HandPhone({ size = 120, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size * 2} viewBox="0 0 60 120" x={-size / 2} y={-size} style={{ overflow: "visible" }}>
      <rect x={2} y={2} width={56} height={116} rx={10} fill="#1B1B2F" stroke={INK} strokeWidth={4} />
      <rect x={7} y={10} width={46} height={98} rx={5} fill={glow ? "#2E3A66" : "#111122"} />
      {glow ? <rect x={7} y={10} width={46} height={98} rx={5} fill="#9EC5FF" opacity={0.35} /> : null}
    </svg>
  );
}
