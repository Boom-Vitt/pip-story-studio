/* Pip and the Little Star — art kit (studio-art). Classic script, no deps, file:// safe.
 * Defines window.ART: palette, SVG markup builders, expression table, camera boards.
 * Rig rule: every element with class "pv" pivots on its own local (0,0).
 *   Call once after inserting markup:  gsap.set('.pv', { svgOrigin: '0 0' });
 * Spec + usage: art-bible.md
 */
(function () {
  'use strict';

  const C = {
    ink: '#2B2346', inkSoft: '#4A3F6B', cream: '#FFF6E3', white: '#FFFFFF',
    pipBody: '#FFD7B5', pipBelly: '#F2B591', pipShell: '#F4907E', pipShellDk: '#D9677A',
    pipShellLt: '#FFC6B4', blush: '#FF8FA8', heart: '#FF6F96',
    star: '#FFD45C', starDk: '#EFA43A', starLt: '#FFEAA0', starGlow: '#FFE89A', starDim: '#8F94C4',
    tear: '#9FD8FF',
    ffBody: '#FFE070', ffGlow: '#FFF1A6', ffHead: '#4A3F6B',
    moon: '#FFF3C4', moonDk: '#F1DFA4', bgStar: '#FFF6D8',
    // night base (S2–S6)
    skyTop: '#141A47', skyMid: '#26307A', skyLow: '#4A4C9C',
    hillFar: '#2C3A7A', hillMid: '#23557A', meadow: '#2C6E66', tallHill: '#2F7A68',
    rimFar: '#3A4B92', rimMid: '#2F6D8E', rimMeadow: '#3F8E78', rimTall: '#4FA283',
    clover: '#4FAE7C', cloverDk: '#3A8A65', cloverLt: '#7FD39A', grass: '#3F9873', grassDk: '#2F7A5E',
    // dusk (S1 start; tween fills from these to the night values above)
    duskTop: '#6E6BBE', duskMid: '#C59AC8', duskLow: '#FFC3A0',
    duskHillFar: '#9C8FC4', duskHillMid: '#7FA6B0', duskMeadow: '#86B88E',
    duskRimFar: '#B3A7D6', duskRimMid: '#98BEC4', duskRimMeadow: '#A3D0A6',
    // lighting washes
    deep: '#0B0E30', warm: '#FFD98A', warmRose: '#F7A6C8', warmLilac: '#A98BEA',
    backdrop: '#0E1036',
  };

  const r1 = (n) => Math.round(n * 10) / 10;

  // Rounded 5-point star centred on 0,0, top point up. R outer, r inner; t = how far along
  // each edge the rounding starts (bigger = softer).
  function roundedStar(R = 100, r = 56, tOut = 0.3, tIn = 0.18) {
    const v = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R;
      v.push([rad * Math.cos(a), rad * Math.sin(a)]);
    }
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    let d = '';
    v.forEach((p, i) => {
      const prev = v[(i + 9) % 10], next = v[(i + 1) % 10], t = i % 2 ? tIn : tOut;
      const a = lerp(p, prev, t), b = lerp(p, next, t);
      d += (i ? 'L' : 'M') + r1(a[0]) + ',' + r1(a[1]) + 'Q' + r1(p[0]) + ',' + r1(p[1]) + ' ' + r1(b[0]) + ',' + r1(b[1]);
    });
    return d + 'Z';
  }
  const STAR = roundedStar();

  // Archimedean spiral polyline for Pip's shell.
  function spiral(rFrom, rTo, turns, a0) {
    const n = 64, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = a0 + t * turns * 2 * Math.PI, rad = rFrom + (rTo - rFrom) * t;
      pts.push(r1(rad * Math.cos(a)) + ',' + r1(rad * Math.sin(a)));
    }
    return 'M' + pts.join('L');
  }

  const HEART = 'M0,12C-10,5 -18,-2 -18,-9C-18,-15 -13,-18 -8.5,-18C-4,-18 -1,-15 0,-12C1,-15 4,-18 8.5,-18C13,-18 18,-15 18,-9C18,-2 10,5 0,12Z';
  const SPARK = 'M0,-20Q3,-3 20,0Q3,3 0,20Q-3,3 -20,0Q-3,-3 0,-20Z';
  // pivot wrapper: positions an animatable group whose pivot is its own 0,0
  const pv = (id, x, y, inner, extra = '') =>
    `<g transform="translate(${x},${y})"><g id="${id}" class="pv"${extra}>${inner}</g></g>`;
  const radial = (id, color, stops) =>
    `<radialGradient id="${id}">${stops.map(([o, a]) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  const linear = (id, y1, y2, stops) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${y1}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

  /* ---------- shared <defs>: insert ONCE per document (inside any inline <svg>) ---------- */
  function defs() {
    return `<defs>
${radial('g-shadow', C.ink, [[0, 0.38], [0.7, 0.16], [1, 0]])}
${radial('g-starGlow', C.starGlow, [[0, 0.62], [0.35, 0.3], [1, 0]])}
${radial('g-ffGlow', C.ffGlow, [[0, 0.75], [0.3, 0.32], [1, 0]])}
${radial('g-moonGlow', C.moon, [[0.3, 0.32], [0.55, 0.1], [1, 0]])}
${radial('g-heartGlow', C.heart, [[0, 0.55], [1, 0]])}
${radial('g-bloom', C.starGlow, [[0, 0.9], [0.25, 0.45], [1, 0]])}
<radialGradient id="g-warm" gradientUnits="userSpaceOnUse" cx="1250" cy="520" r="1500">
  <stop offset="0" stop-color="${C.warm}" stop-opacity=".38"/><stop offset=".22" stop-color="${C.warmRose}" stop-opacity=".2"/><stop offset=".55" stop-color="${C.warmLilac}" stop-opacity=".16"/><stop offset="1" stop-color="${C.warmLilac}" stop-opacity="0"/></radialGradient>
${linear('g-skyM', 0, 900, [[0, C.skyTop], [0.6, C.skyMid], [1, C.skyLow]])}
${linear('g-duskM', 0, 900, [[0, C.duskTop], [0.55, C.duskMid], [1, C.duskLow]])}
${linear('g-skyH', 0, 1800, [[0, '#10143D'], [0.6, C.skyMid], [1, C.skyLow]])}
<path id="sym-starPath" d="${STAR}"/>
<g id="sym-bgstar"><path d="${SPARK}" transform="scale(.55)" fill="${C.bgStar}" stroke="${C.bgStar}" stroke-width="3" stroke-linejoin="round"/></g>
<g id="sym-sparkle"><path d="${SPARK}" fill="${C.bgStar}" stroke="${C.bgStar}" stroke-width="4" stroke-linejoin="round"/><circle r="5" fill="${C.star}"/></g>
<g id="sym-heart"><path d="${HEART}" fill="#FFB3C7"/><path d="${HEART}" transform="translate(-3,-3) scale(.5)" fill="#FFD9E3"/></g>
<g id="sym-ring"><path d="M0,-18Q13,0 0,18" fill="none" stroke="${C.cream}" stroke-width="5" stroke-linecap="round"/></g>
<g id="sym-clover">
  <path d="M0,0Q-2,-22 3,-44" fill="none" stroke="${C.cloverDk}" stroke-width="5" stroke-linecap="round"/>
  <g transform="translate(3,-46)">${[0, 120, 240].map((a) => `<g transform="rotate(${a})"><path d="${HEART}" transform="translate(0,-14) scale(1.15)" fill="${C.clover}"/><path d="M0,-4L0,-24" stroke="${C.cloverLt}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></g>`).join('')}<circle r="4" fill="${C.cloverDk}"/></g>
</g>
<g id="sym-grass"><path d="M-16,0Q-22,-26 -30,-44Q-12,-28 -5,0ZM-6,0Q-6,-36 2,-60Q8,-34 6,0ZM4,0Q14,-24 28,-38Q18,-18 16,0Z" fill="${C.grass}"/><path d="M-6,0Q-6,-36 2,-60Q2,-30 0,0Z" fill="${C.grassDk}" opacity=".45"/></g>
</defs>`;
  }

  /* ---------- Pip: faces right. Local origin = ground contact, bottom centre. ~340 wide. ---------- */
  function pipEye(p, side, x, y) {
    return pv(`${p}-eye${side}`, x, y, pv(`${p}-blink${side}`, 0, 0,
      `<g id="${p}-eye${side}-open"><circle r="25" fill="${C.white}"/><g id="${p}-pupil${side}"><circle cx="5" cy="3" r="14" fill="${C.ink}"/><circle cx="0" cy="-3" r="5" fill="${C.white}"/><circle cx="10" cy="9" r="2.2" fill="${C.white}"/></g></g>
<g id="${p}-eye${side}-shut" opacity="0" visibility="hidden"><circle r="25" fill="${C.pipBody}"/><path d="M-13,2Q0,12 13,2" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/></g>
<g id="${p}-eye${side}-happy" opacity="0" visibility="hidden"><circle r="25" fill="${C.pipBody}"/><path d="M-13,6Q0,-10 13,6" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/></g>`));
  }
  const hide = ' opacity="0" visibility="hidden"';

  function pip(p = 'pip') {
    const stalk = (side, x, y, ex, ey) => pv(`${p}-stalk${side}`, x, y, pv(`${p}-sway${side}`, 0, 0,
      `<path d="M0,0Q${r1(ex * 0.1)},${r1(ey * 0.55)} ${ex},${ey}" fill="none" stroke="${C.pipBody}" stroke-width="15" stroke-linecap="round"/>${pipEye(p, side, ex, ey - 6)}`));
    const body = `
<path d="M-178,-6C-178,-24 -150,-44 -108,-50L100,-58C134,-60 162,-42 162,-20C162,-6 150,0 136,0L-170,0C-176,0 -178,-3 -178,-6Z" fill="${C.pipBody}"/>
<path d="M-176,-3C-120,-12 90,-14 160,-12C158,-4 150,0 136,0L-170,0C-174,0 -176,-1 -176,-3Z" fill="${C.pipBelly}"/>
${stalk('L', 100, -150, -24, -78)}
${stalk('R', 140, -152, 16, -84)}
<ellipse cx="114" cy="-62" rx="48" ry="40" fill="${C.pipBody}"/>
${pv(`${p}-head`, 126, -112, `
  <circle r="58" fill="${C.pipBody}"/>
  <ellipse cx="-22" cy="-30" rx="15" ry="9" fill="${C.white}" opacity=".35" transform="rotate(-25 -22 -30)"/>
  <g id="${p}-blush"><ellipse cx="-14" cy="16" rx="12" ry="7.5" fill="${C.blush}" opacity=".85"/><ellipse cx="44" cy="12" rx="9" ry="6.5" fill="${C.blush}" opacity=".85"/></g>
  <path id="${p}-mouth-smile" d="M8,14Q20,27 32,14" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
  <path id="${p}-mouth-big" d="M5,11Q20,38 35,11Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"${hide}/>
  <ellipse id="${p}-mouth-o" cx="20" cy="20" rx="7" ry="9" fill="${C.ink}"${hide}/>
  <path id="${p}-mouth-flat" d="M9,22Q20,15 31,22" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"${hide}/>`)}`;
    const shell = `
<circle r="96" cy="7" fill="${C.pipShellDk}"/>
<circle r="96" fill="${C.pipShell}"/>
<path d="${spiral(5, 74, 2.15, Math.PI * 0.95)}" fill="none" stroke="${C.pipShellDk}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-70,-40A82,82 0 0 1 -20,-80" fill="none" stroke="${C.pipShellLt}" stroke-width="12" stroke-linecap="round"/>
<g id="${p}-heart"${hide}><circle r="120" fill="url(#g-heartGlow)"/><path d="${HEART}" transform="scale(1.6)" fill="${C.heart}"/><path d="${HEART}" transform="translate(-6,-7) scale(.6)" fill="#FFC2D2"/></g>
<g transform="translate(-6,-92)"><g id="${p}-rider"></g></g>`;
    return `<g id="${p}" class="pv">
<g id="${p}-shadow" class="pv"><ellipse cx="0" cy="2" rx="160" ry="14" fill="url(#g-shadow)"/></g>
${pv(`${p}-squash`, 0, 0, pv(`${p}-breathe`, 0, 0, `
  <g transform="translate(-30,-118)"><g id="${p}-body" class="pv"><g transform="translate(30,118)">${body}</g></g></g>
  ${pv(`${p}-shell`, -30, -118, shell)}`))}
</g>`;
  }

  /* ---------- Little Star: centre origin, R=100 (place at scale .38–.9) ---------- */
  function star(p = 'star') {
    const face = `<g transform="translate(0,0)"><g id="${p}-blink" class="pv">
<g id="${p}-eyes-open">${[-24, 24].map((x) => `<g transform="translate(${x},0)"><g class="${p}-pupil"><ellipse rx="9" ry="12" fill="${C.ink}"/><circle cx="-3" cy="-4" r="3.6" fill="${C.white}"/></g></g>`).join('')}</g>
<g id="${p}-eyes-happy"${hide}>${[-24, 24].map((x) => `<path d="M${x - 10},4Q${x},-9 ${x + 10},4" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
<g id="${p}-eyes-sleepy"${hide}>${[-24, 24].map((x) => `<path d="M${x - 10},1Q${x},7 ${x + 10},1" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`).join('')}</g></g></g>
<g id="${p}-blush"><ellipse cx="-42" cy="17" rx="10" ry="6.5" fill="${C.blush}" opacity=".8"/><ellipse cx="42" cy="17" rx="10" ry="6.5" fill="${C.blush}" opacity=".8"/></g>
<path id="${p}-mouth-smile" d="M-10,20Q0,30 10,20" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
<path id="${p}-mouth-big" d="M-13,17Q0,38 13,17Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"${hide}/>
<path id="${p}-mouth-sad" d="M-9,28Q0,20 9,28" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"${hide}/>
<ellipse id="${p}-mouth-o" cx="0" cy="24" rx="5.5" ry="6.5" fill="${C.ink}"${hide}/>
<ellipse id="${p}-mouth-yawn" cx="0" cy="25" rx="9" ry="13" fill="${C.ink}"${hide}/>
<g id="${p}-tear"${hide}><path d="M-34,10Q-40,22 -34,27Q-28,22 -34,10Z" fill="${C.tear}"/></g>`;
    return `<g id="${p}" class="pv">
${pv(`${p}-glow`, 0, 0, pv(`${p}-glowPulse`, 0, 0, `<circle r="240" fill="url(#g-starGlow)"/>`))}
${pv(`${p}-float`, 0, 0, pv(`${p}-wobble`, 0, 0, pv(`${p}-squash`, 0, 72, `<g transform="translate(0,-72)">
  <use href="#sym-starPath" transform="translate(0,8)" fill="${C.starDk}"/>
  <use href="#sym-starPath" fill="${C.star}"/>
  <use href="#sym-starPath" transform="translate(-6,-10) scale(.62)" fill="${C.starLt}" opacity=".9"/>
  <use id="${p}-dim" href="#sym-starPath" fill="${C.starDim}" opacity="0"/>
  ${pv(`${p}-face`, 0, 4, face)}</g>`)))}
</g>`;
  }

  /* ---------- Firefly: class-based so you can clone 8–12. ~26 wide body, glow r46 ---------- */
  function firefly(id = '') {
    return `<g class="ff pv"${id ? ` id="${id}"` : ''}><g class="ff-bob pv">
<circle r="46" fill="url(#g-ffGlow)" class="ff-glow"/>
<g transform="translate(-2,-8)"><g class="ff-wings pv"><ellipse cx="-7" cy="-7" rx="9" ry="5.5" transform="rotate(-35 -7 -7)" fill="${C.white}" opacity=".7"/><ellipse cx="6" cy="-8" rx="8" ry="5" transform="rotate(25 6 -8)" fill="${C.white}" opacity=".6"/></g></g>
<circle r="10" fill="${C.ffBody}"/><circle cx="-3" cy="-3" r="4" fill="${C.white}" opacity=".7"/>
<circle cx="-11" cy="-5" r="6.5" fill="${C.ffHead}"/><circle cx="-13" cy="-6.5" r="1.6" fill="${C.white}"/>
</g></g>`;
  }

  /* ---------- Moon: centre origin, r78 ---------- */
  function moon(p = 'moon') {
    return `<g id="${p}" class="pv"><circle r="260" fill="url(#g-moonGlow)"/><circle r="78" cy="5" fill="${C.moonDk}"/><circle r="78" fill="${C.moon}"/>
<circle cx="30" cy="-28" r="11" fill="${C.moonDk}"/><circle cx="-34" cy="30" r="8" fill="${C.moonDk}"/><circle cx="40" cy="30" r="6" fill="${C.moonDk}"/>
<g id="${p}-face"><path d="M-30,-2Q-21,6 -12,-2M12,-2Q21,6 30,-2" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" opacity=".55"/><path d="M-6,16Q0,21 6,16" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" opacity=".5"/><ellipse cx="-36" cy="12" rx="8" ry="5" fill="${C.blush}" opacity=".45"/><ellipse cx="36" cy="12" rx="8" ry="5" fill="${C.blush}" opacity=".45"/></g></g>`;
  }

  /* ---------- deterministic star field: <use> sparkles with data-i (pop order) and data-ph (twinkle phase) ---------- */
  function starField(p, x0, y0, w, h, count, seed, avoid = []) {
    let s = seed >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = [];
    for (let tries = 0; out.length < count && tries < count * 20; tries++) {
      const x = x0 + rnd() * w, y = y0 + rnd() * h * rnd() * 1.4; // denser near the top
      if (y > y0 + h) continue;
      if (avoid.some(([ax, ay, ar]) => (x - ax) ** 2 + (y - ay) ** 2 < ar * ar)) continue;
      const k = rnd(), sc = k < 0.6 ? 0.35 + rnd() * 0.25 : k < 0.9 ? 0.65 + rnd() * 0.3 : 1 + rnd() * 0.3;
      out.push(`<g transform="translate(${r1(x)},${r1(y)})"><g class="bgstar pv" data-i="${out.length}" data-ph="${r1(rnd() * 6.28)}"><g class="bgtw pv"><use href="#sym-bgstar" transform="scale(${r1(sc)})"/></g></g></g>`);
    }
    return `<g id="${p}">${out.join('')}</g>`;
  }

  // The Little Star's family: 4 bigger sleepy stars around her empty spot + a ghost outline of the spot.
  const FAMILY = [[-380, -40, 0.55], [-190, -110, 0.62], [190, -90, 0.58], [370, 20, 0.5]];
  function homeCluster(p, cx, cy) {
    return `<g id="${p}">${FAMILY.map(([dx, dy, s], i) => `<g transform="translate(${cx + dx},${cy + dy}) scale(${s})">${star(`${p}-fam${i + 1}`)}</g>`).join('')}
<g transform="translate(${cx},${cy}) scale(.4)"><use id="${p}-ghost" href="#sym-starPath" fill="none" stroke="${C.bgStar}" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" opacity=".35"/></g></g>`;
  }

  const land = (id, crest, x1, y2, fill, rim) =>
    `<path id="${id}" d="${crest}L${x1},${y2}L${crest.match(/^M(-?[\d.]+)/)[1]},${y2}Z" fill="${fill}"/><path id="${id}-rim" d="${crest}" fill="none" stroke="${rim}" stroke-width="7" stroke-linecap="round"/>`;
  const at = (href, x, y, s = 1, extra = '') =>
    `<g transform="translate(${x},${y})"><g class="pv"${extra}><use href="#${href}" transform="scale(${s})"/></g></g>`;

  /* ---------- Set A: Meadow (S1–S3). World 1920×1080 (+overscan). Starts in DUSK colours. ---------- */
  const MEADOW = { home: [1380, 230], pip: [760, 975], landing: [1010, 942], moon: [300, 190] };
  function setMeadow() {
    const [hx, hy] = MEADOW.home;
    const clovers = [[640, 1000, 1], [700, 960, 0.8], [880, 1010, 1.1], [960, 990, 0.85], [1080, 1015, 1], [1150, 970, 0.75], [560, 965, 0.7], [1230, 1000, 0.9], [820, 952, 0.7]];
    const tufts = [[120, 900, 1.1], [330, 930, 0.9], [470, 915, 1], [1340, 940, 1], [1520, 905, 1.2], [1700, 925, 0.9], [1860, 900, 1], [600, 1060, 1.3], [1300, 1070, 1.2]];
    return `<g id="set-meadow">
<rect id="m-sky" x="-400" y="-400" width="2720" height="1900" fill="url(#g-skyM)"/>
<rect id="m-sky-dusk" x="-400" y="-400" width="2720" height="1900" fill="url(#g-duskM)"/>
${starField('m-stars', -200, 0, 2320, 680, 70, 7, [[hx, hy, 120], [MEADOW.moon[0], MEADOW.moon[1], 150], ...FAMILY.map(([dx, dy, s]) => [hx + dx, hy + dy, 80 * s + 30])])}
<g transform="translate(${MEADOW.moon})">${moon('m-moon')}</g>
${homeCluster('m-home', hx, hy)}
${land('m-hill-far', 'M-300,700C0,610 260,600 520,660C760,715 900,640 1160,620C1420,600 1600,690 1900,650C2050,630 2150,640 2220,660', 2220, 1400, C.duskHillFar, C.duskRimFar)}
${land('m-hill-mid', 'M-300,800C-40,740 220,730 480,790C700,840 900,770 1180,760C1460,750 1660,820 2220,770', 2220, 1400, C.duskHillMid, C.duskRimMid)}
${land('m-meadow', 'M-300,900C40,870 300,860 640,890C960,918 1260,880 1560,868C1800,858 2000,880 2220,890', 2220, 1400, C.duskMeadow, C.duskRimMeadow)}
<g id="m-clover">${clovers.map(([x, y, s], i) => at('sym-clover', x, y, s, ` data-i="${i}"`)).join('')}</g>
<g id="m-grass">${tufts.map(([x, y, s], i) => at('sym-grass', x, y, s, ` data-i="${i}"`)).join('')}</g>
<path id="m-fall" d="M1380,230C1290,110 1110,170 1170,330C1230,480 1420,420 1350,580C1280,740 1060,690 1010,948" fill="none"/>
</g>`;
  }

  /* ---------- Set B: Tall Hill (S4–S6). World x −800…2720, y 0…2160. Night colours. ---------- */
  const HILL = { home: [1250, 520], summit: [1250, 1420], moon: [120, 420],
    crest: 'M-800,2060C-200,2040 500,1700 900,1500C1060,1420 1150,1412 1250,1412C1400,1412 1500,1430 1640,1480C1940,1580 2300,1800 2720,1880' };
  function setHill() {
    const [hx, hy] = HILL.home;
    const tufts = [[-60, 1960, 1.2], [300, 1810, 1.1], [620, 1640, 1], [930, 1490, 1], [1080, 1432, 0.9], [1420, 1424, 0.9], [1700, 1505, 1.1], [2050, 1660, 1.2], [2400, 1810, 1.3]];
    const clovers = [[180, 1880, 0.9], [760, 1590, 0.8], [1520, 1450, 0.8], [1880, 1580, 1]];
    return `<g id="set-hill">
<rect id="h-sky" x="-900" y="-200" width="3720" height="2460" fill="url(#g-skyH)"/>
${starField('h-stars', -850, 0, 3620, 1300, 150, 21, [[hx, hy, 120], [HILL.moon[0], HILL.moon[1], 150], ...FAMILY.map(([dx, dy, s]) => [hx + dx, hy + dy, 80 * s + 30])])}
<g transform="translate(${HILL.moon})">${moon('h-moon')}</g>
${homeCluster('h-home', hx, hy)}
<rect id="h-deep" x="-900" y="-200" width="3720" height="2460" fill="${C.deep}" opacity="0"/>
<g id="h-par-far">${land('h-hill-far', 'M-900,1640C-500,1520 -100,1520 300,1600C700,1680 1000,1560 1400,1560C1800,1560 2200,1660 2820,1600', 2820, 2300, C.hillFar, C.rimFar)}</g>
<g id="h-par-mid">${land('h-hill-mid', 'M-900,1800C-400,1720 0,1760 400,1830C800,1900 1500,1760 1900,1760C2300,1760 2600,1820 2820,1800', 2820, 2300, C.hillMid, C.rimMid)}</g>
${land('h-hill', HILL.crest, 2720, 2300, C.tallHill, C.rimTall)}
<g id="h-clover">${clovers.map(([x, y, s], i) => at('sym-clover', x, y, s, ` data-i="${i}"`)).join('')}</g>
<g id="h-grass">${tufts.map(([x, y, s], i) => at('sym-grass', x, y, s, ` data-i="${i}"`)).join('')}</g>
<path id="h-crest" d="${HILL.crest}" fill="none"/>
<rect id="h-warm" x="-900" y="-200" width="3720" height="2460" fill="url(#g-warm)" opacity="0"/>
</g>`;
  }

  /* ---------- Expressions: one visible variant per slot + transform presets. Seek-safe (timeline tweens). ---------- */
  const SLOTS = {
    pip: { eyeL: ['eyeL-open', 'eyeL-shut', 'eyeL-happy'], eyeR: ['eyeR-open', 'eyeR-shut', 'eyeR-happy'], mouth: ['mouth-smile', 'mouth-big', 'mouth-o', 'mouth-flat'] },
    star: { eyes: ['eyes-open', 'eyes-happy', 'eyes-sleepy'], mouth: ['mouth-smile', 'mouth-big', 'mouth-sad', 'mouth-o', 'mouth-yawn'], tear: ['tear'] },
  };
  const E = (show, set = {}) => ({ show, set });
  const pupils = (x, y) => ({ pupilL: { x, y }, pupilR: { x, y } });
  const EXPR = {
    pip: {
      normal: E(['eyeL-open', 'eyeR-open', 'mouth-smile'], { stalkL: { rotation: 0 }, stalkR: { rotation: 0 }, head: { rotation: 0 }, ...pupils(0, 0) }),
      startled: E(['eyeL-open', 'eyeR-open', 'mouth-o'], { stalkL: { rotation: -14 }, stalkR: { rotation: 12 }, eyeL: { scale: 1.15 }, eyeR: { scale: 1.15 }, ...pupils(0, -2) }),
      droopy: E(['eyeL-open', 'eyeR-open', 'mouth-flat'], { stalkL: { rotation: -16 }, stalkR: { rotation: 36 }, head: { rotation: 8 }, eyeL: { scale: 1 }, eyeR: { scale: 1 }, ...pupils(2, 6) }),
      smile: E(['eyeL-happy', 'eyeR-happy', 'mouth-big'], { stalkL: { rotation: -4 }, stalkR: { rotation: 4 }, head: { rotation: -4 }, eyeL: { scale: 1 }, eyeR: { scale: 1 }, ...pupils(0, 0) }),
      lookUp: E(['eyeL-open', 'eyeR-open', 'mouth-smile'], { stalkL: { rotation: -8 }, stalkR: { rotation: -6 }, head: { rotation: -10 }, ...pupils(1, -8) }),
      calling: E(['eyeL-happy', 'eyeR-happy', 'mouth-o'], { stalkL: { rotation: -10 }, stalkR: { rotation: 6 }, head: { rotation: -14 }, ...pupils(0, -6) }),
      asleep: E(['eyeL-shut', 'eyeR-shut', 'mouth-smile'], { stalkL: { rotation: -12 }, stalkR: { rotation: 28 }, head: { rotation: 4 }, ...pupils(0, 0) }),
    },
    star: {
      happy: E(['eyes-open', 'mouth-smile'], { glow: { opacity: 1, scale: 1 }, dim: { opacity: 0 } }),
      joy: E(['eyes-happy', 'mouth-big'], { glow: { opacity: 1, scale: 1.25 }, dim: { opacity: 0 } }),
      sad: E(['eyes-open', 'mouth-sad', 'tear'], { glow: { opacity: 0.28, scale: 0.8 }, dim: { opacity: 0.55 } }),
      sleepy: E(['eyes-sleepy', 'mouth-o'], { glow: { opacity: 0.7, scale: 0.9 }, dim: { opacity: 0 } }),
      yawn: E(['eyes-sleepy', 'mouth-yawn'], { glow: { opacity: 0.7, scale: 0.9 }, dim: { opacity: 0 } }),
      surprised: E(['eyes-open', 'mouth-o'], { glow: { opacity: 0.85, scale: 1 }, dim: { opacity: 0 } }),
    },
  };

  /** Add an expression change to a GSAP timeline at `t`. who: 'pip'|'star'; p: the id prefix used. */
  function applyExpr(tl, who, p, name, t, dur = 0.22) {
    const ex = EXPR[who][name], q = (k) => `#${p}-${k}`;
    for (const slot of Object.values(SLOTS[who])) {
      for (const v of slot) tl.to(q(v), { autoAlpha: ex.show.includes(v) ? 1 : 0, duration: 0.08, ease: 'none' }, t);
    }
    for (const [k, v] of Object.entries(ex.set)) tl.to(q(k), { ...v, duration: dur, ease: 'back.out(2)' }, t);
    return tl;
  }
  /** Same, applied instantly (for setup / static boards). */
  function setExpr(gsap, who, p, name) {
    return applyExpr(gsap.timeline(), who, p, name, 0, 0).progress(1);
  }

  /* ---------- control-bar icons (24×24, stroke = currentColor) ---------- */
  const ic = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    play: ic('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
    pause: ic('<path d="M8.5 6v12M15.5 6v12"/>'),
    restart: ic('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/>'),
    soundOn: ic('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    soundOff: ic('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  };

  /* ---------- recommended camera boards (SVG viewBox "x y w h", always 16:9) ---------- */
  const CAMERA = {
    S1_wide: '0 0 1920 1080', S1_star: '1060 60 640 360',
    S2_fall: '480 240 1280 720', S2_land: '540 700 760 427.5',
    S3_two: '600 735 640 360',
    S4_climbA: '-140 1230 1280 720', S4_summit: '600 1080 1280 720', S4_far: '-83 310 2667 1500',
    S5_tilt: '600 260 1280 720',
    S6_home: '930 340 640 360', S6_wide: '-83 310 2667 1500',
  };

  window.ART = { C, STAR, HEART, SPARK, defs, pip, star, firefly, moon, starField, homeCluster, setMeadow, setHill,
    MEADOW, HILL, FAMILY, SLOTS, EXPR, applyExpr, setExpr, ICONS, CAMERA };
})();
