# Sunset Coast — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/iqbalcokk8-crypto/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/iqbalcokk8-crypto/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photo and a caption into a multi-panel
poster cover in the style of GTA 6 posters — a Vice City sunset / neon colour
grade, bold display lettering, several photos across the panels — and exports
it as a PNG to share. Photos are read on your own machine and never uploaded.

## What it does

- **Any photo:** add your own photos (or use the nine built-in sample
  portraits — original fictional people, generated with the media image
  tool, each with a face-safe focus point and a role name tag). Click a
  panel to put a photo in it, drag to move it, scroll to zoom, or use the
  per-panel zoom / position sliders.
- **Six layouts:** Hero + Trio, Four Grid, Full Bleed, Tilted Snaps, Mosaic
  Nine, Strip Duo — each with white poster gutters and a frame.
- **Five colour grades:** Sunset, Neon Night, Golden Hour, Teal Coast, Noir —
  gradient-map washes, film grain, vignette and a halftone title band.
- **Caption:** big Anton display title with a sunset-gradient fill, a Pacifico
  neon script subtitle, a badge line and a 1–5 star heat meter — plus poster
  furniture: a review quote, a billing block, a deterministic barcode, a
  circular seal, a volume tag and a name tag on every panel.
- **Fast export:** one click exports the current size, or all three post
  sizes at once — 1080 x 1080, 1080 x 1350, 1920 x 1080. Undo / redo included.

## Run it

Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts   # http://localhost:8080
```

No build step, no network request: every script, font and sample is a file
under `app/`.

## Originality

Everything is our own: the lettering is Anton and Pacifico, vendored under
the SIL Open Font License (see `app/fonts/OFL.txt`); the sample scenes are
the sample portraits are original fictional people generated with the
media image tool; the palm, sun and halftone art is drawn by the app itself.
No Rockstar Games logo, wordmark, official artwork, character or font is
used anywhere.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xvbs15t0&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
