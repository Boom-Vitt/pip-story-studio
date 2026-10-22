<!-- BBN:HEADER:START -->
<div align="center">

<img src=".github/brand/banner.svg" width="100%" alt="Pip Story Studio — 60-second story animation made by a Claude Code + Codex team" />

<a href="https://github.com/Boom-Vitt/pip-story-studio/stargazers"><img src="https://img.shields.io/github/stars/Boom-Vitt/pip-story-studio?style=flat-square&color=14b8a6&labelColor=0b1220" alt="stars" /></a>
<a href="https://github.com/Boom-Vitt/pip-story-studio/commits/main"><img src="https://img.shields.io/github/last-commit/Boom-Vitt/pip-story-studio?style=flat-square&color=14b8a6&labelColor=0b1220" alt="last commit" /></a>
<a href="https://github.com/Boom-Vitt"><img src="https://img.shields.io/badge/by-BoomBigNose-14b8a6?style=flat-square&labelColor=0b1220" alt="by BoomBigNose" /></a>

</div>
<!-- BBN:HEADER:END -->

# Pip and the Little Star: an AI-team-made story animation

A cute, 60-second English bedtime story, built as a single web page (hand-drawn SVG + GSAP timeline, no build step, no network) and rendered to MP4. It was made by a four-seat agent team defined in [`rig.yaml`](rig.yaml) and run with [OpenRig](https://github.com/mvschwarz/openrig).

> A tiny snail named Pip helps the smallest star find her way home, with a little help from his firefly friends.

**Watch:** [`story-animation.mp4`](story-animation.mp4) (1920×1080, 30 fps, H.264 + AAC, exactly 60 s)

## Play the page

```bash
python3 -m http.server 8765 --bind 127.0.0.1   # or: npx serve .
# open http://127.0.0.1:8765/index.html
```

`Space` plays/pauses, `?t=44.5` jumps to a moment, and the Sound button turns the synthesized music box on (off by default). Everything is vendored: GSAP in `vendor/`, fonts in `assets/fonts/`.

## The team (`rig.yaml`, `CULTURE.md`)

| Seat | Runtime | Job |
| --- | --- | --- |
| director | Claude Code | story, task routing, final acceptance |
| art | Claude Code | `art-bible.md`, SVG characters, motion language |
| build | Codex (`gpt-6.1-sol`) | `index.html`, `js/`, checks, MP4 render |
| review | Codex (`gpt-6.1-sol`) | independent checks, findings in `docs/review/` |

Re-run it for a new story:

```bash
# needs Node.js 22, tmux, and a logged-in Claude Code and/or Codex
npm install -g @openrig/cli
sed -i.bak "s#/opt/homebrew/lib/node_modules#$(npm root -g)#" rig.yaml   # point at your OpenRig install
rig up rig.yaml
rig send studio-director@story-studio "Make a different 60 s story about ..."
```

`rig.yaml` pins model `gpt-6.1-sol` for the Codex seats; change it to a model your account has. `rig up` writes provider trust/hook settings (see OpenRig's docs) and the seats ask permission for shell commands as usual.

## Build checks and the MP4

```bash
npm install --no-save puppeteer-core     # uses your installed Google Chrome; no browser download
node check.mjs                           # 60 s, 6 scenes, captions, seek, controls, no errors, no network
node render-mp4.mjs                      # frame-by-frame render + ffmpeg -> story-animation.mp4
node check-mp4.mjs                       # duration, size, audio, frame match
```

Defaults assume macOS (`/Applications/Google Chrome.app`, `/opt/homebrew/bin/ffmpeg`); override with `CHROME_PATH` and `FFMPEG_PATH`.

## Known gaps

- Nobody has listened to the audio: loudness (−18.6 LUFS) and sync were measured, not heard.
- No spoken narration; captions carry the story.
- Real-time speed was measured only on one Mac in headless Chrome.
- No license has been chosen yet. GSAP (`vendor/`) and the fonts (`assets/fonts/`, SIL OFL) keep their own licenses.

## สรุปภาษาไทย

แอนิเมชันเล่าเรื่องภาษาอังกฤษความยาว 60 วินาที ทำโดยทีมเอเจนต์ 4 ที่นั่ง (ผู้กำกับ/อาร์ตใช้ Claude, วิศวกร/รีวิวเวอร์ใช้ Codex) ผ่าน OpenRig เปิดดูได้ที่ `index.html` หรือไฟล์ `story-animation.mp4` ยังไม่ได้ฟังเสียงจริง วัดได้เฉพาะระดับความดัง

<!-- BBN:FOOTER:START -->
---

<div align="center">

**สร้างโดย [BoomBigNose](https://github.com/Boom-Vitt)** · [Kruoop.com](https://kruoop.com) แหล่งเรียน AI + คอมมูนิตี้ · [Seeneo.ai](https://seeneo.ai) · [YouTube 220K](https://www.youtube.com/@BoomBigNose)

<sub>ถ้าโปรเจกต์นี้มีประโยชน์ กด ⭐ ให้กำลังใจกันได้เลย</sub>

</div>
<!-- BBN:FOOTER:END -->
