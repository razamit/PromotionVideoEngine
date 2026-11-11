import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { CaptureCallout, type CaptureCalloutProps } from "./CaptureCallout";
import { FloatingPhone, type FloatingPhoneProps } from "./FloatingPhone";
import { Readout, type ReadoutProps } from "./Readout";
import { SoftTap, type SoftTapProps } from "./SoftTap";
import { Stamp, type StampProps } from "./Stamp";
import { Ticket, type TicketProps } from "./Ticket";

// The flat layer of a toy scene, driven from script.json: any scene that
// renders <SceneOverlays {...params} /> can be given a readout, a ticket, a
// stamp, the floating phone and a callout (one element of the capture, large
// and whole) per shot without new scene code. Times are in seconds from the
// start of the shot (`atSeconds`), so the script reads like the edit.

type Timed<T> = Omit<T, "at" | "enterAt"> & { atSeconds?: number };

export type OverlayParams = {
  readout?: Timed<ReadoutProps>;
  /** A stamp on the picture. For a stamp on the ticket, put it in ticket.stamp (x, y are then fractions of the ticket). */
  stamp?: Timed<StampProps>;
  ticket?: Timed<TicketProps> & { stamp?: Timed<StampProps> };
  phone?: Timed<FloatingPhoneProps>;
  /** One element of the capture lifted out of the phone. With a phone in the same shot it grows from its place on that screen. */
  callout?: CalloutParams;
};

export type CalloutParams = Omit<CaptureCalloutProps, "at" | "until" | "children" | "outOf"> & {
  atSeconds?: number;
  /** When it has faded away again; omit to keep it up to the cut. */
  untilSeconds?: number;
  /** A tap to mark on it, capture fractions. */
  tap?: Omit<SoftTapProps, "at"> & { atSeconds?: number };
};

export function SceneOverlays({ readout, stamp, ticket, phone, callout }: OverlayParams) {
  const { fps } = useVideoConfig();
  const frames = (seconds?: number) => Math.round((seconds ?? 0) * fps);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {readout ? <Readout {...readout} at={frames(readout.atSeconds)} /> : null}
      {ticket ? (
        <Ticket {...ticket} at={frames(ticket.atSeconds)}>
          {ticket.stamp ? <Stamp {...ticket.stamp} at={frames(ticket.stamp.atSeconds)} /> : null}
        </Ticket>
      ) : null}
      {phone ? <FloatingPhone {...phone} enterAt={frames(phone.atSeconds)} /> : null}
      {callout ? (
        <CaptureCallout {...callout} at={frames(callout.atSeconds)} until={callout.untilSeconds === undefined ? undefined : frames(callout.untilSeconds)} outOf={phone && !phone.focus ? phone : undefined}>
          {callout.tap ? <SoftTap {...callout.tap} at={frames(callout.tap.atSeconds)} /> : null}
        </CaptureCallout>
      ) : null}
      {stamp ? <Stamp {...stamp} at={frames(stamp.atSeconds)} /> : null}
    </AbsoluteFill>
  );
}
