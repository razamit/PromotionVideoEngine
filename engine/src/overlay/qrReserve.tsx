import React, { createContext, useContext } from "react";
import type { Rect } from "../layout/qrGeometry";

// Tells the last shot's scene where the QR card will sit, so the scene can
// move its words and logo out of the way. Short.tsx provides it around the
// last shot only; everywhere else, and in every short without a QR, it is
// null and a scene draws exactly as it always has.
//
// In a short's own end scene:
//   import { useQrReserve } from "@engine/overlay/qrReserve";
//   const reserve = useQrReserve(); // { left, top, right, bottom } in px of 1080x1920, or null
//   // keep text and logos above reserve.top (or out of the rectangle);
//   // for a centred column, <FitAboveQr reserve={reserve} name="MyEndCard">
//   // from "@engine/overlay/FitAboveQr" does that.
// Import from these paths, not from src/index.ts: that entry file calls
// registerRoot, and a scene importing it would loop back into itself.

export type QrReserve = Rect;

const QrReserveContext = createContext<QrReserve | null>(null);

export function QrReserveProvider({ reserve, children }: { reserve: QrReserve | null; children: React.ReactNode }) {
  return <QrReserveContext.Provider value={reserve}>{children}</QrReserveContext.Provider>;
}

/** The rectangle the QR card keeps for itself (card plus a margin), or null when there is no QR on this shot. */
export function useQrReserve(): QrReserve | null {
  return useContext(QrReserveContext);
}
