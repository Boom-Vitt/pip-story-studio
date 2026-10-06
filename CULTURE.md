# Story Studio

Goal: one **cute, beautiful, ~60 second animated story in English**, delivered as a
single web page in this folder. Open `index.html` (or `npx serve .`) and it plays.

## Free choices (the team decides, no need to ask the owner)
Story and characters (original, gentle, all-ages), art style, palette, music/SFX,
Three.js / WebGL / GSAP / SVG / Canvas / CSS — any mix. Pin library versions; vendor
them under `vendor/` so the page works offline. No build step.

## Hard requirements
- Total runtime 55–65 s, driven by ONE master timeline (GSAP or equivalent), with
  `?t=<seconds>` to seek and a visible play / pause / restart control.
- English story told with on-screen captions (sync to the timeline). Optional: spoken
  narration via the Web Speech API; the page must still work if no voice exists.
- 5–7 scenes with a clear beginning, middle, end and a warm payoff.
- 60 fps target on a laptop, responsive 16:9 stage, no console errors, no external
  network calls at runtime.
- Cute and polished beats complex: soft rounded shapes, pleasing easing, lively
  micro-motion, cohesive palette, readable captions.

## Roles
- **director** (owner): writes `story.md` (narration ≈ 130–150 words, scene table with
  timestamps), splits work into `rig queue` tasks, integrates, and does the final
  acceptance by playing the page in a browser and judging it against the brief.
- **art**: writes `art-bible.md` (palette, character/prop designs, motion language,
  caption typography) and supplies assets/specs the builder can use directly.
- **build**: implements `index.html` + assets from `story.md` and `art-bible.md`.
  Makes the acceptance checks runnable (e.g. `check.mjs`: headless load, duration,
  zero console errors, screenshots at t = 5, 20, 40, 58).
- **review**: independent check of the exact diff and of the running page against the
  hard requirements; returns actionable findings to build/director.

## Working rules
Hand off through `rig queue` (repo path, files changed, checks run, known limits), not
chat text. Small, reviewable increments; the director owns the final result and
reports to the human owner once with: how to open it, what the story is, what was
checked, and any known gaps.
