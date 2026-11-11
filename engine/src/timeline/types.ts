// Shapes shared by script.json (hand-written), scripts/build_timeline.mjs
// (writes src/generated/timeline.json) and the composition that reads it.

export type CameraMove =
  | "hold" // never truly static: a slow 3% drift
  | "push" // slow zoom in
  | "pull" // slow zoom out
  | "crash" // fast punch-in over ~8 frames, then hold
  | "panLeft"
  | "panRight"
  | "tiltUp"
  | "tiltDown"
  | "crashOut" // opens very tight on the focus, springs back out: a hook that starts on the detail
  | "snapZoom"; // two hard punch-ins, at the cut and just before mid-shot

export type ShotEnter = "cut" | "whipLeft" | "whipRight" | "zoomBlur" | "dissolve";

export type CameraSpec = {
  move: CameraMove;
  /** Zoom target as a fraction of the frame, 0..1. Default centre. */
  focusX?: number;
  focusY?: number;
  /** Strength multiplier, default 1. */
  amount?: number;
  /** Screen shake in px, default 0. Use on alarms, slams and panic. */
  shake?: number;
  /** Depth spread: 0 moves plate, actors and foreground together (flat), 1 default, 1.5 stronger. */
  parallax?: number;
};

/** One sound placed on a shot. */
export type SfxCue = {
  /** File under public/, e.g. "sfx/ding.wav". */
  file: string;
  /** Linear gain; default is the kit's level for that file (sfx.ts), else 1. */
  volume?: number;
  /** Seconds after the shot starts; negative leads into the cut. Default 0. */
  offset?: number;
  /** Repeat the file, for phone_buzz.wav and fly_loop.wav. */
  loop?: boolean;
  /** Seconds to play. Default: the file's length, or to the shot's end when looping. */
  duration?: number;
};

/** "auto" keeps the automatic enter or camera whoosh inside an array. */
export type SfxEntry = string | SfxCue;
export type ShotSfx = SfxEntry | SfxEntry[] | "none" | null;

/** Narration-aware music bed. `volume` is linear, about 0.1 for -20 dB. */
export type MusicSpec = {
  file: string;
  volume: number;
  /** Extra gain in dB while words are spoken, default -8. 0 turns ducking off. */
  duckDb?: number;
  /** Repeat the file if it is shorter than the short. */
  loop?: boolean;
  /** Seconds of fade at the start and the end, defaults 0.3 and 1.0. */
  fadeIn?: number;
  fadeOut?: number;
};

export type ShotSpec = {
  /** Key in src/scenes/registry.ts. */
  scene: string;
  /** Passed to the scene component as props. */
  params?: Record<string, unknown>;
  camera?: CameraSpec;
  enter?: ShotEnter;
  /** Relative share of the line's duration, default 1. */
  weight?: number;
  /**
   * Sound for this shot (see src/short/sfx.ts and references/music-and-sfx.md).
   * Unset: the automatic whoosh for the enter or camera move, if any.
   * A path or cue (or an array of them) replaces it; put "auto" in the array
   * to keep it as well. "none" or null: silence, no automatic cue.
   */
  sfx?: ShotSfx;
  /** Caption centre as a fraction of frame height, default 0.64. */
  captionY?: number;
  /** Hide captions, e.g. on an end card that already shows the words. */
  hideCaptions?: boolean;
};

/**
 * The look of a short. "bean" (default): 2D bean characters with ink outlines
 * in a cel-shaded room, word-by-word captions. "toy": 3D toy figures in a lit
 * set (src/toy/), one serif caption per line, shorter and calmer.
 */
export type ShortStyle = "bean" | "toy";

/** How a line is captioned in the "serif" look: a big title at the top, a small line mid-frame, or nothing. */
export type LineCaption = "title" | "line" | "none";

export type ScriptLine = {
  /** Narration. Wrap a word in *stars* to colour its caption. */
  vo: string;
  shots: ShotSpec[];
  /** Serif captions only. Default: "title" for the first line of a toy short, "line" for the rest. */
  caption?: LineCaption;
  /** Seconds of silence after this line, overrides script.gapAfterLine. */
  gapAfter?: number;
};

export type TimedWord = {
  text: string;
  start: number; // seconds
  end: number;
  emphasis: boolean;
  /** Index of the script line the word belongs to. */
  line?: number;
};

export type TimedLine = {
  index: number;
  start: number; // seconds
  end: number;
  caption: LineCaption;
};

export type TimedShot = ShotSpec & {
  index: number;
  lineIndex: number;
  start: number; // seconds
  end: number;
};

/**
 * Caption look. "reference" (default for bean shorts) matches the style measured from a popular cartoon Shorts channel:
 * white heavy sans about 76 px, thin outline plus hard shadow, fixed line at
 * 70.5% down, hard cut per word, no pop, no colour. "pop" is the louder
 * look: bigger, pop and tilt, emphasis words in yellow. "serif" (default for
 * toy shorts) shows one whole line at a time in a small italic serif, and
 * title lines big at the top with the spoken word in the accent colour.
 */
export type CaptionSpec = {
  style?: "reference" | "pop" | "serif";
  /** Font size in px at 1080x1920. Default 76 (reference), 136 (pop) or 60 (serif lines). */
  size?: number;
  /** Default vertical centre as a fraction of the frame. Default 0.705, or 0.56 for serif lines. */
  y?: number;
  /** Serif: colour of the spoken word in a title and of *starred* words. Default a warm red. */
  accent?: string;
  /** Serif: font size of title lines. Default 98. */
  titleSize?: number;
  /** Serif: vertical centre of title lines. Default 0.2. */
  titleY?: number;
};

export type Timeline = {
  title: string;
  /** Default "bean". */
  style?: ShortStyle;
  fps: number;
  durationInFrames: number;
  voFile: string | null;
  music: MusicSpec | null;
  /** Automatic whooshes on whip and zoom enters and crash moves. Default true. */
  autoSfx?: boolean;
  captions?: CaptionSpec;
  /** Where the word times came from: forced alignment, the length-spread estimate, or both. */
  wordTiming?: "aligned" | "estimated" | "mixed";
  words: TimedWord[];
  /** One entry per script line; older timelines have none. */
  lines?: TimedLine[];
  shots: TimedShot[];
};

/**
 * script.json `voice` (read by scripts/build_timeline.mjs, not by the
 * composition). See references/voice-and-audio.md for each engine.
 */
export type VoiceSpec = {
  engine: "say" | "mlx" | "file" | "command" | "none";
  /** mlx: Hugging Face model id, e.g. mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16. */
  model?: string;
  /** say: voice name. mlx: preset speaker (Kokoro, Qwen CustomVoice). */
  voice?: string;
  /** mlx: voice description (Qwen VoiceDesign, VoxCPM2) or style instruction. */
  instruct?: string;
  /** mlx: clip to clone, relative to script.json; its transcript is the sibling .txt. */
  refAudio?: string;
  refText?: string;
  lang?: string;
  seed?: number;
  /** mlx: the model's own speed control (Kokoro); ignored by models without one. */
  speed?: number;
  /** Any engine but file: ffmpeg atempo after synthesis, pitch kept. 1.15 = 15% faster. */
  tempo?: number;
  exaggeration?: number;
  cfgWeight?: number;
  temperature?: number;
  /** mlx: extra generate() keyword arguments, passed as is. */
  options?: Record<string, unknown>;
  /** Forced word alignment. Default true for mlx and file. */
  align?: boolean;
  aligner?: string;
  /** say: words per minute. */
  rate?: number;
  /** command: shell command with {text_file} and {out}. */
  command?: string;
  /** none: words per minute for a silent animatic. */
  wpm?: number;
};
