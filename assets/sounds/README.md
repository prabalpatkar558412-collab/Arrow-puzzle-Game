These 13 original effects are rendered by `tools/create-sounds.py` as real
PCM16 mono 44,100 Hz WAV files. No external or licensed sound pack is claimed.
The renderer combines damped bell partials, shaped noise, pitch sweeps and a
musical victory chord, with RMS targets and capped peaks to balance volume.

- app-start.wav: gentle musical startup
- button-tap.wav: soft UI click
- arrow-tap.wav: crisp short arrow tick
- arrow-move.wav: short filtered swish
- arrow-escape.wav: soft positive pop
- blocked.wav: gentle low bump
- hint.wav: bell hint chime
- lifeline.wav: rising power-up
- level-complete.wav: 1.55-second musical victory flourish
- star.wav: subtle sparkle
- star-bright.wav: brighter third-star sparkle
- coin.wav: reward chime
- restart.wav: descending reset swish

`src/soundAssets.ts` statically requires every asset with exact capitalization.
One centralized manager caches playback resources and controls global mute,
foreground state, first-interaction Web unlock, event guards and cleanup.
