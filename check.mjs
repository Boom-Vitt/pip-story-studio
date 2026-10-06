// Run: node check.mjs
// Uses installed puppeteer-core (local, PUPPETEER_CORE_PATH, or npm cache) + system Chrome.
// Catches broken timing, caption synchronization, controls, seeking, runtime errors, and network leakage.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { puppeteer, chromePath } from './browser-tools.mjs';

const url = new URL('./index.html', import.meta.url);
assert(existsSync(fileURLToPath(url)), 'The story page index.html must exist');
mkdirSync(new URL('./shots/', import.meta.url), { recursive: true });
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const errors = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!/^(file:|data:|blob:)/.test(request.url())) remote.push(request.url()); });
  await page.goto(url.href + '?t=5');
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(errors, [], 'Page startup must have no errors');
  assert(await page.evaluate(() => Boolean(window.story?.timeline)), JSON.stringify(await page.evaluate(() => ({ url: location.href, gsap: typeof gsap, story: typeof window.story, scripts: [...document.scripts].map(s => s.src), title: document.title }))));
  assert(await page.$('#sound'), 'A user-gesture sound toggle is available');
  const initial = await page.evaluate(() => ({ duration: story.timeline.duration(), time: story.timeline.time(), paused: story.timeline.paused(), scenes: story.scenes.length }));
  assert.equal(initial.duration, 60);
  assert.equal(initial.time, 5);
  assert.equal(initial.paused, true);
  assert.equal(initial.scenes, 6);
  const regressions = [];
  for (const time of [39.6, 40, 40.5, 40.75]) {
    await page.evaluate(t => story.seek(t), time);
    const [x, y] = await page.$eval('#call-rings', node => { const m = node.transform.baseVal.consolidate().matrix; return [m.e, m.f]; });
    if (x < 1370 || x > 1410 || y !== 1280) regressions.push(`Call rings stay beside Pip at ${time}s, got ${x},${y}`);
  }
  await page.evaluate(() => story.seek(40));
  await page.focus('#restart');
  await page.keyboard.press('Space');
  if (!await page.evaluate(() => story.timeline.time() < .25 && !story.timeline.paused())) regressions.push('Space on focused Restart begins the story at zero');
  await page.evaluate(() => story.seek(20));
  await page.focus('#sound');
  await page.keyboard.press('Space');
  await new Promise(resolve => setTimeout(resolve, 120));
  if (!await page.evaluate(() => storyAudio.enabled && story.timeline.paused() && story.timeline.time() === 20)) regressions.push('Space on focused Sound toggles audio while preserving paused time');
  if (await page.evaluate(() => storyAudio.enabled)) {
    await page.click('#sound');
    await page.waitForSelector('#sound[aria-pressed="false"]');
  }
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 844 });
    const layout = await page.evaluate(() => {
      const box = document.querySelector('#stage').getBoundingClientRect();
      return { ratio: box.width / box.height, overflow: document.documentElement.scrollWidth > innerWidth, buttons: [...document.querySelectorAll('button')].every(node => { const r = node.getBoundingClientRect(); return r.height >= 44 && r.x >= 0 && r.right <= innerWidth; }) };
    });
    if (Math.abs(layout.ratio - 16 / 9) > .01 || layout.overflow || !layout.buttons) regressions.push(`${width}px layout fits the viewport with 44px button targets`);
    await page.screenshot({ path: `shots/controls-${width}.png` });
  }
  assert.deepEqual(regressions, [], 'Review regressions');
  await page.setViewport({ width: 1280, height: 800 });
  for (const time of [14, 21.5, 26]) {
    await page.evaluate(t => story.seek(t), time);
    const clear = await page.evaluate(() => document.querySelector('#mp-head').getBoundingClientRect().bottom < document.querySelector('#caption').getBoundingClientRect().top);
    assert(clear, `Pip's face is above the caption band at ${time}s`);
  }
  await page.evaluate(() => story.seek(28.5));
  const rider = await page.$eval('#m-star-pos', node => { const m = node.transform.baseVal.consolidate().matrix; return [m.e, m.f]; });
  assert(Math.abs(rider[0] - 742) < 1 && Math.abs(rider[1] - 844) < 1, 'The star rests on the shell before the hill scene');
  const samples = [
    [5, 'High above a sleepy meadow, the stars woke up one by one.'],
    [20.5, 'Pip was small, and Pip was slow, but Pip had a very big heart.'],
    [40, 'So Pip called out to his friends, the fireflies.'],
    [57, 'and every night after, she twinkled a little extra — just for Pip.']
  ];
  for (const [time, text] of samples) {
    await page.evaluate(t => story.seek(t), time);
    assert.equal(await page.$eval('#caption', node => node.textContent), text);
  }
  await page.evaluate(() => story.seek(20));
  const meadow = await page.evaluate(() => {
    const svg = document.querySelector('#picture');
    const origin = id => { const m = svg.getCTM().inverse().multiply(document.querySelector(id).getCTM()); return [m.e, m.f]; };
    return { pip: origin('#mp'), star: origin('#ms') };
  });
  assert(Math.abs(meadow.pip[0] - 760) < 1 && Math.abs(meadow.pip[1] - 975) < 1, `Pip stays at the meadow ground origin, got ${meadow.pip}`);
  for (const time of [5, 20, 40, 58]) {
    await page.evaluate(t => story.seek(t), time);
    await page.screenshot({ path: fileURLToPath(new URL(`./shots/t-${time}.png`, import.meta.url)) });
  }
  await page.evaluate(() => story.seek(40));
  const ground = await page.$eval('#h-pip-pos', node => { const m = node.transform.baseVal.consolidate().matrix; return [m.e, m.f]; });
  assert(Math.abs(ground[0] - 1250) < 1 && Math.abs(ground[1] - 1412) < 1, `Pip must stand on the summit, got ${ground}`);
  await page.evaluate(() => story.seek(20.5));
  const stage = await page.$('#stage');
  const frameBefore = await stage.screenshot({ path: 'shots/reseek-before.png' });
  await page.evaluate(() => { story.seek(58); story.seek(0); story.seek(20.5); });
  assert(Buffer.from(await stage.screenshot({ path: 'shots/reseek-after.png' })).equals(Buffer.from(frameBefore)), 'Seeking backwards and forwards reproduces the same pixels');
  await page.evaluate(() => story.seek(20));
  await page.click('#sound');
  await page.waitForSelector('#sound[aria-pressed="true"]');
  assert.equal(await page.evaluate(() => storyAudio.scheduled), 0, 'Sound remains paused with the story');
  await page.click('#play');
  await new Promise(resolve => setTimeout(resolve, 180));
  assert(await page.evaluate(() => story.timeline.time() > 20.05), 'Play advances the story');
  assert(await page.evaluate(() => storyAudio.scheduled > 0), 'Play schedules the music and cues');
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Space');
  const pausedAt = await page.evaluate(() => story.timeline.time());
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.equal(await page.evaluate(() => story.timeline.time()), pausedAt, 'Space pauses playback');
  assert.equal(await page.evaluate(() => storyAudio.scheduled), 0, 'Pause stops scheduled sound');
  await page.click('#restart');
  assert(await page.evaluate(() => story.timeline.time() < 0.15 && !story.timeline.paused()), 'Restart begins playback');
  await page.evaluate(() => story.seek(60));
  await page.click('#sound');
  await page.waitForSelector('#sound[aria-pressed="false"]');
  assert.equal(await page.$eval('#play', node => node.textContent), 'Play');
  assert.deepEqual(errors, []);
  assert.deepEqual(remote, []);
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url.href + '?t=0&render=1');
  await page.evaluate(() => document.fonts.ready);
  const audio = await page.evaluate(() => storyAudio.renderWav());
  assert.equal(audio.seconds, 60);
  assert(audio.peak > .01 && audio.peak < .95, 'Offline sound is audible and not clipped');
  const wav = Buffer.from(audio.base64, 'base64');
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 44100);
  assert.equal(wav.length, 44 + 60 * 44100 * 2);
  writeFileSync('shots/check-audio.wav', wav);
  const loudness = spawnSync('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-i', 'shots/check-audio.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  assert.equal(loudness.status, 0, loudness.stderr);
  const summary = loudness.stderr.slice(loudness.stderr.lastIndexOf('Summary:'));
  const integratedLufs = Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const truePeakDb = Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
  assert(integratedLufs >= -20 && integratedLufs <= -16, `Shared audio bus loudness is -20 to -16 LUFS, got ${integratedLufs}`);
  assert(truePeakDb <= -1.5, `Shared audio bus has 1.5 dB true-peak headroom, got ${truePeakDb}`);
  const renderBox = await page.$eval('#stage', node => { const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  assert.deepEqual(renderBox, [0, 0, 1920, 1080]);
  assert.equal(await page.$eval('.controls', node => getComputedStyle(node).display), 'none');
  for (const time of [5, 20, 40, 58, 59]) {
    await page.evaluate(t => story.seek(t), time);
    await page.screenshot({ path: fileURLToPath(new URL(`./shots/render-${time}.png`, import.meta.url)) });
  }
  assert(await page.$eval('#ending', node => Number(getComputedStyle(node).opacity)) > .9);
  await page.goto(new URL('./assets/preview.html#boards', import.meta.url).href);
  await page.evaluate(() => document.fonts.ready);
  await (await page.$('.board .stage')).screenshot({ path: fileURLToPath(new URL('./shots/art-reference.png', import.meta.url)) });
  assert.deepEqual(errors, []);
  assert.deepEqual(remote, []);
  console.log(`PASS: 60.0 s, six scenes, exact captions, file:// seek, native button Space + global Space, 320/390px controls, responsive 16:9, caption-safe faces, shell hop, grounding/call rings, identical repeated-seek pixels, live audio pause/play, shared 60s WAV ${integratedLufs} LUFS/${truePeakDb} dBTP, 1920×1080 render framing, visible ending, zero errors/remote requests. Screenshots in shots/.`);
} finally { await browser.close(); }
