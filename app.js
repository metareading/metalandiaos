/* maitapp v3 hybrid · point-cloud engine (EIDOLON recipe, ported from the v2 museum)
   The 8 exhibits now assemble inside short transition bands (section.trans[data-exhibit])
   woven between the full v1 sections; outside a band the cloud parks as ambient dust
   under the v1 content (dimmed by the .v1s scrim).
   One BufferGeometry · attributes: position(=aHome)/aDust/aSeed/aClass/aData
   One uAssembly uniform driven by viewport centeredness · pseudo-curl dust ·
   Gaussian cursor swirl · hold-to-focus · additive, depthWrite:false, frustumCulled=false. */
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* ── capability tier ─────────────────────────────────────────── */
/* ?reduced=1 forces the reduced-motion path (mirrors ?nogl=1): the OS setting cannot
   be toggled from a verification harness, so the criterion needs a switch. */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  || /[?&]reduced=1/.test(location.search);
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

/* Exhibit II · Сърцето, което тиктака
   classes: 0 envelope · 1 ring1(fastest) · 2 ring2 · 3 ring3(slowest) · 4 arrow
   data[]: envelope → curve t · rings → r/R0 · arrow → radius fraction */
const HEART_SCALE = 0.0760633694313386;
const HEART_YOFF = 0.19307728033275595;

function heartRaw(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [x, y];
}
function heartTangent(t) {
  const dx = 48 * Math.sin(t) * Math.sin(t) * Math.cos(t);
  const dy = -13 * Math.sin(t) + 10 * Math.sin(2 * t) + 6 * Math.sin(3 * t) + 4 * Math.sin(4 * t);
  return [dx, dy];
}
function heartArcTable(M) {
  const pts = [];
  let total = 0;
  let prev = heartRaw(0);
  for (let i = 0; i <= M; i++) {
    const t = (i / M) * TAU;
    const [x, y] = heartRaw(t);
    const len = i === 0 ? 0 : Math.hypot(x - prev[0], y - prev[1]);
    total += len;
    pts.push({ t, acc: total });
    prev = [x, y];
  }
  return { pts, total };
}
function arcLookup(pts, d) { // binary search: first entry with acc >= d
  let lo = 0, hi = pts.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid].acc < d) lo = mid + 1; else hi = mid; }
  return pts[lo];
}

function genClock(home, cls, data, N, rand) {
  const nEnvelope = Math.floor(N * 0.68);
  const nRing1 = Math.floor(N * 0.11);
  const nRing2 = Math.floor(N * 0.10);
  const nRing3 = Math.floor(N * 0.09);
  const nArrow = N - nEnvelope - nRing1 - nRing2 - nRing3;

  const Z_DEPTH = 0.22;
  const R_DIAL = 1.16; // rim sits outside the hand sweep (1.02) and the gear trio (0.40/0.58/0.74)

  let i = 0;
  for (let k = 0; k < nEnvelope; k++, i++) {
    // Времетрон dial: volumetric rim + 12 hour ticks. Same cls 0 as the old heart
    // envelope — the shader's theft wave is angle-based, so it sweeps the rim untouched.
    const isTick = rand() < 0.28;
    let phi, r, zThin = false;
    if (isTick) {
      const h = Math.floor(rand() * 12);
      const rIn = (h % 3) === 0 ? 0.90 : 0.99; // 12/3/6/9 reach deeper
      phi = h * (TAU / 12) + (rand() - 0.5) * 0.035;
      r = rIn + rand() * (R_DIAL - 0.035 - rIn);
      zThin = true;
    } else {
      phi = rand() * TAU;
      const shell = (rand() - 0.5) * 0.05;
      const inward = -Math.pow(rand(), 2.1) * 0.16;
      r = R_DIAL + shell + (rand() < 0.55 ? inward : 0);
    }
    home[i * 3] = r * Math.cos(phi);
    home[i * 3 + 1] = r * Math.sin(phi);
    // two z-contours (front/back shells) + light fill between — same depth recipe as the heart
    const zu = rand();
    home[i * 3 + 2] = zThin
      ? (rand() - 0.5) * 0.03
      : (zu < 0.72
        ? (rand() < 0.5 ? -1 : 1) * Z_DEPTH * (0.30 + 0.20 * rand())
        : (rand() - 0.5) * Z_DEPTH);
    cls[i] = 0;
    data[i] = (((phi % TAU) + TAU) % TAU) / TAU;
  }

  function fillRing(n, clsVal, R0, teeth, k) {
    for (let m = 0; m < n; m++, i++) {
      const phi = rand() * TAU;
      const r = R0 * (1 - k * Math.abs(Math.sin(phi * teeth))) + (rand() - 0.5) * 0.03;
      home[i * 3] = r * Math.cos(phi);
      home[i * 3 + 1] = r * Math.sin(phi);
      home[i * 3 + 2] = (rand() - 0.5) * 0.03;
      cls[i] = clsVal;
      data[i] = r / R0;
    }
  }
  fillRing(nRing1, 1, 0.40, 9, 0.22); // innermost, fastest (shader speed 1.6)
  fillRing(nRing2, 2, 0.58, 7, 0.16); // mid (0.85)
  fillRing(nRing3, 3, 0.74, 5, 0.12); // outermost, slowest (0.42)

  const R_ARROW_MIN = 0.05, R_ARROW_MAX = 1.02;
  for (let k = 0; k < nArrow; k++, i++) {
    const u = rand();
    const r = R_ARROW_MIN + (R_ARROW_MAX - R_ARROW_MIN) * u;
    home[i * 3] = r; // static +x spoke; shader rotates by uTime·ω
    home[i * 3 + 1] = (rand() - 0.5) * 0.010;
    home[i * 3 + 2] = (rand() - 0.5) * 0.010;
    cls[i] = 4;
    data[i] = u;
  }
}

/* Exhibit III · Осемте, които посяват
   classes: 0 node(8) · 1 field dust(pre-aligned) · 2 arc-line · 3 grain
   data[]: node → k/7 · field → alignment blend · line → t · grain → loop phase */
const GOLD_HALF_SPAN = Math.PI * 35 / 180;
const GOLD_R = 2.004;
function nodePos(k) {
  const frac = (k * 137.5 / 360.0) % 1.0; // golden-angle low-discrepancy placement
  const ang = -GOLD_HALF_SPAN + 2 * GOLD_HALF_SPAN * frac;
  const x = GOLD_R * Math.sin(ang);
  const y = GOLD_R * (Math.cos(ang) - Math.cos(GOLD_HALF_SPAN)) + 0.05;
  const z = 0.10 * Math.sin(ang * 2.0 + k);
  return [x, y, z];
}

function genConstellation(home, cls, data, N, rand) {
  const NODES = [];
  for (let k = 0; k < 8; k++) NODES.push(nodePos(k));

  const nNodes = 8;
  const nLines = Math.floor(N * 0.09);
  const nGrains = Math.floor(N * 0.055); // редки зърна — sparse by design
  const nField = N - nNodes - nLines - nGrains;

  let i = 0;
  for (let k = 0; k < nNodes; k++, i++) {
    home[i * 3] = NODES[k][0];
    home[i * 3 + 1] = NODES[k][1];
    home[i * 3 + 2] = NODES[k][2];
    cls[i] = 0;
    data[i] = k / 7;
  }

  const perSeg = Math.floor(nLines / 7);
  let linesPlaced = 0;
  for (let s = 0; s < 7; s++) {
    const na = NODES[s], nb = NODES[s + 1];
    const dx = nb[0] - na[0], dy = nb[1] - na[1], dz = nb[2] - na[2];
    let ux = dx, uy = dy, uz = dz;
    const segLen = Math.hypot(ux, uy, uz) || 1;
    ux /= segLen; uy /= segLen; uz /= segLen;
    let px = -uy, py = ux, pz = 0;
    let pl = Math.hypot(px, py, pz);
    if (pl < 1e-4) { px = 0; py = -uz; pz = uy; pl = Math.hypot(px, py, pz); }
    px /= pl; py /= pl; pz /= pl;
    const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
    const count = (s === 6) ? (nLines - linesPlaced) : perSeg;
    for (let m = 0; m < count; m++, i++) {
      const t = rand();
      const rr = (rand() - 0.5) * 0.020;
      const th = rand() * TAU;
      home[i * 3] = na[0] + dx * t + (Math.cos(th) * px + Math.sin(th) * qx) * rr;
      home[i * 3 + 1] = na[1] + dy * t + (Math.cos(th) * py + Math.sin(th) * qy) * rr;
      home[i * 3 + 2] = na[2] + dz * t + (Math.cos(th) * pz + Math.sin(th) * qz) * rr;
      cls[i] = 2;
      data[i] = t;
    }
    linesPlaced += count;
  }

  for (let k = 0; k < nGrains; k++, i++) {
    const n = NODES[Math.floor(rand() * 8) % 8];
    home[i * 3] = n[0];
    home[i * 3 + 1] = n[1];
    home[i * 3 + 2] = n[2];
    cls[i] = 3;
    data[i] = rand();
  }

  // field dust baked ONCE toward the 1/d-weighted centroid of the 3 nearest nodes —
  // allocation-free top-3 selection (no per-point arrays/sort → no scroll-in GC hitch)
  const BOUND = { x0: -1.30, x1: 1.30, y0: -1.00, y1: 0.60, z0: -0.32, z1: 0.32 };
  for (let k = 0; k < nField; k++, i++) {
    const p0x = BOUND.x0 + rand() * (BOUND.x1 - BOUND.x0);
    const p0y = BOUND.y0 + rand() * (BOUND.y1 - BOUND.y0);
    const p0z = BOUND.z0 + rand() * (BOUND.z1 - BOUND.z0);
    let b1 = 0, b2 = 0, b3 = 0, d1 = 1e9, d2 = 1e9, d3 = 1e9;
    for (let n = 0; n < 8; n++) {
      const dx = NODES[n][0] - p0x, dy = NODES[n][1] - p0y, dz = NODES[n][2] - p0z;
      const d = Math.hypot(dx, dy, dz);
      if (d < d1) { d3 = d2; b3 = b2; d2 = d1; b2 = b1; d1 = d; b1 = n; }
      else if (d < d2) { d3 = d2; b3 = b2; d2 = d; b2 = n; }
      else if (d < d3) { d3 = d; b3 = n; }
    }
    const w1 = 1 / (d1 + 0.06), w2 = 1 / (d2 + 0.06), w3 = 1 / (d3 + 0.06);
    const wsum = w1 + w2 + w3;
    const wx = (NODES[b1][0] * w1 + NODES[b2][0] * w2 + NODES[b3][0] * w3) / wsum;
    const wy = (NODES[b1][1] * w1 + NODES[b2][1] * w2 + NODES[b3][1] * w3) / wsum;
    const wz = (NODES[b1][2] * w1 + NODES[b2][2] * w2 + NODES[b3][2] * w3) / wsum;
    const blend = Math.pow(rand(), 0.65);
    home[i * 3] = p0x + (wx - p0x) * blend;
    home[i * 3 + 1] = p0y + (wy - p0y) * blend;
    home[i * 3 + 2] = p0z + (wz - p0z) * blend;
    cls[i] = 1;
    data[i] = blend;
  }
}

/* Exhibit IV · Осемте стъпала
   classes: 0 plate · 1 axis · data[] = normalized height hNorm for both */
const STAIR_A = 0.34, STAIR_B = 0.3064, STAIR_DPHI = Math.PI / 4, STAIR_DH = 0.44;
const STAIR_THETA0 = -2.4; // phase the spiral so the ascent sweeps across the view instead of hiding behind the axis
const STAIR_TILT = -0.38;  // pitch toward the viewer so the 8 plates read as plates, not edge-on lines
const STAIR_HALF_TOTAL = (7 * STAIR_DH) / 2;
const PLATE_A = 0.42, PLATE_B = 0.28, PLATE_N = 4.0, PLATE_THICK = 0.035;

function plateCenter(k) {
  const growth = k * STAIR_DPHI;                 // golden growth per step
  const theta = STAIR_THETA0 + growth;
  const r = STAIR_A * Math.exp(STAIR_B * growth);
  return { x: r * Math.cos(theta), y: k * STAIR_DH - STAIR_HALF_TOTAL, z: r * Math.sin(theta), theta };
}

function genStairs(home, cls, data, N, rand) {
  const nAxis = Math.floor(N * 0.06);
  const nPlate = N - nAxis;
  const perPlate = Math.floor(nPlate / 8);
  const ct0 = Math.cos(STAIR_TILT), st0 = Math.sin(STAIR_TILT);
  const tilt = (idx) => { // rotate the finished point around X
    const y = home[idx * 3 + 1], z = home[idx * 3 + 2];
    home[idx * 3 + 1] = y * ct0 - z * st0;
    home[idx * 3 + 2] = y * st0 + z * ct0;
  };

  let i = 0;
  for (let k = 0; k < 8; k++) {
    const c = plateCenter(k);
    const count = (k === 7) ? (nPlate - perPlate * 7) : perPlate;
    for (let m = 0; m < count; m++, i++) {
      const ang = rand() * TAU;
      const s = Math.sqrt(rand()); // uniform-in-area elliptical plate — one clean countable blob per level
      const cx = Math.cos(ang), sn = Math.sin(ang);
      const xl = PLATE_A * cx * s;
      const zl = PLATE_B * sn * s;
      const ct = Math.cos(c.theta), st = Math.sin(c.theta);
      home[i * 3] = c.x + xl * ct - zl * st;
      home[i * 3 + 1] = c.y + (rand() - 0.5) * PLATE_THICK * 2;
      home[i * 3 + 2] = c.z + xl * st + zl * ct;
      cls[i] = 0;
      data[i] = (c.y + STAIR_HALF_TOTAL) / (2 * STAIR_HALF_TOTAL);
      tilt(i);
    }
  }

  for (let m = 0; m < nAxis; m++, i++) {
    const t = rand();
    const y = -STAIR_HALF_TOTAL + t * (2 * STAIR_HALF_TOTAL);
    const rr = rand() * 0.014, th = rand() * TAU;
    home[i * 3] = Math.cos(th) * rr;
    home[i * 3 + 1] = y;
    home[i * 3 + 2] = Math.sin(th) * rr;
    cls[i] = 1;
    data[i] = t;
    tilt(i);
  }
}

/* Exhibit V · Прагът, преминат само в една посока
   classes: 0 frame · 1 membrane · 2 stream · 3 demo-hero
   data[]: 0 → height/arc t · 1 → shimmer phase · 2 → speed variance · 3 → comet stagger */
const PORTAL_ARCH_R = 0.86;
const PORTAL_COL_BASE_Y = -1.30;
const PORTAL_COL_TOP_Y = 0.24;
const PORTAL_COL_R = 0.05;
const PORTAL_ARCH_TUBE_R = 0.05;
const PORTAL_MEMB_CY = (PORTAL_COL_BASE_Y + PORTAL_COL_TOP_Y + PORTAL_ARCH_R) * 0.5; // -0.10 · must match EX5_GLSL literal

function gaussian01(rand) { // Box-Muller fed only by the deterministic rand()
  const u1 = Math.max(1e-6, rand()), u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
}

function genPortal(home, cls, data, N, rand) {
  const nDemo = Math.max(8, Math.floor(N * 0.0025));
  const rem = N - nDemo;
  const nFrame = Math.floor(rem * 0.17);
  const nMembrane = Math.floor(rem * 0.17);
  const nStream = rem - nFrame - nMembrane;
  const nCol = Math.floor(nFrame * 0.62);
  const nArch = nFrame - nCol;

  let i = 0;
  for (let k = 0; k < nCol; k++, i++) {
    const side = (k % 2 === 0) ? -1 : 1;
    const y = PORTAL_COL_BASE_Y + rand() * (PORTAL_COL_TOP_Y - PORTAL_COL_BASE_Y);
    const phi = rand() * TAU;
    const r = PORTAL_COL_R * (0.7 + rand() * 0.35);
    home[i * 3] = side * PORTAL_ARCH_R + r * Math.cos(phi);
    home[i * 3 + 1] = y;
    home[i * 3 + 2] = r * Math.sin(phi);
    cls[i] = 0;
    data[i] = Math.max(0, Math.min(1, (y - PORTAL_COL_BASE_Y) / (PORTAL_COL_TOP_Y - PORTAL_COL_BASE_Y)));
  }
  for (let k = 0; k < nArch; k++, i++) { // half-torus vault
    const th = rand() * Math.PI;
    const phi = rand() * TAU;
    const R = PORTAL_ARCH_R + PORTAL_ARCH_TUBE_R * Math.cos(phi);
    home[i * 3] = R * Math.cos(th);
    home[i * 3 + 1] = PORTAL_COL_TOP_Y + R * Math.sin(th);
    home[i * 3 + 2] = PORTAL_ARCH_TUBE_R * Math.sin(phi);
    cls[i] = 0;
    data[i] = Math.sin(th); // glow peaks at the apex
  }
  for (let k = 0; k < nMembrane; k++, i++) { // curtain filling the opening
    const x = (rand() * 2 - 1) * PORTAL_ARCH_R * 0.94;
    const yLo = PORTAL_COL_BASE_Y + 0.06;
    const yHi = Math.abs(x) <= PORTAL_ARCH_R
      ? PORTAL_COL_TOP_Y + Math.sqrt(Math.max(0, PORTAL_ARCH_R * PORTAL_ARCH_R - x * x)) - 0.06
      : PORTAL_COL_TOP_Y;
    const y = yLo + rand() * Math.max(0.05, yHi - yLo);
    home[i * 3] = x;
    home[i * 3 + 1] = y;
    home[i * 3 + 2] = 0.006 * Math.sin(x * 6.0 + y * 5.0) * (0.7 + rand() * 0.6);
    cls[i] = 1;
    data[i] = rand();
  }
  for (let k = 0; k < nStream; k++, i++) { // stream: z animated in-shader from seed+uTime
    home[i * 3] = gaussian01(rand) * PORTAL_ARCH_R * 0.30;
    home[i * 3 + 1] = PORTAL_MEMB_CY + gaussian01(rand) * PORTAL_ARCH_R * 0.30;
    home[i * 3 + 2] = 0.0;
    cls[i] = 2;
    data[i] = 0.72 + rand() * 0.56;
  }
  for (let k = 0; k < nDemo; k++, i++) { // the ONE auto-demo crossing (comet + tail)
    home[i * 3] = (rand() - 0.5) * 0.03;
    home[i * 3 + 1] = PORTAL_MEMB_CY + (rand() - 0.5) * 0.03;
    home[i * 3 + 2] = 0.0;
    cls[i] = 3;
    data[i] = k / nDemo;
  }
}

/* Exhibit VI · Пашкулът и крилете — two buffers, JS swaps them in the dissolve trough */
function cocoonProfile() {
  return [
    [0.00, -0.92], [0.09, -0.86], [0.22, -0.70], [0.33, -0.46], [0.38, -0.16],
    [0.37, 0.16], [0.30, 0.46], [0.19, 0.70], [0.08, 0.88], [0.00, 0.98],
  ];
}

function genCocoon(home, cls, data, N, rand) {
  const prof = sampleProfileArc(cocoonProfile(), N, rand);
  for (let i = 0; i < N; i++) {
    const p = prof[i], th = rand() * TAU;
    const r = p.r + (rand() - 0.5) * 0.010;
    home[i * 3] = r * Math.cos(th);
    home[i * 3 + 1] = p.y;
    home[i * 3 + 2] = r * Math.sin(th);
    cls[i] = 0;
    data[i] = p.t;
  }
}

function wingSample(side, rand) {
  const u = rand(), v = rand();
  const span = 1.05, sweepY = 0.40, lobes = 6.0;
  const envelope = Math.sin(Math.min(1, u) * Math.PI * 0.92);
  const scallop = 0.86 + 0.14 * Math.sin(u * lobes * Math.PI + v * 1.4);
  const chord = 0.78 * envelope * scallop;
  const x = side * (0.08 + u * span);
  const y = sweepY * (1.0 - u * 0.55) - v * chord;
  const z = (v - 0.42) * 0.10 * (1.0 - 0.6 * u) + (rand() - 0.5) * 0.008;
  return [x, y, z, u];
}
function bodySample(rand) {
  const L0 = -0.85, L1 = 0.60;
  const t = rand();
  const y = L0 + t * (L1 - L0);
  const rad = 0.095 * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.05)));
  const th = rand() * TAU;
  const hairy = rand() < 0.22 ? (1.0 + rand() * 1.8) : 1.0;
  const r = rad * hairy;
  return [r * Math.cos(th), y, r * Math.sin(th), t];
}
function proboscisSample(rand) {
  const turns = 2.8, k = 0.32, r0 = 0.20;
  const t = rand();
  const theta = t * turns * TAU;
  const r = r0 * Math.exp(-k * theta / TAU);
  const x = r * Math.cos(theta) + (rand() - 0.5) * 0.006;
  const y = 0.58 - t * 0.34 + r * Math.sin(theta) * 0.4 + (rand() - 0.5) * 0.006;
  const z = 0.10 + r * Math.sin(theta) * 0.6 + (rand() - 0.5) * 0.006;
  return [x, y, z, t];
}

function genWings(home, cls, data, N, rand) {
  const nProb = Math.floor(N * 0.07);
  const nBody = Math.floor(N * 0.21);
  const nWingEach = Math.floor((N - nProb - nBody) / 2);
  let i = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < nWingEach; k++, i++) {
      const [x, y, z, u] = wingSample(side, rand);
      home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
      cls[i] = 1; data[i] = u;
    }
  }
  for (let k = 0; k < nBody; k++, i++) {
    const [x, y, z, t] = bodySample(rand);
    home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
    cls[i] = 2; data[i] = t;
  }
  const nRest = N - i;
  for (let k = 0; k < nRest; k++, i++) {
    const [x, y, z, t] = proboscisSample(rand);
    home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
    cls[i] = 3; data[i] = t;
  }
}

/* Exhibit VII · Чашата, преляла — THE RHYME with Exhibit I: same lathe profile, gold instead of water
   classes: 0 wall (identical sampling) · 1 gold volume (baked fill height) · 2 overflow drop */
const CUP_GOLD_Y0 = 0.90;                 // bowl floor (raw profile-y)
const CUP_GOLD_Y1 = 2.28;                 // just under the rim
const CUP_GOLD_RFAC = 0.91;               // inward clearance vs the wall radius
const CUP_RIM_R = 0.97, CUP_RIM_Y = 2.30; // rim lip — identical terminal point of cupProfile()

function cupBowlRadius(yRaw, prof) { // interior wall radius at a raw y (bowl is single-valued in y here)
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (yRaw <= y1 || i === prof.length - 2) {
      const f = y1 > y0 ? Math.max(0, Math.min(1, (yRaw - y0) / (y1 - y0))) : 0;
      return r0 + (r1 - r0) * f;
    }
  }
  return prof[prof.length - 1][0];
}

function genGoldCup(home, cls, data, N, rand) {
  const nWall = Math.floor(N * 0.772), nGold = Math.floor(N * 0.21);
  const nDrop = N - nWall - nGold;
  const prof = cupProfile();
  const wallSamples = sampleProfileArc(prof, nWall, rand);

  let i = 0;
  for (let k = 0; k < nWall; k++, i++) { // wall: IDENTICAL sampling to genCup — zero geometry drift, the rhyme
    const p = wallSamples[k], th = rand() * TAU;
    const r = p.r + (rand() - 0.5) * 0.012;
    home[i * 3] = r * Math.cos(th);
    home[i * 3 + 1] = p.y - CUP_Y0 + (rand() - 0.5) * 0.008;
    home[i * 3 + 2] = r * Math.sin(th);
    cls[i] = 0;
    data[i] = Math.max(0, Math.min(1, (p.y - 0.9) / 1.4)); // same rim-proximity encoding as Exhibit I
  }
  for (let k = 0; k < nGold; k++, i++) { // gold: uniform VOLUMETRIC fill r·cbrt(rand) (PRD formula), floor→rim
    const yRaw = CUP_GOLD_Y0 + rand() * (CUP_GOLD_Y1 - CUP_GOLD_Y0);
    const Rlocal = cupBowlRadius(yRaw, prof) * CUP_GOLD_RFAC;
    const r = Rlocal * Math.cbrt(rand());
    const th = rand() * TAU;
    home[i * 3] = r * Math.cos(th);
    home[i * 3 + 1] = yRaw - CUP_Y0;
    home[i * 3 + 2] = r * Math.sin(th);
    cls[i] = 1;
    data[i] = (yRaw - CUP_GOLD_Y0) / (CUP_GOLD_Y1 - CUP_GOLD_Y0); // baked fill height — gated vs the level uniform
  }
  for (let k = 0; k < nDrop; k++, i++) { // overflow drops parked at the rim lip; shader launches them
    const th = rand() * TAU;
    const rr = CUP_RIM_R * CUP_GOLD_RFAC;
    home[i * 3] = rr * Math.cos(th);
    home[i * 3 + 1] = CUP_RIM_Y - CUP_Y0;
    home[i * 3 + 2] = rr * Math.sin(th);
    cls[i] = 2;
    data[i] = rand();
  }
}

/* Exhibit VIII · Сърцето, върнато у дома — THE RHYME with Exhibit II: same curve, NO gears, NO arrow
   classes: 0 envelope (identical recipe) · 1 inner warm core */
function genHomeHeart(home, cls, data, N, rand) {
  const nEnvelope = Math.floor(N * 0.90);
  const nCore = N - nEnvelope;

  const table = heartArcTable(500);
  const WALL_JITTER = 0.028;
  const Z_DEPTH = 0.22;

  let i = 0;
  for (let k = 0; k < nEnvelope; k++, i++) { // identical envelope recipe to genHeart
    const d = rand() * table.total;
    const seg = arcLookup(table.pts, d);
    const t = seg.t;
    const [x0, y0] = heartRaw(t);
    const [tx, ty] = heartTangent(t);
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const shell = (rand() - 0.5) * (WALL_JITTER * 4.0 / HEART_SCALE);
    const inward = -Math.pow(rand(), 2.1) * (0.52 / HEART_SCALE);
    const j = shell + (rand() < 0.55 ? inward : 0);
    const x = x0 + nx * j, y = y0 + ny * j;
    home[i * 3] = x * HEART_SCALE;
    home[i * 3 + 1] = y * HEART_SCALE + HEART_YOFF;
    const zu = rand();
    home[i * 3 + 2] = zu < 0.72
      ? (rand() < 0.5 ? -1 : 1) * Z_DEPTH * (0.30 + 0.20 * rand())
      : (rand() - 0.5) * Z_DEPTH;
    cls[i] = 0;
    data[i] = t / TAU;
  }
  for (let k = 0; k < nCore; k++, i++) { // warm inner core: same curve, deeper inward reach
    const d = rand() * table.total;
    const seg = arcLookup(table.pts, d);
    const t = seg.t;
    const [x0, y0] = heartRaw(t);
    const [tx, ty] = heartTangent(t);
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const inward = -Math.pow(rand(), 1.4) * (0.90 / HEART_SCALE);
    const x = x0 + nx * inward, y = y0 + ny * inward;
    home[i * 3] = x * HEART_SCALE;
    home[i * 3 + 1] = y * HEART_SCALE + HEART_YOFF;
    home[i * 3 + 2] = (rand() - 0.5) * Z_DEPTH * 0.5;
    cls[i] = 1;
    data[i] = t / TAU;
  }
}

const GENERATORS = [genCup, genClock, genConstellation, genStairs, genPortal, genCocoon, genGoldCup, genHomeHeart];

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

const EX2_GLSL = /* glsl */`
  // cls: 0 dial+ticks · 1 ring1(fastest) · 2 ring2 · 3 ring3(slowest) · 4 hand
  float breathe = 1.0 + 0.028 * sin(uTime * 0.55);   // whole clock breathes as ONE body
  if (clsv < 0.5) {
    a = asm2(uAssembly, seedv, 0.0);
    float thetaP = atan(hp.y, hp.x);
    float omega = mix(1.0, 2.5, uFocus);              // hard-capped 2.5x under focus
    float thetaArrow = uTime * omega;                 // same formula as the arrow class → wave tracks the hand
    float dAng = thetaP - thetaArrow;
    dAng = atan(sin(dAng), cos(dAng));                // wrap-aware angular distance
    float sigma = mix(0.35, 0.9, uFocus);
    float gauss = exp(-(dAng * dAng) / (2.0 * sigma * sigma));
    float gearAmp = 1.0 - 0.22 * abs(sin(thetaP * 9.0 - uTime * 1.6));
    float waveAmp = gauss * gearAmp * 0.42;
    waveAmp = min(waveAmp, 0.22 * max(length(hp.xy), 1e-4)); // cap vs LOCAL radius — the notch never fills
    waveAmp *= (1.0 - uReduced);                              // reduced motion: clean undistorted heart
    vec2 dir = hp.xy / max(length(hp.xy), 1e-4);
    hp.xy += dir * waveAmp;                            // stateless outward bulge — returns as the arrow passes
    hp *= breathe;
    col = mix(uPal[1] * 0.60, uPal[1] * 1.05, datv * 0.5 + waveAmp * 1.1);
    col = mix(col, uPal[1] * 1.55, smoothstep(0.05, 0.30, waveAmp));
    alphaF = 0.85;
    sizeF = 1.0 + waveAmp * 0.6;
  } else if (clsv < 1.5) {
    a = asm2(uAssembly, seedv, 0.05);
    float ang = uTime * 1.6;
    float c = cos(ang), s = sin(ang);
    hp.xy = mat2(c, s, -s, c) * hp.xy;
    hp *= breathe;
    col = uPal[1] * mix(0.55, 0.85, datv);
    sizeF = 1.05;
    alphaF = 0.9;
  } else if (clsv < 2.5) {
    a = asm2(uAssembly, seedv, 0.09);
    float ang = uTime * 0.85;
    float c = cos(ang), s = sin(ang);
    hp.xy = mat2(c, s, -s, c) * hp.xy;
    hp *= breathe;
    col = uPal[1] * mix(0.38, 0.60, datv);
    sizeF = 1.0;
    alphaF = 0.9;
  } else if (clsv < 3.5) {
    a = asm2(uAssembly, seedv, 0.13);
    float ang = uTime * 0.42;
    float c = cos(ang), s = sin(ang);
    hp.xy = mat2(c, s, -s, c) * hp.xy;
    hp *= breathe;
    col = uPal[1] * mix(0.24, 0.40, datv);
    sizeF = 0.95;
    alphaF = 0.9;
  } else {
    a = asm2(uAssembly, seedv, 0.18);
    float omega = mix(1.0, 2.5, uFocus);
    float ang = uTime * omega;
    float c = cos(ang), s = sin(ang);
    hp.xy = mat2(c, s, -s, c) * hp.xy;
    hp *= breathe;
    col = uPal[1] * mix(1.25, 1.55, datv);
    sizeF = mix(1.8, 2.6, datv);
    alphaF = 1.0;
  }
`;

const EX3_GLSL = /* glsl */`
  // cls: 0 node · 1 field dust(pre-aligned) · 2 arc-line · 3 grain
  if (clsv < 0.5) {
    a = asm2(uAssembly, seedv, 0.0);
    vec2 toPtr = hp.xy - uPointer.xy;
    float near = exp(-dot(toPtr, toPtr) * 3.2) * ptrAct;
    col = mix(uPal[2] * 1.1, uPal[2] * 1.6, near);
    sizeF = mix(2.4, 3.2, datv) * (1.0 + near * 1.0);
    alphaF = 1.0;
  } else if (clsv < 1.5) {
    a = asm2(uAssembly, seedv, 0.10 + datv * 0.10);
    col = mix(uPal[2] * 0.55, uPal[2] * 1.05, datv);
    alphaF = mix(0.35, 0.85, datv);
    sizeF = mix(0.85, 1.15, datv);
  } else if (clsv < 2.5) {
    a = asm2(uAssembly, seedv, 0.05);
    vec2 toPtr = hp.xy - uPointer.xy;
    float near = exp(-dot(toPtr, toPtr) * 2.4) * ptrAct;
    float shimmer = 0.55 + 0.45 * sin(uTime * 2.0 - datv * 9.0);
    col = uPal[2] * mix(0.7, 1.5, near * shimmer);
    alphaF = 0.8;
    sizeF = 1.0 + near * 0.6;
  } else {
    a = asm2(uAssembly, seedv, 0.14);
    float period = 4.2;
    float ttG = mod(uTime * 0.6 + datv * period, period);
    float vx = sin(seedv * 12.9) * 0.34;
    float vy0 = 0.55 + 0.30 * cos(seedv * 7.3);
    float gG = 0.85;
    float ground = -0.85 + 0.14 * sin(seedv * 31.7);     // varied landing height — no neat rows
    float disc = vy0 * vy0 - 2.0 * gG * ground;
    float tLand = (vy0 + sqrt(max(disc, 0.0))) / gG;
    float te = min(ttG, tLand);                   // analytic landing — x&y freeze together, stateless
    hp.x += vx * te;
    hp.y += vy0 * te - 0.5 * gG * te * te;
    float logi = 1.0 / (1.0 + exp(-(uTime * 0.05 + seedv * 9.0 - 4.5)));
    vec2 toPtr = hp.xy - uPointer.xy;
    float near = exp(-dot(toPtr, toPtr) * 3.0) * uFocus; // germination boost = max(timer, cursor-under-hold)
    float germ = max(logi, near);
    col = mix(uPal[2] * 0.9, uPal[0] * 1.35, germ);      // germinated grains turn gold — knowledge leads to the meta
    sizeF = mix(1.1, 1.6, germ);
    alphaF = mix(0.5, 0.85, germ);
  }
`;

const EX4_GLSL = /* glsl */`
  // cls: 0 plate · 1 axis · datv = normalized height hNorm
  float hNorm = datv;
  if (clsv < 0.5) {
    a = asm2(uAssembly, seedv, hNorm * 0.5);           // bottom-up stagger — works even with uProgress==0
    float frontGlow = smoothstep(hNorm - 0.16, hNorm + 0.02, uProgress);
    float pulsePos = fract(uTime * 0.12);
    float dHP = hNorm - pulsePos;
    float pulse = exp(-dHP * dHP * 90.0) * (1.0 - uReduced); // Зовът climbs; reduced: clean static steps
    float flareTarget = clamp(uProgress + 1.0 / 7.0, 0.0, 1.0);
    float dFl = hNorm - flareTarget;
    float flare = uFocus * exp(-dFl * dFl * 220.0);    // hold: the next unlit plate flares
    col = mix(uPal[3] * 0.55, uPal[3] * 1.05, frontGlow);
    col = mix(col, uPal[0] * 1.45, clamp(pulse + flare, 0.0, 1.0));
    alphaF = 0.85;
    sizeF = 1.0 + pulse * 0.5 + flare * 0.8;
  } else {
    a = asm2(uAssembly, seedv, hNorm * 0.30);
    float pulsePos = fract(uTime * 0.12);
    float dHP = hNorm - pulsePos;
    float pulse = exp(-dHP * dHP * 70.0) * (1.0 - uReduced);
    col = mix(uPal[3] * 0.40, uPal[0] * 1.30, pulse);
    alphaF = 0.6;
    sizeF = 1.0 + pulse * 0.4;
  }
`;

const EX5_GLSL = /* glsl */`
  // cls: 0 frame · 1 membrane · 2 stream · 3 demo-hero
  if (clsv < 0.5) {                                     // frame: warm glow builds toward the apex
    a = asm2(uAssembly, seedv, 0.0);
    col = mix(uBone, uPal[4], 0.45 + 0.45 * datv);
    alphaF = 0.85;
    sizeF = 1.05;
  } else if (clsv < 1.5) {                              // membrane: pale curtain, opens wider under focus
    float shimmer = 0.5 + 0.5 * sin(uTime * 1.3 + datv * 20.0 + hp.x * 4.0);
    a = asm2(uAssembly, seedv, 0.18);
    vec2 openCentre = vec2(0.0, -0.10);
    hp.xy = openCentre + (hp.xy - openCentre) * mix(1.0, 1.09, uFocus * (1.0 - uReduced));
    hp.z += 0.018 * shimmer * (1.0 - uReduced);
    col = mix(uBone, uPal[4], 0.20 + 0.18 * shimmer);
    alphaF = 0.55 + 0.30 * uFocus;
    sizeF = 0.95;
  } else if (clsv < 2.5) {                              // stream: one-way, brightest exactly at the threshold
    a = asm2(uAssembly, seedv, 0.38);
    float density = 0.55 + 0.85 * uFocus;
    float speed = (0.085 + 0.055 * datv) * density;
    float z = -9.0 + fract(seedv + uTime * speed) * 17.5; // corridor -9..+8.5: wrap point BEHIND the camera (z=7.2)
    float nearFade = 1.0 - smoothstep(5.0, 6.8, z);        // grains die out before the teleport — no visible wink
    float order = smoothstep(-0.30, 0.30, z);              // chaos before the plane, calm order beyond
    vec2 chaos = (1.0 - order) * 0.30 * vec2(
      sin(uTime * 0.8 + seedv * 23.0), sin(uTime * 0.65 + seedv * 17.0));
    hp.xy = position.xy + chaos;
    hp.y += order * 0.02 * sin(z * 2.0 + seedv * 9.0);
    hp.z = z;
    vec2 toCentre = hp.xy - vec2(0.0, -0.10);              // -0.10 = PORTAL_MEMB_CY (baked, must match JS)
    float gate = exp(-dot(toCentre, toCentre) * 2.0);
    float flare = exp(-z * z * 8.0);                       // decision-flare peaks exactly at z=0
    vec2 toPointer = hp.xy - uPointer.xy;
    float pointerBoost = exp(-dot(toPointer, toPointer) * 1.6) * order * ptrAct;
    col = mix(uBone * 0.75, uPal[4] * 1.35, order) + uPal[4] * (flare * 0.55 + pointerBoost * 0.5);
    alphaF = gate * nearFade * (0.35 + 0.55 * order + 0.6 * flare + 0.3 * pointerBoost) * mix(1.0, order, uReduced);
    sizeF = (0.85 + 0.9 * flare + 0.4 * pointerBoost) * nearFade;
  } else {                                               // demo-hero: ONE scripted crossing (uDemo pulses 1→0)
    a = asm2(uAssembly, seedv, 0.0);
    float dz = mix(-2.4, 2.4, 1.0 - uDemo);
    hp.z = dz - datv * 0.35;                             // comet tail
    float dFlare = exp(-dz * dz * 6.0);
    col = uPal[4] * (1.3 + 1.8 * dFlare);
    sizeF = 1.6 + 2.2 * dFlare;
    alphaF = 0.9 * smoothstep(0.02, 0.12, uDemo);        // hidden before AND after the pulse — never a parked blob
  }
`;

const EX6_GLSL = /* glsl */`
  // cls buffer A: 0 cocoon · buffer B: 1 wing · 2 hairy body · 3 proboscis (JS swaps buffers in the trough)
  float pEff = clamp(uProgress + uFocus * 0.32 * (1.0 - uReduced), 0.0, 1.0); // hold ACCELERATES, never reverses
  float stagger = (seedv - 0.5) * 0.10;
  float aUp = 1.0 - smoothstep(0.30 + stagger, 0.44 + stagger, pEff);   // edges tuned so the trough
  float aDown = smoothstep(0.56 + stagger, 0.70 + stagger, pEff);       // is FULLY dissolved for every seed at p=0.5
  float triA = (uReduced > 0.5) ? 1.0 : clamp(max(aUp, aDown), 0.0, 1.0);
  float dissolve = 1.0 - triA;
  float distToMid = abs(pEff - 0.5);
  float spark = exp(-distToMid * distToMid * 160.0) * (1.0 - uReduced); // brief warm flash at the transition

  a = asm2(uAssembly, seedv, 0.0);

  vec3 swirlOff = dissolve * 0.62 * vec3(               // dense VISIBLE vortex — never a black gap
    cos(uTime * 1.7 + seedv * 18.0 + dissolve * 3.0),
    sin(uTime * 1.35 + seedv * 23.0) * 0.85,
    sin(uTime * 2.05 + seedv * 11.0));
  hp = position + swirlOff;

  vec3 earthC = uPal[5];
  vec3 amberC = uPal[0];

  if (clsv < 0.5) {                                      // cocoon shell
    col = mix(earthC * 0.85, earthC * 1.15, datv) + amberC * spark * 0.6;
    sizeF = mix(1.0, 1.35, dissolve);
    alphaF = mix(0.85, 1.0, dissolve);
  } else if (clsv < 1.5) {                               // wings: amber grows toward the scalloped tip (predicts VII)
    col = mix(earthC, amberC, 0.25 + 0.35 * datv) + amberC * spark * 0.7;
    sizeF = mix(1.05, 1.4, dissolve);
    alphaF = mix(0.75, 0.95, dissolve);
  } else if (clsv < 2.5) {                               // hairy body
    col = earthC * 0.9 + amberC * spark * 0.5;
    sizeF = mix(1.0, 1.3, dissolve);
    alphaF = 0.8;
  } else {                                                // decaying-spiral proboscis
    col = mix(earthC * 0.7, amberC * 0.9, datv) + amberC * spark * 0.5;
    sizeF = mix(0.9, 1.2, dissolve) * 1.1;
    alphaF = 0.85;
  }
`;

const EX7_GLSL = /* glsl */`
  // cls: 0 wall (same profile as Exhibit I) · 1 gold (level rises with uProgress) · 2 overflow drop
  float level = mix(0.35, 1.0, uProgress);
  if (clsv < 0.5) {                            // wall: STILL — the payoff of Exhibit I's tremble
    a = asm2(uAssembly, seedv, 0.0);
    col = mix(uBone, uPal[0], 0.30 + datv * 0.55);
    alphaF = 0.85;
  } else if (clsv < 1.5) {                     // gold: lights only below the level (stateless)
    float lit = 1.0 - smoothstep(level - 0.06, level + 0.06, datv);
    a = asm2(uAssembly, seedv, 0.0) * mix(0.12, 1.0, lit);
    float ds = (datv - level) * 10.0;
    float surface = exp(-ds * ds);              // near-surface band (никога pow(neg,2) — NaN на ANGLE/mobile)
    vec2 toPtr = hp.xy - uPointer.xy;
    float gp = exp(-dot(toPtr, toPtr) * 2.5) * ptrAct;
    hp.y += surface * gp * 0.05 * sin(uTime * 3.0 + seedv * 20.0) * (1.0 - uReduced); // ripples on the gold surface only
    float glow = mix(1.0, 1.5, uFocus);         // hold → full radiance, hue-capped
    col = uPal[0] * glow * mix(0.85, 1.15, lit);
    sizeF = mix(1.0, 1.3, lit);
    alphaF = 0.9;
  } else {                                     // overflow drops: same parabola family as the III grains, capped
    float overflowGate = clamp(smoothstep(0.55, 0.85, uProgress) + uFocus * 0.30, 0.0, 1.0);
    float rare = smoothstep(0.90, 0.94, datv);  // only the top seeds ever launch — rare drops, not a pour
    float period = 6.5;
    float ttG = mod(uTime * 0.35 + datv * period, period);
    float vOut = 0.10 + 0.08 * fract(seedv * 41.0);
    float vy0 = -0.02 - 0.05 * fract(seedv * 17.0);
    float gG = 0.9, tFlight = 1.4;
    float te = min(ttG, tFlight);
    vec2 dirOut = normalize(hp.xy + vec2(1e-4));
    hp.xy += dirOut * vOut * te;
    hp.y += vy0 * te - 0.5 * gG * te * te;
    float life = 1.0 - smoothstep(0.0, tFlight, te); // dissolves into a glint near the base
    a = asm2(uAssembly, seedv, 0.30) * overflowGate;
    col = uPal[0] * (1.3 + 0.4 * life);
    sizeF = mix(0.6, 1.3, life) * rare;
    alphaF = life * rare * overflowGate * 0.9;
  }
`;

const EX8_GLSL = /* glsl */`
  // cls: 0 envelope · 1 inner core — same heart curve as II, no gears, no arrow
  // 3 beats over uProgress: <0.22 ЗАВРЪЩАНЕ · 0.22-0.44 ВЪЗКРЕСВАНЕ · >0.44 ДАРЪТ
  // (compressed vs v2: the band is ~135svh with only the footer after it, so max
  //  reachable progress is ~0.74 — the exhale must complete by then)
  float aBase = asm2(uAssembly, seedv, 0.0);

  if (uProgress < 0.22) {                                // ЗАВРЪЩАНЕ · slow calm breathe, whole body
    float breathe = 1.0 + 0.05 * sin(uTime * 0.30 + seedv * 2.1);
    a = aBase;
    hp *= breathe;
    if (clsv < 0.5) { col = mix(uPal[7] * 0.55, uPal[7] * 1.05, datv); alphaF = 0.85; sizeF = 1.0; }
    else            { col = mix(uPal[7] * 0.80, uPal[0] * 1.10, 0.45); alphaF = 0.9; sizeF = 1.1; }

  } else if (uProgress < 0.44) {                         // ВЪЗКРЕСВАНЕ · bounded implosion + short 8-color flash
    float p2 = clamp((uProgress - 0.22) / 0.22, 0.0, 1.0);
    float implodeFactor = 0.55 * sin(p2 * 3.14159265) * (1.0 - uReduced); // reduced: still heart, no collapse
    a = aBase;
    hp = mix(hp, vec3(0.0), implodeFactor);
    float fp = (p2 - 0.5) * 6.0;
    float flashWin = exp(-fp * fp) * (1.0 - uReduced);   // short window around the peak; skipped under reduced motion
    // GLSL ES 1.0: no dynamic indexing of uniform arrays — constant-count loop fakes it
    vec3 flashCol = uPal[0];
    float idxF = floor(seedv * 8.0);                     // STATIC per-point index (PRD: floor(aSeed·8) · не диско)
    for (int c8 = 0; c8 < 8; c8++) { if (abs(float(c8) - idxF) < 0.5) flashCol = uPal[c8]; }
    vec3 base = (clsv < 0.5) ? mix(uPal[7] * 0.55, uPal[7] * 1.05, datv) : mix(uPal[7] * 0.80, uPal[0] * 1.10, 0.45);
    col = mix(base, flashCol * 1.15, flashWin * 0.75); // 8 hues must survive additive stacking — never blow to white
    alphaF = 0.9;
    sizeF = 1.0 + implodeFactor * 0.4;

  } else {                                                // ДАРЪТ · exhale — the ring closes into the opening dust
    float p3 = clamp((uProgress - 0.44) / 0.22, 0.0, 1.0); // completes by uProgress≈0.66 (reachable at page end)
    float stagger = seedv * 0.6;
    float aDown = smoothstep(stagger, stagger + 0.4, p3);
    a = aBase * (1.0 - aDown);
    vec2 toPtr = hp.xy - uPointer.xy;
    float g = exp(-dot(toPtr, toPtr) * 1.5) * ptrAct;
    hp.xy -= toPtr * g * 0.35;                             // soft mirror parallax — attraction, no scatter, only for a live pointer
    vec2 dirOut = normalize(hp.xy + vec2(1e-4));
    hp.xy += dirOut * uFocus * 0.5 * (1.0 - uReduced);     // hold DISPERSES (the inverse gesture of every hall)
    col = (clsv < 0.5) ? mix(uPal[7] * 0.45, uPal[7] * 0.85, datv) : uPal[7] * 0.70 + uPal[0] * 0.25;
    alphaF = 0.8 * (0.3 + 0.7 * a);
    sizeF = 1.0;
  }
`;

const EX_BLOCKS = [EX1_GLSL, EX2_GLSL, EX3_GLSL, EX4_GLSL, EX5_GLSL, EX6_GLSL, EX7_GLSL, EX8_GLSL];

function buildVertexShader() {
  const chain = EX_BLOCKS.map((body, i) =>
    `${i ? 'else ' : ''}if (uExhibit < ${i}.5) {\n${body}\n}`).join('\n    ');
  return /* glsl */`
  attribute vec3 aDust;
  attribute float aSeed;
  attribute float aClass;
  attribute float aData;
  uniform float uTime, uAssembly, uProgress, uFocus, uSwirl, uExhibit, uReduced, uFlash, uDemo, uSizeBase, uPx, uScale;
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
          + 0.20 * sin(tt * 0.23 + aDust.z * 1.30 + seedv * 12.6)
          + 0.09 * sin(tt * 0.37 + aDust.x * 2.10 + seedv * 3.3);
    dp.y += 0.42 * sin(tt * 0.13 + aDust.z * 0.80 + seedv * 4.71)
          + 0.16 * sin(tt * 0.19 + aDust.x * 1.10 + seedv * 8.1)
          + 0.08 * sin(tt * 0.31 + aDust.y * 1.90 + seedv * 5.7);
    dp.z += 0.50 * sin(tt * 0.09 + aDust.x * 0.60 + seedv * 9.42)
          + 0.18 * sin(tt * 0.21 + aDust.y * 1.20 + seedv * 7.3)
          + 0.08 * sin(tt * 0.33 + aDust.z * 2.00 + seedv * 11.1);

    vec3 hp = position;
    float a = 0.0;
    vec3 col = uBone;
    float sizeF = 1.0, alphaF = 1.0;
    // pointer effects only while the pointer is actually alive (swirl decays at rest; focus = deliberate hold)
    // — an idle uPointer at (0,0,0) must never act like a phantom cursor (the template's sentinel lesson)
    float ptrAct = clamp(uSwirl * 2.0 + uFocus, 0.0, 1.0);

    if (clsv < -0.5) { a = 0.0; } // parked points stay dust in EVERY exhibit
    else ${chain}

    vec3 p = mix(dp, hp, a);

    // cursor swirl: Gaussian falloff, tangential push (strong on dust, subtle when assembled)
    vec2 toP = p.xy - uPointer.xy;
    float d2 = dot(toP, toP);
    float g = exp(-d2 * 0.9) * uSwirl;
    vec2 tang = normalize(vec2(-toP.y, toP.x) + vec2(1e-4));
    p.xy += tang * g * mix(0.9, 0.14, a);
    sizeF *= 1.0 + g * 1.4;

    p = p * uScale + uOffset; // mobile: shortened amplitudes — the whole cloud scales into the clean top band
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
  cov: 0,        // viewport coverage of the winning band (drives assembly · #3)
  bandOn: false, // hysteresis latch — kills the assemble/dissolve/re-assemble flicker
  scale: 1, scaleT: 1, // mobile: fit-to-band cloud scale (#4), replaces the flat 0.74 shrink
};

let scene, camera, material, points, uniforms;

function initGL() {
  document.body.classList.remove('no-webgl'); // self-heal if the module-load fallback fired before a slow boot
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
    uScale: { value: 1 },
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
  // step(y): synchronous scroll+drive tick for state sweeps (verification only, no render needed)
  window.__museum = {
    camera, renderer, uniforms, state, cloud: CLOUD, extent: visibleExtent,
    // layout state (offset/scale) is snapped, drama state (assembly/progress) is not —
    // the sweep must read the true targets, but the metrics must read the settled layout
    step(y) {
      document.documentElement.style.scrollBehavior = 'auto'; // smooth-scroll never advances in a hidden tab
      window.scrollTo(0, y);
      driveSections(); driveVariants(); driveOffset();
      state.scale = state.scaleT;
      state.offset.copy(state.offsetT);
    },
    // scroll there, then run real frames until the easings settle → a screenshot
    // shows what a user sees, not the un-driven boot state of a hidden tab
    settle(y, seconds) {
      document.documentElement.style.scrollBehavior = 'auto';
      if (y != null) window.scrollTo(0, y);
      const n = Math.round((seconds || 2) * 60);
      for (let i = 0; i < n; i++) tick(1 / 60);
      return { ex: state.exhibit, asm: +state.assembly.toFixed(2), cov: +state.cov.toFixed(2) };
    },
  };
}

function loadHome(idx, gen) {
  const rand = mulberry32(1000 + idx * 7919);
  (gen || GENERATORS[idx])(home, cls, data, COUNT, rand);
  const g = points.geometry;
  g.attributes.position.needsUpdate = true;
  g.attributes.aClass.needsUpdate = true;
  g.attributes.aData.needsUpdate = true;
  uniforms.uExhibit.value = idx;
  measureHome();
}

/* ── cloud metrics (#4) ───────────────────────────────────────
   The shape's own bounding box, measured once per geometry load, lets the
   mobile layout GROW the cloud to the largest size that still fits the band
   without clipping sideways — instead of the flat 0.74 shrink that left the
   visual owning ~20% of the screen and a dead void below it. */
const CLOUD = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
const CAM_FOV = 50, CAM_Z = 7.2;

function visibleExtent() { // world units spanned by the viewport at z = 0
  const h = 2 * Math.tan((CAM_FOV * Math.PI / 180) / 2) * CAM_Z;
  return { h, w: h * (innerWidth / Math.max(1, innerHeight)) };
}

function measureHome() {
  let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
  for (let i = 0; i < COUNT; i++) {
    if (cls[i] < -0.5) continue; // parked-in-dust points are not part of the form
    const x = home[i * 3], y = home[i * 3 + 1];
    if (x < mnX) mnX = x; if (x > mxX) mxX = x;
    if (y < mnY) mnY = y; if (y > mxY) mxY = y;
  }
  if (mnX < mxX) { CLOUD.minX = mnX; CLOUD.maxX = mxX; CLOUD.minY = mnY; CLOUD.maxY = mxY; }
  computeScale();
}

/* mobile 80/20 inversion: fill the visual zone, but never clip horizontally —
   a round form on a 390-wide viewport is width-bound, so the width fit wins. */
const MOB_FILL_W = 1.02, MOB_FILL_H = 0.82, MOB_SCALE_MIN = 0.90, MOB_SCALE_MAX = 2.0;
const MOB_VISUAL_ZONE = 0.80; // top 80% of the band belongs to the visual, bottom 20% to the card

function computeScale() {
  if (!mqMobile.matches) { state.scaleT = 1.0; return; }
  const v = visibleExtent();
  const spanX = Math.max(0.2, CLOUD.maxX - CLOUD.minX);
  const spanY = Math.max(0.2, CLOUD.maxY - CLOUD.minY);
  const s = Math.min(v.w * MOB_FILL_W / spanX, v.h * MOB_FILL_H / spanY);
  // eased, never snapped: hall VI swaps cocoon→wings mid-band and the two forms
  // have different spans — an instant refit would pop inside the dissolve trough
  state.scaleT = Math.max(MOB_SCALE_MIN, Math.min(MOB_SCALE_MAX, s));
}

/* mid-section geometry swap (hall VI: cocoon -> wings at the dissolution trough).
   focusBoost mirrors EX6_GLSL's pEff so the buffer swap and the shader dissolve cross 0.5 together. */
const VARIANTS = { 5: { alt: genWings, threshold: 0.5, focusBoost: 0.32 } };
let variantOn = false;
function driveVariants() {
  const v = VARIANTS[state.exhibit];
  if (!v) { variantOn = false; return; }
  if (REDUCED) { // static path: show the after-state directly (Д3)
    if (!variantOn) { loadHome(state.exhibit, v.alt); variantOn = true; }
    return;
  }
  const p = state.progress + state.focus * (v.focusBoost || 0); // same effective progress as the shader
  if (!variantOn && p > v.threshold) { loadHome(state.exhibit, v.alt); variantOn = true; }
  else if (variantOn && p < v.threshold - 0.12) { loadHome(state.exhibit); variantOn = false; }
}

/* ═══ SCROLL / SECTION DRIVER ═════════════════════════════════ */
const sections = Array.from(document.querySelectorAll('[data-exhibit]'));
const counterEl = document.getElementById('cNum');

/* #3 · assembly is driven by COVERAGE + hysteresis, not by a narrow centre-snap.
   The old target = pow(centeredness, 1.35) only peaked in a thin band around the
   exact centre, so the cloud assembled, fell apart mid-crossing and had to be
   scrolled back to — "появява се на скрол, бързо изчезва". Coverage stays high for
   the WHOLE crossing, and the latch keeps it whole once the band owns the viewport,
   in both scroll directions. */
function coverage(rect, vh) {
  const ov = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  return Math.max(0, ov) / Math.max(1, Math.min(vh, rect.height));
}
function smoothstep01(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / Math.max(1e-6, e1 - e0)));
  return t * t * (3 - 2 * t);
}
const COV_IN = 0.42, COV_OUT = 0.18; // latch on / latch off — the hysteresis window

function driveSections() {
  if (state.peekLock != null) { // verification harness: pinned exhibit, snapped (headless gets few rAF frames)
    state.assemblyT = 1;
    state.assembly = 1;
    state.progressT = state.progressLock;
    state.progress = state.progressLock;
    driveOffset();
    state.offset.copy(state.offsetT);
    return;
  }
  const vh = innerHeight;
  let best = -1, bestC = 0;
  for (const s of sections) {
    const rect = s.getBoundingClientRect();
    if (rect.bottom < -vh || rect.top > vh * 2) continue;
    const c = coverage(rect, vh);
    const idx = +s.dataset.exhibit;
    if (idx < 0) continue;
    if (c > bestC) { bestC = c; best = idx; }
  }
  if (best >= 0 && best !== state.exhibit) {
    state.exhibit = best;
    loadHome(best);
    variantOn = false; // fresh section always starts on its base geometry
    state.assembly = Math.min(state.assembly, 0.22); // inhale from dust after rewrite
    updateCounter(best);
    if (best === 4 && !state.demoPlayed && !REDUCED) { state.demo = 1; state.demoPlayed = true; } // hall V auto-demo (skipped under reduced motion)
  }
  state.cov = bestC;
  if (!state.bandOn && bestC >= COV_IN) state.bandOn = true;
  else if (state.bandOn && bestC < COV_OUT) state.bandOn = false;
  // latched → fully assembled; otherwise ease in with coverage (monotone, never a dip-and-return)
  const target = state.bandOn ? 1 : Math.min(0.88, smoothstep01(0.02, COV_IN, bestC));
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

/* cloud placement: story card sits at the band bottom → lift the cloud into the
   upper ~60% of the screen (mobile keeps the v2 clean-top-band offset) */
const mqMobile = window.matchMedia('(max-width: 899px)');
function driveOffset() {
  if (mqMobile.matches) {
    // #4 · centre the form inside the top-80% visual zone (was: shoved into a thin
    // top strip at y=1.35, which left a dead ~35vh void between cloud and card)
    const v = visibleExtent();
    const worldY = (0.5 - MOB_VISUAL_ZONE / 2) * v.h;         // screen 40% from the top
    const cy = ((CLOUD.minY + CLOUD.maxY) / 2) * state.scale; // the form's own centre
    state.offsetT.set(0, worldY - cy, 0);
    return;
  }
  state.offsetT.set(0, 0.55, 0);
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
  const s = state.scale || 1; // undo the mobile cloud scale → true cloud-local coords
  state.pointer.copy(world.sub(state.offset).divideScalar(s));
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
  if (e.target.closest('a,button,input,label,textarea,select,.plaque,.wl-card,dialog,.v1s,.tr-story')) return;
  holdX = e.clientX; holdY = e.clientY;
  pointerToLocal(e.clientX, e.clientY);
  holdTimer = setTimeout(() => { state.focusT = 1; }, 160);
}, { passive: true });
addEventListener('pointerup', cancelHold, { passive: true });
addEventListener('pointercancel', cancelHold, { passive: true });

/* ═══ MAIN LOOP ═══════════════════════════════════════════════ */
let lastFrame = performance.now();
let sizeCheck = 0;

/* one full frame, decoupled from rAF: a backgrounded/headless tab never fires
   rAF, so verification (screenshots, settle-then-measure) drives tick() directly. */
function tick(dt) {
  state.time += dt;

  if (++sizeCheck >= 30) { // guard against missed resize events (embedded viewports): CSS stretches a stale buffer
    sizeCheck = 0;
    const sz = renderer.getSize(new THREE.Vector2());
    if ((sz.x !== innerWidth || sz.y !== innerHeight) && innerWidth > 0 && innerHeight > 0) {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }
  }

  driveSections();
  driveVariants();
  driveOffset();

  const k = 1 - Math.pow(0.0018, dt); // frame-rate independent ease
  // assembly gets its own, slower channel — forms gather gradually (~1.5s to 95%)
  // instead of snapping together; reduced motion keeps the quick settle
  const kAsm = REDUCED ? k : 1 - Math.pow(0.12, dt);
  state.assembly += (state.assemblyT - state.assembly) * kAsm;
  state.progress += (state.progressT - state.progress) * k;
  state.focus += (state.focusT - state.focus) * (1 - Math.pow(0.001, dt));
  state.swirlT *= Math.pow(0.25, dt); // swirl decays when the mouse rests
  state.swirl += (state.swirlT - state.swirl) * k;
  state.offset.lerp(state.offsetT, k);
  state.scale += (state.scaleT - state.scale) * k;
  if (state.demo > 0) state.demo = Math.max(0, state.demo - dt * 0.4); // uDemo pulse 1 -> 0 (~2.5s)

  uniforms.uScale.value = state.scale;
  uniforms.uTime.value = REDUCED ? 12.0 : state.time;
  uniforms.uAssembly.value = state.assembly;
  uniforms.uProgress.value = state.progress;
  uniforms.uFocus.value = state.focus;
  uniforms.uSwirl.value = state.swirl;
  uniforms.uFlash.value = state.flash;
  uniforms.uDemo.value = state.demo;

  renderer.render(scene, camera);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  tick(dt);
}

addEventListener('resize', () => {
  if (!renderer) return;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  computeScale(); // viewport changed → refit the cloud to the band (#4)
});

/* ═══ STORY-CARD REVEAL (transition bands fade their line in) ═══ */
const po = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('visible'); po.unobserve(en.target); }
    }, { threshold: 0.25 })
  : null;
document.querySelectorAll('.plaque, .tr-story').forEach(p => po ? po.observe(p) : p.classList.add('visible'));

/* ═══ BOOT ════════════════════════════════════════════════════ */
const NOGL = new URLSearchParams(location.search).get('nogl'); // verification: DOM-only mode
if (NOGL && renderer) { renderer = null; }
if (renderer && renderer.getContext()) {
  initGL();
  renderer.setSize(innerWidth, innerHeight);
  loadHome(0);
  updateCounter(0);
  state.scale = state.scaleT;          // first frame must already be fitted, not eased in from 1.0
  driveOffset(); state.offset.copy(state.offsetT);
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
      if (s.id !== 'ex-' + peek && s.id !== peek) s.style.display = 'none'; // ?peek=N (band) or ?peek=<section-id> (hero, cta, …)
    });
    const idx = parseInt(peek, 10) - 1;
    if (renderer && !isNaN(idx) && idx >= 0 && idx < 8) {
      state.peekLock = idx;
      const pv = parseFloat(qs.get('prog'));
      state.progressLock = Number.isFinite(pv) ? pv : 0.5;
      loadHome(idx);
      updateCounter(idx);
      state.exhibit = idx;
      state.assembly = 1;
    }
  }
  if (qs.get('sweep') && renderer) {
    /* verification: walk the scroll in-page and dump the drama sequence into the DOM.
       Each step is exhibit:assemblyT:progressT:coverage.
       Two passes — DOWN then UP — because a one-way pass cannot see a direction-
       dependent latch; both must return the same verdict (#3 symmetry). */
    const STEPS = 40, COV_JUDGE = 0.50, ASM_MIN = 0.90, DIP = 0.35;
    const d = document.createElement('div');
    d.id = 'sweepOut';
    d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;background:#111;color:#ff0;font:10px monospace;padding:4px;max-width:92vw;white-space:pre-wrap';
    document.body.appendChild(d);

    // verdict is computed here, from the same numbers printed above it — never from a screenshot
    const verdict = (tag, rows) => {
      const p = rows.map(r => r.split(':').map(Number));
      let low = 0, flick = 0;
      for (const row of p) if (row[3] >= COV_JUDGE && row[1] < ASM_MIN) low++;
      let i = 0;
      while (i < p.length) {
        let j = i;
        while (j + 1 < p.length && p[j + 1][0] === p[i][0]) j++;
        let peak = -1, trough = 2, dipped = false;
        for (let k = i; k <= j; k++) {           // dip-and-return INSIDE one exhibit run
          const a = p[k][1];
          if (a > peak) { peak = a; trough = a; }
          if (a < trough) trough = a;
          if (peak - trough > DIP) dipped = true;
          if (dipped && a > trough + 0.05) { flick++; dipped = false; peak = a; trough = a; }
        }
        i = j + 1;
      }
      return tag + ' asm≥' + ASM_MIN + '@cov≥' + COV_JUDGE + '=' + (low ? 'FAIL(' + low + ')' : 'PASS')
        + ' flicker=' + (flick ? 'FAIL(' + flick + ')' : 'PASS');
    };

    const run = () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const H = Math.max(1, document.body.scrollHeight - innerHeight);
      const pass = (dir) => {
        const out = [];
        for (let s = 0; s <= STEPS; s++) {
          const k = dir > 0 ? s : STEPS - s;
          window.__museum.step(Math.round(H * k / STEPS));
          out.push(state.exhibit + ':' + state.assemblyT.toFixed(2)
            + ':' + state.progressT.toFixed(2) + ':' + state.cov.toFixed(2));
        }
        return out;
      };
      const down = pass(1), up = pass(-1);
      window.__museum.step(0);
      d.textContent = 'SWEEP H=' + H + ' vh=' + innerHeight + ' scale=' + state.scale.toFixed(2)
        + '\nDOWN:: ' + down.join(' ')
        + '\nUP:: ' + up.join(' ')
        + '\n' + verdict('DOWN', down) + ' | ' + verdict('UP', up);
    };
    // rAF never fires in a throttled/background tab → timeout fallback keeps the harness usable headless
    requestAnimationFrame(run);
    setTimeout(() => { if (!d.textContent) run(); }, 500);
    window.__museum.sweep = () => { d.textContent = ''; run(); return d.textContent; };
  }
  /* layout metrics for #4 / M2 — numbers instead of eyeballing a screenshot.
     canvasVH = the <canvas> element itself (fixed full-bleed → 1.00 by construction)
     cloudVH  = the projected vertical extent of the ASSEMBLED form (the honest one)
     textVH   = the active band's story card
     gapVH    = largest empty vertical run (nothing but ambient dust) — anti-void metric
     ctaScrolls = distance to the waitlist form in screens · sticky = #stickyCta shown */
  function layoutMetrics() {
    const vh = innerHeight;
    const cnv = document.getElementById('stage');
    const canvasVH = cnv ? cnv.getBoundingClientRect().height / vh : 0;
    const v = visibleExtent();
    const s = state.scale;
    // world y → screen px (z = 0 plane; perspective on off-plane grains is ignored)
    const yTop = (0.5 - (CLOUD.maxY * s + state.offset.y) / v.h) * vh;
    const yBot = (0.5 - (CLOUD.minY * s + state.offset.y) / v.h) * vh;
    const cloudVis = state.assembly > 0.5 ? Math.max(0, Math.min(vh, yBot) - Math.max(0, yTop)) : 0;
    const act = sections.find(x => +x.dataset.exhibit === state.exhibit);
    const card = act ? act.querySelector('.tr-story') : null;
    const cr = card ? card.getBoundingClientRect() : null;
    const textPx = cr ? Math.max(0, Math.min(vh, cr.bottom) - Math.max(0, cr.top)) : 0;
    const occ = [];
    if (cloudVis > 0) occ.push([Math.max(0, yTop), Math.min(vh, yBot)]);
    if (textPx > 0) occ.push([Math.max(0, cr.top), Math.min(vh, cr.bottom)]);
    occ.sort((a, b) => a[0] - b[0]);
    let cur = 0, gap = 0;
    for (const [a, b] of occ) { if (a - cur > gap) gap = a - cur; if (b > cur) cur = b; }
    if (vh - cur > gap) gap = vh - cur;
    const cta = document.getElementById('cta');
    const sticky = document.getElementById('stickyCta');
    return {
      canvasVH: +canvasVH.toFixed(2),
      cloudVH: +(cloudVis / vh).toFixed(2),
      textVH: +(textPx / vh).toFixed(2),
      gapVH: +(gap / vh).toFixed(2),
      ctaScrolls: cta ? +(Math.max(0, cta.getBoundingClientRect().top) / vh).toFixed(2) : -1,
      sticky: sticky && sticky.classList.contains('show') ? 1 : 0,
    };
  }
  if (window.__museum) window.__museum.metrics = layoutMetrics;

  if (qs.get('diag')) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;background:#222;color:#0f0;font:12px monospace;padding:6px;white-space:pre';
    document.body.appendChild(d);
    const paint = () => {
      const m = layoutMetrics();
      d.textContent = 'y=' + Math.round(scrollY) + ' ex=' + state.exhibit + ' asm=' + state.assembly.toFixed(2)
        + ' tgt=' + state.assemblyT.toFixed(2) + ' cov=' + state.cov.toFixed(2)
        + ' prog=' + state.progress.toFixed(2) + ' red=' + (REDUCED ? 1 : 0)
        + (renderer ? ' calls=' + renderer.info.render.calls + ' pts=' + renderer.info.render.points : ' nogl')
        + ' vw=' + innerWidth + 'x' + innerHeight
        + '\ncanvasVH=' + m.canvasVH + ' cloudVH=' + m.cloudVH + ' textVH=' + m.textVH
        + ' gapVH=' + m.gapVH + ' ctaScrolls=' + m.ctaScrolls + ' sticky=' + m.sticky
        + ' scale=' + state.scale.toFixed(2);
    };
    paint();
    setInterval(paint, 250); // interval, not rAF: the HUD must keep updating in a throttled tab
  }
}
