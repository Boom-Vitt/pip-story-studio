# Art Bible: Pip and the Little Star

Owner: studio-art. Source of truth for scenes, timings and captions: `story.md`. This file covers
the look and motion. Everything below is already implemented in `assets/`, so build pastes or
inserts it and doesn't redraw anything.

**See it first:** open `assets/preview.html` (it works over `file://`). It shows every
expression and prop, plus 11 storyboard frames that use the camera boards below. Treat those
frames as the target look.

## 0. Files and quick start

| File | What |
|---|---|
| `assets/art.js` | Classic script, defines `window.ART`: palette, SVG markup builders, expression table + `applyExpr`, star field, sets, camera boards, control icons |
| `assets/art.css` | Tokens, `@font-face` (vendored), `.stage`, `.caption`, `.title-card`, `.end-card`, `.controls` |
| `assets/fonts/` | Sniglet 800 (display), Nunito 700/800 (captions/UI), latin woff2 from `@fontsource/*@5.3.0`, OFL licence files |
| `assets/preview.html` | Visual reference / storyboard (not shipped in `index.html`) |

```html
<link rel="stylesheet" href="assets/art.css">
<div class="stage">
  <svg class="defs" aria-hidden="true"></svg>                         <!-- ART.defs() once, never display:none -->
  <svg id="sv-meadow" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"></svg>   <!-- S1–S3 -->
  <svg id="sv-hill" viewBox="-140 1230 1280 720" preserveAspectRatio="xMidYMid slice" style="opacity:0"></svg> <!-- S4–S6 -->
  <!-- HTML overlays: .title-card, .caption, .end-card -->
</div>
<div class="controls">…</div>
<script src="vendor/gsap.min.js"></script><script src="assets/art.js"></script>
```
```js
document.querySelector('svg.defs').innerHTML = ART.defs();
meadow.innerHTML = ART.setMeadow() + ART.pip('pip') + ART.star('star');
hill.innerHTML   = ART.setHill() + ART.pip('pip2') + ART.star('star3') + Array.from({length: 10}, (_, i) => ART.firefly('ff' + i)).join('');
document.getElementById('pip2-rider').innerHTML = `<g transform="translate(0,-52) scale(.75)">${ART.star('star2')}</g>`;
gsap.set('.pv', { svgOrigin: '0 0' });            // REQUIRED: every rigged group pivots on its own local 0,0
gsap.set('#pip',  { x: 760, y: 975, scale: .5 });  // place by the character's origin (see §3)
gsap.set('#star', { x: 1380, y: 230, scale: .4 });
```
Use two set SVGs, each with its own `viewBox` camera, and cross-dissolve between them at 29.0 s.
The sets use different world coordinates, so a single shared camera would show the wrong place
during the dissolve. Every ID takes a prefix argument (`ART.pip('pip2')` gives `#pip2-…`), so
duplicate characters never collide.

**Rig rule (verified in GSAP 3.15.0, including seeking forward, backward and forward again):** every
animatable group has class `pv`. It has no transform attribute of its own, and its pivot is its
local (0,0); a parent `<g transform="translate()">` puts it in place. With `svgOrigin:'0 0'`, the
GSAP properties rotation, scale, x and y behave as the pivots below describe. Use
`gsap.set('.pv', { svgOrigin: '0 0', smoothOrigin: false })`. Without `smoothOrigin:false`, GSAP
shifts x/y on groups that already have a transform. Build found this on 3.13.0. Don't use
percentage `transformOrigin` on these groups, because hidden expression variants change the bbox.

**Choreography vs idle groups never overlap.** The timeline tweens choreography groups.
Procedural idle motion (§6.3) writes only to idle groups. Never tween an idle group.

## 1. The look in one line

A cut-paper bedtime picture book. Every shape is soft and rounded with no outlines. Each body
sits on a slightly darker copy of itself, offset downward, which gives it "paper depth". Warm
characters stand against a cool blue-teal night, and light comes from the characters: the star,
the fireflies, the moon. Glows are radial gradients only. Never use SVG/CSS blur filters on
anything that animates.

## 2. Palette (`ART.C`, also CSS vars in `art.css`)

| Role | Tokens |
|---|---|
| Ink (eyes, mouths, text-dark) | `ink #2B2346`, `inkSoft #4A3F6B`; never pure black |
| Cream (captions, bg stars, light) | `cream #FFF6E3`, `bgStar #FFF6D8`, `moon #FFF3C4` / `moonDk #F1DFA4` |
| Pip | body `#FFD7B5`, belly `#F2B591`, shell `#F4907E`, swirl/shade `#D9677A`, shell highlight `#FFC6B4`, blush `#FF8FA8`, heart `#FF6F96` |
| Little Star | `star #FFD45C`, `starDk #EFA43A` (depth), `starLt #FFEAA0` (highlight), glow `#FFE89A`, sad overlay `starDim #8F94C4`, tear `#9FD8FF` |
| Fireflies | body `#FFE070`, glow `#FFF1A6`, head `#4A3F6B`, wings white @ .6–.7 |
| Night sky (base) | `#141A47` → `#26307A` → `#4A4C9C` (top → horizon) |
| Night land | far `#2C3A7A`, mid `#23557A`, meadow `#2C6E66`, tall hill `#2F7A68`; each has a lighter `-rim` stroke on its crest |
| Dusk (S1 start only) | sky `#6E6BBE` → `#C59AC8` → `#FFC3A0`; land far `#9C8FC4`, mid `#7FA6B0`, meadow `#86B88E` (+ dusk rims) |
| Washes | `#h-deep` `#0B0E30` (S4 deepen), `#h-warm` gold→rose→lilac radial (S6 payoff) |
| Page backdrop | `#0E1036` |

**Lighting changes, all on the master timeline:**
- **S1, dusk to night:** fade `#m-sky-dusk` opacity 1→0. Tween each land path's `fill` and each
  `-rim` path's `stroke` from the dusk value to the night value. Run 0.5→7.0 s, `sine.inOut`.
  The markup ships in dusk colours, and the night targets are `ART.C.hillFar/hillMid/meadow` and
  `rimFar/rimMid/rimMeadow`.
- **S4:** `#h-deep` opacity 0→0.25 over 29→38 s (`sine.inOut`).
- **S6:** `#h-warm` opacity 0→0.8 over 50.2→52.5 s (`sine.out`). Don't go above 0.8, because it
  turns muddy.

## 3. Sets and world coordinates

**Meadow (`ART.setMeadow()`, S1–S3).** The world is 1920×1080 with overscan. Layers, back to front:
`#m-sky`, `#m-sky-dusk`, `#m-stars` (70 × `.bgstar`), `#m-moon` (300,190), `#m-home` (family
stars + ghost), `#m-hill-far`, `#m-hill-mid`, `#m-meadow` (each with a `-rim`), `#m-clover`,
`#m-grass`, and the invisible `#m-fall` path.
- `ART.MEADOW.home` = **(1380,230)**: the Little Star's spot.
- `ART.MEADOW.pip` = **(760,975)** at scale **.5**.
- `ART.MEADOW.landing` = **(1010,942)** at star scale **.4**.

**Tall hill (`ART.setHill()`, S4–S6).** The world spans x −800…2720 and y 0…2160. Layers, back to
front: `#h-sky`, `#h-stars` (150), `#h-moon` (120,420), `#h-home`, `#h-deep`, `#h-par-far`,
`#h-par-mid` (parallax groups), `#h-hill` + rim, `#h-clover`, `#h-grass`, the invisible
`#h-crest` path, and `#h-warm`.
- `ART.HILL.home` = **(1250,520)**.
- The summit on the crest is ≈ **(1250,1412)**.
- Pip's scale here is **.6**.

**Parallax (S4):** while the camera moves, offset `#h-par-far` by `0.6 × Δcam` and `#h-par-mid`
by `0.3 × Δcam`, where Δ is relative to the `S4_climbA` board. Apply it to both x and y.

**Home cluster (`#m-home` / `#h-home`):** four bigger "family" stars, `#…-fam1..4`. Each is a
full star rig at scale .5–.62, so "the smallest star" reads at a glance. `#…-ghost` is a dashed
outline of her empty spot. Hide the ghost the instant she clicks home.

**Camera boards (`ART.CAMERA`, SVG `viewBox` strings, always 16:9):** tween the set SVG's
`viewBox` attribute with GSAP (`attr:{viewBox}`) or the equivalent world transform. Camera eases
are `power2.inOut` and never shorter than 1.0 s.

| Board | viewBox | Use |
|---|---|---|
| `S1_wide` | `0 0 1920 1080` | title, stars waking |
| `S1_star` | `1060 60 640 360` | close on the smallest star |
| `S2_fall` | `480 240 1280 720` | follow the tumble |
| `S2_land` | `540 700 760 427.5` | plink + Pip pops out + sad |
| `S3_two` | `600 735 640 360` | two-shot, heart, hop on |
| `S4_climbA` | `-140 1230 1280 720` | start of climb |
| `S4_summit` | `600 1080 1280 720` | arrival at top |
| `S4_far` | `-83 310 2667 1500` | "still so far": tiny pair on top, empty gap high above |
| `S5_tilt` | `600 260 1280 720` | end of the lift tilt |
| `S6_home` | `930 340 640 360` | click + bloom |
| `S6_wide` | `-83 310 2667 1500` | payoff. **Same frame as `S4_far`, on purpose:** the low point and the payoff rhyme. |

Composition rule: keep faces out of the bottom 22% of the frame, where captions sit.

## 4. Characters

### Pip (`ART.pip(prefix)`)
Faces right; to face left, set `scaleX:-1` on the root. Origin is ground contact, bottom centre.
He's ≈340 wide × 330 tall at scale 1. Use .5 in the meadow and .6 on the hill.
```
#pip  (choreo: x,y,scale,rotation)
├─ #pip-shadow          choreo: scaleX .65 when tucked
└─ #pip-squash          choreo squash/stretch, pivot bottom centre
   └─ #pip-breathe      IDLE
      ├─ #pip-body      choreo TUCK: scale 1→.12, pivot = shell centre
      │  ├─ #pip-stalkL / #pip-stalkR   expr rotation, pivot = stalk base on head
      │  │  └─ #pip-swayL / #pip-swayR  IDLE
      │  │     └─ #pip-eyeL / #pip-eyeR  expr scale, pivot = eye centre
      │  │        └─ #pip-blinkL / #pip-blinkR   choreo blink scaleY
      │  │           ├─ #pip-eyeL-open (#pip-pupilL: x/y look direction)
      │  │           ├─ #pip-eyeL-shut   └─ #pip-eyeL-happy
      │  └─ #pip-head   expr rotation, pivot head centre; #pip-blush, mouths: #pip-mouth-smile|big|o|flat
      └─ #pip-shell     choreo (bob, tuck drop y:+28), pivot shell centre
         ├─ #pip-heart  hidden; S3 heart pulse (scale/opacity)
         └─ #pip-rider  empty anchor on top of the shell: put the riding star here
```
- **Expressions:** `normal`, `startled`, `droopy`, `smile`, `lookUp`, `calling`, `asleep`.
- **Tuck** (inside the shell; also the sleep pose): `#pip-body` scale→.12, `#pip-shell` y→+28,
  `#pip-shadow` scaleX→.65. Tween over 0.45 s `power2.in`, with a 0.12 s anticipation stretch
  first. **Untuck** is the reverse over 0.45 s, `back.out(2.5)`.
- **Riding star:** `<g transform="translate(0,-52) scale(.75)">` + `ART.star('star2')` inside
  `#pip2-rider`. Riding world position = `pipXY + pipScale × (−36, −262)`. Her world scale is
  `.75 × pipScale`, which is ≈.4 so she stays the same size everywhere.

### Little Star (`ART.star(prefix)`)
Origin at centre, outer radius 100 at scale 1. Use **.4** at home and in the meadow (≈ .45 while
riding on the hill).
```
#star (choreo x,y,scale,rotation)
├─ #star-glow       expr opacity/scale = MOOD; choreo bloom pulses
│  └─ #star-glowPulse   IDLE
└─ #star-float      IDLE
   └─ #star-wobble  choreo: S1 wobble, fall spin
      └─ #star-squash   choreo squash, pivot = bottom tips (0,72)
         ├─ body (dark copy +8, main, light inner star), #star-dim (sad grey overlay, opacity)
         └─ #star-face  choreo: small x/y "look" offsets (−4..4)
            ├─ #star-blink (eyes: #star-eyes-open|happy|sleepy; pupils .star-pupil)
            └─ #star-blush, mouths #star-mouth-smile|big|sad|o|yawn, #star-tear
```
Expressions: `happy`, `joy`, `sad`, `sleepy`, `yawn`, `surprised`.
**Her glow is her mood:** `sad` sets glow .28 / scale .8 and dim .55; `happy` sets glow 1 and
dim 0; `joy` sets glow 1 / scale 1.25.

### Fireflies (`ART.firefly(id?)`)
`.ff` is choreography (position, opacity). Inside it are `.ff-bob` (IDLE bob) and `.ff-wings`
(IDLE flutter, pivot at the wing root). Use scale **1.25** on the hill and 10 fireflies. The
glow (r46) is built in.

### Moon, family stars, props
- **Moon (`ART.moon`):** sleepy face `#…-face`, static apart from the idle glow.
- **Props:** shared `<defs>` you reuse with `<use href>`. The pivot is the base or centre:
  - `#sym-clover`
  - `#sym-grass`
  - `#sym-sparkle` (trail/burst)
  - `#sym-heart` (S6 heart twinkle)
  - `#sym-ring` (Pip's call, S5)
  - `#sym-bgstar`
  - `#sym-starPath` (the star silhouette)
  - `url(#g-bloom)` (radial for blooms)

## 5. Expressions API (seek-safe)
```js
ART.applyExpr(tl, 'pip', 'pip', 'startled', 12.45);  // (timeline, who, idPrefix, name, time[, dur=.22])
ART.applyExpr(tl, 'star', 'star', 'sad', 15.0, 0.8);  // dur also controls glow/dim fade
```
It swaps the visible variant in each slot (0.08 s) and tweens transform presets with
`back.out(2)`. The result is plain timeline tweens, so seeking with `?t=` reproduces every frame.
Tested: seeking forward, then back, then forward gives an identical state.

## 6. Motion language

### 6.1 Eases + durations (GSAP)
| Verb | Spec |
|---|---|
| Pop in (stars, sparkles, fireflies) | scale 0→1, rotation −15→0, `back.out(2.2)`, 0.45 s |
| Land / settle | squash scaleX 1.25 / scaleY .75 for 0.08 s `power2.out`, then `elastic.out(1,.4)` 0.6 s |
| Anticipation | 0.12–0.15 s counter-move (e.g. scaleY .9) before any jump/pop/stretch |
| Overlap | secondary parts (shell, stalks, glow) trail the main move by 0.06–0.12 s |
| Travel | `sine.inOut`; nothing moves linearly except the fall spin (`power1.in`) |
| Camera | `power2.inOut`, ≥1.0 s |
| Blink | target scaleY 1→.1 in 0.07 s `power2.in`, then →1 in 0.09 s `power2.out` |
| Pip inch (1 step = 0.8 s) | stretch 0.32 s `sine.out` (squash scaleX 1.12, scaleY .92, advance 40%), then pull 0.48 s `sine.inOut` (scale back to 1, advance 60%); shell bobs y −4→0 lagging 0.08 s |
| Caption | in: opacity 0→1, y .8cqh→0, 0.4 s `power2.out`; out: 0.3 s `power1.in` |
| Title / End | in: 0.8 s `power2.out` (+ scale .96→1); End: 1.2 s `sine.out` |

### 6.2 Blinks (choreography; times in s)
- **Pip:** 13.4, 13.7 (double), 18.6, 22.0, 27.9, 31.8, 34.6, 38.3 (slow 0.3 s), 42.5, 54.2, 56.0.
- **Star:** 19.0, 21.4, 24.0, 27.8, 33.0, 36.0, 41.5, 47.5, 52.0, 56.8.

### 6.3 Idle (procedural, a pure function of master time `t`)
Compute these in one master `onUpdate`, writing only the IDLE groups with
`gsap.set(..., {...})` or `gsap.quickSetter`. Never use separate `repeat:-1` tweens: they break
`?t=` seeking and the fixed runtime. `S(p) = Math.sin(2π t / p)`. `φ` is a per-instance phase:
use `data-ph` on bg stars, and the index × 0.37 elsewhere.

| Group | Formula |
|---|---|
| `#pip-breathe` | scaleY `1 + .02·S(2.4)`, scaleX `1 − .01·S(2.4)` |
| `#pip-swayL` / `R` | rotation `4·S(3.1)` / `4·sin(2π(t+.45)/3.1)` |
| `#star-float` (and `-fam*`) | y `6·sin(2π(t+φ)/2.2)`, rotation `3·sin(2π(t+φ+.5)/3.3)` |
| `#star-glowPulse` | scale `1 + .05·S(1.8)` |
| `.ff-bob` | y `9·sin(2π(t+φ)/T)`, x `4·sin(2π(t+φ)/(1.7T))`, T = 1.4…2.0 per firefly |
| `.ff-wings` | scaleY `.6 + .4·sin(2π·10·t + φ)` |
| `.bgtw` (only where `data-i % 3 == 0`) | scale `.85 + .25·sin(2πt/2.6 + ph)`, opacity `.75 + .25·sin(…)` |
| grass `.pv` in `#m-grass` / `#h-grass` | rotation `3·sin(2π(t + i·.3)/3.6)` |
| clover `.pv` | rotation `2·sin(2π(t + i·.4)/4.2)` |

## 7. Scene-by-scene direction (times match `story.md`)

**S1 Night Falls, 0–10.** Camera `S1_wide`.
- **Pip:** tucked at (760,975) the whole scene.
- **Little Star and family:** start at scale 0, expression `sleepy`.
- **Lighting:** dusk→night runs 0.5–7.0 s (§2).
- **Title:** in at 0.2 s, out from 2.4–3.0 s.
- **Background stars:** `.bgstar` pop in `data-i` order, 0.3→4.5 s (stagger ≈ .06 s).
- **Family stars:** fam1–4 pop at 3.2 / 3.6 / 4.0 / 4.4 s and switch to `happy` 0.6 s after
  each pop.
- **Little Star:** pops last, at 5.0 s, still `sleepy`.
- **Camera:** `S1_wide`→`S1_star` from 6.0–8.0 s.
- **The wake-up:** at 7.2 s she stretches (squash scaleY 1.15 / scaleX .9, 0.4 s yoyo). At 7.8 s
  `yawn`, back to `sleepy` at 8.6 s. From 8.6–10.0 s `#star-wobble` swings ±6°, ±10°, ±14°,
  growing, and drifts x +8.

**S2 The Fall, 10–20.**
- **The fall:** from 10.0–12.0 s she follows `#m-fall` (MotionPathPlugin, or a fallback of
  x `power1.inOut` plus y `power2.in`). Spin `#star-wobble` +540° (`power1.in`) and set
  `surprised` at 10.1 s.
- **Sparkle trail:** a sparkle every 0.08 s, each living 0.5 s and fading. Cap at 12 alive at once.
- **Camera:** `S1_star`→`S2_fall` from 10.0–11.2 s, then `S2_land` from 11.4–12.4 s.
- **The plink at 12.0 s:** land squash, a 30-unit bounce, a burst of 6 sparkles flying out
  60–110 units, and a glow pulse 1.4→1.
- **Pip pops out:** untuck from 12.3 s, `startled` at 12.45 s, double blink, then `normal` at
  14.2 s with pupils x +4 toward her.
- **She saddens:** `sad` at 15.0 s with a 0.8 s fade. Her `.star-pupil` and face move y −4 at
  15.6 s as she looks up. The tear shows at 16.2 s, slides y +14 over 1.2 s, then fades.
- **Pip's concern:** head rotation 6° at 17.5 s.

**S3 A Promise, 20–29.**
- **Camera:** `S2_land`→`S3_two`, 20.0–21.2 s.
- **"Big heart":** `#pip-heart` fades in at 22.6 s, pulses scale 1→1.25→1 twice (0.35 s each,
  `sine.inOut`), and is out by 24.6 s.
- **Pip offers his shell:** `smile` at 24.9 s, then he lowers it (squash scaleY .92) at 25.6 s.
- **She hops on (26.4 s):** anticipation, then a 0.5 s arc (peak −120) to the rider world
  position (742,844). She lands with a squash and Pip recoils (scaleY .92→1).
- **She brightens:** `happy` at 26.9 s, with dim and glow at about the midpoint (glow .7).
  Swap to the hill-set copy during the dissolve.

**S4 The Long Climb, 29–39.**
- **The dissolve:** at 29.0 s cross-fade `#sv-hill` over `#sv-meadow` (0.8 s). `pip2` carries
  `star2` (`happy`).
- **The climb:** 8 inch-steps from 29.2–35.6 s along `#h-crest`, from x≈420 to the summit. Rotate
  to the slope; MotionPath `autoRotate` is fine.
- **Camera and lighting:** `S4_climbA`→`S4_summit` over the same span with parallax (§3).
  `#h-deep` rises.
- **At the top:** 35.8 s both `lookUp`. Camera `S4_summit`→`S4_far` from 36.2–37.8 s, revealing
  the tiny pair and the empty ghost spot high above.
- **The low moment:** 37.4 s Pip `droopy`, star `sad`. Hold quietly until 38.8 s; Pip's slow
  blink falls at 38.3 s.

**S5 Friends Glow, 39–49.**
- **Camera:** `S4_far`→`S4_summit`, 39.0–40.0 s.
- **Pip calls:** at 39.3 s he stretches tall (scaleY 1.15 `back.out`) in `calling`. Three
  `#sym-ring`s leave his mouth at 39.6, 40.1 and 40.6 s, each scale .6→2.2 and opacity 1→0 over
  0.9 s.
- **The fireflies gather:** 10 fireflies rise from the grass from 41.0–44.0 s, staggered .3 s.
  Each pops in, then follows an S-curve for 0.9 s to ring slots around her (radius 130,
  ellipse ×0.7).
- **She lights up:** `happy` at 44.0 s, then swap `star2` for the free `star3` at the same world
  point and expression.
- **The lift:** from 44.4–48.8 s she and the ring rise to (1250,640) while the ring orbits once
  (`sine.inOut`). Camera `S4_summit`→`S5_tilt` over the same span.
- **Pip waves:** at 45.0–46.5 s, `#pip2-stalkR` swings ±18° three times, in `smile`.

**S6 Home, 49–60.**
- **The last rise:** from 49.0–50.2 s she rises to home (1250,520); camera `S5_tilt`→`S6_home`;
  the ring loosens to radius 220.
- **She clicks home (50.2 s):** scale 1→1.2→1 with `elastic.out(1,.45)` and `joy`. A
  `g-bloom` circle (r420) scales .3→1.6 and fades .9→0 over 1.4 s. The ghost hides, `#h-warm`
  rises, and the family switch to `joy` from 50.5 s, staggered .12.
- **Sparks drift down:** fireflies float back to the grass like sparks, 51.5–53.5 s
  (`sine.in`, opacity →.5).
- **The wide shot:** camera `S6_home`→`S6_wide` from 53.5–55.0 s, with Pip in `lookUp`.
- **The heart:** at 55.2 s she twinkles (scale pulse 1→1.15→1). A `#sym-heart` pops in beside
  her (scale 0→2.5 `back.out`), floats 120 units toward Pip and fades over 1.6 s.
- **Pip goes to sleep:** `smile` at 56.4 s, then he tucks to sleep at 57.2 s.
- **The End:** fades in from 58.0–59.2 s. Hold until 60.0 s.

## 8. Captions and type
- **Fonts:** display is **Sniglet 800**: round, storybook, used only for the title, "The End"
  and `<em>plink!</em>`. Captions and UI use **Nunito 700/800**. Both are vendored with
  `font-display:block`, so there's no flash and no network.
- **Caption (`.caption`):** one `<p>` per line from `story.md`, lower centre, `bottom:5.5cqh`.
  - Box: max width 74cqw, `text-wrap:balance`, at most 2 lines.
  - Type: 4.3cqh (≈46 px at 1080p), line-height 1.32.
  - Colours: cream text on a `rgba(20,18,52,.62)` rounded box. Contrast ≥ 6:1 even over the
    dusk peach horizon.
  - Markup: wrap "plink!" in `<em>` (gold Sniglet). Use the curly quotes exactly as in
    `story.md`. Never animate word by word.
- **Title (`.title-card`):** `<span class="t-small">Pip and the</span><span class="t-big">Little Star</span>`.
  The small line is cream 5.4cqh and the big line is gold 11cqh, with a soft gold glow, sitting at
  31cqh from the top (clear of the stars).
- **The End (`.end-card`):** cream, 9cqh, 24cqh from the top.

## 9. Control bar (`.controls`, under the stage, same width)
- **Layout:** a 52 px gold Play/Pause button (`.ctl-btn--primary`), a 44 px Restart button, a
  progress track (`.ctl-progress`, set `--p:%` from timeline progress; the gold star dot marks
  the playhead), time `0:23 / 1:00` (tabular numbers), and a Sound toggle on the right
  (`.ctl-sound`, `aria-pressed`).
- **Icons:** `ART.ICONS.play|pause|restart|soundOn|soundOff`, 24 px, drawn in `currentColor`.
- **Accessibility:**
  - Every button needs an `aria-label`, and the label must flip with state ("Play" ↔ "Pause",
    "Sound on" ↔ "Sound off").
  - Focus ring: 3 px gold, `:focus-visible`.
  - Hit targets are ≥ 44 px.
  - Keyboard: Space toggles play/pause; R restarts.
- **Sound:** the visuals and captions autoplay muted. Sound starts **off**. Clicking Sound (or
  Play) is the user gesture that starts the WebAudio and narration. The page has to look
  complete with sound off.

## 10. Performance rules (60 fps)
- **No filters:** no `feGaussianBlur` and no CSS `filter`/`backdrop-filter` on animated content.
  Glows come from radial gradients only.
- **Reuse geometry:** repeat props with `<use>`. Idle writes go through `gsap.quickSetter`.
  Only every third bg star twinkles.
- **Cap the FX:** ≤ 20 sparkles alive at once. Recycle a pool instead of creating DOM per frame.
- **Hidden set:** keep the hidden set at `opacity:0`, and also set `visibility:hidden` after the
  dissolve, so it costs nothing.
- **Defs:** the defs `<svg>` must never be `display:none`, or the `url(#…)` fills disappear.

## 11. Specified vs builder's judgement
- **Fully specified:** palette, all character/prop/set art, rig and pivots, expressions,
  idle formulas, eases and durations, blink times, camera boards, caption/title/end/controls
  look, fonts.
- **Builder's call:**
  - Camera via `viewBox` tween vs world transform.
  - MotionPath vs x/y arcs for the fall and climb.
  - Exact sparkle counts and paths.
  - Firefly entry curves.
  - Whether the progress bar is clickable.
  - Small timing nudges (±0.3 s) to sync with captions or audio.
  - Sound design.
- **If something looks off**, compare it with `assets/preview.html` and ping studio-art. Art
  owns `assets/` and this file.
