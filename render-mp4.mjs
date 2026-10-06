// Run: node render-mp4.mjs
// Optional: node render-mp4.mjs --output /path/story.mp4
// Requires installed puppeteer-core + system Chrome + /opt/homebrew/bin/ffmpeg.
// No browser download or live recording. Exactly 1,800 deterministic frames + offline audio.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { puppeteer, chromePath } from './browser-tools.mjs';

const outputIndex = process.argv.indexOf('--output');
const output = resolve(outputIndex < 0 ? fileURLToPath(new URL('./story-animation.mp4', import.meta.url)) : process.argv[outputIndex + 1]);
const temporary = output.replace(/\.mp4$/, '') + '.rendering.mp4';
await mkdir(dirname(output), { recursive: true });
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
let encoder;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(new URL('./index.html?t=0&render=1', import.meta.url).href);
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => story.timeline.duration()), 60);
  const audio = await page.evaluate(() => storyAudio.renderWav());
  assert.equal(audio.seconds, 60);
  assert(audio.peak > .01 && audio.peak < .95, 'Offline audio must be audible and not clipped');
  const wav = fileURLToPath(new URL('./shots/story-audio.wav', import.meta.url));
  await writeFile(wav, Buffer.from(audio.base64, 'base64'));
  encoder = spawn(process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '30', '-i', 'pipe:0',
    '-i', wav, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', '60', '-movflags', '+faststart', temporary
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let encoderError = '', pipeError;
  encoder.stderr.on('data', chunk => { encoderError += chunk; });
  encoder.stdin.on('error', error => { pipeError = error; });
  const complete = once(encoder, 'close');
  for (let frame = 0; frame < 1800; frame++) {
    await page.evaluate(t => story.seek(t), frame / 30);
    const pixels = await page.screenshot({ type: 'png' });
    if (pipeError) throw pipeError;
    if (!encoder.stdin.write(pixels)) await once(encoder.stdin, 'drain');
    if (frame % 150 === 0) console.log(`Rendered ${frame}/1800 frames (${(frame / 30).toFixed(1)} s)`);
  }
  encoder.stdin.end();
  const [code] = await complete;
  assert.equal(code, 0, encoderError || 'ffmpeg failed');
  assert.deepEqual(errors, []);
  await rename(temporary, output);
  console.log(`DONE: ${output} — 60.0 s, 1920×1080, 30 fps, H.264/yuv420p, faststart, AAC music + SFX.`);
} finally {
  if (encoder?.exitCode === null) encoder.kill('SIGTERM');
  await browser.close();
}
