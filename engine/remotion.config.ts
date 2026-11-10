import path from "node:path";
import { Config } from "@remotion/cli/config";

// three.js needs a real GL backend in headless Chrome; ANGLE is the one that works on macOS.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);

// One engine, many shorts. bin/short.mjs sets SHORT_DIR to the short being
// worked on; "@short" resolves into it (its scenes and generated timeline)
// and "@engine" into this engine's src. A short's scene files sit outside
// this folder, so packages resolve from the engine's node_modules too. Each
// short gets its own webpack cache, so one short's "@short" never leaks into
// another's bundle.
const ENGINE = process.env.ENGINE_DIR ? path.resolve(process.env.ENGINE_DIR) : process.cwd();
const SHORT = process.env.SHORT_DIR ? path.resolve(process.env.SHORT_DIR) : path.join(ENGINE, "example");

Config.overrideWebpackConfig((config) => {
  const cache = config.cache && typeof config.cache === "object" && config.cache.type === "filesystem" ? { ...config.cache, name: `${config.cache.name ?? "remotion"}-${process.env.SHORT_KEY ?? path.basename(SHORT)}` } : config.cache;
  return {
    ...config,
    cache,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), "@short": SHORT, "@engine": path.join(ENGINE, "src") },
      modules: [...(config.resolve?.modules ?? ["node_modules"]), path.join(ENGINE, "node_modules")],
    },
  };
});
