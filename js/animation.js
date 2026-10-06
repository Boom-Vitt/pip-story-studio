/* All visible motion is added to the ONE story timeline, including idle motion. */
window.buildAnimation = function (tl) {
  const A = ART, C = A.C;
  const place = (id, x, y, scale, inner) => `<g transform="translate(${x},${y})"><g id="${id}" class="pv" transform="scale(${scale})">${inner}</g></g>`;
  const flies = Array.from({ length: 10 }, (_, i) => place(`fly${i}`, 0, 0, 1.25, A.firefly(`ff${i}`))).join('');
  const sparkles = Array.from({ length: 7 }, (_, i) => place(`spark${i}`, 1010, 920, 1, '<use href="#sym-sparkle"/>')).join('');
  document.querySelector('svg.defs').innerHTML = A.defs();
  document.querySelector('#picture').innerHTML = `<g id="meadow-world">${A.setMeadow()}${place('m-pip-pos', 760, 975, .5, A.pip('mp'))}${place('m-star-pos', 0, 0, .4, A.star('ms'))}<g id="fall-trail"></g>${sparkles}</g>`;
  document.querySelector('#hill-picture').innerHTML = `<g id="hill-world">${A.setHill()}${place('h-pip-pos', 0, 0, .6, A.pip('hp'))}${place('h-star-pos', 0, 0, .45, A.star('hs'))}${flies}${place('home-bloom', 1250, 520, 1, '<circle r="280" fill="url(#g-bloom)"/>')}${place('heart-spark', 1320, 580, 1.6, '<use href="#sym-heart"/>')}<g id="call-rings" transform="translate(1370,1280)">${[0, 1, 2].map(i => `<use href="#sym-ring" transform="translate(${i * 25},0) scale(${1 + i * .5})" opacity="${1 - i * .25}"/>`).join('')}</g></g>`;
  document.querySelector('#hp-rider').innerHTML = '<g transform="translate(0,-52) scale(.75)">' + A.star('rider') + '</g>';
  gsap.set('.pv', { svgOrigin: '0 0', smoothOrigin: false });
  gsap.set('#m-pip-pos', { x: 0, y: 0 });
  gsap.set('#m-star-pos', { x: 1380, y: 230 });
  gsap.set('#h-pip-pos', { x: 260, y: 1830 });
  gsap.set('#h-star-pos', { x: 1228.4, y: 1254.8, opacity: 0 });
  gsap.set('#home-bloom, #heart-spark, #call-rings, [id^="spark"], [id^="fly"]', { opacity: 0 });
  gsap.set('#mp-body', { scale: .12 });
  gsap.set('#mp-shell', { y: 30 });
  gsap.set('#m-home-ghost', { opacity: 0 });
  const camera = (box, t, duration = 0) => tl.to(t >= 29 ? '#hill-picture' : '#picture', { attr: { viewBox: box }, duration, ease: 'power2.inOut' }, t);
  const expr = (who, prefix, name, t) => A.applyExpr(tl, who, prefix, name, t);
  const bob = (target, start, duration, count, props) => tl.to(target, { ...props, duration, repeat: count, yoyo: true, ease: 'sine.inOut' }, start);

  // Night wakes gently; the camera finds our little star.
  tl.to('#m-sky-dusk', { opacity: 0, duration: 5 }, 0);
  [['m-hill-far', C.hillFar, C.rimFar], ['m-hill-mid', C.hillMid, C.rimMid], ['m-meadow', C.meadow, C.rimMeadow]].forEach(([id, fill, rim]) => {
    tl.to(`#${id}`, { attr: { fill }, duration: 5 }, 0);
    tl.to(`#${id}-rim`, { attr: { stroke: rim }, duration: 5 }, 0);
  });
  document.querySelectorAll('#m-stars .bgstar').forEach((star, i) => {
    gsap.set(star, { scale: 0, opacity: 0 });
    tl.to(star, { scale: 1, opacity: .8, duration: .65, ease: 'back.out(2)' }, .6 + i * .045);
  });
  for (let i = 1; i <= 4; i++) {
    tl.fromTo(`#m-home-fam${i}`, { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, 2.8 + i * .4);
    expr('star', `m-home-fam${i}`, 'sleepy', 0);
    expr('star', `m-home-fam${i}`, 'happy', 3.4 + i * .4);
    expr('star', `h-home-fam${i}`, 'joy', 50.5 + i * .12);
  }
  tl.fromTo('#ms', { scale: 0 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, 5);
  expr('star', 'ms', 'sleepy', 0);
  camera(A.CAMERA.S1_star, 5.9, 2.1);
  expr('star', 'ms', 'yawn', 7.7);
  bob('#ms-squash', 7.7, .5, 1, { scaleY: 1.2, scaleX: .9 });
  tl.to('#ms-wobble', { rotation: 15, duration: .3 }, 8.6).to('#ms-wobble', { rotation: -18, duration: .6 }, 8.9).to('#ms-wobble', { rotation: 24, duration: .4 }, 9.5);

  // Fall follows the art kit's looping path, sampled once during setup.
  camera(A.CAMERA.S2_fall, 10, 1.2);
  expr('star', 'ms', 'surprised', 10);
  const fall = document.querySelector('#m-fall'), fallLength = fall.getTotalLength();
  for (let i = 1; i <= 32; i++) {
    const point = fall.getPointAtLength(fallLength * i / 32);
    tl.to('#m-star-pos', { x: point.x, y: point.y - 10, rotation: 360 * i / 32, duration: 2 / 32, ease: 'none' }, 10 + (i - 1) * 2 / 32);
  }
  const trail = document.querySelector('#fall-trail');
  for (let i = 0; i < 15; i++) {
    const p = fall.getPointAtLength(fallLength * i / 15);
    trail.insertAdjacentHTML('beforeend', place(`trail${i}`, p.x, p.y, .45, '<use href="#sym-sparkle"/>'));
    gsap.set(`#trail${i}`, { opacity: 0, svgOrigin: '0 0', smoothOrigin: false });
    tl.to(`#trail${i}`, { opacity: .9, duration: .1 }, 10 + i * 2 / 15).to(`#trail${i}`, { opacity: 0, scale: .1, duration: .55 }, 10.1 + i * 2 / 15);
  }
  camera(A.CAMERA.S2_land, 11.5, 1);
  tl.to('#m-star-pos', { y: 912, rotation: 348, duration: .32, ease: 'power2.out' }, 12).to('#m-star-pos', { y: 942, rotation: 360, duration: .42, ease: 'bounce.out' }, 12.32);
  tl.to('#ms-wobble', { rotation: 0, duration: .5 }, 12.3);
  tl.to('#mp-body', { scale: 1, duration: .5, ease: 'back.out(2)' }, 12.1).to('#mp-shell', { y: 0, duration: .5 }, 12.1);
  expr('pip', 'mp', 'startled', 12.15);
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    tl.to(`#spark${i}`, { opacity: 1, duration: .12 }, 12).to(`#spark${i}`, { x: Math.cos(angle) * 95, y: Math.sin(angle) * 80 - 35, scale: .1, opacity: 0, duration: .8, ease: 'power2.out' }, 12.12);
  }
  expr('pip', 'mp', 'normal', 14);
  expr('star', 'ms', 'sad', 15);
  tl.to('#ms-tear', { y: 23, opacity: 0, duration: 1.4 }, 17);
  tl.to('#m-home-ghost', { opacity: .35, duration: .8 }, 13);

  // A tiny promise, a big heart, and a soft hop onto Pip's shell.
  camera(A.CAMERA.S3_two, 20, 1.2);
  expr('pip', 'mp', 'smile', 22);
  tl.to('#mp-heart', { autoAlpha: .9, duration: .5 }, 22.5);
  bob('#mp-heart', 23, .45, 3, { scale: 1.2, opacity: .5 });
  tl.to('#mp-heart', { autoAlpha: 0, duration: .6 }, 25.2);
  expr('star', 'ms', 'happy', 25);
  tl.to('#m-star-pos', { x: 850, y: 730, rotation: 340, duration: .5, ease: 'power2.out' }, 26).to('#m-star-pos', { x: 742, y: 844, rotation: 360, duration: .7, ease: 'bounce.out' }, 26.5);
  bob('#ms-wobble', 26.7, .6, 3, { y: -5, rotation: 3 });

  // Hill set: Pip follows the actual crest so the climb stays grounded.
  tl.to('#picture', { autoAlpha: 0, duration: .8 }, 29).to('#hill-picture', { autoAlpha: 1, duration: .8 }, 29);
  camera(A.CAMERA.S4_climbA, 29);
  camera(A.CAMERA.S4_summit, 29.5, 5);
  const crest = document.querySelector('#h-crest'), crestLength = crest.getTotalLength();
  const onCrest = x => {
    let lo = 0, hi = crestLength;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (crest.getPointAtLength(m).x < x) lo = m; else hi = m; }
    const p = crest.getPointAtLength(lo), q = crest.getPointAtLength(lo + 3);
    return { x: p.x, y: p.y, rotation: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI * .75 };
  };
  gsap.set('#h-pip-pos', onCrest(260));
  for (let i = 1; i <= 28; i++) tl.to('#h-pip-pos', { ...onCrest(260 + 990 * i / 28), duration: 5.6 / 28, ease: 'none' }, 29 + (i - 1) * 5.6 / 28);
  bob('#hp-squash', 29, .35, 15, { scaleX: 1.04, scaleY: .94 });
  bob('#rider-wobble', 29, .35, 15, { y: -8, rotation: 4 });
  tl.to('#h-par-far', { x: -35, duration: 5.6, ease: 'none' }, 29).to('#h-par-mid', { x: -65, duration: 5.6, ease: 'none' }, 29);
  expr('pip', 'hp', 'lookUp', 34.7);
  expr('pip', 'hp', 'droopy', 36);
  expr('star', 'rider', 'sad', 36);
  camera(A.CAMERA.S4_far, 36.2, 1.6);
  tl.to('#h-deep', { opacity: .2, duration: 1 }, 35.5);

  // Friends arrive one by one; ten lights form a soft ascending spiral.
  expr('pip', 'hp', 'calling', 39.3);
  camera(A.CAMERA.S4_summit, 39, 1);
  tl.to('#call-rings', { opacity: .75, duration: .25 }, 39.5).to('#call-rings', { opacity: 0, x: 1410, duration: 1 }, 39.75);
  expr('pip', 'hp', 'lookUp', 41.3);
  expr('star', 'rider', 'happy', 42);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, x = 1232 + Math.cos(a) * 115, y = 1268 + Math.sin(a) * 85;
    gsap.set(`#fly${i}`, { x: 760 + i * 100, y: 1540 + (i % 3) * 30 });
    tl.to(`#fly${i}`, { x, y, opacity: 1, duration: 1.7, ease: 'power2.out' }, 39.7 + i * .25);
    for (let k = 1; k <= 32; k++) {
      const f = k / 32, angle = a + f * Math.PI * 2;
      tl.to(`#fly${i}`, { x: 1232 + Math.cos(angle) * 115, y: 1272 - f * 700 + Math.sin(angle) * 80, duration: 4.8 / 32, ease: 'none' }, 44 + (k - 1) * 4.8 / 32);
    }
    tl.to(`#fly${i}`, { x: 920 + i * 65, y: 1480 + (i % 3) * 60, opacity: 0, duration: 3.5, ease: 'sine.inOut' }, 50.5 + i * .1);
  }
  tl.set('#rider', { opacity: 0 }, 44).set('#h-star-pos', { opacity: 1 }, 44);
  expr('star', 'hs', 'happy', 44);
  tl.to('#h-star-pos', { x: 1250, y: 570, duration: 4.8, ease: 'sine.inOut' }, 44);
  camera(A.CAMERA.S5_tilt, 44, 4.7);
  bob('#hp-stalkR', 44, .32, 5, { rotation: -22 });

  // Home blooms warm. One extra heart-shaped twinkle, just for Pip.
  camera(A.CAMERA.S6_home, 49, .9);
  tl.to('#h-star-pos', { y: 520, duration: .65, ease: 'back.out(2)' }, 49);
  tl.to('#h-home-ghost', { opacity: 0, duration: .3 }, 49.3);
  expr('star', 'hs', 'joy', 49.4);
  tl.to('#home-bloom', { opacity: 1, scale: 1.3, duration: .5 }, 49.3).to('#home-bloom', { opacity: .15, scale: 2, duration: 1.5 }, 49.8);
  tl.to('#h-warm', { opacity: .8, duration: 1.8 }, 49.3).to('#h-deep', { opacity: 0, duration: 1 }, 49.3);
  camera(A.CAMERA.S6_wide, 52.5, 2);
  expr('star', 'hs', 'happy', 53.5);
  expr('pip', 'hp', 'smile', 54.2);
  tl.to('#heart-spark', { opacity: 1, scale: 3.8, duration: .35, ease: 'back.out(2)' }, 54.6);
  bob('#heart-spark', 54.95, .6, 2, { scale: 4.6, y: 28, opacity: .65 });
  tl.to('#heart-spark', { opacity: 0, y: 170, duration: 1.3 }, 56.75);
  expr('pip', 'hp', 'asleep', 57.1);
  tl.to('#hp-body', { scale: .12, duration: 1.2, ease: 'sine.inOut' }, 57.6).to('#hp-shell', { y: 30, duration: 1.2 }, 57.6);

  // Gentle reusable idles and blinks also freeze and seek with the master timeline.
  for (const [prefix, times] of [['mp', [14.1, 18.2]], ['hp', [31.7, 41.8, 52.2]]]) for (const t of times) {
    tl.to(`#${prefix}-blinkL, #${prefix}-blinkR`, { scaleY: .12, duration: .09 }, t).to(`#${prefix}-blinkL, #${prefix}-blinkR`, { scaleY: 1, duration: .12 }, t + .09);
  }
  // Pure functions of master time, on separate art-owned idle groups.
  const pipIdles = ['mp', 'hp'].map(p => ({ breathe: gsap.quickSetter(`#${p}-breathe`, 'scaleY'), swayL: gsap.quickSetter(`#${p}-swayL`, 'rotation'), swayR: gsap.quickSetter(`#${p}-swayR`, 'rotation') }));
  const floats = [...document.querySelectorAll('[id$="-float"]')].map((node, i) => ({ y: gsap.quickSetter(node, 'y'), rotation: gsap.quickSetter(node, 'rotation'), phase: i * .37 }));
  const glows = [...document.querySelectorAll('[id$="-glowPulse"]')].map(node => gsap.quickSetter(node, 'scale'));
  const fireflies = Array.from({ length: 10 }, (_, i) => ({ bob: gsap.quickSetter(`#ff${i} .ff-bob`, 'y'), wing: gsap.quickSetter(`#ff${i} .ff-wings`, 'scaleY'), phase: i * .37 }));
  const twinkles = [...document.querySelectorAll('.bgstar')].filter(node => Number(node.dataset.i) % 3 === 0).map(node => ({ scale: gsap.quickSetter(node.querySelector('.bgtw'), 'scale'), opacity: gsap.quickSetter(node.querySelector('.bgtw'), 'opacity'), phase: Number(node.dataset.ph) }));
  const plants = [...document.querySelectorAll('#m-clover .pv, #h-clover .pv, #m-grass .pv, #h-grass .pv')].map((node, i) => ({ rotate: gsap.quickSetter(node, 'rotation'), phase: i * .3 }));
  return t => {
    const wave = (period, phase = 0) => Math.sin(2 * Math.PI * (t + phase) / period);
    pipIdles.forEach(p => { p.breathe(1 + .02 * wave(2.4)); p.swayL(4 * wave(3.1)); p.swayR(4 * wave(3.1, .45)); });
    floats.forEach(p => { p.y(6 * wave(2.2, p.phase)); p.rotation(3 * wave(3.3, p.phase + .5)); });
    glows.forEach(set => set(1 + .05 * wave(1.8)));
    fireflies.forEach(p => { p.bob(9 * wave(1.7, p.phase)); p.wing(.6 + .4 * Math.sin(2 * Math.PI * 10 * t + p.phase)); });
    twinkles.forEach(p => { const w = Math.sin(2 * Math.PI * t / 2.6 + p.phase); p.scale(.85 + .25 * w); p.opacity(.75 + .25 * w); });
    plants.forEach(p => p.rotate(3 * wave(3.6, p.phase)));
  };
};
