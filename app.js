/* maitapp v2 · "Музей на осемте нива" · point-cloud engine (EIDOLON recipe)
   One BufferGeometry · attributes: position(=aHome)/aDust/aSeed/aClass/aData
   One uAssembly uniform driven by viewport centeredness · pseudo-curl dust ·
   Gaussian cursor swirl · hold-to-focus · additive, depthWrite:false, frustumCulled=false. */
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ── capability tier ─────────────────────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = window.matchMedia('(max-width: 899px)').matches;
const LOW_POWER = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2;
const COUNT = IS_MOBILE ? (LOW_POWER ? 18000 : 30000) : (LOW_POWER ? 34000 : 58000);
const DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 2 : 1.75);

/* ── canonical palette (8 scenes of the metalanguage) ────────── */
const PALETTE_HEX = ['#E8C77E', '#D4895E', '#4A7FA8', '#6FB59A', '#E89556', '#8B5E3C', '#E8C77E', '#7B5EA8'];
const PALETTE = PALETTE_HEX.map(h => new THREE.Color(h));
const BONE = new THREE.Color('#efe7d3');

/* ── deterministic rng (same exhibit → same cloud on every load) */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── shared generator helpers ────────────────────────────────── */
/* Sample a 2D lathe profile [[r,y],...] uniformly BY ARC LENGTH (not by t). */
function sampleProfileArc(profile, n, rand) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i], [r1, y1] = profile[i + 1];
    // weight by arc length × mean radius → uniform SURFACE density after the θ sweep
    const len = Math.hypot(r1 - r0, y1 - y0) * Math.max(0.05, (r0 + r1) / 2);
    segs.push({ r0, y0, r1, y1, len, acc: total });
    total += len;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    const d = rand() * total;
    let s = segs[0];
    for (let i = 0; i < segs.length; i++) { if (segs[i].acc <= d) s = segs[i]; else break; }
    const f = s.len > 0 ? (d - s.acc) / s.len : 0;
    out.push({ r: s.r0 + (s.r1 - s.r0) * f, y: s.y0 + (s.y1 - s.y0) * f, t: d / total });
  }
  return out;
}

/* ── geometry buffers ────────────────────────────────────────── */
const home = new Float32Array(COUNT * 3);
const dust = new Float32Array(COUNT * 3);
const seed = new Float32Array(COUNT);
const cls = new Float32Array(COUNT);
const data = new Float32Array(COUNT);

{ // stable dust shell + seeds (never rewritten)
  const r = mulberry32(20260712);
  for (let i = 0; i < COUNT; i++) {
    const rad = 2.6 + r() * 4.2;
    const th = r() * TAU, ph = Math.acos(2 * r() - 1);
    dust[i * 3] = rad * Math.sin(ph) * Math.cos(th);
    dust[i * 3 + 1] = rad * Math.sin(ph) * Math.sin(th) * 0.72;
    dust[i * 3 + 2] = rad * Math.cos(ph) * 0.8;
    seed[i] = r();
  }
}

/* ═══ EXHIBIT GENERATORS ══════════════════════════════════════
   gen(home, cls, data, N, rand) fills all N points.
   cls = -1 parks a point in dust. data = per-point aux 0..1.      */

/* Exhibit I · Чашата, още неналята със злато
   classes: 0 wall · 1 water · 2 hero mote · 3 vector              */
function cupProfile() {
  return [
    [0.02, 0.00], [0.60, 0.00], [0.62, 0.06], [0.58, 0.10], [0.16, 0.16],
    [0.10, 0.30], [0.085, 0.60], [0.09, 0.88], [0.30, 1.02], [0.58, 1.22],
    [0.78, 1.48], [0.90, 1.78], [0.95, 2.05], [0.97, 2.30],
  ];
}
const CUP_Y0 = 1.15;               // vertical centering shift
const CUP_WATER_Y = 2.02 - CUP_Y0; // water surface height (cloud-local)
const CUP_WATER_R = 0.86;
const CUP_HERO = [0.97 * Math.cos(1.05), 2.30 - CUP_Y0, 0.97 * Math.sin(1.05)];

function genCup(home, cls, data, N, rand) {
  const nWall = Math.floor(N * 0.815), nWater = Math.floor(N * 0.165);
  const nHero = Math.floor(N * 0.003), nVec = N - nWall - nWater - nHero;
  const prof = sampleProfileArc(cupProfile(), nWall, rand);
  let i = 0;
  for (let k = 0; k < nWall; k++, i++) {
    const p = prof[k], th = rand() * TAU;
    const j = (rand() - 0.5) * 0.012; // jitter along the normal → wall thickness
    const r = p.r + j;
    home[i * 3] = r * Math.cos(th);
    home[i * 3 + 1] = p.y - CUP_Y0 + (rand() - 0.5) * 0.008;
    home[i * 3 + 2] = r * Math.sin(th);
    cls[i] = 0;
    data[i] = Math.max(0, Math.min(1, (p.y - 0.9) / 1.4)); // rim proximity → amber rim-glow
  }
  for (let k = 0; k < nWater; k++, i++) { // dense disc, uniform: r·√rand
    const r = CUP_WATER_R * Math.sqrt(rand()), th = rand() * TAU;
    home[i * 3] = r * Math.cos(th);
    home[i * 3 + 1] = CUP_WATER_Y + (rand() - 0.5) * 0.035;
    home[i * 3 + 2] = r * Math.sin(th);
    cls[i] = 1;
    data[i] = r / CUP_WATER_R;
  }
  for (let k = 0; k < nHero; k++, i++) { // one bright mote = tight cluster
    home[i * 3] = CUP_HERO[0] + (rand() - 0.5) * 0.05;
    home[i * 3 + 1] = CUP_HERO[1] + (rand() - 0.5) * 0.05;
    home[i * 3 + 2] = CUP_HERO[2] + (rand() - 0.5) * 0.05;
    cls[i] = 2;
    data[i] = rand();
  }
  for (let k = 0; k < nVec; k++, i++) { // vector: hero → water centre (2-3px, glowing)
    const t = rand();
    home[i * 3] = CUP_HERO[0] * (1 - t) + (rand() - 0.5) * 0.016;
    home[i * 3 + 1] = CUP_HERO[1] * (1 - t) + CUP_WATER_Y * t + (rand() - 0.5) * 0.016;
    home[i * 3 + 2] = CUP_HERO[2] * (1 - t) + (rand() - 0.5) * 0.016;
    cls[i] = 3;
    data[i] = t;
  }
}

/* Stub: park everything in dust (exhibits II-VIII arrive in later tickets). */
function genDustOnly(home, cls, data, N) {
  for (let i = 0; i < N; i++) { cls[i] = -1; data[i] = 0; }
}

const GENERATORS = [genCup, genDustOnly, genDustOnly, genDustOnly, genDustOnly, genDustOnly, genDustOnly, genDustOnly];

/* ═══ SHADERS ═════════════════════════════════════════════════
   Exhibit blocks live in EX_BLOCKS[i]; each block reads
   (seedv, clsv, datv, uniforms) and writes hp / a / col / sizeF / alphaF. */

const EX1_GLSL = /* glsl */`
  // cls: 0 wall · 1 water · 2 hero · 3 vector
  float delay = (clsv > 0.5 && clsv < 1.5) ? 0.45 : 0.0;   // water pours LAST
  a = asm2(uAssembly, seedv, delay);
  if (clsv < 0.5) {            // wall: bone with amber rim-glow (emission capped)
    col = mix(uBone, uPal[0], datv * 0.55);
    alphaF = 0.85;
  } else if (clsv < 1.5) {     // water: saturated amber body, alive tremble
    float tremble = (1.0 - uFocus) * (1.0 - uReduced);
    hp.y += tremble * 0.020 * sin(uTime * 2.1 + seedv * 41.0 + datv * 9.0);
    hp.x += tremble * 0.006 * sin(uTime * 1.7 + seedv * 23.0);
    col = uPal[0] * (1.15 + 0.25 * uFocus);   // focus → mirror brightens
    sizeF = 1.15;
  } else if (clsv < 2.5) {     // the Hero mote
    col = uPal[0] * 1.8;
    sizeF = 3.0;
  } else {                     // vector Hero→meta: thickened + amber glow
    col = uPal[0] * 1.35;
    sizeF = 1.7;
    alphaF = 0.9;
  }
`;

const EX_STUB_GLSL = /* glsl */`a = 0.0;`;

const EX_BLOCKS = [EX1_GLSL, EX_STUB_GLSL, EX_STUB_GLSL, EX_STUB_GLSL, EX_STUB_GLSL, EX_STUB_GLSL, EX_STUB_GLSL, EX_STUB_GLSL];

function buildVertexShader() {
  const chain = EX_BLOCKS.map((body, i) =>
    `${i ? 'else ' : ''}if (uExhibit < ${i}.5) {\n${body}\n}`).join('\n    ');
  return /* glsl */`
  attribute vec3 aDust;
  attribute float aSeed;
  attribute float aClass;
  attribute float aData;
  uniform float uTime, uAssembly, uProgress, uFocus, uSwirl, uExhibit, uReduced, uFlash, uDemo, uSizeBase, uPx;
  uniform vec3 uOffset, uPointer, uBone;
  uniform vec3 uPal[8];
  varying vec3 vColor;
  varying float vAlpha;

  float asm2(float u, float s, float d) {
    return smoothstep(0.0, 1.0, u * (1.35 + d) - (s * 0.35 + d));
  }

  void main() {
    float seedv = aSeed, clsv = aClass, datv = aData;

    // pseudo-curl dust drift: 3 layered sin terms per axis (free on GPU)
    vec3 dp = aDust;
    float tt = uTime * (1.0 - uReduced * 0.94);
    dp.x += 0.55 * sin(tt * 0.11 + aDust.y * 0.70 + seedv * 6.28)
          + 0.20 * sin(tt * 0.23 + aDust.z * 1.30 + seedv * 12.6);
    dp.y += 0.42 * sin(tt * 0.13 + aDust.z * 0.80 + seedv * 4.71)
          + 0.16 * sin(tt * 0.19 + aDust.x * 1.10 + seedv * 8.1);
    dp.z += 0.50 * sin(tt * 0.09 + aDust.x * 0.60 + seedv * 9.42);

    vec3 hp = position;
    float a = 0.0;
    vec3 col = uBone;
    float sizeF = 1.0, alphaF = 1.0;

    if (clsv < -0.5) { a = 0.0; }
    ${chain}

    vec3 p = mix(dp, hp, a);

    // cursor swirl: Gaussian falloff, tangential push (strong on dust, subtle when assembled)
    vec2 toP = p.xy - uPointer.xy;
    float d2 = dot(toP, toP);
    float g = exp(-d2 * 0.9) * uSwirl;
    vec2 tang = normalize(vec2(-toP.y, toP.x) + vec2(1e-4));
    p.xy += tang * g * mix(0.9, 0.14, a);
    sizeF *= 1.0 + g * 1.4;

    p += uOffset;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float ps = uSizeBase * mix(0.55, 1.35, seedv) * sizeF * mix(0.55, 1.15, a) * (uPx * 16.0 / max(1.0, -mv.z));
    gl_PointSize = clamp(ps, 0.75, 6.5);
    gl_Position = projectionMatrix * mv;

    vColor = min(col, vec3(1.6));           // cap additive emission
    // museum dust is sparse: most idle grains near-invisible, a few glimmer
    float dustA = 0.05 + 0.30 * smoothstep(0.72, 1.0, seedv);
    vAlpha = alphaF * mix(dustA, 0.20, a); // assembled grains stay translucent — form = accumulation, not solid fill
  }`;
}

const FRAG = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float m = smoothstep(0.5, 0.10, length(uv));
    if (m < 0.01) discard;
    gl_FragColor = vec4(vColor, vAlpha * m);
  }`;

/* ═══ RENDERER / SCENE ════════════════════════════════════════ */
const canvas = document.getElementById('stage');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

const state = {
  exhibit: 0, assembly: 0, assemblyT: 0, progress: 0, progressT: 0,
  focus: 0, focusT: 0, swirl: 0, swirlT: 0, flash: 0, demo: 0,
  offset: new THREE.Vector3(), offsetT: new THREE.Vector3(),
  pointer: new THREE.Vector3(), time: 0,
};

let scene, camera, material, points, uniforms;

function initGL() {
  renderer.setPixelRatio(DPR);
  renderer.setClearColor('#07090b', 1);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 60);
  camera.position.set(0, 0, 7.2);
  camera.lookAt(0, 0, 0);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(home, 3));
  geo.setAttribute('aDust', new THREE.BufferAttribute(dust, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aClass', new THREE.BufferAttribute(cls, 1));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 1));

  uniforms = {
    uTime: { value: 0 }, uAssembly: { value: 0 }, uProgress: { value: 0 },
    uFocus: { value: 0 }, uSwirl: { value: 0 }, uExhibit: { value: 0 },
    uReduced: { value: REDUCED ? 1 : 0 }, uFlash: { value: 0 }, uDemo: { value: 0 },
    uSizeBase: { value: IS_MOBILE ? 0.85 : 0.95 }, uPx: { value: DPR },
    uOffset: { value: state.offset }, uPointer: { value: state.pointer },
    uBone: { value: new THREE.Vector3(BONE.r, BONE.g, BONE.b) },
    uPal: { value: PALETTE.map(c => new THREE.Vector3(c.r, c.g, c.b)) },
  };

  material = new THREE.ShaderMaterial({
    vertexShader: buildVertexShader(),
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  points = new THREE.Points(geo, material);
  points.frustumCulled = false; // real positions live in the shader
  scene.add(points);

  // debug handle (guide lesson: when nothing draws, print camera.position first)
  window.__museum = { camera, renderer, uniforms, state };
}

function loadHome(idx) {
  const rand = mulberry32(1000 + idx * 7919);
  GENERATORS[idx](home, cls, data, COUNT, rand);
  const g = points.geometry;
  g.attributes.position.needsUpdate = true;
  g.attributes.aClass.needsUpdate = true;
  g.attributes.aData.needsUpdate = true;
  uniforms.uExhibit.value = idx;
}

/* ═══ SCROLL / SECTION DRIVER ═════════════════════════════════ */
const sections = Array.from(document.querySelectorAll('[data-exhibit]'));
const counterEl = document.getElementById('cNum');

function centeredness(rect, vh) {
  const c = rect.top + rect.height / 2;
  return Math.max(0, 1 - Math.abs(c - vh / 2) / (vh * 0.78));
}

function driveSections() {
  if (state.peekLock != null) { // verification harness: pinned exhibit
    state.assemblyT = 1;
    state.progressT = state.progressLock;
    return;
  }
  const vh = innerHeight;
  let best = -1, bestC = 0;
  let heroC = 0;
  for (const s of sections) {
    const rect = s.getBoundingClientRect();
    if (rect.bottom < -vh || rect.top > vh * 2) continue;
    const c = centeredness(rect, vh);
    const idx = +s.dataset.exhibit;
    if (idx < 0) { heroC = Math.max(heroC, c); continue; }
    if (c > bestC) { bestC = c; best = idx; }
  }
  if (best >= 0 && best !== state.exhibit) {
    state.exhibit = best;
    loadHome(best);
    state.assembly = Math.min(state.assembly, 0.22); // inhale from dust after rewrite
    updateCounter(best);
  }
  const target = heroC > bestC ? 0 : Math.pow(bestC, 1.35);
  state.assemblyT = REDUCED ? (bestC > 0.05 ? 1 : 0) : target;

  // within-section progress driver (passive scroll position → phase timeline)
  const active = sections.find(s => +s.dataset.exhibit === state.exhibit);
  if (active) {
    const r = active.getBoundingClientRect();
    state.progressT = Math.max(0, Math.min(1, (vh / 2 - r.top) / Math.max(1, r.height)));
  }
}

function updateCounter(idx) {
  if (counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0');
  document.documentElement.style.setProperty('--scene', PALETTE_HEX[idx]);
}

/* cloud placement: mobile → upper clean band; desktop → opposite the plaque */
const mqMobile = window.matchMedia('(max-width: 899px)');
function driveOffset() {
  if (mqMobile.matches) { state.offsetT.set(0, 1.35, 0); return; }
  const active = sections.find(s => +s.dataset.exhibit === state.exhibit);
  const alt = active && active.classList.contains('alt'); // alt = plaque on the left
  state.offsetT.set(alt ? 1.25 : -1.25, 0, 0);            // cloud opposite the plaque
}

/* ═══ POINTER (never a sentinel as animation target) ═════════ */
let lastPX = 0, lastPY = 0, lastPT = 0;
let holdTimer = null;

function pointerToLocal(clientX, clientY) {
  const nx = (clientX / innerWidth) * 2 - 1;
  const ny = -(clientY / innerHeight) * 2 + 1;
  const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
  const dir = v.sub(camera.position).normalize();
  if (Math.abs(dir.z) < 1e-4) return;
  const t = (0 - camera.position.z) / dir.z;
  const world = camera.position.clone().add(dir.multiplyScalar(t));
  state.pointer.copy(world.sub(state.offset)); // cloud-local coords
}

addEventListener('pointermove', (e) => {
  const now = performance.now();
  const dt = Math.max(16, now - lastPT);
  const v = Math.hypot(e.clientX - lastPX, e.clientY - lastPY) / dt;
  lastPX = e.clientX; lastPY = e.clientY; lastPT = now;
  state.swirlT = Math.min(1, state.swirlT * 0.6 + v * 1.6);
  pointerToLocal(e.clientX, e.clientY);
  if (holdTimer && Math.hypot(e.clientX - holdX, e.clientY - holdY) > 9) cancelHold();
}, { passive: true });

let holdX = 0, holdY = 0;
function cancelHold() { clearTimeout(holdTimer); holdTimer = null; state.focusT = 0; }
addEventListener('pointerdown', (e) => {
  if (e.target.closest('a,button,input,label,textarea,select,.plaque,.wl-card,dialog')) return;
  holdX = e.clientX; holdY = e.clientY;
  pointerToLocal(e.clientX, e.clientY);
  holdTimer = setTimeout(() => { state.focusT = 1; }, 160);
}, { passive: true });
addEventListener('pointerup', cancelHold, { passive: true });
addEventListener('pointercancel', cancelHold, { passive: true });

/* ═══ MAIN LOOP ═══════════════════════════════════════════════ */
let lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state.time += dt;

  driveSections();
  driveOffset();

  const k = 1 - Math.pow(0.0018, dt); // frame-rate independent ease
  state.assembly += (state.assemblyT - state.assembly) * k;
  state.progress += (state.progressT - state.progress) * k;
  state.focus += (state.focusT - state.focus) * (1 - Math.pow(0.001, dt));
  state.swirlT *= Math.pow(0.25, dt); // swirl decays when the mouse rests
  state.swirl += (state.swirlT - state.swirl) * k;
  state.offset.lerp(state.offsetT, k);

  uniforms.uTime.value = REDUCED ? 12.0 : state.time;
  uniforms.uAssembly.value = state.assembly;
  uniforms.uProgress.value = state.progress;
  uniforms.uFocus.value = state.focus;
  uniforms.uSwirl.value = state.swirl;
  uniforms.uFlash.value = state.flash;
  uniforms.uDemo.value = state.demo;

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  if (!renderer) return;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

/* ═══ PLAQUE REVEAL (amber rule lines draw in) ═══════════════ */
const po = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('visible'); po.unobserve(en.target); }
    }, { threshold: 0.25 })
  : null;
document.querySelectorAll('.plaque').forEach(p => po ? po.observe(p) : p.classList.add('visible'));

/* ═══ BOOT ════════════════════════════════════════════════════ */
const NOGL = new URLSearchParams(location.search).get('nogl'); // verification: DOM-only mode
if (NOGL && renderer) { renderer = null; }
if (renderer && renderer.getContext()) {
  initGL();
  renderer.setSize(innerWidth, innerHeight);
  loadHome(0);
  updateCounter(0);
  requestAnimationFrame(frame);
} else {
  document.body.classList.add('no-webgl'); // DOM copy carries everything on its own
  if (canvas) canvas.remove();
}

/* verification harness (scroll-free: headless captures of scrolled pages come out black):
   ?peek=N isolates exhibit N at scroll 0, forces assembly=1 · ?prog=0..1 sets progress · ?diag=1 overlay */
{
  const qs = new URLSearchParams(location.search);
  const peek = qs.get('peek');
  if (peek) {
    document.querySelectorAll('main > section').forEach(s => {
      if (s.id !== 'ex-' + peek && !(peek === 'hero' && s.id === 'hero')) s.style.display = 'none';
    });
    const idx = parseInt(peek, 10) - 1;
    if (renderer && !isNaN(idx) && idx >= 0 && idx < 8) {
      state.peekLock = idx;
      state.progressLock = qs.get('prog') !== null ? parseFloat(qs.get('prog')) : 0.5;
      loadHome(idx);
      updateCounter(idx);
      state.exhibit = idx;
      state.assembly = 1;
    }
  }
  if (qs.get('diag')) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;background:#222;color:#0f0;font:12px monospace;padding:6px;white-space:pre';
    document.body.appendChild(d);
    const paint = () => {
      d.textContent = 'y=' + Math.round(scrollY) + ' ex=' + state.exhibit + ' asm=' + state.assembly.toFixed(2)
        + ' tgt=' + state.assemblyT.toFixed(2)
        + (renderer ? ' calls=' + renderer.info.render.calls + ' pts=' + renderer.info.render.points : ' nogl')
        + ' vw=' + innerWidth + 'x' + innerHeight;
      requestAnimationFrame(paint);
    };
    paint();
  }
}
