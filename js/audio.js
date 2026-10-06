/* One offline, synthesized score, shared by live playback and OfflineAudioContext export. */
(() => {
  'use strict';
  const notes = [];
  const add = (time, frequency, duration = .9, gain = .045, endFrequency) => notes.push({ time, frequency, duration, gain, endFrequency });
  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392, 0];
  for (let beat = 0; beat < 78; beat++) {
    const t = .45 + beat * .75, f = melody[beat % melody.length];
    if (f) add(t, f, 1.25, .042);
    if (beat % 4 === 0) add(t, [130.81, 146.83, 174.61, 130.81][Math.floor(beat / 4) % 4], 2.2, .025);
  }
  [1.2, 1.9, 2.6, 3.3, 4.2].forEach((t, i) => add(t, 1046.5 + i * 130.8, .6, .035));
  add(10, 1000, 1.8, .025, 220); // falling whistle
  add(12, 1567.98, 1.1, .1); add(12.03, 1046.5, .7, .055); // plink
  [523.25, 659.25, 783.99].forEach((f, i) => add(22.6 + i * .12, f, 1.4, .065));
  for (let i = 0; i < 8; i++) add(29.3 + i * .8, 220 + (i % 2) * 41.63, .2, .026);
  for (let i = 0; i < 16; i++) add(44 + i * .3, [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98][i % 6], .8, .045);
  [523.25, 659.25, 783.99, 1046.5].forEach(f => add(49.6, f, 2.2, .055));
  add(55.2, 1318.51, 1.5, .055); add(55.38, 1567.98, 1.5, .04);
  notes.sort((a, b) => a.time - b.time);
  function voice(context, note, when, output) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, when);
    if (note.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, when + note.duration);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(note.gain, when + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + note.duration);
    oscillator.connect(envelope).connect(output);
    oscillator.start(when); oscillator.stop(when + note.duration + .03);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    return oscillator;
  }
  function masterBus(context) {
    const gain = context.createGain(), compressor = context.createDynamicsCompressor(), level = context.createGain();
    gain.gain.value = 8;
    compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 6;
    compressor.attack.value = .002; compressor.release.value = .15;
    level.gain.value = .7;
    gain.connect(compressor).connect(level).connect(context.destination);
    return gain;
  }
  let context, output, enabled = false, sources = [];
  function stop() { sources.forEach(source => { try { source.stop(); } catch {} }); sources = []; }
  function sync(time, playing) {
    stop();
    if (!enabled || !context || !playing) return;
    sources = notes.filter(note => note.time >= time).map(note => voice(context, note, context.currentTime + .03 + note.time - time, output));
  }
  async function toggle(time, playing) {
    if (!context) { context = new (window.AudioContext || window.webkitAudioContext)(); output = masterBus(context); }
    await context.resume();
    enabled = !enabled; sync(time, playing);
    return enabled;
  }
  async function renderWav() {
    const offline = new OfflineAudioContext(1, 60 * 44100, 44100);
    const bus = masterBus(offline);
    notes.forEach(note => voice(offline, note, note.time, bus));
    const samples = (await offline.startRendering()).getChannelData(0);
    const bytes = new Uint8Array(44 + samples.length * 2), view = new DataView(bytes.buffer);
    const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
    text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true); view.setUint32(28, 88200, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, samples.length * 2, true);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      peak = Math.max(peak, Math.abs(samples[i]));
      view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return { base64: btoa(binary), peak, seconds: samples.length / 44100 };
  }
  window.storyAudio = { toggle, sync, renderWav, get enabled() { return enabled; }, get scheduled() { return sources.length; } };
})();
