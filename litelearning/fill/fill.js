/* MET-1265 · „Попълване“ — нов контрол №2 за сайта на Курсове по английски.
   Думите живеят върху картите на въртележката; долу стои изречение с празно място. Тап/свайп до вярната карта →
   думата се откъсва от картата като прах, пада като капка и се сглобява в изречението. N/N → наградата.
   Модул ОТВЪН: двигателят (engine.js) и цирковият декор (decor-circus.js) са байт-идентични с еталона.
   Влиза през шева decor(scene, config): riders() ражда праха · step(F) живее в същия ЕДИН rAF на двигателя.
   Съдържанието (думите · изреченията) идва само от config.js. */
import * as THREE from 'three';
import circus from './decor-circus.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const MAXW = 900, DRIP = 48, DUR = 1.5;                  // зрънца в една дума · капки в покой · полет (s)
const G = { cards: [], seq: [], k: 0, got: [], fly: null, pend: null, last: 'flow', lastIdx: -1, E: null, pts: null, tNext: 0, tDrip: 0, drips: [], shapes: {}, done: false };
let panel, sentEl, bagEl;

/* ───────── DOM: картите (за двигателя) + изречението (за играча) ───────── */
export function prepare(config) {
  G.cards = config.cards; const N = G.cards.length;
  $('.sheet-body').innerHTML = G.cards.map(c =>
    `<article id="${esc(c.id)}" data-title="${esc(c.word)}" data-teaser="${esc(c.title)}"><h2>${esc(c.word)}</h2><h3>${esc(c.title)}</h3><p class="lead">${esc(c.sentence)}</p>${c.text !== c.sentence ? `<p>${esc(c.text)}</p>` : ''}</article>`).join('');
  $('#menu ul').insertAdjacentHTML('beforeend', G.cards.map(c => `<li><button type="button" data-go="${esc(c.id)}">${esc(c.word)}</button></li>`).join(''));
  const s = [3, 2, 5, 7, 1].find(s => gcd(s, N) === 1);   // редът на изреченията ≠ реда на картите → думата се търси
  G.seq = G.cards.map((_, k) => (k * s + 2) % N);
  panel = document.createElement('div'); panel.className = 'fill'; panel.id = 'fill';
  panel.innerHTML = '<p class="fill-s" aria-live="polite"></p><p class="fill-bag" aria-hidden="true"></p>';
  sentEl = panel.firstChild; bagEl = panel.lastChild; $('.cap').before(panel);
  show(0);
  window.__fill = { state: () => ({ k: G.k, want: G.seq[G.k], got: [...G.got], fly: !!G.fly, done: G.done }) };
}
function show(k) {
  G.k = k; const c = G.cards[G.seq[k]];
  const m = new RegExp('(?<![A-Za-z])' + c.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z])').exec(c.sentence), at = m ? m.index : 0;
  panel.classList.remove('in', 'no');
  sentEl.innerHTML = esc(c.sentence.slice(0, at)) + `<span class="gap"><b>${esc(c.word)}</b></span>` + esc(c.sentence.slice(at + c.word.length));
  bag(); void panel.offsetWidth; panel.classList.add('in');
}
function bag() { bagEl.innerHTML = G.seq.map(i => G.got.includes(i) ? `<i>${esc(G.cards[i].word)}</i>` : '<u></u>').join(''); }

/* ───────── декорът: цирковият, непипнат + прахът на попълването ───────── */
export function decor(scene, config) {
  const D = circus(scene, config); G.E = config;
  return { ...D,
    riders() { if (D.riders) D.riders(); G.pts = dust(scene, config, D.dust); },
    step(F) { if (D.step) D.step(F); step(F); } };
}
decor.fonts = circus.fonts; decor.fontProbe = circus.fontProbe;

function dust(scene, cfg, tone) {                        // зрънца в екранни координати · същият renderer · същият кадър
  const n = MAXW + DRIP, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(n), 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uPR: { value: cfg.renderer.getPixelRatio() }, uCol: { value: new THREE.Vector3(...tone.loose) } },
    vertexShader: 'attribute float aA; varying float vA; uniform float uPR; void main(){ vA=aA; gl_Position=vec4(position.xy,0.,1.); gl_PointSize=position.z*uPR; }',
    fragmentShader: 'varying float vA; uniform vec3 uCol; void main(){ float d=length(gl_PointCoord-.5)*2.; float a=pow(max(1.-d,0.),1.7)*vA; gl_FragColor=vec4(uCol*a,a); }',
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 999; scene.add(p);
  p.userData = { r1: Float32Array.from({ length: MAXW }, Math.random), r2: Float32Array.from({ length: MAXW }, Math.random), r3: Float32Array.from({ length: MAXW }, Math.random), loose: tone.loose, gold: tone.gold };
  return p;
}
function shape(word) {                                   // думата → зрънца (единица = ширината на думата)
  if (G.shapes[word]) return G.shapes[word];
  const cv = document.createElement('canvas'), x = cv.getContext('2d', { willReadFrequently: true }), font = '400 96px "Yeseva One", Georgia, serif';
  x.font = font; const w = Math.ceil(x.measureText(word).width) + 8, h = 144; cv.width = w; cv.height = h;
  x.font = font; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(word, 4, h / 2);
  const d = x.getImageData(0, 0, w, h).data; let all = [];
  for (let yy = 0; yy < h; yy += 3) for (let xx = 0; xx < w; xx += 3) if (d[(yy * w + xx) * 4 + 3] > 120) all.push((xx - w / 2) / w, (yy - h / 2) / w);
  const cnt = all.length / 2, n = Math.min(MAXW, cnt), p = new Float32Array(n * 2);
  for (let j = 0; j < n; j++) { const s = Math.floor(j * cnt / n); p[j * 2] = all[s * 2]; p[j * 2 + 1] = all[s * 2 + 1]; }
  return (G.shapes[word] = { n, p, w });
}
const v3 = new THREE.Vector3();
function px(obj, lx, ly) { v3.set(lx, ly, 0); obj.localToWorld(v3); v3.project(window.__proto.dbg().camera); return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight }; }
const gapRect = () => { const b = $('#fill .gap b'); return b ? b.getBoundingClientRect() : null; };

/* ───────── покой → взимане → събрано (всичко в step на двигателя) ───────── */
function step(F) {
  const P = G.pts; if (!P) return;
  const st = window.__proto.state(), t = F.t, W = innerWidth, H = innerHeight, pos = P.geometry.attributes.position, al = P.geometry.attributes.aA, a = pos.array, A = al.array, ud = P.userData;
  if (st.mode === 'focus' && ((G.last !== 'focus' && G.last !== 'open') || st.idx !== G.lastIdx)) onFocus(st.idx, t);
  G.last = st.mode; G.lastIdx = st.idx;
  if (G.pend && (st.mode !== 'focus' || st.idx !== G.pend.i)) G.pend = null;
  if (G.pend && t >= G.pend.t) { launch(G.pend.i, t); G.pend = null; }

  const f = G.fly;                                        // взимане: думата се откъсва, пада и се сглобява в празното място
  if (f) {
    const tau = (t - f.t0) / DUR, sh = f.sh, k = clamp(tau * 1.3, 0, 1);
    P.material.uniforms.uCol.value.set(lerp(ud.loose[0], ud.gold[0], k), lerp(ud.loose[1], ud.gold[1], k), lerp(ud.loose[2], ud.gold[2], k));
    const fade = Math.min(1, tau / .08) * (tau > .84 ? Math.max(0, 1 - (tau - .84) / .16) : 1);
    for (let j = 0; j < sh.n; j++) {
      const nx = sh.p[j * 2], ny = sh.p[j * 2 + 1], d = (nx + .5) * .16 + ud.r1[j] * .14, p = clamp((tau - d) / .68, 0, 1), e = p * p * (3 - 2 * p), arc = Math.sin(p * Math.PI);
      const x = lerp(f.sx + nx * f.sw, f.ex + nx * f.ew, e) + (ud.r2[j] - .5) * 96 * arc;
      const y = lerp(f.sy + ny * f.sw, f.ey + ny * f.ew, Math.pow(p, 2.3)) + (ud.r3[j] - .5) * 44 * arc - 30 * arc * (1 - p);
      a[j * 3] = x / W * 2 - 1; a[j * 3 + 1] = 1 - y / H * 2; a[j * 3 + 2] = 3 + 4.6 * arc; A[j] = fade * (.62 + .38 * ud.r1[j]);
    }
    if (tau >= .8 && !f.landed) { f.landed = true; G.got.push(f.i); $('#fill .gap').classList.add('in'); bag(); }
    if (tau >= 1) { for (let j = 0; j < MAXW; j++) A[j] = 0; G.fly = null; document.body.classList.remove('fill-take'); G.tNext = t + 1.5; }
  }
  if (G.tNext && t >= G.tNext) {                          // събрано → следващото изречение (или наградата)
    G.tNext = 0; const was = G.seq[G.k];
    if (G.k + 1 < G.cards.length) { show(G.k + 1); if (st.mode === 'focus' && st.idx === was) window.__proto.flow(); }
    else finale();
  }

  if (st.mode === 'flow' && !G.done && !f && t >= G.tDrip) {   // покой: от картата отпред капе прах към празното място
    G.tDrip = t + .09; const c = G.E.cards[st.near], r = c && c.plane && gapRect();
    if (r && G.drips.length < DRIP) { const s = px(c.plane, (Math.random() - .5) * G.E.CW * .7, -G.E.CH * .5); if (s.x > 0 && s.x < W) G.drips.push({ t0: t, sx: s.x, sy: s.y, ex: r.left + r.width * Math.random(), ey: r.top + r.height * .5 }); }
  }
  for (let j = 0; j < DRIP; j++) {
    const q = G.drips[j], o = MAXW + j; if (!q) { A[o] = 0; continue; }
    const p = (t - q.t0) / 1.25; if (p >= 1) { G.drips.splice(j, 1); j--; continue; }
    a[o * 3] = lerp(q.sx, q.ex, p) / W * 2 - 1; a[o * 3 + 1] = 1 - lerp(q.sy, q.ey, p * p) / H * 2; a[o * 3 + 2] = 4.2; A[o] = Math.sin(p * Math.PI) * (f ? 0 : 1);
  }
  for (let j = G.drips.length; j < DRIP; j++) A[MAXW + j] = 0;
  pos.needsUpdate = true; al.needsUpdate = true;
}
function onFocus(i, t) {
  if (G.done || G.fly || G.pend || G.tNext) return;
  if (i === G.seq[G.k]) G.pend = { i, t: t + .5 };       // вярната карта: камерата сяда, после думата тръгва
  else { panel.classList.remove('no'); void panel.offsetWidth; panel.classList.add('no'); }
}
function launch(i, t) {
  const c = G.E.cards[i], r = gapRect(); if (!r || !c.plane) return;
  const s = px(c.plane, 0, G.E.CH * .1), e = px(c.plane, G.E.CW / 2, G.E.CH * .1), sh = shape(G.cards[i].word);   // заглавието на картата: 80px върху платно 624
  for (let j = sh.n; j < MAXW; j++) G.pts.geometry.attributes.aA.array[j] = 0;
  G.fly = { i, t0: t, sh, sx: s.x, sy: s.y, sw: Math.abs(e.x - s.x) * 2 * (sh.w * 80 / 96) / 624, ex: r.left + r.width / 2, ey: r.top + r.height / 2, ew: r.width, landed: false };
  G.drips.length = 0; document.body.classList.add('fill-take');
}
function finale() {
  G.done = true; document.body.classList.add('done', 'reward-on', 'fill-done'); $('#reward').setAttribute('aria-hidden', 'false');
  if (window.__proto.state().mode === 'focus') window.__proto.flow();
}
