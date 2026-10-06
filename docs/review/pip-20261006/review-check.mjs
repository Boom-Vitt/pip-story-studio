// Independent review of the delivered page; does not edit product files.
// Run from project root: node docs/review/pip-20261006/review-check.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { puppeteer, chromePath } from '../../../browser-tools.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = fileURLToPath(new URL('./', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!path.startsWith(root)) { res.writeHead(403).end(); return; }
  if (path.endsWith('/favicon.ico')) { res.writeHead(204).end(); return; }
  try { const bytes = await readFile(path); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(bytes); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const report = { origin, errors: [], remote: [], captions: [], layouts: [], keyboard: {}, playback: {} };
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
try {
  const page = await browser.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('request', req => { if (!req.url().startsWith(origin) && !/^(file:|data:|blob:)/.test(req.url())) report.remote.push(req.url()); });
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(origin + '/index.html?t=0');
  await page.evaluate(() => document.fonts.ready);
  if (process.argv.includes('--ring-check')) {
    const frames = [];
    for (const t of [39.6, 39.75, 40, 40.5, 40.75]) {
      await page.evaluate(t => story.seek(t), t);
      frames.push(await page.$eval('#call-rings', (el, t) => { const m = el.transform.baseVal.consolidate().matrix; return { t, x: m.e, y: m.f, opacity: getComputedStyle(el).opacity }; }, t));
      await page.screenshot({ path: out + `call-${t}.png` });
    }
    await writeFile(out + 'call-report.json', JSON.stringify(frames, null, 2) + '\n');
    console.log(JSON.stringify(frames, null, 2));
  } else {
  const spec = await readFile(root + 'story.md', 'utf8');
  const expected = [...spec.matchAll(/(\d+\.\d+)–(\d+\.\d+) "([^"]+)"/g)].filter(m => m[3] !== 'The End').map(m => [Number(m[1]), Number(m[2]), m[3]]);
  assert.equal(expected.length, 12, 'Extract all 12 caption intervals from the story spec');
  for (const [start, end, text] of expected) {
    for (const t of [start - .001, start, (start + end) / 2, end - .001, end]) {
      await page.evaluate(t => story.seek(t), t);
      const actual = await page.$eval('#caption', el => el.textContent);
      const wanted = expected.find(([a, b]) => t >= a && t < b)?.[2] || '';
      assert.equal(actual, wanted, `Spec caption at ${t}`);
    }
    report.captions.push({ start, end, text });
  }
  for (const t of [0, 8, 12.5, 16, 23, 27.5, 29.4, 32, 37.5, 42, 45.5, 49.7, 51, 55.5, 59, 60]) {
    await page.evaluate(t => story.seek(t), t);
    await page.screenshot({ path: out + `page-${t}.png` });
  }
  for (const width of [1280, 600, 390, 320]) {
    await page.setViewport({ width, height: 844 });
    await page.evaluate(() => story.seek(12.5));
    const layout = await page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
      return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, stage: rect(document.querySelector('#stage')), caption: rect(document.querySelector('#caption')), fontSize: getComputedStyle(document.querySelector('#caption')).fontSize, controls: [...document.querySelectorAll('.controls > *')].map(el => ({ id: el.id, ...rect(el) })) };
    });
    report.layouts.push(layout);
    await page.screenshot({ path: out + `mobile-${width}.png` });
  }
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluate(() => story.seek(40));
  await page.focus('#restart');
  await page.keyboard.press('Space');
  report.keyboard.restartSpace = await page.evaluate(() => ({ time: story.timeline.time(), paused: story.timeline.paused() }));
  assert(report.keyboard.restartSpace.time < .25 && !report.keyboard.restartSpace.paused, 'Space on Restart begins playback from zero');
  await page.evaluate(() => story.seek(20));
  await page.focus('#sound');
  await page.keyboard.press('Space');
  await page.waitForSelector('#sound[aria-pressed="true"]');
  report.keyboard.soundSpace = await page.evaluate(() => ({ enabled: storyAudio.enabled, time: story.timeline.time(), paused: story.timeline.paused() }));
  assert.deepEqual(report.keyboard.soundSpace, { enabled: true, time: 20, paused: true }, 'Space on Sound enables audio without changing paused playback');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#sound[aria-pressed="false"]');
  report.keyboard.soundEnterOff = await page.evaluate(() => storyAudio.enabled);
  assert.equal(report.keyboard.soundEnterOff, false, 'Enter turns sound off');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#sound[aria-pressed="true"]');
  report.keyboard.soundEnter = await page.evaluate(() => storyAudio.enabled);
  assert.equal(report.keyboard.soundEnter, true, 'Enter turns sound back on for audio checks');
  await page.evaluate(() => story.seek(45));
  assert.equal(await page.evaluate(() => storyAudio.scheduled), 0, 'Seeking stops sound');
  await page.focus('#play');
  await page.keyboard.press('Enter');
  assert(await page.evaluate(() => storyAudio.scheduled > 0), 'Resuming schedules audio');
  await page.click('#restart');
  assert(await page.evaluate(() => story.timeline.time() < .25 && storyAudio.scheduled > 0), 'Restart starts score and story');
  await page.click('#sound');
  await page.waitForSelector('#sound[aria-pressed="false"]');
  await page.goto(origin + '/index.html');
  await page.evaluate(() => {
    window.reviewFrames = []; window.reviewLines = []; let previous = performance.now(); let line = '';
    function sample(now) {
      reviewFrames.push(now - previous); previous = now;
      const current = document.querySelector('#caption').textContent;
      if (current !== line) { line = current; reviewLines.push({ t: story.timeline.time(), line }); }
      if (story.timeline.time() < 60) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  console.log('Review: full realtime web playback started.');
  await page.waitForFunction(() => story.timeline.time() === 60, { timeout: 70000 });
  report.playback.page = await page.evaluate(() => {
    const dt = reviewFrames.slice(1).sort((a, b) => a - b);
    return { duration: story.timeline.duration(), time: story.timeline.time(), button: document.querySelector('#play').textContent, samples: dt.length, averageFps: 1000 / (dt.reduce((a, b) => a + b, 0) / dt.length), p95FrameMs: dt[Math.floor(dt.length * .95)], framesOver33ms: dt.filter(t => t > 33).length, lines: reviewLines };
  });
  assert.equal(report.playback.page.lines.filter(x => x.line).length, 12);
  console.log('Review: realtime web ended; full encoded MP4 playback started.');
  await page.goto(origin + '/index.html?t=0');
  await page.evaluate(async origin => {
    document.querySelector('main').innerHTML = '<video id="movie" controls style="width:100%"></video>';
    const video = document.querySelector('#movie'); video.src = origin + '/story-animation.mp4'; video.muted = true;
    await video.play();
  }, origin);
  await page.waitForFunction(() => document.querySelector('#movie').ended, { timeout: 70000 });
  report.playback.movie = await page.$eval('#movie', v => ({ duration: v.duration, currentTime: v.currentTime, error: v.error, ended: v.ended, quality: v.getVideoPlaybackQuality().toJSON?.() || { total: v.getVideoPlaybackQuality().totalVideoFrames, dropped: v.getVideoPlaybackQuality().droppedVideoFrames } }));
  assert.equal(report.playback.movie.duration, 60);
  assert.equal(report.playback.movie.error, null);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.remote, []);
  await writeFile(out + 'browser-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ layouts: report.layouts.map(x => ({ width: x.viewport, scrollWidth: x.scrollWidth, fontSize: x.fontSize })), keyboard: report.keyboard, playback: report.playback, errors: report.errors, remote: report.remote }, null, 2));
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
