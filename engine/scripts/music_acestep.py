#!/usr/bin/env python3
"""Generate instrumental music beds with ACE-Step 1.5, locally on MLX.

Called by scripts/make_music.mjs with ACE-Step's own interpreter, so its
package and checkpoints resolve. The job file is JSON:

    {"acestep": "<checkout>", "duration": 58,
     "takes": [{"caption": "...", "seed": 4101, "bpm": 112, "keyscale": "C major", "out": "/abs/take.wav"}]}

Prints one JSON line per take: {"out": ..., "seconds": ...}.
"""

import json
import shutil
import sys
import time
from pathlib import Path

SETTINGS = {"inference_steps": 8, "shift": 3.0, "thinking": True}  # turbo DiT recommendation


def load_handlers(acestep):
    sys.path.insert(0, str(acestep))
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler

    dit = AceStepHandler()
    dit.initialize_service(project_root=str(acestep), config_path="acestep-v15-turbo", device="auto")
    llm = LLMHandler()
    llm.initialize(
        checkpoint_dir=str(acestep / "checkpoints"),
        lm_model_path="acestep-5Hz-lm-1.7B",
        backend="mlx",
        device="auto",
    )
    return dit, llm


def generate_take(dit, llm, take, duration):
    from acestep.inference import GenerationConfig, GenerationParams, generate_music

    extra = {k: take[k] for k in ("bpm", "keyscale") if take.get(k)}
    params = GenerationParams(
        caption=take["caption"], lyrics="[Instrumental]", instrumental=True,
        seed=take["seed"], duration=duration, **extra, **SETTINGS,
    )
    config = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[take["seed"]], audio_format="wav")
    out = Path(take["out"])
    raw_dir = out.parent / f"raw_{take['seed']}"
    started = time.time()
    result = generate_music(dit, llm, params, config, save_dir=str(raw_dir))
    if not result.success:
        raise RuntimeError(f"seed {take['seed']}: {result.error}")
    shutil.move(result.audios[0]["path"], out)
    shutil.rmtree(raw_dir, ignore_errors=True)
    return {"out": str(out), "seconds": round(time.time() - started, 1)}


def main():
    job = json.loads(Path(sys.argv[1]).read_text())
    dit, llm = load_handlers(Path(job["acestep"]))
    for take in job["takes"]:
        print(json.dumps(generate_take(dit, llm, take, job["duration"])), flush=True)


if __name__ == "__main__":
    main()
