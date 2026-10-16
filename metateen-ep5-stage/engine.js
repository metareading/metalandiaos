import * as THREE from 'three';

/* ═════════ ВЪРТЕЛЕЖКА · ДВИГАТЕЛ v2 (MET-1275 · ADR 0123) · НЕ СЕ ПИПА — md5 в паспорта (controls/carousel/PASPORT.md т.1) ═════════
   Произход: git show 3be9e12:_proto/eng-carousel-test/index.html (script #2) · срязан веднъж по шева decor(scene, config).
   Двигателят: сцена · камера/пози · поток в покой → фокус → лист · прахът (зрънцата на картите + въздухът) · един rAF · постер при намалено движение · N карти от DOM.
   Декорът идва отвън: mount({ decor }) · decor(scene, config) → { paintCard(card, glow) → canvas, dust: { grain, loose, air: [a, b], gold }, riders()?, step(F)? }
     + decor.fonts / decor.fontProbe (шрифтовете, с които paintCard рисува). Двигателят не знае какво има в декора.
   Друг декор + друго съдържание (DOM) = нова въртележка · този файл остава байт-идентичен. */
export function mount({ decor }) {
const F = { t: 0, dt: 0, rot: 0, all: 0, shots: 0 };     // кадърът, който декорът получава в step()

/* ───────── помощни ───────── */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = new URLSearchParams(location.search);
const REDUCED = Q.has('reduced') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const body = document.body, stage = $('#stage'), canvas = $('#gl');

/* ───────── картите идват от DOM-а (текстът живее само там) ───────── */
const CARDS = $$('#sheet article').map((el, i) => ({ i, el, title: el.dataset.title, teaser: el.dataset.teaser || '' }));
const N = CARDS.length, STEP = Math.PI * 2 / N;
CARDS.forEach(c => { c.a = c.i * STEP; c.A = 0; c.ph = c.i * 1.7; });

/* ───────── състояние: flow (поток) → focus (фокус) → open (картата) ───────── */
const S = { mode: 'flow', idx: 0, rot: 0.42, vel: 0, target: 0, fK: 0, oK: 0, drag: null, stir: 0, px: 0, seen: new Set(), near: -1, boost: 0, shots: 0, done: false, off: -1, tIdle: 0 };
const W_FLOW = -Math.PI * 2 / 50;                       // една обиколка ≈ 50 s · картите идват отдясно
const nearest = (rot = S.rot) => ((Math.round(-rot / STEP) % N) + N) % N;
const targetFor = (i, rot = S.rot) => -CARDS[i].a + Math.PI * 2 * Math.round((rot + CARDS[i].a) / (Math.PI * 2));

const bulbsNav = $('.bulbs');
bulbsNav.innerHTML = '<i aria-hidden="true">‹</i>' + CARDS.map(c => `<button type="button" aria-label="${c.title}"></button>`).join('') + '<i aria-hidden="true">›</i>';
const bulbBtns = $$('button', bulbsNav);
const sheet = $('#sheet'), sbody = $('.sheet-body'), sheetDotsBox = $('.sheet-dots');
sheetDotsBox.innerHTML = '<i></i>'.repeat(N); const sheetDots = $$('i', sheetDotsBox);
const menuBtns = $$('#menu button'); menuBtns.forEach(b => { b.dataset.i = CARDS.findIndex(c => c.el.id === b.dataset.go); });
$$('#menu li').forEach((li, i) => li.style.setProperty('--i', i));
function hud() {
  body.classList.remove('s-flow', 's-drag', 's-focus', 's-open'); body.classList.add('s-' + S.mode);
  const cur = S.mode === 'flow' || S.mode === 'drag' ? S.near : S.idx;
  for (const els of [bulbBtns, sheetDots]) els.forEach((b, i) => { b.classList.toggle('cur', i === cur); b.classList.toggle('lit', S.seen.has(i)); });
  menuBtns.forEach(b => b.classList.toggle('lit', S.seen.has(+b.dataset.i)));
}
function flow() { S.mode = 'flow'; hud(); render1(); }
function focus(i) {
  S.idx = ((i % N) + N) % N; S.target = targetFor(S.idx); S.mode = 'focus'; S.tIdle = performance.now(); hud();
  $('#live').textContent = CARDS[S.idx].title + ' — ' + CARDS[S.idx].teaser; posterGo(S.idx); render1();
}
function open(i = S.idx) {
  if (i !== S.idx || S.mode === 'flow' || S.mode === 'drag') focus(i);
  S.mode = 'open'; S.seen.add(S.idx); const c = CARDS[S.idx];
  CARDS.forEach(k => k.el.classList.toggle('on', k === c));
  sheet.setAttribute('aria-hidden', 'false'); body.classList.remove('reward-on', 'menu-on'); hud(); reveal(c.el); render1();
}
function close() {
  if (S.mode !== 'open') return;
  S.mode = body.classList.contains('poster') ? 'flow' : 'focus'; S.tIdle = performance.now(); sheet.setAttribute('aria-hidden', 'true'); hud(); render1();
  if (S.seen.size === N && !S.done) celebrate();
}
function celebrate() {                                   // 7/7 → златната обиколка: всички карти сглобени, прахът става злато, думите на учениците
  S.done = true; S.boost = 1; S.shots = 3; S.mode = 'flow'; body.classList.add('done', 'reward-on'); $('#reward').setAttribute('aria-hidden', 'false'); hud(); render1();
}
function go(id, sub) {
  body.classList.remove('menu-on'); const c = CARDS.find(c => c.el.id === id); if (!c) { if (S.mode === 'open') { S.mode = 'focus'; sheet.setAttribute('aria-hidden', 'true'); } return flow(); }
  open(c.i); const d = sub && document.getElementById(sub);
  if (d) { d.open = true; setTimeout(() => d.scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' }), 420); }
}
let posterGo = () => {};

/* ───────── листът: разкриване на текста ───────── */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: sbody, rootMargin: '0px 0px -4% 0px', threshold: .03 }) : null;
function splitWords(el) {                                // думите стават <span> (текстът не се променя) → светват една по една
  let i = 0; const walk = n => { for (const ch of [...n.childNodes]) {
    if (ch.nodeType === 3) { const f = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(tok => { if (!tok) return; if (/^\s+$/.test(tok)) f.append(tok); else { const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = tok; f.append(w); } }); ch.replaceWith(f); }
    else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch); } }; walk(el);
}
for (const c of CARDS) {
  $$('h2, h3, h4, p, ul.lit > li, .quotes > li, .ticket, hr.orn, details, .rail, .dots, blockquote', c.el).forEach(el => {
    const host = el.parentElement.closest('.ticket, .law, blockquote'); if (!host) el.classList.add('rv'); });
  $$('.lead', c.el).forEach(splitWords);
  const h2 = $('h2', c.el); if (h2 && h2.textContent.trim() === c.title) h2.classList.add('sr');   // същото заглавие вече свети на картата над листа
}
function reveal(el) {
  const r = $$('.rv', el); r.forEach((x, k) => { x.classList.remove('in'); x.style.setProperty('--d', (k < 7 ? 300 + k * 90 : 0) + 'ms'); });
  sbody.scrollTop = 0; void sbody.offsetHeight;
  if (io && !REDUCED) r.forEach(x => io.observe(x)); else r.forEach(x => x.classList.add('in'));
}
$$('[data-rail]').forEach(rail => {                      // въртележка във въртележката: 7-те закона
  const dots = [...rail.nextElementSibling.children], upd = () => { const i = Math.round(rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth) * (dots.length - 1)); dots.forEach((d, k) => d.classList.toggle('cur', k === i)); };
  rail.addEventListener('scroll', upd, { passive: true }); upd();
});
sheet.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); go(a.dataset.go, a.dataset.sub); } });
$('.sheet .prev').addEventListener('click', () => open(S.idx - 1)); $('.sheet .next').addEventListener('click', () => open(S.idx + 1)); $('.sheet .x').addEventListener('click', close);
{ let y0 = null; const hd = $('.sheet-head');
  hd.addEventListener('pointerdown', e => { y0 = e.clientY; }); hd.addEventListener('pointercancel', () => { y0 = null; });
  hd.addEventListener('pointerup', e => { if (y0 !== null && e.clientY - y0 > 44) close(); y0 = null; }); }
$('.menu-btn').addEventListener('click', () => { const on = body.classList.toggle('menu-on'); $('#menu').setAttribute('aria-hidden', String(!on)); body.classList.add('touched'); });
$('#menu').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.go); });
$('#reward').addEventListener('click', e => { if (!e.target.closest('a')) body.classList.remove('reward-on'); });
let render1 = () => {};                                  // постерът/GL го презаписват

/* ───────── WebGL сцената ───────── */
const U = { uTime: { value: 0 }, uPR: { value: 1 }, uScale: { value: 1 }, uAspect: { value: 1 }, uStir: { value: 0 }, uGold: { value: 0 }, uPointer: { value: new THREE.Vector2(9, 9) } };
const R_RIDE = 2.0, CW = 1.6, CH = 2.05, CY = 2.15, FOV = 50;
const POSE = { flow: { y: 2.9, z: 10.6, ly: 2.45 }, focus: { y: 2.3, z: 8.2, ly: 1.5 }, open: { y: 2.3, z: 8.2, ly: 0 } };   // z и ly се смятат във fit()
let renderer, scene, camera, carousel, frames = 0, raf = 0, tPrev = 0, D = null;   // D = живият декор: { paintCard, dust, riders, step }

const FLOW_GLSL = `
vec3 flow(vec3 p, float t){
  return vec3(sin(p.y*1.7+t*1.1)+sin(p.z*1.3-t*.7), sin(p.z*1.5+t*.9)+sin(p.x*1.1+t*.6), sin(p.x*1.9-t*.8)+sin(p.y*1.2+t*1.3));
}
vec4 stir(vec4 clip, float amt, vec2 pointer, float aspect){
  vec2 q = clip.xy/clip.w - pointer; q.x *= aspect;
  float f = exp(-dot(q,q)*20.)*amt;
  vec2 d = vec2(-q.y, q.x)*f*.42 + q*f*.3; d.x /= aspect;
  clip.xy += d*clip.w; return clip;
}`;

function canvasTex(cv, srgb = true) { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function build() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 1, .1, 220);
  carousel = new THREE.Group(); scene.add(carousel);

  /* ═══ шевът: всичко, което се вижда като стил, идва от декора · двигателят дава сцената, групата, която върти, и праха ═══ */
  const cfg = { renderer, carousel, stage, cards: CARDS, N, STEP, U, R_RIDE, CW, CH, CY, canvasTex, grains: null };
  D = decor(scene, cfg);
  const v3 = a => `vec3(${a.map(v => v.toFixed(4)).join(',')})`, gt = D.dust.grain;

  /* ═══ ездачите: 7 карти · всяка = пилон + кристален лист (чете се) + ~3800 зрънца прах (сглобява се/разпада се) ═══ */
  const grainMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aDust; attribute vec4 aSeed; attribute vec3 aCol;
      uniform float uTime,uA,uFocus,uPR,uScale,uStir,uAspect,uSz; uniform vec2 uPointer; varying vec3 vCol; varying float vAl;
      ${FLOW_GLSL}
      void main(){
        float a = clamp(uA*1.35 - aSeed.x*.35, 0., 1.); a = a*a*(3.-2.*a);
        vec3 dust = aDust + flow(aDust*.55 + aSeed.yzw*6.283, uTime*.22)*.42;
        vec3 home = position + flow(position*5. + aSeed.yzw*6.283, uTime*.9)*.006*(1.-uFocus*.7);
        vec3 p = mix(dust, home, a);
        float arc = sin(a*3.14159);
        p += (aSeed.yzw-.5)*arc*.8; p.y += arc*.3;
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = stir(projectionMatrix*mv, uStir*(1.-a*.6), uPointer, uAspect);
        float tw = .7+.3*sin(uTime*(2.+aSeed.y*3.)+aSeed.z*40.);
        float sz = mix(2.5/uSz, 1.1, a)*(.55+aSeed.w*.9)*(1.+uFocus*.18);
        gl_PointSize = clamp(sz*uSz*uScale*uPR*6.2/(-mv.z), 1., 48.);
        vCol = mix(aCol*${v3(D.dust.loose)}, aCol, a); vAl = mix(.62/(uSz*uSz), .95, a)*tw;
      }`,
    fragmentShader: `varying vec3 vCol; varying float vAl;
      void main(){ vec2 c=gl_PointCoord-.5; float d=dot(c,c)*4.; if(d>1.)discard; float g=pow(1.-d,2.2); gl_FragColor=vec4(vCol*g*vAl,1.); }`
  });
  cfg.grains = uSz => { const m = grainMat.clone(); m.uniforms = { ...U, uA: { value: 0 }, uFocus: { value: 0 }, uSz: { value: uSz } }; return m; };
  const planeGeo = new THREE.PlaneGeometry(CW, CH);
  for (const c of CARDS) {
    const g = new THREE.Group(); g.position.set(Math.sin(c.a) * R_RIDE, CY, Math.cos(c.a) * R_RIDE); g.rotation.y = c.a; carousel.add(g); c.g = g;
    c.plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: canvasTex(D.paintCard(c, false)), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    c.plane.userData.i = c.i; g.add(c.plane);
    // зрънцата: проба от „светещия“ слой на картата
    const cv = D.paintCard(c, true), W = cv.width, H = cv.height, px = cv.getContext('2d').getImageData(0, 0, W, H).data, cand = [];
    for (let i = 3; i < px.length; i += 4) if (px[i] > 70) cand.push(i >> 2);
    const n = 3800, pos = new Float32Array(n * 3), dust = new Float32Array(n * 3), seed = new Float32Array(n * 4), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const k = cand[(Math.random() * cand.length) | 0], x = k % W, y = (k / W) | 0;
      pos[i * 3] = ((x + Math.random()) / W - .5) * CW; pos[i * 3 + 1] = (.5 - (y + Math.random()) / H) * CH; pos[i * 3 + 2] = .012 + Math.random() * .03;
      let u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.cbrt(Math.random()), s = Math.sqrt(1 - u * u);
      dust[i * 3] = r * s * Math.cos(th) * 2.3; dust[i * 3 + 1] = r * u * 2.1 + .25; dust[i * 3 + 2] = r * s * Math.sin(th) * 2.3 - .3;
      seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random();
      const b = 1.05 + Math.random() * .35; col[i * 3] = px[k * 4] / 255 * b * gt[0]; col[i * 3 + 1] = px[k * 4 + 1] / 255 * b * gt[1]; col[i * 3 + 2] = px[k * 4 + 2] / 255 * b * gt[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aDust', new THREE.BufferAttribute(dust, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    c.mat = cfg.grains(1);
    const pts = new THREE.Points(geo, c.mat); pts.frustumCulled = false; g.add(pts);
  }

  if (D.riders) D.riders();                               // декорът добавя това, което язди между картите (след тях → същият ред на раждане като донора)

  /* ═══ прахът, който пълни цялото пространство (eidolon): носи се, трепти, обикаля с въртележката, пръстът го разбърква ═══ */
  { const n = 9000, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 11; pos[i * 3 + 1] = .15 + Math.pow(Math.random(), 1.25) * 9.5; pos[i * 3 + 2] = -13 + Math.random() * 23.2;
      seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random();
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aSeed; uniform float uTime,uPR,uScale,uStir,uAspect,uGold; uniform vec2 uPointer; varying vec3 vCol; varying float vAl;
        ${FLOW_GLSL}
        void main(){
          vec3 p = position + flow(position*.33 + aSeed.xyz*6.283, uTime*.13)*.95;
          float r = length(p.xz), ang = -uTime*.05*smoothstep(12., 2.5, r);
          float cs = cos(ang), sn = sin(ang); p.xz = mat2(cs, -sn, sn, cs)*p.xz;
          vec4 mv = modelViewMatrix*vec4(p,1.);
          gl_Position = stir(projectionMatrix*mv, uStir, uPointer, uAspect);
          float sz = clamp((1.+aSeed.w*aSeed.w*3.4)*(1.+uGold*.7)*uScale*uPR*6.6/(-mv.z), 1., 40.);
          gl_PointSize = sz;
          float lit = .42 + .58*exp(-dot(p.xz,p.xz)*.02);
          float tw = .5+.5*sin(uTime*(.8+aSeed.x*2.4)+aSeed.y*40.);
          vAl = lit*(.3+.7*tw)*clamp(8./sz, .1, 1.)*(1.+uGold*1.5);
          vCol = mix(mix(${v3(D.dust.air[0])}, ${v3(D.dust.air[1])}, aSeed.z), ${v3(D.dust.gold)}, uGold*.7);
        }`,
      fragmentShader: `varying vec3 vCol; varying float vAl;
        void main(){ vec2 c=gl_PointCoord-.5; float d=dot(c,c)*4.; if(d>1.)discard; float g=pow(1.-d,2.); gl_FragColor=vec4(vCol*g*vAl,1.); }`
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); }

  fit(); addEventListener('resize', () => { fit(); render1(); });
  render1 = () => { if (!raf) { step(performance.now() / 1000, 0); renderer.render(scene, camera); } };
}

function fit() {
  const w = innerWidth, h = innerHeight, desk = w >= 900; renderer.setSize(w, h, false); camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix(); S.off = -1;
  const tv = Math.tan(FOV * Math.PI / 360), th = tv * camera.aspect, dist = (wf, hf) => Math.max(CW / (2 * th * wf), CH / (2 * tv * hf));
  const aim = (cy, cz, yW, ndc) => cy + cz * Math.tan(Math.atan((yW - cy) / (cz - R_RIDE)) - Math.atan(ndc * tv));   // накъде да гледа камерата, за да застане yW на височина ndc
  POSE.flow.z = R_RIDE + dist(.54, .30); POSE.focus.z = POSE.open.z = R_RIDE + dist(.76, desk ? .54 : .5);
  POSE.focus.ly = aim(POSE.focus.y, POSE.focus.z, CY, desk ? .02 : .16);
  POSE.open.ly = desk ? POSE.focus.ly : aim(POSE.open.y, POSE.open.z, CY + .2, .7);          // листът покрива долните 76% → заглавието на картата остава над него
  U.uAspect.value = camera.aspect; U.uScale.value = h / 812; U.uPR.value = renderer.getPixelRatio();
}

/* ───────── една стъпка на света (вика се САМО от tick → един rAF) ───────── */
function step(t, dt) {
  const d = S.drag;
  if (S.mode === 'flow') { S.vel += (W_FLOW * (1 + 7 * S.boost) - S.vel) * (1 - Math.exp(-dt * 1.4)); S.rot += S.vel * dt; }
  else if (!(d && d.h)) { const k = 44, c = 2 * Math.sqrt(k) * .9; S.vel += (-k * (S.rot - S.target) - c * S.vel) * dt; S.rot += S.vel * dt; }
  carousel.rotation.y = S.rot;
  S.boost *= Math.exp(-dt * .42); if (S.boost < .003) S.boost = 0; const all = smooth(0, .3, S.boost);
  if (S.mode === 'focus' && !d && performance.now() - S.tIdle > 18000) flow();        // тапът държи · после потокът се връща сам
  const e = 1 - Math.exp(-dt * 4.2);
  S.fK += ((S.mode === 'flow' ? 0 : S.mode === 'drag' ? .3 : 1) - S.fK) * e; S.oK += ((S.mode === 'open' ? 1 : 0) - S.oK) * e;
  const f = S.fK * S.fK * (3 - 2 * S.fK), o = S.oK * S.oK * (3 - 2 * S.oK);
  const cy = lerp(lerp(POSE.flow.y, POSE.focus.y, f), POSE.open.y, o), cz = lerp(lerp(POSE.flow.z, POSE.focus.z, f), POSE.open.z, o), ly = lerp(lerp(POSE.flow.ly, POSE.focus.ly, f), POSE.open.ly, o);
  camera.position.set(Math.sin(t * .13) * .16 * (1 - f) + S.px * .3, cy + Math.sin(t * .17) * .04, cz); camera.lookAt(-S.px * .12, ly, 0);
  const off = innerWidth >= 900 ? Math.round(o * Math.min(540, innerWidth * .44) / 2) : 0;                 // десктоп: листът е вдясно → сцената се отмества наляво
  if (off !== S.off) { S.off = off; if (off) camera.setViewOffset(innerWidth, innerHeight, off, 0, innerWidth, innerHeight); else camera.clearViewOffset(); }
  for (const c of CARDS) {
    const dd = Math.abs(wrapPi(c.a + S.rot)), aFlow = lerp(1 - smooth(.35, 2.6, dd), 1, all), isF = c.i === S.idx;
    const aT = lerp(aFlow, isF ? 1 : aFlow * .1, clamp((S.fK - .3) / .7, 0, 1));
    c.A += (aT - c.A) * (dt ? 1 - Math.exp(-dt * 5) : 1);
    c.mat.uniforms.uA.value = c.A; c.mat.uniforms.uFocus.value = isF ? f : 0;
    c.plane.material.opacity = smooth(.7, .975, c.A);
    c.g.position.y = CY + Math.sin(t * 1.25 + c.ph) * .08 * (1 - .75 * f); c.g.rotation.z = Math.sin(t * .9 + c.ph) * .018 * (1 - f);
  }
  if (D.step) { F.t = t; F.dt = dt; F.rot = S.rot; F.all = all; F.shots = S.shots; D.step(F); S.shots = F.shots; }   // декорът живее в същия кадър
  U.uGold.value = S.boost; U.uTime.value = t; U.uStir.value += (S.stir - U.uStir.value) * (1 - Math.exp(-dt * 5));
  const near = nearest(); if (near !== S.near) { S.near = near; if (S.mode === 'flow' || S.mode === 'drag') hud(); }
}
function tick(now) {
  raf = requestAnimationFrame(tick);
  const t = now / 1000, dt = Math.min(.05, tPrev ? t - tPrev : .016); tPrev = t; frames++;
  step(t, dt); renderer.render(scene, camera);
}

/* ───────── жестове: свайп върти · тап фокусира · тап върху фокусираната карта я отваря ───────── */
const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
function pick(x, y) {
  if (!camera) return -1; v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, camera);
  const hit = ray.intersectObjects(CARDS.map(c => c.plane), false)[0]; return hit ? hit.object.userData.i : -1;
}
const setPointer = e => { U.uPointer.value.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); S.px += ((e.clientX / innerWidth * 2 - 1) * (e.pointerType === 'mouse' ? 1 : 0) - S.px) * .08; };
stage.addEventListener('pointerdown', e => {
  if (!e.isPrimary) return; body.classList.add('touched'); try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  S.drag = { x0: e.clientX, y0: e.clientY, t: performance.now(), rot0: S.rot, mode0: S.mode, moved: false, h: false }; S.stir = 1; setPointer(e);
});
stage.addEventListener('pointermove', e => {
  setPointer(e); if (e.pointerType === 'mouse') S.stir = 1;
  const d = S.drag; if (!d) return;
  const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
  if (!d.moved && Math.hypot(dx, dy) > 9) { d.moved = true; d.h = Math.abs(dx) >= Math.abs(dy); if (d.h && S.mode !== 'open') { S.mode = 'drag'; hud(); } }
  if (d.moved && d.h && S.mode === 'drag') {
    const now = performance.now(), nr = d.rot0 + dx * STEP / (innerWidth * .62), ddt = Math.max(.004, (now - d.t) / 1000);
    S.vel = lerp(S.vel, (nr - S.rot) / ddt, .5); S.rot = nr; d.t = now; render1();
  }
});
const release = e => {
  const d = S.drag; S.drag = null; if (e.pointerType !== 'mouse') S.stir = 0; if (!d) return;
  if (!d.moved) {                                         // тап
    if (body.classList.contains('reward-on')) { body.classList.remove('reward-on'); return; }
    const hit = pick(e.clientX, e.clientY);
    if (S.mode === 'flow') focus(hit >= 0 ? hit : nearest());
    else if (S.mode === 'focus') { if (hit === S.idx) open(); else if (hit >= 0) focus(hit); else flow(); }
    else if (S.mode === 'open') close();
  } else if (d.h && S.mode === 'drag') {                  // свайп → най-близката карта по посоката на замаха
    let i = nearest(S.rot + clamp(S.vel * .12, -STEP * .5, STEP * .5));     // един замах = една карта (инерцията добавя най-много половин стъпка)
    if (d.mode0 !== 'flow' && i === S.idx && Math.abs(S.rot - d.rot0) > STEP * .16) i = S.idx + (S.rot < d.rot0 ? 1 : -1);
    focus(i);
  } else if (!d.h && S.mode === 'focus' && e.clientY - d.y0 < -40) open();   // дръпни картата нагоре
};
stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
stage.addEventListener('pointerleave', () => { if (!S.drag) S.stir = 0; });
$('.more').addEventListener('click', () => open());
bulbBtns.forEach((b, i) => b.addEventListener('click', () => { body.classList.add('touched'); if (S.mode !== 'flow' && S.idx === i) open(); else focus(i); }));
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') focus((S.mode === 'flow' ? nearest() : S.idx) + 1); else if (e.key === 'ArrowLeft') focus((S.mode === 'flow' ? nearest() : S.idx) - 1);
  else if (e.key === 'Escape') { if (S.mode === 'open') close(); else flow(); }
  else if ((e.key === 'Enter' || e.key === ' ') && S.mode === 'focus' && document.activeElement === body) { e.preventDefault(); open(); }
});
let wheelT = 0;
stage.addEventListener('wheel', e => { const now = performance.now(); if (now - wheelT < 420 || S.mode === 'open') return; const dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(dl) < 8) return; wheelT = now; focus((S.mode === 'flow' ? nearest() : S.idx) + (dl > 0 ? 1 : -1)); }, { passive: true });

/* ───────── пускане ───────── */
function poster(why) {
  body.classList.add('poster', 'ready'); body.dataset.poster = why;
  const rail = document.createElement('div'); rail.className = 'prail';
  for (const c of CARDS) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pcard'; b.dataset.i = c.i;
    for (const [tag, text] of [['b', c.title], ['span', c.teaser], ['em', $('.more').textContent]]) { const e = document.createElement(tag); e.textContent = text; b.append(e); } rail.append(b); }
  rail.addEventListener('click', e => { const b = e.target.closest('.pcard'); if (b) open(+b.dataset.i); });
  rail.addEventListener('scroll', () => { const i = Math.round(rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth) * (N - 1)); if (i !== S.near) { S.near = i; hud(); } }, { passive: true });
  body.append(rail); S.near = 0; hud();
  posterGo = i => { rail.children[i].scrollIntoView({ inline: 'center', block: 'nearest' }); if (S.mode === 'focus') { S.mode = 'flow'; S.near = i; hud(); } };
}
const fontsReady = () => Promise.race([
  Promise.all((decor.fonts || []).map(f => document.fonts.load(f, decor.fontProbe || 'A'))).catch(() => {}),
  new Promise(r => setTimeout(r, 2600))]);
(async () => {
  hud();
  if (REDUCED) return poster('reduced');
  try { await fontsReady(); build(); } catch (err) { console.warn('GL', err); return poster('no-gl'); }
  step(performance.now() / 1000, 0); for (const c of CARDS) { c.A = 1 - smooth(.35, 2.6, Math.abs(wrapPi(c.a + S.rot))); } step(performance.now() / 1000, 0);
  renderer.render(scene, camera); body.classList.add('ready');
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { tPrev = 0; raf = requestAnimationFrame(tick); } });
  if (!document.hidden) raf = requestAnimationFrame(tick);
})();

/* гейт-кука (Playwright): кадри · състояние · управление */
window.__proto = { dbg: () => ({ renderer, scene, camera, carousel }), frames: () => frames, state: () => ({ mode: S.mode, idx: S.idx, near: S.near, seen: [...S.seen], rot: S.rot, poster: body.dataset.poster || null }), focus, open, close, flow,
  fps: (ms = 2000) => new Promise(r => { const f0 = frames, t0 = performance.now(); setTimeout(() => r(Math.round((frames - f0) / (performance.now() - t0) * 10000) / 10), ms); }) };
}
