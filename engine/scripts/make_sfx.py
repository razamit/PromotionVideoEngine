#!/usr/bin/env python3
"""House sound-effect kit for the cartoon shorts, synthesised from scratch.

Every sound is built here from oscillators, filtered noise and envelopes, so
the project owns the output outright: no samples, no packs, no licence. The
seeds are fixed, so a rerun writes the same files bit for bit.

Usage (numpy + scipy, e.g. the venv at ~/.cache/cartoon-shorts/venv-sfx):
    python scripts/make_sfx.py            # writes public/sfx/*.wav
    python scripts/make_sfx.py --out DIR  # somewhere else

All files: 48 kHz, mono, 16-bit PCM, peak -6 dBFS. Loops (phone_buzz,
fly_loop) are built three times over and cut from the middle, so they repeat
without a click.
"""

import argparse
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
PEAK_DBFS = -6.0


# ---------------------------------------------------------------- building blocks

def timeline(seconds):
    return np.arange(int(round(seconds * SR))) / SR


def rng_for(seed):
    return np.random.default_rng(seed)


def filt(signal, kind, cutoff, order=2):
    sos = butter(order, cutoff, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, signal)


def glide_phase(freq):
    """Phase in radians for a per-sample frequency curve."""
    return 2 * np.pi * np.cumsum(freq) / SR


def decay(t, seconds):
    return np.exp(-t / seconds)


def swell(t, peak_at, rise_power=2.0, fall_seconds=0.12):
    """Envelope that rises to 1 at peak_at, then decays exponentially."""
    rise = np.clip(t / peak_at, 0, 1) ** rise_power
    fall = np.exp(-np.clip(t - peak_at, 0, None) / fall_seconds)
    return np.where(t < peak_at, rise, fall)


def sweep_bandpass(noise, centre, q=1.2):
    """State-variable band-pass whose centre frequency moves per sample."""
    out = np.zeros_like(noise)
    low = band = 0.0
    damp = 1.0 / q
    coeff = 2 * np.sin(np.pi * np.clip(centre, 20, SR / 6) / SR)
    for i, x in enumerate(noise):
        high = x - low - damp * band
        band += coeff[i] * high
        low += coeff[i] * band
        out[i] = band
    return out


def log_sweep(t, points):
    """Frequency curve through (time, hz) points, interpolated in log space."""
    times, freqs = zip(*points)
    return np.exp(np.interp(t, times, np.log(freqs)))


def mallet(t, freq, partials, start=0.0):
    """Struck bar: list of (ratio, amp, decay_seconds) partials from start."""
    local = np.clip(t - start, 0, None)
    gate = (t >= start).astype(float)
    attack = np.clip(local / 0.002, 0, 1)
    tone = sum(a * np.sin(2 * np.pi * freq * r * local) * decay(local, d) for r, a, d in partials)
    return tone * attack * gate


def thump(t, f_start, f_end, seconds, start=0.0):
    local = np.clip(t - start, 0, None)
    freq = f_end + (f_start - f_end) * decay(local, seconds / 3)
    return np.sin(glide_phase(freq)) * decay(local, seconds) * (t >= start)


def seamless(build, period):
    """Render three periods of a loop, filter all of it, keep the middle one."""
    n = int(round(period * SR))
    whole = build(np.arange(3 * n) / SR)
    return whole[n:2 * n]


def finish(signal, fade_ms=3.0, loop=False):
    signal = np.asarray(signal, dtype=np.float64)
    signal = signal - np.mean(signal) if loop else signal
    if not loop:
        fade = int(SR * fade_ms / 1000)
        ramp = np.linspace(0, 1, fade)
        signal[:fade] *= ramp
        signal[-fade:] *= ramp[::-1]
    peak = np.max(np.abs(signal)) or 1.0
    return signal * (10 ** (PEAK_DBFS / 20) / peak)


# ---------------------------------------------------------------- the effects

def whoosh(seed, seconds, sweep, peak_at, q, fall):
    t = timeline(seconds)
    noise = rng_for(seed).standard_normal(t.size)
    centre = log_sweep(t, sweep)
    air = sweep_bandpass(noise, centre, q)
    body = filt(noise, "lowpass", 380) * 0.6
    return finish((air + body) * swell(t, peak_at, 2.2, fall))


def whoosh_a():
    """Bright, quick whip for whipLeft and whipRight."""
    return whoosh(11, 0.5, [(0, 350), (0.15, 2600), (0.5, 700)], 0.15, 1.4, 0.09)


def whoosh_b():
    """Lower, airier whip; the auto cue alternates it with whoosh_a."""
    return whoosh(12, 0.55, [(0, 220), (0.15, 1700), (0.55, 450)], 0.15, 1.0, 0.11)


def zoom_whoosh():
    """Riser into a soft hit, peak at 0.18 s: zoomBlur enters and crash moves."""
    t = timeline(0.7)
    noise = rng_for(21).standard_normal(t.size)
    air = sweep_bandpass(noise, log_sweep(t, [(0, 500), (0.18, 5200), (0.7, 1500)]), 1.6)
    riser_freq = log_sweep(t, [(0, 160), (0.18, 900), (0.7, 900)])
    riser = np.sin(glide_phase(riser_freq)) * swell(t, 0.18, 3.0, 0.05) * 0.35
    hit = thump(t, 110, 48, 0.16, start=0.17) * 0.9
    return finish(air * swell(t, 0.18, 2.5, 0.1) + riser + hit)


def pop():
    """Bubble pop for a sign or caption landing."""
    t = timeline(0.15)
    freq = 330 + 950 * decay(t, 0.018)
    tone = np.sin(glide_phase(freq)) * decay(t, 0.035) * np.clip(t / 0.001, 0, 1)
    click = filt(rng_for(31).standard_normal(t.size), "highpass", 3000) * decay(t, 0.002) * 0.3
    return finish(tone + click)


def motor(t, hz):
    """Vibration motor: clipped sine plus a case rattle locked to the motor."""
    hum = np.tanh(3.5 * np.sin(2 * np.pi * hz * t))
    rattle_gate = (0.5 + 0.5 * np.sin(2 * np.pi * hz * t)) ** 6
    noise = rng_for(41).standard_normal(t.size)
    rattle = filt(noise * rattle_gate, "bandpass", [1800, 4200]) * 2.2
    return filt(hum, "lowpass", 2400) + rattle


def gate(t, period, windows, ramp=0.012):
    """1 inside each (start, end) window of every period, with soft edges."""
    local = np.mod(t, period)
    level = np.zeros_like(t)
    for start, end in windows:
        rise = np.clip((local - start) / ramp, 0, 1)
        fall = np.clip((end - local) / ramp, 0, 1)
        level = np.maximum(level, np.minimum(rise, fall))
    return level


def phone_buzz():
    """Loop, 1.0 s: two buzzes of a phone on a table. 170 Hz fits the period."""
    build = lambda t: motor(t, 170) * gate(t, 1.0, [(0.02, 0.40), (0.52, 0.90)])
    return finish(seamless(build, 1.0), loop=True)


def buzz_once():
    """One 0.35 s "BZZT!" for a single accent."""
    t = timeline(0.4)
    return finish(motor(t, 170) * gate(t, 10.0, [(0.0, 0.35)]))


def ding():
    """Generic two-tone chime, rising major sixth E5 to C#6 on a glockenspiel bar.

    Deliberately not modelled on any phone's or app's notification sound."""
    t = timeline(1.1)
    bar = [(1.0, 1.0, 0.55), (2.0, 0.18, 0.3), (2.76, 0.32, 0.2), (5.4, 0.1, 0.08)]
    tone = mallet(t, 659.26, bar) * 0.8 + mallet(t, 1108.73, bar, start=0.14)
    return finish(tone)


def swat():
    """Rolled-newspaper thwack: crack, slap, low thump."""
    t = timeline(0.35)
    noise = rng_for(61).standard_normal(t.size)
    crack = filt(noise, "highpass", 4500) * decay(t, 0.004) * 0.8
    slap = filt(noise, "bandpass", [400, 3200]) * decay(t, 0.035) * np.clip(t / 0.0015, 0, 1)
    body = thump(t, 150, 55, 0.12) * 0.9
    return finish(crack + slap * 1.4 + body)


def fly_voice(t, f0, period, fm_cycles, am_cycles, depth):
    """Sawtooth-ish fly with periodic FM; closed-form phase keeps the loop exact."""
    rate = fm_cycles / period
    phase = 2 * np.pi * f0 * t + (depth / rate) * (1 - np.cos(2 * np.pi * rate * t))
    saw = sum(np.sin(k * phase) / k for k in range(1, 9))
    loudness = 0.55 + 0.45 * np.sin(2 * np.pi * am_cycles / period * t) ** 2
    return saw * loudness


def fly_loop():
    """Loop, 2.0 s: two flies circling. f0 * period is a whole number."""
    def build(t):
        flies = fly_voice(t, 220, 2.0, 3, 2, 22) + 0.7 * fly_voice(t, 247, 2.0, 5, 3, 30)
        return filt(flies, "bandpass", [260, 4200])
    return finish(seamless(build, 2.0), loop=True)


def tap():
    """Soft UI tap: tiny click plus a short 2.4 kHz blip."""
    t = timeline(0.06)
    click = filt(rng_for(81).standard_normal(t.size), "highpass", 2500) * decay(t, 0.0015)
    blip = np.sin(2 * np.pi * 2400 * t) * decay(t, 0.008) * 0.6
    return finish(click + blip, fade_ms=1.0)


def boing():
    """Spring boing for the twist: a wobbling glide with a jaw-harp edge."""
    t = timeline(0.85)
    wobble = 1 + 0.32 * decay(t, 0.28) * np.sin(2 * np.pi * 9.5 * t)
    freq = (190 + 90 * np.clip(t / 0.25, 0, 1)) * wobble
    phase = glide_phase(freq)
    tone = np.sin(phase) + 0.5 * np.sin(2 * phase) + 0.28 * np.sin(3 * phase)
    env = np.clip(t / 0.004, 0, 1) * decay(t, 0.32)
    return finish(filt(tone * env, "lowpass", 3500))


def scratch_source(seconds):
    """A noisy chord to drag back and forth, like a groove under a needle."""
    t = timeline(seconds)
    chord = sum(np.sin(2 * np.pi * f * t) for f in (196, 247, 294, 392))
    hiss = filt(rng_for(101).standard_normal(t.size), "bandpass", [600, 6000]) * 1.5
    return chord + hiss


def record_scratch():
    """Needle dragged back then forward: the "wait, what?" stop."""
    t = timeline(0.5)
    rate = np.interp(t, [0, 0.08, 0.14, 0.26, 0.32, 0.5], [1.0, 1.0, -2.4, -2.4, 2.8, 0.0])
    source = scratch_source(1.2)
    position = 0.4 * SR + np.cumsum(rate)
    dragged = np.interp(position, np.arange(source.size), source)
    env = np.interp(t, [0, 0.02, 0.4, 0.5], [0, 1, 0.8, 0])
    return finish(filt(dragged * env, "bandpass", [350, 7000]))


def time_skip():
    """Rising shimmer then a swish down: for a "3 MINUTES LATER" card."""
    t = timeline(0.8)
    noise = rng_for(111).standard_normal(t.size)
    centre = log_sweep(t, [(0, 3000), (0.42, 9000), (0.62, 900), (0.8, 600)])
    swish = sweep_bandpass(noise, centre, 1.3) * swell(t, 0.42, 3.0, 0.14)
    shimmer = sum(np.sin(2 * np.pi * f * t) for f in (2093, 2637, 3136))
    shimmer *= (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t)) * swell(t, 0.42, 2.0, 0.2) * 0.12
    return finish(swish + shimmer)


def honk():
    """Taxi horn: two square waves a major third apart (370 and 466 Hz), filtered, 0.42 s."""
    t = timeline(0.42)
    horn = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (370.0, 466.0))
    horn = filt(filt(horn, "lowpass", 2600), "highpass", 180)
    env = np.clip(t / 0.015, 0, 1) * np.clip((t[-1] - t) / 0.12, 0, 1)
    return finish(horn * env)


MARIMBA = [(1.0, 1.0, 0.45), (3.9, 0.22, 0.12), (9.2, 0.06, 0.04)]


def tada():
    """Soft end-card sting: pickup note into a warm C major marimba chord."""
    t = timeline(1.6)
    pickup = mallet(t, 392.0, MARIMBA) * 0.6
    chord_hz = (523.25, 659.26, 783.99, 1046.5)
    chord = sum(mallet(t, f, MARIMBA, start=0.16) * a for f, a in zip(chord_hz, (1, 0.8, 0.8, 0.4)))
    detuned = sum(mallet(t, f * 1.004, MARIMBA, start=0.165) * 0.3 for f in chord_hz)
    return finish(filt(pickup + chord + detuned, "lowpass", 6000))


KIT = {
    "whoosh_a": whoosh_a,
    "whoosh_b": whoosh_b,
    "zoom_whoosh": zoom_whoosh,
    "pop": pop,
    "phone_buzz": phone_buzz,
    "buzz_once": buzz_once,
    "ding": ding,
    "swat": swat,
    "fly_loop": fly_loop,
    "tap": tap,
    "boing": boing,
    "record_scratch": record_scratch,
    "time_skip": time_skip,
    "tada": tada,
    "honk": honk,
}


def write(path, signal):
    pcm = np.round(np.clip(signal, -1, 1) * 32767).astype(np.int16)
    wavfile.write(path, SR, pcm)


def main():
    default_out = Path(__file__).resolve().parent.parent / "public" / "sfx"
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=default_out)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    for name, build in KIT.items():
        signal = build()
        write(args.out / f"{name}.wav", signal)
        print(f"{name:15s} {signal.size / SR:5.2f}s")
    print(f"wrote {len(KIT)} files to {args.out}")


if __name__ == "__main__":
    main()
