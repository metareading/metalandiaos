/* MET-1264 · „Албум“ — нов контрол №1 за сайта на Курсове по английски.
   Колекция: думите живеят върху картите на въртележката; долу стои албум — бордът, върху който въртележката стъпва — с по един джоб за всяка.
   Покой: джобът на картата, която минава отпред, светва (албумът диша с въртележката).
   Взимане: тап/свайп до карта или тап на празен джоб → самата карта се разсипва на прах (Eidolon: образ → прах → образ),
            изтича отдолу нагоре като пясък по усукана лента и се сглобява в джоба си; картата на въртележката притъмнява — взета е.
   Събрано: джобът е мини-въртележка (шатра · крушки · думата) и се вози в нейния ритъм. N/N → наградата.
   Ред няма, грешна карта няма (това е събиране, не попълване — №2 е MET-1265).
   Модул ОТВЪН: двигателят (engine.js) и цирковият декор (decor-circus.js) са байт-идентични с еталона.
   Влиза през шева decor(scene, config): riders() ражда праха (платно над албума) · step(F) го рисува в същия ЕДИН rAF на двигателя.
   Съдържанието (думите · джобовете) идва само от config.js. */
import * as THREE from 'three';
import circus from './decor-circus.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t, ease = p => p * p * (3 - 2 * p);
const NP = 1100, ORB = 7, DUR = 2.0, DIM = .4;            // зрънца в една карта · зрънца около джоба отпред · полет (s) · взетата карта на въртележката
const G = { cards: [], got: [], fly: null, pend: null, last: 'flow', lastIdx: -1, near: -2, E: null, pts: null, tBack: 0, tEnd: 0, backIdx: -1, src: [], rects: [], tRect: 0, done: false };
let panel, countEl, pockets = [];
const lines = word => { const out = []; let cur = ''; for (const w of word.split(' ')) { if (cur && (cur + ' ' + w).length > 9) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } out.push(cur); return out; };

/* ───────── DOM: картите (за двигателя) + албумът (за играча) ───────── */
export function prepare(config) {
  G.cards = config.cards; const N = G.cards.length;
  $('.sheet-body').innerHTML = G.cards.map(c =>
    `<article id="${esc(c.id)}" data-title="${esc(c.word)}" data-teaser="${esc(c.from)}"><h2>${esc(c.word)}</h2><h3>${esc(c.from)}</h3><p class="lead">${esc(c.context)}</p></article>`).join('');
  $('#menu ul').insertAdjacentHTML('beforeend', G.cards.map(c => `<li><button type="button" data-go="${esc(c.id)}">${esc(c.word)}</button></li>`).join(''));
  panel = document.createElement('div'); panel.className = 'album'; panel.id = 'album';
  panel.innerHTML = `<div class="album-g" style="--cols:${+config.album.cols || 4}">` +
    G.cards.map((c, i) => `<button class="pk" type="button" data-i="${i}" style="--i:${i}" aria-label="${esc(c.word)}"><b>${lines(c.word).map(l => `<span>${esc(l)}</span>`).join('')}</b></button>`).join('') +
    '<p class="album-n" aria-live="polite"></p></div>';
  countEl = panel.querySelector('.album-n'); $('.cap').before(panel); pockets = [...panel.querySelectorAll('.pk')];
  panel.addEventListener('click', e => { const b = e.target.closest('.pk'); if (b) tapPocket(+b.dataset.i); });
  panel.addEventListener('animationend', e => { if (e.animationName !== 'ride') e.target.classList.remove('pop', 'again', 'tick'); });
  mark();
  window.__album = { state: () => ({ got: [...G.got], fly: !!G.fly, done: G.done, n: N }) };
}
function mark() {
  const next = G.cards.findIndex((_, i) => !G.got.includes(i));
  pockets.forEach((b, i) => { b.classList.toggle('in', G.got.includes(i)); b.classList.toggle('next', i === next && !G.fly); });
  countEl.textContent = G.got.length + ' / ' + G.cards.length;
}
function tapPocket(i) {                                   // празен джоб → довежда картата си · пълен → листът ѝ
  const P = window.__proto, poster = document.body.classList.contains('poster');
  if (G.got.includes(i)) { P.focus(i); P.open(i); return; }
  if (poster) { collect(i); if (G.got.length === G.cards.length) finale(); return; }   // без движение: картата ляга направо в джоба
  P.focus(i);
}
function dim(i, v) { const c = G.E && G.E.cards[i]; if (c && c.plane) c.plane.material.color.setScalar(v); }   // взетата карта остава на въртележката като сянка
function collect(i) {
  if (G.got.includes(i)) return; G.got.push(i); mark(); dim(i, DIM);
  const b = pockets[i]; b.classList.remove('take', 'near', 'pop'); void b.offsetWidth; b.classList.add('pop');
  countEl.classList.remove('tick'); void countEl.offsetWidth; countEl.classList.add('tick');
}

/* ───────── декорът: цирковият, непипнат + прахът на албума ───────── */
export function decor(scene, config) {
  const D = circus(scene, config); G.E = config;
  return { ...D,
    riders() { if (D.riders) D.riders(); G.pts = dust(); },
    step(F) { if (D.step) D.step(F); step(F); } };
}
decor.fonts = circus.fonts; decor.fontProbe = circus.fontProbe;

function dust() {                                        // зрънца на платно НАД албума (сцената на двигателя стои под него) · рисува се от step → същият ЕДИН rAF
  const cv = document.createElement('canvas'); cv.className = 'album-dust'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const css = getComputedStyle(document.documentElement), tok = (k, d) => css.getPropertyValue(k).trim() || d;
  const grain = (core, mid, edge) => {                    // зрънцето: само токените на въртележката
    const sp = document.createElement('canvas'), sx = sp.getContext('2d'); sp.width = sp.height = 32;
    const gr = sx.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, core); gr.addColorStop(.3, mid); gr.addColorStop(.62, edge + '55'); gr.addColorStop(1, edge + '00');
    sx.fillStyle = gr; sx.fillRect(0, 0, 32, 32); return sp; };
  const paper = tok('--paper', '#f7eeda'), cream = tok('--cream', '#f4e8cf'), bulb = tok('--bulb', '#ffd9a0'), brass = tok('--brass', '#e8a33c');
  const n = NP + ORB * G.cards.length, rnd = () => Float32Array.from({ length: NP }, Math.random);
  const P = { cv, x: cv.getContext('2d'), sp: [grain(paper, bulb, brass), grain(bulb, brass, brass)], a: new Float32Array(n * 3), A: new Float32Array(n), K: new Uint8Array(n).fill(1),
    orb: new Float32Array(G.cards.length), dirty: false, r1: rnd(), r2: rnd() };
  const fit = () => { const pr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * pr; cv.height = innerHeight * pr; P.pr = pr; };
  fit(); addEventListener('resize', fit);
  return P;
}
function paint(P) {
  const x = P.x, a = P.a, A = P.A, K = P.K, n = A.length; let any = false;
  if (P.dirty) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, P.cv.width, P.cv.height); P.dirty = false; }
  x.setTransform(P.pr, 0, 0, P.pr, 0, 0); x.globalCompositeOperation = 'lighter';
  for (let j = 0; j < n; j++) { const al = A[j]; if (al < .02) continue; const r = a[j * 3 + 2]; x.globalAlpha = al > 1 ? 1 : al; x.drawImage(P.sp[K[j]], a[j * 3] - r, a[j * 3 + 1] - r, r * 2, r * 2); any = true; }
  P.dirty = any;
}
function pick(all, k) {                                  // равномерно NP зрънца от всички кандидати (редът ред-по-ред се пази)
  const cnt = all.length / k, n = Math.min(NP, cnt), p = new Float32Array(n * k);
  for (let j = 0; j < n; j++) { const s = Math.floor(j * cnt / n); for (let q = 0; q < k; q++) p[j * k + q] = all[s * k + q]; }
  return { n, p };
}
function source(i) {                                     // образ → прах: светлите пиксели на САМАТА карта (рамка · гирлянда · думата) · u, v в картата + тон (месинг/крем)
  if (G.src[i]) return G.src[i];
  const img = G.E.cards[i].plane.material.map.image, W = 240, H = Math.round(W * img.height / img.width);
  const cv = document.createElement('canvas'), x = cv.getContext('2d', { willReadFrequently: true }); cv.width = W; cv.height = H; x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data, all = [];
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const o = (yy * W + xx) * 4, r = d[o], g = d[o + 1], b = d[o + 2];
    if (d[o + 3] > 100 && r * .3 + g * .59 + b * .11 > 150) all.push(xx / W, yy / H, r - b > 70 ? 1 : 0);
  }
  return (G.src[i] = pick(all, 3));
}
function target(i, r) {                                  // прах → образ: мини-картата, каквато ще стои в джоба (рамка · шатра · думата на мястото си в DOM)
  const s = 3, w = Math.round(r.width), h = Math.round(r.height), cv = document.createElement('canvas'), x = cv.getContext('2d', { willReadFrequently: true });
  cv.width = w * s; cv.height = h * s; x.scale(s, s); x.strokeStyle = x.fillStyle = '#fff';
  x.lineWidth = 1.5; x.beginPath(); x.roundRect(1, 1, w - 2, h - 2, 9); x.stroke();
  x.lineWidth = 1; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(w / 2, 2); x.lineTo(w / 2 + k * (w - 6) / 4, 16); x.stroke(); }   // спиците на шатрата
  x.lineWidth = 2; x.beginPath(); x.moveTo(3, 18); x.lineTo(w - 3, 18); x.stroke();
  const cs = getComputedStyle(pockets[i]); x.font = `400 ${cs.fontSize} ${cs.fontFamily}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  pockets[i].querySelectorAll('span').forEach(sp => { const q = sp.getBoundingClientRect(); x.fillText(sp.textContent, q.left + q.width / 2 - r.left, q.top + q.height / 2 - r.top + 1); });
  const d = x.getImageData(0, 0, w * s, h * s).data, all = [];
  for (let yy = 0; yy < h * s; yy += 2) for (let xx = 0; xx < w * s; xx += 2) if (d[(yy * w * s + xx) * 4 + 3] > 120) all.push(xx / s, yy / s);
  return pick(all, 2);
}
const v3 = new THREE.Vector3();
function px(obj, lx, ly) { v3.set(lx, ly, 0); obj.localToWorld(v3); v3.project(window.__proto.dbg().camera); return { x: (v3.x + 1) / 2 * innerWidth, y: (1 - v3.y) / 2 * innerHeight }; }

/* ───────── покой → взимане → събрано (всичко в step на двигателя) ───────── */
function step(F) {
  const P = G.pts; if (!P) return;
  const st = window.__proto.state(), t = F.t, a = P.a, A = P.A;
  if (st.mode === 'focus' && ((G.last !== 'focus' && G.last !== 'open') || st.idx !== G.lastIdx)) onFocus(st.idx, t);
  G.last = st.mode; G.lastIdx = st.idx;
  if (G.pend && (st.mode !== 'focus' || st.idx !== G.pend.i)) G.pend = null;
  if (G.pend && t >= G.pend.t) { launch(G.pend.i, t); G.pend = null; }
  if (t >= G.tRect) { G.tRect = t + .5; G.rects = pockets.map(b => b.getBoundingClientRect()); }

  const f = G.fly;                                        // взимане: картата се разсипва отдолу нагоре, изтича по усукана лента и се сглобява в джоба си
  if (f) {
    const tau = (t - f.t0) / DUR, c = G.E.cards[f.i], hw = G.E.CW / 2, hh = G.E.CH / 2, r = f.r;
    const tl = px(c.plane, -hw, hh), tr = px(c.plane, hw, hh), bl = px(c.plane, -hw, -hh);   // прахът стои върху картата, докато не тръгне
    const ux = tr.x - tl.x, uy = tr.y - tl.y, vx = bl.x - tl.x, vy = bl.y - tl.y;
    const fin = Math.min(1, tau / .07), fout = tau > .9 ? Math.max(0, 1 - (tau - .9) / .1) : 1, sp = f.src.p, dp = f.dst.p, m = f.dst.n / f.n;
    for (let j = 0; j < f.n; j++) {
      const u = sp[j * 3], v = sp[j * 3 + 1], k = Math.floor(j * m) * 2, r1 = P.r1[j], r2 = P.r2[j];
      const sx = tl.x + u * ux + v * vx, sy = tl.y + u * uy + v * vy, ex = r.left + dp[k], ey = r.top + dp[k + 1];
      const p = clamp((tau - .1 - (1 - v) * .3 - r1 * .06) / .44, 0, 1), e = ease(p), q = 1 - e, arc = Math.sin(p * Math.PI);
      const mx = (sx + ex) / 2 + f.side * (44 + 44 * r2), my = lerp(sy, ey, .3);                 // дъгата: като завоя на въртележката
      const hel = arc * (8 + 10 * r2) * Math.sin(p * 7.5 + (j & 1 ? 0 : Math.PI) + r1);           // двойна усукана лента
      a[j * 3] = q * q * sx + 2 * q * e * mx + e * e * ex + hel;
      a[j * 3 + 1] = q * q * sy + 2 * q * e * my + e * e * ey + hel * .35;
      a[j * 3 + 2] = lerp(1.8, 1.25, e) + 1.3 * arc; A[j] = fin * fout * (.7 + .3 * r1) * (1 - .35 * arc);   // в полет: ситен златен прах, не бяла буца
    }
    c.plane.material.color.setScalar(lerp(1, DIM, ease(clamp((tau - .1) / .5, 0, 1))));
    if (tau >= .9 && !f.landed) { f.landed = true; collect(f.i); }
    if (tau >= 1) { for (let j = 0; j < NP; j++) A[j] = 0; G.backIdx = f.i; G.fly = null; mark(); G.tBack = t + .9; if (G.got.length === G.cards.length) G.tEnd = t + 1.3; }
  }
  if (G.tBack && t >= G.tBack) { G.tBack = 0; if (st.mode === 'focus' && st.idx === G.backIdx && !G.fly && !G.pend) window.__proto.flow(); }   // събрано → въртележката потича пак
  if (G.tEnd && t >= G.tEnd) { G.tEnd = 0; finale(); }

  const hide = st.mode === 'open' || document.body.classList.contains('menu-on') || document.body.classList.contains('reward-on');
  const near = hide || G.done ? -1 : st.mode === 'focus' ? st.idx : st.near;                     // покой: джобът на картата отпред светва и около него обикаля прах
  if (near !== G.near) { G.near = near; pockets.forEach((b, i) => b.classList.toggle('near', i === near && !G.got.includes(i))); }
  const kf = Math.min(1, (F.dt || .016) * 5);
  for (let i = 0; i < pockets.length; i++) {
    const r = G.rects[i], on = r && i === near && !G.got.includes(i) && !(G.fly && G.fly.i === i) ? 1 : 0, w = (P.orb[i] += (on - P.orb[i]) * kf);
    for (let q = 0; q < ORB; q++) {
      const o = NP + i * ORB + q; if (w < .02 || !r) { A[o] = 0; continue; }
      const ph = t * 1.15 + q * (Math.PI * 2 / ORB);
      a[o * 3] = r.left + r.width / 2 + Math.cos(ph) * r.width * .5; a[o * 3 + 1] = r.top + r.height * .86 + Math.sin(ph) * r.height * .1;
      a[o * 3 + 2] = 2.4 + 1.1 * Math.sin(ph); A[o] = w * (.3 + .65 * (1 + Math.sin(ph)) / 2);
    }
  }
  paint(P);
}
function onFocus(i, t) {
  if (G.done || G.fly || G.pend) return;
  if (!G.got.includes(i)) G.pend = { i, t: t + .5 };      // камерата сяда, после картата тръгва
  else { const b = pockets[i]; b.classList.remove('again'); void b.offsetWidth; b.classList.add('again'); }
}
function launch(i, t) {
  const c = G.E.cards[i]; if (!c || !c.plane) return;
  const r = pockets[i].getBoundingClientRect(), src = source(i), dst = target(i, r), P = G.pts, s = px(c.plane, 0, 0), ex = r.left + r.width / 2;
  for (let j = 0; j < NP; j++) { P.A[j] = 0; if (j < src.n) P.K[j] = src.p[j * 3 + 2]; }
  G.fly = { i, t0: t, src, dst, n: src.n, r, side: ex < s.x - 24 ? -1 : ex > s.x + 24 ? 1 : (i % 2 ? 1 : -1), landed: false };
  pockets.forEach(b => b.classList.remove('next', 'near')); pockets[i].classList.add('take');
}
function finale() {
  if (G.done) return;
  G.done = true; document.body.classList.add('done', 'reward-on', 'album-done'); $('#reward').setAttribute('aria-hidden', 'false');
  if (window.__proto.state().mode === 'focus') window.__proto.flow();
}
