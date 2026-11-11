// The lint's checks on shots that show the real app. Two questions, and a
// shot must pass both:
//
//   legibility   can the text be read at phone size?
//   cut-element  is the UI element the line talks about on screen whole?
//   no-element   (toy) a zoomed phone shot that does not say which element
//                it shows, so the question above cannot be answered
//
// They pull against each other. A 1.6x zoom makes text readable and shows
// only 62% of the capture's width, so a banner, a settings row or a task
// row (about 92% wide) loses its right-hand end. The first toy short went
// out to review like that with every check green, because every check asked
// the first question only (2026-11-10, cat-vs-parking-ticket).
//
// What a shot can say in script.json, all in capture fractions:
//   params.phone.element   toy: the element's box on the capture the floating phone shows
//   params.element         bean: the same, for a CartoonPhone or CaptureCard shot
//   params.callout         toy: {src, crop, width, x, y}, the element lifted out as a large card
//   params.callout.element optional: the element inside a callout cropped wider than it
//
// Geometry is in capture_window.mjs.

import { CALLOUT, FRAME, PHONES, boxAtPeak, captureSizeOf, centredBox, contains, isRect, maxWholeZoom, phoneScreen, sidesOutside, visibleWindow } from "./capture_window.mjs";

const SLACK = 0.004; // capture fractions: about 4 px of a 1080 px capture, the soft edge of a card's shadow
const ZOOMED = 1.08; // up to here a full-width element (92% of the capture) still fits the phone
const isApp = (src) => typeof src === "string" && /(^|\/)app\//.test(src);
const span = (from, size) => `${from.toFixed(2)}-${(from + size).toFixed(2)}`;
const describe = (r) => `x ${span(r.x, r.w)}, y ${span(r.y, r.h)}`;
const moveOf = (shot) => shot.camera?.move ?? "hold";

/** What a shot shows of a capture: its phone (toy: params.phone, bean: the params themselves) and a callout card. */
export function appViews(shot) {
  const params = shot.params ?? {};
  const floating = typeof params.phone?.src === "string";
  const phone = floating ? params.phone : params;
  return {
    phone: isApp(phone.src) ? phone : null,
    kind: floating ? "floating" : "cartoon",
    callout: isApp(params.callout?.src) ? params.callout : null,
  };
}

/** The zoom the shot lands on and holds for reading (focusTo, else focus), or 0 without one. */
function landingZoom(params) {
  const landing = params.focusTo ?? params.focus;
  return typeof landing?.zoom === "number" ? landing.zoom : 0;
}

function phoneProblems(params, limits) {
  const framed = params.focus !== undefined || params.crop !== undefined;
  const zoomedIn = landingZoom(params) >= limits.readableFocusZoom;
  const height = params.height ?? params.phoneHeight;
  if (limits.tallPhoneReads && !framed && height >= limits.minPhoneHeight) return [];
  const problems = [];
  if (!framed) problems.push("no focus or crop");
  if (height === undefined && !framed) problems.push("phone height not set");
  if (height !== undefined && height < limits.minPhoneHeight && !zoomedIn) problems.push(`phone height ${height}`);
  return problems;
}

/** Frame px per capture px of a callout: 0.6 and up reads like a 1.6x zoom in the floating phone. */
function calloutScale(callout) {
  if (!isRect(callout.crop)) return 0;
  const capture = captureSizeOf(callout.src, callout.captureSize);
  return (callout.width ?? CALLOUT.width) / (callout.crop.w * capture[0]);
}

function checkLegibility(shot, views, { limits, add, tag }) {
  const scale = views.callout ? calloutScale(views.callout) : 0;
  if (scale >= limits.minCalloutScale) return; // the element is shown large outside the phone
  const problems = views.phone ? phoneProblems(views.phone, limits) : [];
  if (views.phone && problems.length === 0) return;
  if (views.callout) problems.push(`callout shows the capture at ${scale.toFixed(2)}x, under ${limits.minCalloutScale}x`);
  add("warn", "legibility", `${tag(shot)} ${(views.phone ?? views.callout).src}`, problems.join(", "),
    `the app text must read at phone size, on an element that stays whole: a phone ${limits.minPhoneHeight} px or taller, a focus zoom >= ${limits.readableFocusZoom} on an element narrow enough to fit (declare it in "element"), or the element lifted out large (toy: params.callout, bean: a CaptureCard crop)`);
}

/** The part of the capture a phone (or a cropped card) shows once the shot has landed. */
function phoneView(params, kind) {
  if (isRect(params.crop)) return { window: params.crop, zoom: null, shows: "the crop shows" };
  const capture = captureSizeOf(params.src, params.captureSize);
  const screen = phoneScreen(kind, params.height ?? params.phoneHeight ?? PHONES[kind].height);
  const focus = params.focus ? params.focusTo ?? params.focus : null;
  const zoom = focus ? Math.max(1, focus.zoom ?? 1) : 1;
  const window = visibleWindow(screen, capture, focus ? { focus } : { scroll: params.scrollTo ?? 0 });
  return { window, zoom, screen, capture, shows: `at zoom ${zoom} the phone shows` };
}

function wholeFix(shown, element, kind) {
  if (!shown.screen) return "widen the crop to the element's own edges";
  const lift = kind === "floating"
    ? 'show the capture whole and lift the element out large with params.callout (toy-style.md, "One element, large and whole")'
    : "show it as a CaptureCard cropped on the element's own edges (app-footage.md)";
  const fits = Math.floor(maxWholeZoom(shown.screen, shown.capture, element) * 100) / 100;
  const centre = `x ${(element.x + element.w / 2).toFixed(2)}, y ${(element.y + element.h / 2).toFixed(2)}`;
  const limit = fits < 1 ? "it does not fit this phone at any zoom" : `it fits whole up to zoom ${fits} with the focus on ${centre}`;
  return `${limit}: ${lift}, or focus on a narrower element`;
}

/** The phone's glass, or the declared element on it, must stay inside the frame through the camera move. */
function checkPhoneInFrame(shot, phone, shown, whole, { add }, where) {
  const body = PHONES.floating;
  const glass = centredBox(phone.x ?? body.x, phone.y ?? body.y, shown.screen.width, shown.screen.height);
  const rect = shown.window.rect;
  const el = whole ? phone.element : null;
  const box = el ? {
    left: glass.left + rect.left + el.x * rect.width, right: glass.left + rect.left + (el.x + el.w) * rect.width,
    top: glass.top + rect.top + el.y * rect.height, bottom: glass.top + rect.top + (el.y + el.h) * rect.height,
  } : glass;
  const peak = boxAtPeak(box, shot.camera);
  const out = sidesOutside(peak);
  if (out.length === 0) return;
  add("error", "cut-element", where,
    `${el ? "the element" : "the phone screen"} runs off the ${out.join(" and ")} of the frame at the peak of the ${moveOf(shot)} (${peak.scale.toFixed(2)}x)`,
    "move the phone (x, y), make it smaller (height) or lower the camera amount");
}

function checkPhoneWhole(shot, { phone, kind }, ctx) {
  const element = phone.element;
  if (element === undefined && !ctx.limits.declareElement) return; // bean shorts opt in by declaring one
  const where = `${ctx.tag(shot)} ${phone.src}`;
  const shown = phoneView(phone, kind);
  const whole = isRect(element) && contains(shown.window, element, SLACK);
  if (element === undefined) {
    if (shown.zoom > ZOOMED) {
      ctx.add("error", "no-element", where,
        `${shown.shows} ${Math.round(shown.window.w * 100)}% of the capture's width and the shot does not say which element the zoom is for, so nothing can check that it is whole`,
        'add "element": {x, y, w, h} (capture fractions: the box of the one UI element the line talks about) beside the focus. A full-width banner or row does not fit above about 1.07x: show it with params.callout instead');
    }
  } else if (!isRect(element)) {
    ctx.add("error", "element", where, '"element" is not a box', 'write it as {"x": 0.04, "y": 0.07, "w": 0.92, "h": 0.13}, capture fractions');
  } else if (!whole) {
    ctx.add("error", "cut-element", where, `the element spans ${describe(element)} of the capture; ${shown.shows} ${describe(shown.window)}`, wholeFix(shown, element, kind));
  }
  if (kind === "floating" && shown.screen) checkPhoneInFrame(shot, phone, shown, whole, ctx, where);
}

/** A callout at rest should also clear the platform UI: the tabs on top, the buttons on the right, the text below. */
function checkCalloutZone(box, { add, zone }, where) {
  const edges = { left: box.left / FRAME.width, right: box.right / FRAME.width, top: box.top / FRAME.height, bottom: box.bottom / FRAME.height };
  const under = [];
  if (edges.left < zone.left - SLACK) under.push("left");
  if (edges.right > zone.right + SLACK) under.push("right");
  if (edges.top < zone.top - SLACK) under.push("top");
  if (edges.bottom > zone.bottom + SLACK) under.push("bottom");
  if (under.length === 0) return;
  add("warn", "callout-zone", where,
    `the callout spans x ${edges.left.toFixed(2)}-${edges.right.toFixed(2)}, y ${edges.top.toFixed(2)}-${edges.bottom.toFixed(2)}, past the ${under.join(" and ")} of the safe zone (x ${zone.left.toFixed(2)}-${zone.right.toFixed(2)}, y ${zone.top.toFixed(2)}-${zone.bottom.toFixed(2)})`,
    "the platforms draw their own buttons there: move the callout (x, y) or narrow it (width)");
}

function checkCallout(shot, callout, ctx) {
  const where = `${ctx.tag(shot)} ${callout.src} callout`;
  const crop = callout.crop;
  if (!isRect(crop)) {
    ctx.add("error", "element", where, 'the callout has no "crop" box', 'crop it on the element\'s own edges: {"x": 0.04, "y": 0.07, "w": 0.92, "h": 0.13}, capture fractions');
    return;
  }
  if (callout.element !== undefined && !(isRect(callout.element) && contains(crop, callout.element, SLACK))) {
    ctx.add("error", "cut-element", where, `the crop shows ${describe(crop)} of the capture and does not hold its element`, "widen the crop to the element's own edges");
  }
  const capture = captureSizeOf(callout.src, callout.captureSize);
  const width = callout.width ?? CALLOUT.width;
  const box = centredBox(callout.x ?? CALLOUT.x, callout.y ?? CALLOUT.y, width, (width * crop.h * capture[1]) / (crop.w * capture[0]));
  const peak = boxAtPeak(box, shot.camera);
  const out = sidesOutside(peak);
  if (out.length > 0) {
    ctx.add("error", "cut-element", where, `the callout runs off the ${out.join(" and ")} of the frame at the peak of the ${moveOf(shot)} (${peak.scale.toFixed(2)}x)`,
      "narrow it (width), move it (x, y) or lower the camera amount");
    return;
  }
  checkCalloutZone(box, ctx, where);
}

/** ctx: { limits, add, tag, zone }, all from lint_shots.mjs. */
export function checkAppShots(shots, ctx) {
  for (const shot of shots) {
    const views = appViews(shot);
    if (!views.phone && !views.callout) continue;
    checkLegibility(shot, views, ctx);
    if (views.phone) checkPhoneWhole(shot, views, ctx);
    if (views.callout) checkCallout(shot, views.callout, ctx);
  }
}
