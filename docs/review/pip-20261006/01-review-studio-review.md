# Independent review — Pip and the Little Star

2026-10-06 · studio-review · input qitem `qitem-20261006080753-e21cd407`

**Verdict: three MEDIUM findings; recommend correcting them before final director acceptance.** The story and encoded export pass the checks below, but an additional visual reproduction exposed a displaced call effect. No MUST-FIX/HIGH source or export defect was found in this scope. This is an ordinary review, without a selected deep-review composition.

## Target and context

Reviewed the delivered working files in `.` against `CULTURE.md`, `story.md`, and `art-bible.md`. There is no Git repository and no before-state diff. All 14 entries in `shots/build-sha256.txt` matched before and after review, including source, art, vendor GSAP and MP4. Review added only this review folder and memory notes; it did not change product files.

The page is an offline SVG story with locally vendored GSAP 3.13.0. One 60-second timeline drives choreography, captions, cameras and pure-time idles. The same synthesized note/SFX schedule supplies live audio and the exported score. The reviewer traced the audio caller with Graft and inspected actual source; no speculative parallel implementation or dependency is recommended.

## Findings

### MEDIUM — controls overflow at a 320 px viewport

`index.html:20`, `index.html:28`: the control row stays on one line below 600 px. At 320×844, document `scrollWidth` is **344 px**, and the Sound button is clipped at the right edge. The 16:9 stage itself fits. At 390, 600 and 1280 px there is no horizontal overflow.

Reproduce: open `index.html?t=12.5` at 320×844. Evidence: `mobile-320.png` and `browser-report.json` in this folder. Expected: every playback control fits and remains usable without horizontal scrolling. Let the controls reflow at narrow widths, keeping useful touch targets; add a 320 px overflow assertion to `check.mjs`. A source/CSS-only fix does not require rendering the movie again if full-HD render pixels remain unchanged.

### MEDIUM — Space activates playback instead of the focused control

`js/story.js:54–56`: the document Space handler excludes inputs but includes buttons and prevents their native activation.

Reproduce with the story paused at 40 s: focus Restart and press Space. Actual: `time=40`, `paused=false`; it resumes instead of restarting. At 20 s, focus Sound off and press Space. Actual: `enabled=false`, `paused=false`; it resumes without enabling sound. Enter activates Sound successfully, so this is a specific Space regression rather than total keyboard inaccessibility.

Evidence: `browser-report.json` → `keyboard`. Preserve native Space handling on buttons and retain the background/global playback shortcut. Add focused Restart and Sound Space assertions to `check.mjs`.

### MEDIUM — Pip's call rings fly left across the scene

`js/animation.js:9`, `js/animation.js:111`: the group starts with `transform="translate(1370,1280)"`, then animates to **absolute** `x:40` at 39.75 s. Instead of drifting outward from Pip's mouth by 40 units, the rings move 1330 world units left while fading.

Reproduce: seek to 39.6, 40 and 40.5 s. Measured group x is **1370 → 788.125 → 123.125**; the final x at 40.75 s is 40. The decoded movie's 40 s frame visibly shows the rings detached far left of Pip. `node docs/review/pip-20261006/review-check.mjs --ring-check` reproduces it; see `call-report.json`, `call-40.png` and `shots/mp4-40.png`.

Animate to the intended world coordinate (e.g. 1410), or keep placement on a static parent and animate a local offset. Add a call-effect position assertion. Unlike the UI-only fixes, this changes stage pixels: regenerate/recheck the MP4 after correcting the animation and refresh the delivered hash manifest.

## Fresh verification

- `node check.mjs` passed in approved host Chrome: file:// seek, 60 s/six scenes, sampled captions, play/pause/restart, 390 px layout, grounding, face clearance, shell hop, repeated-seek pixel equality, live audio pause/play and offline WAV, full-HD framing, End, no page/console errors or remote requests.
- `node check-mp4.mjs` passed: actual H.264/yuv420p + AAC, 1920×1080, 30 fps/1800 frames, 60 s, moov before mdat, four decoded frames matching fresh page samples above .99 luminance SSIM. Independently ran FFprobe to confirm those stream/duration values.
- `node docs/review/pip-20261006/review-check.mjs` completed: local HTTP, every caption start/end/midpoint checked against text parsed from `story.md`, narrow layouts, focused-button reproductions, sound/seek/restart, and complete realtime playback of both page and MP4. Page reached 60 s with all 12 captions; MP4 reached 60 s/ended with 1800 presented frames, **zero dropped frames**. No external requests or page/console errors.
- The headless page run at 1280×800 measured **59.94 average rAF/s**, p95 **16.70 ms**, one interval over 33 ms in 3594 samples. This supports the 60 fps target in this environment; it is not a displayed-browser or cross-device guarantee.
- Inspected independent page captures at 8, 12.5, 23, 29.4, 37.5, 45.5, 49.7, 55.5 and 59 s. The fall, sadness, promise, climb, friends, return and heart payoff read clearly; the 29 s two-set dissolve and ending are visible. Faces/captions are clear in the inspected frames. The supplied encoded samples match the corresponding page framing/colors visually.
- Decoded all AAC samples: 60 s, peak .21235, RMS .01417, no clipping/NaN/Inf reported by FFmpeg. Zero-lag correlation with the exported source WAV is **.999990**, supporting encoded audio synchronization (`audio-report.json`).

## Remaining acceptance

Correct/recheck the three findings, rerender the changed call effect into the MP4, then let the director make the final visual acceptance. This model runtime explicitly rejects audio input, so subjective listening was **not performed**. The director should listen to the AAC score/SFX during final playback; objective decoding, levels and synchronization have been checked. No narration is included, as requested. Full displayed-browser performance and devices other than the checked host remain unmeasured.

Supporting workflows: project `review-team`, Ponytail full, ECC `accessibility`, Superpowers `verification-before-completion`; no extra review agents or deep protocol were started.
