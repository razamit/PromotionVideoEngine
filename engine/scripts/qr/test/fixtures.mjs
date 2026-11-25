// Small hand-made shorts for the QR tests: script lines, and the shots,
// words and lines build_timeline.mjs would lay out for them (every line
// LINE_SECONDS long with two words, GAP_SECONDS after it).

export const FPS = 30;
export const LINE_SECONDS = 2;
export const GAP_SECONDS = 0.12;

export const BRIEF = { qr: { baseUrl: "https://example.com/st/", socialLine: "Scan the code at the end or search Example" } };

/** A script line with one shot per scene name (a string, or a shot object). */
export function line(vo, ...scenes) {
  return { vo, shots: scenes.map((scene) => (typeof scene === "string" ? { scene } : scene)) };
}

/** Shots, words and lines laid out like build_timeline's layoutLines, plus the tail on the last shot. */
export function layOut(lines, tail = 0.4) {
  const shots = [];
  const words = [];
  const timed = [];
  let cursor = 0;
  lines.forEach((scriptLine, lineIndex) => {
    const end = cursor + LINE_SECONDS + GAP_SECONDS;
    const span = (end - cursor) / scriptLine.shots.length;
    scriptLine.shots.forEach((shot, i) => {
      shots.push({ ...shot, index: shots.length, lineIndex, start: cursor + i * span, end: cursor + (i + 1) * span });
    });
    words.push({ text: "one", start: cursor, end: cursor + 1, line: lineIndex }, { text: "two", start: cursor + 1, end: cursor + LINE_SECONDS, line: lineIndex });
    timed.push({ index: lineIndex, start: cursor, end: cursor + LINE_SECONDS, caption: "line" });
    cursor = end;
  });
  shots[shots.length - 1].end += tail;
  return { shots, words, lines: timed, fps: FPS, durationInFrames: Math.ceil((cursor + tail) * FPS), music: null };
}

/** A deep copy, to compare before and after a function that mutates. */
export const copy = (value) => JSON.parse(JSON.stringify(value));

/** The loop-line short: CTA end card, then a story shot on the last line (main-quest-dentist's shape). */
export function loopLineScript() {
  return [
    line("Hook line here.", "room", "phone"),
    line("Middle line here.", "room"),
    line("App name. Link in bio.", { scene: "endCard", hideCaptions: true }),
    line("And the loop line.", "questCard"),
  ];
}
