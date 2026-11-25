import React from "react";
import { QR_PLACEHOLDER_FILL, type QrLayout } from "../layout/qrGeometry";

// What QrCard draws where the symbol goes when the render was not verified
// (qrVerification.ts): a flat grey-blue panel with "QR preview" and the
// short's code. No black or white modules and no finder squares, so no phone
// can read it as a QR code. Same rectangle as the real symbol, so every
// layout around the card is the same in both modes. The decode check
// (scripts/qr/qr_decode_check.mjs) knows the panel by QR_PLACEHOLDER_FILL.

const PLACEHOLDER_INK = "#3A4250";

export function QrPlaceholderFace({ layout, code, fontFamily }: { layout: QrLayout; code: string; fontFamily: string }) {
  const { card, symbol } = layout;
  const size = symbol.right - symbol.left;
  return (
    <div data-qr-placeholder="" style={{
      position: "absolute", left: symbol.left - card.left, top: symbol.top - card.top, width: size, height: size,
      background: QR_PLACEHOLDER_FILL.css, borderRadius: 12,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
      fontFamily, fontWeight: 800, color: PLACEHOLDER_INK, textAlign: "center", lineHeight: 1.1,
    }}>
      <div style={{ fontSize: 46 }}>QR preview</div>
      <div style={{ fontSize: 34 }}>{code}</div>
      <div style={{ fontSize: 26, maxWidth: size - 60 }}>The real code is drawn only by npm run render</div>
    </div>
  );
}
