// Run after rendering: node check-mp4.mjs
// Checks the delivered MP4 itself and compares decoded frames with check.mjs's page captures.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const movie = root + 'story-animation.mp4';
const run = (tool, args) => execFileSync('/opt/homebrew/bin/' + tool, args, { encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
const info = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', movie]));
const video = info.streams.find(stream => stream.codec_type === 'video');
const audio = info.streams.find(stream => stream.codec_type === 'audio');
assert.equal(video.codec_name, 'h264');
assert.equal(video.pix_fmt, 'yuv420p');
assert.equal(video.width, 1920); assert.equal(video.height, 1080);
assert.equal(video.avg_frame_rate, '30/1'); assert.equal(Number(video.nb_frames), 1800);
assert(Math.abs(Number(info.format.duration) - 60) < .05);
assert.equal(audio.codec_name, 'aac');
const sound = spawnSync('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-i', movie, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
assert.equal(sound.status, 0, sound.stderr);
const peakDb = Number(sound.stderr.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
assert(peakDb > -50 && peakDb < 0, `Encoded AAC must be audible without clipping, peak=${peakDb}dB`);
const loudness = spawnSync('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-i', movie, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
assert.equal(loudness.status, 0, loudness.stderr);
const summary = loudness.stderr.slice(loudness.stderr.lastIndexOf('Summary:'));
const integratedLufs = Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
const truePeakDb = Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
assert(integratedLufs >= -20 && integratedLufs <= -16, `Integrated loudness must be -20 to -16 LUFS, got ${integratedLufs}`);
assert(truePeakDb <= -1.5, `True peak must leave 1.5 dB headroom, got ${truePeakDb}`);
const bytes = readFileSync(movie), atoms = [];
for (let offset = 0; offset + 8 <= bytes.length;) {
  let size = bytes.readUInt32BE(offset);
  const type = bytes.toString('ascii', offset + 4, offset + 8);
  if (size === 1) size = Number(bytes.readBigUInt64BE(offset + 8));
  if (size === 0) size = bytes.length - offset;
  assert(size >= 8 && offset + size <= bytes.length, 'MP4 atoms are well formed');
  atoms.push(type); offset += size;
}
assert(atoms.indexOf('moov') >= 0 && atoms.indexOf('mdat') > atoms.indexOf('moov'), 'faststart puts moov before mdat');
const frames = [];
for (const time of [5, 20, 40, 58]) {
  const frame = `shots/mp4-${time}.png`;
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(time), '-i', movie, '-frames:v', '1', '-update', '1', frame]);
  // ffmpeg reports SSIM to stderr even on success.
  // Compare luminance explicitly: yuv420p chroma subsampling is expected to alter RGB edges.
  const result = spawnSync('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-i', `shots/render-${time}.png`, '-i', frame, '-lavfi', '[0:v]format=gray[a];[1:v]format=gray[b];[a][b]ssim', '-f', 'null', '-'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const similarity = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
  assert(similarity > .99, `MP4 frame ${time}s must match its page capture (SSIM=${similarity})`);
  frames.push({ time, path: frame, lumaSimilarity: similarity });
}
writeFileSync(root + 'shots/mp4-report.json', JSON.stringify({ duration: info.format.duration, video: { codec: video.codec_name, pixelFormat: video.pix_fmt, width: video.width, height: video.height, frameRate: video.avg_frame_rate, frames: video.nb_frames }, audio: { codec: audio.codec_name, peakDb, integratedLufs, truePeakDb }, atoms, frames }, null, 2) + '\n');
console.log(`PASS: delivered MP4 = 60.0s, 1920×1080, 30fps/1800 frames, H.264 yuv420p + AAC, faststart; ${integratedLufs} LUFS, ${truePeakDb} dBTP. Decoded samples: shots/mp4-{5,20,40,58}.png`);
