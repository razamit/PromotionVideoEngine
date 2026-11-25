// How bin/short.mjs reads the arguments it passes on to the Remotion CLI.
// One rule for "this argument is the value of a flag": the argument before
// it is a `--flag` written without "=" (`--log verbose`, `--frames 0-9`).
// A boolean flag written before a path (`--muted out/x.mp4`) is read the
// same way, so put paths first or write flags with "=".

const VIDEO_FILE = /\.(mp4|mov|webm|mkv)$/i;

/** True when args[i] is the value of the flag before it. */
export function isFlagValue(args, i) {
  const previous = args[i - 1] ?? "";
  return previous.startsWith("--") && !previous.includes("=");
}

/** The arguments that are neither flags nor flag values, in order. */
export function positionalArgs(args) {
  return args.filter((arg, i) => !arg.startsWith("-") && !isFlagValue(args, i));
}

/** A flag's value (`--name=value` or `--name value`), true for a bare flag, or undefined when absent. */
export function flagValue(args, name) {
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(`--${name}=`)) return args[i].slice(name.length + 3);
    if (args[i] === `--${name}`) return args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : true;
  }
  return undefined;
}

/** Why no output file can be named: no positional path, and perhaps a path read as a flag's value. */
function missingOutputReason(args) {
  const swallowed = args.find((arg, i) => !arg.startsWith("-") && isFlagValue(args, i) && VIDEO_FILE.test(arg));
  if (swallowed) return `no output file is named ("${swallowed}" follows a flag, so it is read as that flag's value; put the output path first)`;
  return "no output file is named (Remotion then writes out/Short.mp4 inside the engine)";
}

/**
 * Whether a `render` (its arguments after "render", "Short" included or not)
 * makes a postable video: a full, full-size render to a named video file.
 * @returns {{ output: string | null, reason: string | null }} reason is null for a postable render
 */
export function postableRender(renderArgs) {
  const output = positionalArgs(renderArgs).filter((arg) => arg !== "Short")[0] ?? null;
  const scale = flagValue(renderArgs, "scale");
  if (flagValue(renderArgs, "frames") !== undefined) return { output, reason: "it is a partial render (--frames)" };
  if (flagValue(renderArgs, "sequence") !== undefined) return { output, reason: "it renders an image sequence (--sequence)" };
  if (scale !== undefined && Number(scale) !== 1) return { output, reason: `it is a scaled render (--scale=${scale})` };
  if (!output) return { output, reason: missingOutputReason(renderArgs) };
  if (!VIDEO_FILE.test(output)) return { output, reason: `its output ${output} is not a video file` };
  return { output, reason: null };
}
