(() => {
  'use strict';
  const captions = [
    [3, 6.4, 'High above a sleepy meadow, the stars woke up one by one.'],
    [6.5, 9.8, 'The smallest star stretched, and yawned, and wobbled…'],
    [10.2, 14.8, '…and tumbled all the way down — plink! — into the clover, right next to Pip the snail.'],
    [15, 19.8, '“Oh no,” she whispered. “I can\'t shine from down here.”'],
    [20.3, 24.6, 'Pip was small, and Pip was slow, but Pip had a very big heart.'],
    [24.8, 28.8, '“Hop on,” he smiled. “I\'ll take you home.”'],
    [29.3, 33.8, 'Up the tallest hill they went, one tiny step at a time.'],
    [34, 38.8, 'But at the very top, the sky was still so far away.'],
    [39.3, 43.8, 'So Pip called out to his friends, the fireflies.'],
    [44, 48.8, 'Glow by glow, they gathered round and lifted the little star higher… and higher…'],
    [49.2, 53.5, '…all the way home. That night she shone brighter than ever,'],
    [53.7, 58, 'and every night after, she twinkled a little extra — just for Pip.']
  ];
  const scenes = [[0, 10, 'Night Falls'], [10, 20, 'The Fall'], [20, 29, 'A Promise'], [29, 39, 'The Long Climb'], [39, 49, 'Friends Glow'], [49, 60, 'Home']];
  const caption = document.querySelector('#caption');
  const play = document.querySelector('#play');
  const scrub = document.querySelector('#scrub');
  const clock = document.querySelector('#time');
  let renderIdle = () => {};
  let wasPlaying = false;
  const timeline = gsap.timeline({ paused: true, onUpdate: update, onComplete: update });
  renderIdle = buildAnimation(timeline);
  timeline.to({}, { duration: 60 }, 0);
  timeline.to('#opening', { opacity: 0, duration: .7 }, 2.3);
  timeline.to('#ending', { opacity: 1, duration: 1.2 }, 58);
  scenes.forEach(([start, , name]) => timeline.addLabel(name, start));
  function update() {
    const t = timeline.time();
    renderIdle(t);
    const line = captions.find(([start, end]) => t >= start && t < end)?.[2] || '';
    if (caption.textContent !== line) caption.textContent = line;
    const paused = timeline.paused() || t >= 60;
    if (wasPlaying !== !paused) { storyAudio.sync(t, !paused); wasPlaying = !paused; }
    play.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-label', paused ? 'Play story' : 'Pause story');
    scrub.value = t;
    clock.value = `0:${String(Math.floor(t)).padStart(2, '0')} / 1:00`;
    if (t >= 60) clock.value = '1:00 / 1:00';
  }
  function seek(t) { timeline.pause().time(Math.max(0, Math.min(60, Number(t) || 0)), false); update(); }
  function toggle() {
    if (timeline.time() >= 60) timeline.restart();
    else if (timeline.paused()) timeline.play();
    else timeline.pause();
    update();
  }
  play.addEventListener('click', toggle);
  function restart() { timeline.restart(); storyAudio.sync(0, true); update(); }
  document.querySelector('#restart').addEventListener('click', restart);
  scrub.addEventListener('input', () => seek(scrub.value));
  document.addEventListener('keydown', event => {
    if (event.target.closest('button, input, textarea, select, a, [contenteditable]')) return;
    if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) toggle(); }
    if (event.code === 'KeyR') restart();
  });
  const sound = document.querySelector('#sound');
  if (!window.AudioContext && !window.webkitAudioContext) sound.hidden = true;
  sound.addEventListener('click', async () => {
    try {
      const on = await storyAudio.toggle(timeline.time(), !timeline.paused() && timeline.time() < 60);
      sound.textContent = on ? 'Sound on' : 'Sound off';
      sound.setAttribute('aria-pressed', String(on));
      sound.setAttribute('aria-label', on ? 'Turn story sound off' : 'Turn story sound on');
    } catch { sound.textContent = 'Audio unavailable'; sound.disabled = true; }
  });
  const params = new URLSearchParams(location.search);
  if (params.has('render')) document.documentElement.classList.add('render');
  window.story = { timeline, captions, scenes, seek };
  if (params.has('t')) seek(params.get('t'));
  else { timeline.play(0); update(); }
})();
