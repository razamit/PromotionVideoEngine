import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFont, labelFont } from "./fonts";

// A paper ticket: a coloured header strip, a few label/value fields and an
// optional torn-off stub. It is the prop that carries an analogy (a boarding
// pass for your morning run, a parking ticket for your to-do list). Place a
// <Stamp> inside it as a child to stamp the ticket itself.

export type TicketField = { label: string; value: string };

export type TicketProps = {
  title: string;
  fields: TicketField[];
  /** The part after the dashed line, usually the price. */
  stub?: TicketField;
  /** Centre, fractions of the frame. */
  x?: number;
  y?: number;
  width?: number;
  rotate?: number;
  color?: string;
  paper?: string;
  /** Frame of the shot at which it slides in. */
  at?: number;
  children?: React.ReactNode;
};

function Field({ label, value, big = 54 }: TicketField & { big?: number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: labelFont, fontWeight: 700, fontSize: 22, letterSpacing: 2.5, color: "#8A8478", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: displayFont, fontSize: big, lineHeight: 1.12, color: "#1B1B22", textTransform: "uppercase", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

export function Ticket({ title, fields, stub, x = 0.465, y = 0.34, width = 800, rotate = -3, color = "#C7352E", paper = "#F6F0E4", at = 0, children }: TicketProps) {
  const frame = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  if (frame < 0) return null;
  const p = spring({ frame, fps, config: { damping: 16, stiffness: 150, mass: 0.7 } });
  return (
    <div style={{
      position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width,
      transform: `translate(-50%, -50%) translateY(${(1 - p) * 140}px) rotate(${rotate}deg)`, opacity: Math.min(1, (frame + 1) / 4),
      background: paper, borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.3)", zIndex: 10,
    }}>
      <div style={{ background: color, color: "#FFFFFF", fontFamily: displayFont, fontSize: 44, letterSpacing: 5, padding: "12px 34px", textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "18px 44px", padding: "26px 34px 30px" }}>
          {fields.map((field) => <Field key={field.label} {...field} />)}
        </div>
        {stub ? (
          <div style={{ borderLeft: "5px dashed #CFC6B4", padding: "26px 34px 30px", display: "flex", alignItems: "center" }}>
            <Field {...stub} big={76} />
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
