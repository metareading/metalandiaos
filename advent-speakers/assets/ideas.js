/* The metaidea layer · the Eidolon effect (build log „Encore 29 · Point clouds“), in the advent palette.
   Method kept as originally created: ONE BufferGeometry sized to the cloud, three custom attributes per grain
   (aHome = its place in the active image · aDust = a stable resting place in a loose shell · aSeed = size + stagger),
   a seed-staggered uAssembly lerp in the vertex shader (the cloud breathes into shape, never snaps), every image sampled from math
   (lathe a profile, loft a tube, fill a silhouette; no model file, no image service), sine-layer curl dust, a cursor that stirs the air.
   Perf budget adopted from the dust craft: 18k grains on a phone, 34k on a desktop. Three.js r160 from the local vendor copy. */
(function () {
'use strict';
var THREE = window.THREE, TAU = Math.PI * 2;
function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ── samplers: each returns function(rn) → [x, y, z]; aim: even surface coverage, not even parameter coverage ── */
function jit(rn, r) { if (!r) return [0, 0, 0]; var u = rn() * 2 - 1, a = rn() * TAU, s = Math.sqrt(1 - u * u), q = r * Math.cbrt(rn()); return [q * s * Math.cos(a), q * s * Math.sin(a), q * u]; }
function poly(P, r) {   /* a polyline, even along its length, r thick */
  var segs = [], tot = 0, i; for (i = 1; i < P.length; i++) { var l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], (P[i][2] || 0) - (P[i - 1][2] || 0)); segs.push(l); tot += l; }
  var f = function (rn) { var d = rn() * tot, i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; } var k = d / (segs[i] || 1), a = P[i], b = P[i + 1], j = jit(rn, r);
    return [a[0] + (b[0] - a[0]) * k + j[0], a[1] + (b[1] - a[1]) * k + j[1], (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * k + j[2]]; };
  f.len = tot; return f; }
function path(fn, r, n) { n = n || 120; var P = [], i; for (i = 0; i <= n; i++) P.push(fn(i / n)); return poly(P, r); }
function closed(P, r) { return poly(P.concat([P[0]]), r); }
function fill(P, zt) {   /* inside a 2D silhouette */
  var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; P.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  function inside(x, y) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  return function (rn) { for (var k = 0; k < 80; k++) { var x = x0 + rn() * (x1 - x0), y = y0 + rn() * (y1 - y0); if (inside(x, y)) return [x, y, (rn() - 0.5) * (zt || 0)]; } return [P[0][0], P[0][1], 0]; }; }
function lathe(prof, r) { var p = poly(prof.map(function (q) { return [q[0], q[1], 0]; }), 0); return function (rn) { var q = p(rn), a = rn() * TAU, j = jit(rn, r || 0.006); return [Math.cos(a) * q[0] + j[0], q[1] + j[1], Math.sin(a) * q[0] + j[2]]; }; }
function ell(c, rx, ry, rz, shell) { return function (rn) { var u = rn() * 2 - 1, a = rn() * TAU, s = Math.sqrt(1 - u * u), q = shell ? 1 - 0.05 * rn() : Math.cbrt(rn()); return [c[0] + rx * q * s * Math.cos(a), c[1] + ry * q * u, (c[2] || 0) + rz * q * s * Math.sin(a)]; }; }
function ball(c, R, shell) { return ell(c, R, R, R, shell); }
function capsule(a, b, R) { return function (rn) { var k = rn(), j = jit(rn, R); return [a[0] + (b[0] - a[0]) * k + j[0], a[1] + (b[1] - a[1]) * k + j[1], (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * k + j[2]]; }; }
function xf(f, m) { return function (rn) { return m(f(rn)); }; }
function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
function rotZ(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; }
function mirror(f) { return xf(f, function (p) { return [-p[0], p[1], p[2]]; }); }
function star(c, R, r, n) { var P = [], k; n = n || 4; for (k = 0; k < 2 * n; k++) { var a = k * Math.PI / n + Math.PI / 2, q = k % 2 ? r : R; P.push([c[0] + q * Math.cos(a), c[1] + q * Math.sin(a)]); } return P; }
function leaf(base, ang, len, wid) { var c = Math.cos(ang), s = Math.sin(ang); return function (rn) { var u = rn(), hw = wid * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9), v = rn() * 2 - 1, e = rn(); if (e < 0.42) v = v < 0 ? -1 : 1; else if (e < 0.56) v = 0;
  var x = u * len, y = v * hw; return [base[0] + x * c - y * s, base[1] + x * s + y * c, 0.1 * Math.sin(Math.PI * u) * (1 - Math.abs(v)) + (rn() - 0.5) * 0.03]; }; }
function bez(P0, P1, P2, P3) { return function (t) { var m = 1 - t; return [m * m * m * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2[0] + t * t * t * P3[0], m * m * m * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2[1] + t * t * t * P3[1], 0]; }; }

/* ── the 20 images. A part = [share of the grains, sampler, colour: 'w' bone white · 'r' TED red · 'W' bright white · 'm' mixed] ── */
var FORMS = {
  /* a seed with its first two leaves: not known yet what it will be */
  sprout: function () { var top = [0.052, 0.28]; return { parts: [
    [1.3, poly([[-0.95, -0.6], [0.95, -0.6]], 0.012), 'w'], [0.7, function (rn) { return [(rn() * 2 - 1) * 0.9, -0.62 - rn() * rn() * 0.3, (rn() - 0.5) * 0.3]; }, 'w'],
    [1.8, ell([0, -0.76], 0.17, 0.11, 0.11, true), 'r'], [1.5, path(function (t) { return [0.1 * Math.sin(t * 2.6), -0.66 + t * 0.94, 0]; }, 0.017), 'w'],
    [2.8, leaf(top, 0.62, 0.62, 0.17), 'w'], [2.6, leaf(top, Math.PI - 0.7, 0.54, 0.15), 'w'], [0.4, ball([top[0], top[1] + 0.03], 0.045), 'r']] }; },
  /* a fingerprint: the one pattern nobody else has */
  finger: function () { var parts = []; for (var k = 0; k < 10; k++) (function (k) { var w = 0.06 + 0.068 * k, cy = 0.16 - 0.022 * k;
    var f = path(function (t) { if (t < 0.3) return [-w, -1 + (cy + 1) * (t / 0.3), 0]; if (t > 0.7) return [w, cy - (cy + 1) * ((t - 0.7) / 0.3), 0]; var a = Math.PI * (1 - (t - 0.3) / 0.4); return [w * Math.cos(a), cy + w * 1.2 * Math.sin(a), 0]; }, 0.011, 90);
    parts.push([f.len, function (rn) { for (var i = 0; i < 40; i++) { var p = f(rn); p[0] += 0.016 * Math.sin(p[1] * 8 + k * 1.7); var e = (p[0] / 0.7) * (p[0] / 0.7) + ((p[1] + 0.02) / 0.96) * ((p[1] + 0.02) / 0.96);
      if (e < 1 && Math.sin(p[1] * 23 + k * 5.1) > -0.93) return p; } return [0, cy, 0]; }, k % 4 === 1 ? 'r' : 'w']); })(k); return { parts: parts, sway: 0.12 }; },
  /* a balloon: lightness, play */
  balloon: function () { var body = function (rn) { var u = rn() * 2 - 1, a = rn() * TAU, s = Math.sqrt(1 - u * u), pin = 1 - 0.3 * Math.pow(Math.max(0, -u), 2.2); return [0.56 * s * Math.cos(a) * pin, 0.3 + 0.66 * u, 0.56 * s * Math.sin(a) * pin]; };
    return { parts: [[7, body, 'r'], [0.9, function (rn) { for (var i = 0; i < 200; i++) { var p = body(rn); if ((p[0] * -0.42 + (p[1] - 0.3) * 0.5 + p[2] * 0.76) > 0.5) return p; } return body(rn); }, 'W'],
      [0.5, fill([[-0.055, -0.44], [0.055, -0.44], [0, -0.35]], 0.05), 'r'], [1.2, path(function (t) { return [0.06 * Math.sin(t * 7), -0.44 - t * 0.54, 0]; }, 0.01), 'w']], sway: 0.3 }; },
  /* an iceberg: the small part seen, the large part under the water */
  iceberg: function () { var tip = [[-0.3, 0.2], [-0.22, 0.42], [-0.1, 0.5], [-0.02, 0.82], [0.1, 0.62], [0.2, 0.66], [0.34, 0.2]], low = [[-0.42, 0.2], [-0.62, -0.05], [-0.5, -0.35], [-0.58, -0.6], [-0.3, -0.78], [-0.12, -0.98], [0.1, -0.8], [0.36, -0.86], [0.5, -0.5], [0.66, -0.3], [0.52, 0], [0.46, 0.2]];
    return { parts: [[2.2, path(function (t) { var x = -1 + 2 * t; return [x, 0.2 + 0.014 * Math.sin(x * 15), 0]; }, 0.012), 'w'], [2.4, closed(tip, 0.012), 'W'], [1.5, fill(tip, 0.25), 'w'],
      [3.4, closed(low, 0.013), 'r'], [2.6, fill(low, 0.4), 'r'], [0.5, poly([[-0.02, 0.82], [0.02, 0.2]], 0.008), 'w'], [0.9, poly([[-0.12, -0.98], [0, 0.2], [0.5, -0.5]], 0.008), 'r']], sway: 0.16 }; },
  /* a heart that beats: breathing, alive */
  heart: function () { return { parts: [[1, function (rn) { var t = rn() * TAU, s = rn() < 0.42 ? 1 : Math.sqrt(rn()), x = 16 * Math.pow(Math.sin(t), 3) / 17, y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
    return [x * s, 0.1 + (y - 0.1) * s, (rn() < 0.5 ? -1 : 1) * 0.3 * Math.sqrt(Math.max(0, 1 - s * s)) * (0.35 + 0.65 * rn())]; }, 'r']], beat: 1, sway: 0.3 }; },
  /* a wand with a spark at its tip: magic among the ordinary */
  wand: function () { var S = [0.36, 0.42]; return { parts: [[2.4, capsule([-0.5, -0.5], [0.2, 0.25], 0.024), 'w'], [1.5, capsule([-0.8, -0.82], [-0.5, -0.5], 0.045), 'r'],
    [2.6, closed(star(S, 0.36, 0.075), 0.011), 'W'], [1.8, fill(star(S, 0.36, 0.075), 0.05), 'W'], [0.8, closed(star([0.8, 0.74], 0.13, 0.03), 0.008), 'r'], [0.6, closed(star([0.68, 0.06], 0.1, 0.025), 0.008), 'w'],
    [0.7, closed(star([-0.02, 0.76], 0.11, 0.026), 0.008), 'r'], [1.2, function (rn) { var a = rn() * TAU, q = 0.2 + 0.5 * Math.sqrt(rn()); return [S[0] + q * Math.cos(a), S[1] + q * Math.sin(a) * 0.9, (rn() - 0.5) * 0.3]; }, 'm']], sway: 0.14 }; },
  /* a spiral galaxy: many dimensions in one */
  galaxy: function () { var g = function (rn) { if (rn() < 0.2) { var q = jit(rn, 0.17); return [q[0], q[1] * 0.55, q[2]]; } if (rn() < 0.06) return jit(rn, 1);
    var r = 0.08 + 0.92 * Math.pow(rn(), 0.75), th = (rn() < 0.5 ? 0 : Math.PI) + 3.3 * Math.log(1 + 3.2 * r) + (rn() - 0.5) * (rn() - 0.5) * 2.4 * (1.5 - r); return [r * Math.cos(th), (rn() - 0.5) * 0.07 * (1.2 - r), r * Math.sin(th)]; };
    return { parts: [[1, xf(g, function (p) { return rotZ(rotX(p, 1.02), -0.3); }), 'm']], sway: 0.35, spin: 1 }; },
  /* an atom: how the Universe works, at the root */
  atom: function () { var parts = [], k; for (k = 0; k < 7; k++) parts.push([0.3, ball([0.09 * Math.cos(k * 2.4), 0.09 * Math.sin(k * 2.4), 0.07 * Math.cos(k * 1.3)], 0.075, true), k % 2 ? 'W' : 'r']);
    for (k = 0; k < 3; k++) (function (k) { var a = k * Math.PI / 3 + 0.26, orb = function (t) { return rotZ([0.96 * Math.cos(t * TAU), 0.33 * Math.sin(t * TAU), 0.3 * Math.sin(t * TAU)], a); };
      parts.push([2.4, path(orb, 0.009, 140), 'w']); parts.push([0.5, ball(orb(0.13 + k * 0.31), 0.055), 'r']); })(k); return { parts: parts, sway: 0.3 }; },
  /* an arrow on a drawn bow: the mind that hunts */
  bow: function () { var tipY = Math.sin(0.875), tipX = -0.55 + Math.cos(0.875); return { parts: [[3.2, path(function (t) { var a = -0.875 + 1.75 * t; return [-0.55 + Math.cos(a), Math.sin(a), 0]; }, 0.02), 'w'], [0.6, capsule([0.45, -0.12], [0.45, 0.12], 0.04), 'r'],
    [1.8, poly([[tipX, tipY], [-0.5, 0], [tipX, -tipY]], 0.007), 'w'], [2.2, capsule([-0.5, 0], [0.86, 0], 0.013), 'W'], [1, fill([[0.99, 0], [0.8, 0.085], [0.8, -0.085]], 0.04), 'r'], [0.6, closed([[0.99, 0], [0.8, 0.085], [0.8, -0.085]], 0.008), 'r'],
    [0.5, fill([[-0.5, 0], [-0.63, 0.1], [-0.47, 0.1], [-0.35, 0]], 0.02), 'r'], [0.5, fill([[-0.5, 0], [-0.63, -0.1], [-0.47, -0.1], [-0.35, 0]], 0.02), 'r']], sway: 0.14 }; },
  /* scales where life weighs more */
  scales: function () { var L = [-0.707, 0.737], R = [0.707, 0.463], pan = function (c) { return path(function (t) { var a = Math.PI * t; return [c[0] + 0.27 * Math.cos(a), c[1] - 0.1 * Math.sin(a), 0]; }, 0.012); };
    var PL = [L[0], L[1] - 0.6], PR = [R[0], R[1] - 0.6]; return { parts: [[0.9, fill([[-0.32, -0.95], [0.32, -0.95], [0.16, -0.84], [-0.16, -0.84]], 0.2), 'w'], [2, capsule([0, -0.84], [0, 0.6], 0.026), 'w'], [0.5, ball([0, 0.64], 0.06), 'r'],
      [2.2, poly([L, R], 0.018), 'W'], [0.7, poly([[PL[0] - 0.27, PL[1]], L, [PL[0] + 0.27, PL[1]]], 0.006), 'w'], [0.7, poly([[PR[0] - 0.27, PR[1]], R, [PR[0] + 0.27, PR[1]]], 0.006), 'w'],
      [1.3, pan(PL), 'w'], [0.5, poly([[PL[0] - 0.27, PL[1]], [PL[0] + 0.27, PL[1]]], 0.008), 'w'], [1.3, pan(PR), 'w'], [0.5, poly([[PR[0] - 0.27, PR[1]], [PR[0] + 0.27, PR[1]]], 0.008), 'w'],
      [1.5, ball([PR[0], PR[1] + 0.07], 0.12), 'r'], [0.3, ball([PL[0], PL[1] + 0.02], 0.045), 'W']], sway: 0.14 }; },
  /* a paper plane: someone who tries */
  plane: function () { var A = [-0.95, 0.2], B = [0.95, 0.62], C = [-0.32, -0.62], Dp = [-0.4, -0.02]; return { parts: [[2.6, closed([A, B, Dp], 0.011), 'W'], [1.6, fill([A, B, Dp], 0.03), 'w'], [2.2, closed([Dp, B, C], 0.011), 'W'], [2, fill([Dp, B, C], 0.03), 'r'],
    [1.2, function (rn) { for (var i = 0; i < 40; i++) { var t = rn(); if (Math.sin(t * 46) > 0) return [-0.42 - 0.5 * t + (rn() - 0.5) * 0.012, -0.5 - 0.42 * t * t + 0.09 * Math.sin(t * 8) + (rn() - 0.5) * 0.012, 0]; } return [-0.5, -0.6, 0]; }, 'w']], sway: 0.18 }; },
  /* a peak with a flag on it: the dreamer who does not give up */
  peak: function () { var M = [[-0.98, -0.8], [-0.52, -0.12], [-0.36, -0.3], [0.1, 0.52], [0.4, -0.02], [0.55, 0.12], [0.98, -0.8]]; return { parts: [[3.6, poly(M, 0.013), 'w'], [0.9, poly([[-0.98, -0.8], [0.98, -0.8]], 0.01), 'w'], [1.3, fill(M, 0.25), 'w'],
    [1.7, fill([[0.1, 0.52], [-0.08, 0.2], [0, 0.27], [0.06, 0.16], [0.14, 0.28], [0.21, 0.19], [0.28, 0.2]], 0.1), 'W'], [0.6, poly([[0.1, 0.52], [0.17, 0.1], [0.05, -0.3], [0.2, -0.8]], 0.007), 'w'],
    [0.7, capsule([0.1, 0.52], [0.1, 0.96], 0.011), 'W'], [1.5, fill([[0.1, 0.96], [0.5, 0.86], [0.1, 0.74]], 0.03), 'r'], [0.5, closed([[0.1, 0.96], [0.5, 0.86], [0.1, 0.74]], 0.008), 'r']], sway: 0.12 }; },
  /* a wrapped gift: the wink in the line (a chore handed over as a present) */
  gift: function () { var box = function (a, y0, y1) { return function (rn) { var f = (rn() * 5) | 0, u = rn() * 2 - 1, v = rn(), p; if (rn() < 0.62) { if (rn() < 0.5) u = u < 0 ? -1 : 1; else v = v < 0.5 ? 0 : 1; }
      if (f === 4) { var w = rn() * 2 - 1; if (rn() < 0.62) w = w < 0 ? -1 : 1; p = [u * a, y1, w * a]; } else { var y = y0 + (y1 - y0) * v; p = f === 0 ? [u * a, y, a] : f === 1 ? [u * a, y, -a] : f === 2 ? [a, y, u * a] : [-a, y, u * a]; } return p; }; };
    var band = function (ax) { return function (rn) { var a = 0.645, f = (rn() * 3) | 0, w = (rn() - 0.5) * 0.17, t = rn(), p = f === 0 ? [w, -0.85 + 1.24 * t, a] : f === 1 ? [w, -0.85 + 1.24 * t, -a] : [w, 0.392, (t * 2 - 1) * a]; return ax ? [p[2], p[1], p[0]] : p; }; };
    var loop = function (sg) { return path(function (t) { var a = t * TAU; return [sg * (0.21 + 0.2 * Math.cos(a)), 0.56 + 0.13 * Math.sin(a) + 0.05 * Math.cos(a), 0.05 * Math.sin(a)]; }, 0.02); };
    var tilt = function (p) { return rotX(rotY(p, 0.62), 0.36); }; return { parts: [[5, xf(box(0.58, -0.85, 0.2), tilt), 'w'], [2.2, xf(box(0.64, 0.2, 0.39), tilt), 'w'], [1.6, xf(band(0), tilt), 'r'], [1.6, xf(band(1), tilt), 'r'],
      [1, xf(loop(1), tilt), 'r'], [1, xf(loop(-1), tilt), 'r'], [0.4, xf(ball([0, 0.44, 0], 0.06), tilt), 'r']], sway: 0.22 }; },
  /* an open hand with a small light on it: the selfless gift */
  hand: function () { var capsule = function (a, b, R) { var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;   /* a finger with a clear edge */
      return function (rn) { var k = rn(), e = rn() < 0.6, q = e ? (rn() < 0.5 ? -1 : 1) : rn() * 2 - 1; if (e && rn() < 0.22) { var an = rn() * Math.PI; return [b[0] + R * (Math.cos(an) * nx + Math.sin(an) * dx / L), b[1] + R * (Math.cos(an) * ny + Math.sin(an) * dy / L), 0]; } return [a[0] + dx * k + nx * q * R, a[1] + dy * k + ny * q * R, (rn() - 0.5) * 0.03]; }; };
    var parts = [], fx = [-0.29, -0.1, 0.095, 0.285], fl = [0.56, 0.66, 0.61, 0.46], fa = [-0.12, -0.04, 0.04, 0.14], k;
    var lay = function (p) { return rotX(rotZ([p[0], p[1] + 0.3, p[2]], -Math.PI / 2), -0.72); };
    parts.push([3.2, xf(function (rn) { for (var i = 0; i < 60; i++) { var x = (rn() * 2 - 1), y = (rn() * 2 - 1); var e3 = Math.pow(Math.abs(x), 3) + Math.pow(Math.abs(y), 3); if (e3 < 1 && (e3 > 0.8 || rn() < 0.3)) return [x * 0.4, -0.38 + y * 0.42, (rn() - 0.5) * 0.04]; } return [0, -0.38, 0]; }, lay), 'w']);
    for (k = 0; k < 4; k++) { var b = [fx[k], -0.04], d = [Math.sin(fa[k]), Math.cos(fa[k])], m = [b[0] + d[0] * fl[k] * 0.52, b[1] + d[1] * fl[k] * 0.52], d2 = [Math.sin(fa[k] * 1.6), Math.cos(fa[k] * 1.6)], t = [m[0] + d2[0] * fl[k] * 0.48, m[1] + d2[1] * fl[k] * 0.48];
      parts.push([0.75, xf(capsule(b, m, 0.082), lay), 'w']); parts.push([0.7, xf(capsule(m, t, 0.074), lay), 'w']); }
    parts.push([0.8, xf(capsule([-0.36, -0.52], [-0.56, -0.3], 0.095), lay), 'w']); parts.push([0.7, xf(capsule([-0.56, -0.3], [-0.7, -0.1], 0.082), lay), 'w']);
    parts.push([1.5, ball([-0.1, 0.5, 0.12], 0.13, true), 'r']); parts.push([0.6, function (rn) { var a = rn() * TAU, q = 0.17 + 0.2 * rn() * rn(); return [-0.1 + q * Math.cos(a), 0.5 + q * Math.sin(a), 0.12]; }, 'W']);
    return { parts: parts, sway: 0.2 }; },
  /* a bridge: a connection made */
  bridge: function () { var cab = function (x) { var ax = Math.abs(x); if (ax <= 0.48) return -0.2 + 0.82 * (ax / 0.48) * (ax / 0.48); var u = (ax - 0.48) / 0.52; return 0.62 - 0.9 * u - 0.1 * Math.sin(Math.PI * u); };
    var parts = [], z; [-0.1, 0.1].forEach(function (z) { parts.push([1.6, poly([[-1, -0.28, z], [1, -0.28, z]], 0.014), 'W']); parts.push([1.6, path(function (t) { var x = -1 + 2 * t; return [x, cab(x), z]; }, 0.011, 160), 'r']);
      [-0.48, 0.48].forEach(function (x) { parts.push([0.9, capsule([x, -0.66, z], [x, 0.64, z], 0.026), 'w']); });
      parts.push([1.1, function (rn) { var x = Math.round((rn() * 1.92 - 0.96) / 0.08) * 0.08, y = -0.28 + (cab(x) + 0.28) * rn(); return [x + (rn() - 0.5) * 0.008, y, z]; }, 'w']); });
    [-0.48, 0.48].forEach(function (x) { parts.push([0.3, poly([[x, 0.6, -0.1], [x, 0.6, 0.1]], 0.014), 'w']); parts.push([0.3, poly([[x, 0.2, -0.1], [x, 0.2, 0.1]], 0.012), 'w']); });
    parts.push([1.2, function (rn) { var x = rn() * 2 - 1, r = (rn() * 3) | 0; return [x, -0.72 - r * 0.09 + 0.012 * Math.sin(x * 22 + r * 2), (rn() - 0.5) * 0.5]; }, 'w']);
    return { parts: parts.map(function (p) { return [p[0], xf(p[1], function (q) { return rotX(rotY(q, 0.42), 0.12); }), p[2]]; }), sway: 0.2 }; },
  /* an open door with light in it: room made for something new */
  door: function () { var ca = Math.cos(1.1), sa = Math.sin(1.1), t = function (q) { return rotX(rotY(q, -0.3), 0.1); }, P = function (w, f, c) { return [w, xf(f, t), c]; };
    return { parts: [P(3.2, poly([[-0.42, -0.85], [-0.42, 0.9], [0.42, 0.9], [0.42, -0.85]], 0.026), 'w'), P(0.9, poly([[-0.95, -0.85], [0.95, -0.85]], 0.01), 'w'),
      P(2.4, function (rn) { var u = rn(), v = rn(); if (rn() < 0.55) { if (rn() < 0.5) u = u < 0.5 ? 0 : 1; else v = v < 0.5 ? 0 : 1; } return [-0.42 - 0.84 * u * ca, -0.85 + 1.75 * v, 0.84 * u * sa]; }, 'r'), P(0.3, ball([-0.42 - 0.84 * 0.84 * ca, -0.02, 0.84 * 0.84 * sa + 0.03], 0.035), 'W'),
      P(2.6, function (rn) { var x = (rn() + rn() - 1) * 0.39, y = -0.85 + 1.72 * Math.pow(rn(), 1.25); return [x, y, -0.05 - rn() * 0.2]; }, 'W'),
      P(1.8, function (rn) { var z = Math.pow(rn(), 1.5) * 0.95, x = (rn() * 2 - 1) * (0.39 + 0.3 * z); return [x, -0.85, z]; }, 'W')], sway: 0.16 }; },
  /* an amphora that gathers itself again: new life for an old thing (the first Eidolon exhibit) */
  amphora: function () { var prof = [[0.11, -0.98], [0.2, -0.96], [0.2, -0.92], [0.13, -0.86], [0.2, -0.72], [0.38, -0.42], [0.5, -0.1], [0.52, 0.12], [0.44, 0.34], [0.26, 0.5], [0.15, 0.6], [0.13, 0.74], [0.17, 0.84], [0.26, 0.9], [0.27, 0.94], [0.2, 0.94]];
    var h = path(bez([0.43, 0.36], [0.8, 0.5], [0.62, 0.9], [0.13, 0.74]), 0.028); return { parts: [[8, lathe(prof, 0.006), 'w'], [1, h, 'w'], [1, mirror(h), 'w'], [0.9, lathe([[0.515, 0.06], [0.52, 0.17]], 0.006), 'r'], [0.35, lathe([[0.135, 0.66], [0.13, 0.7]], 0.005), 'r'],
      [0.5, lathe([[0.36, -0.46], [0.39, -0.4]], 0.005), 'r']], sway: 0.34, spin: 1 }; },
  /* a drop and its rings on the water: the good goes on */
  ripples: function () { var parts = [], R = [0.2, 0.42, 0.66, 0.93], t = function (q) { return rotX(q, 0.42); };
    R.forEach(function (r, k) { parts.push([r * (1.5 - k * 0.22) * 3, xf(path(function (u) { var a = u * TAU; return [r * Math.cos(a), -0.42, r * Math.sin(a)]; }, 0.016 - k * 0.002, 140), t), k < 2 ? 'W' : 'w']); });
    parts.push([1.7, lathe([[0, 0.78], [0.045, 0.62], [0.105, 0.48], [0.135, 0.39], [0.115, 0.3], [0.06, 0.26], [0, 0.25]], 0.006), 'r']); parts.push([0.5, xf(capsule([0, -0.42, 0], [0, -0.2, 0], 0.02), t), 'W']); parts.push([0.3, xf(ball([0, -0.16, 0], 0.045), t), 'W']);
    return { parts: parts, sway: 0.2 }; },
  /* a tree: what you leave grows in the life of the other */
  tree: function () { var parts = [[2.2, function (rn) { var y = -0.95 + rn() * 0.9, R = 0.055 + 0.12 * Math.exp(-(y + 0.95) * 7), a = rn() * TAU, q = R * Math.sqrt(rn()); return [q * Math.cos(a), y, q * Math.sin(a)]; }, 'r'],
      [0.5, capsule([0, -0.2], [-0.3, 0.16], 0.028), 'r'], [0.5, capsule([0, -0.15], [0.28, 0.2], 0.028), 'r'], [0.8, poly([[-0.7, -0.95], [0.7, -0.95]], 0.01), 'w']];
    [[0, 0.46, 0.36], [-0.37, 0.28, 0.27], [0.37, 0.3, 0.27], [-0.2, 0.68, 0.24], [0.22, 0.7, 0.24], [0, 0.2, 0.24]].forEach(function (c) { parts.push([c[2] * c[2] * 26, ball([c[0], c[1], 0], c[2], true), 'w']); });
    parts.push([0.5, function (rn) { return [(rn() * 2 - 1) * 0.75, -0.9 + rn() * 0.9 * rn(), (rn() - 0.5) * 0.4]; }, 'r']); return { parts: parts, sway: 0.3 }; },
  /* wings above, roots below */
  wings: function () { var wing = function (sg) { return function (rn) { var u = Math.pow(rn(), 0.85), v = rn(), e = rn(); if (e < 0.3) v = e < 0.17 ? 0 : 1; else if (e < 0.55) u = Math.round(u * 13) / 13;
      var sx = 0.12 + 0.84 * u, sy = 0.06 + 0.6 * Math.sin(u * 1.75), ch = (0.5 * (1 - 0.72 * u) + 0.06) * (1 + 0.08 * Math.sin(u * Math.PI * 13)); return [sg * (sx + v * ch * 0.3 * u), sy - v * ch, 0.2 * Math.sin(u * 2.2) - 0.1 * v]; }; };
    var parts = [[4.5, wing(1), 'w'], [4.5, wing(-1), 'w'], [0.6, ell([0, -0.02], 0.07, 0.2, 0.07), 'W']], k;
    for (k = -2; k <= 2; k++) (function (k) { parts.push([0.5, path(function (t) { return [k * 0.17 * Math.pow(t, 0.8) + 0.04 * Math.sin(t * 7 + k), -0.2 - 0.76 * t * (1 - 0.08 * Math.abs(k)), 0.06 * Math.cos(t * 5 + k)]; }, 0.012), 'r']); })(k);
    return { parts: parts, sway: 0.22 }; },
  peace: function () { var f = FORMS.wings(); return { parts: f.parts.filter(function (p) { return p[2] !== 'r'; }), sway: 0.22 }; }   /* r8 · the same wings without the roots: a wish for peace (b01) */
};
/* speaker id → the form of his line (the words of each metaidea are in the report) */
var MAP = { b08: 'sprout', a06: 'finger', a08: 'balloon', a10: 'iceberg', a04: 'heart', a03: 'wand', b09: 'galaxy', a07: 'atom', a05: 'bow', a01: 'scales', b06: 'plane', b01: 'peace',
  b03: 'gift', b10: 'hand', b02: 'bridge', b04: 'door', a09: 'amphora', a02: 'ripples', b07: 'tree', b05: 'wings' };

var MOBILE = Math.min(screen.width || 9999, innerWidth) < 700 || (navigator.maxTouchPoints > 0 && innerWidth < 900), MAXN = MOBILE ? 18000 : 34000, CLOUD = {};
function cloud(id) {
  if (CLOUD[id]) return CLOUD[id]; var F = FORMS[MAP[id]](), rn = rng(31 + id.charCodeAt(0) * 131 + id.charCodeAt(2) * 17), tw = 0, pos = new Float32Array(MAXN * 3), col = new Float32Array(MAXN), k = 0, i;
  F.parts.forEach(function (p) { tw += p[0]; });
  F.parts.forEach(function (p, pi) { var m = pi === F.parts.length - 1 ? MAXN - k : Math.round(MAXN * p[0] / tw);
    for (i = 0; i < m && k < MAXN; i++, k++) { var q = p[1](rn), c = p[2], red = c === 'r' ? rn() < 0.86 : c === 'm' ? rn() < 0.34 : c === 'W' ? false : rn() < 0.1;
      pos[k * 3] = q[0]; pos[k * 3 + 1] = q[1]; pos[k * 3 + 2] = q[2]; col[k] = red ? (rn() < 0.55 ? 0 : rn() < 0.5 ? 1 : 4) : (c === 'W' ? 3 : rn() < 0.7 ? 2 : 5); } });
  var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (i = 0; i < k; i++) { x0 = Math.min(x0, pos[i * 3]); x1 = Math.max(x1, pos[i * 3]); y0 = Math.min(y0, pos[i * 3 + 1]); y1 = Math.max(y1, pos[i * 3 + 1]); }
  var s = 1 / Math.max((x1 - x0) / 2, (y1 - y0) / 2), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; for (i = 0; i < k; i++) { pos[i * 3] = (pos[i * 3] - cx) * s; pos[i * 3 + 1] = (pos[i * 3 + 1] - cy) * s; pos[i * 3 + 2] *= s; }
  CLOUD[id] = { pos: pos, col: col, n: k, sway: F.sway || 0.2, beat: F.beat || 0, spin: F.spin || 0 }; return CLOUD[id];
}

/* ── the one buffer ── */
var renderer, scene, camera, geo, mat, points, aHome, aDust, aCol, seed, aOrd, loaded = null, W = 1, H = 1, WPP = 1, CAMZ = 10, FOV = 30;
var ptr = { x: 0, y: 0, swirl: 0, lx: 0, ly: 0, has: false };   /* no sentinel position: strength 0 until the pointer really moves */
var VS = [
  'attribute vec3 aHome; attribute vec3 aDust; attribute float aSeed; attribute float aCol; attribute float aOrd;',
  'uniform float uAssembly,uPres,uThr,uT,uPx,uScale,uBeat,uYaw; uniform vec3 uCenter,uTarget,uPtr,uDustC,uHole; uniform vec2 uDustS; uniform vec3 uPal[6];',
  'varying vec3 vCol; varying float vA;',
  'vec3 curl(vec3 p,float t){float x=sin(p.y*1.3+t*.5)+cos(p.z*1.1-t*.4);float y=sin(p.z*1.2-t*.45)+cos(p.x*1.4+t*.5);float z=sin(p.x*1.1+t*.4)+cos(p.y*1.3-t*.5);return vec3(x,y,z);}',
  'void main(){float s=aSeed,s2=fract(aSeed*71.37+aCol*.173);',
  ' float a=clamp((uAssembly-aOrd*.7)/.3,0.,1.);a=a*a*(3.-2.*a);float fl=sin(a*3.14159);float av=sqrt(a);',          /* each grain leaves at its own seed time and eases in and out: the cloud breathes into shape over the whole line */
  ' float cy=cos(uYaw),sy=sin(uYaw);vec3 h=vec3(aHome.x*cy+aHome.z*sy,aHome.y,-aHome.x*sy+aHome.z*cy)*uScale*(1.+uBeat);',
  ' vec3 home=uCenter+h+curl(aHome*2.3+s*9.,uT)*uScale*.007;',
  ' vec3 dust=uDustC+vec3(aDust.xy*uDustS,aDust.z*uScale)+curl(aDust*1.9+s*5.,uT*.6)*uScale*.14;',
  ' vec3 off=dust-home;float sw=(s2<.82?1.:-1.)*(.5+.6*s2)*fl;float cw=cos(sw),sw2=sin(sw);off.xy=vec2(off.x*cw-off.y*sw2,off.x*sw2+off.y*cw);',
  ' vec3 p=home+off*(1.-a);p+=curl(p*.9/uScale+s*3.,uT*.5)*uScale*.22*fl;',                          /* the road in is curved: a slow swing round the image + curl drift, strongest mid-flight, zero at home */
  ' float tw=.5+.5*sin(uT*(1.6+s*3.4)+s2*40.);float al=mix(.04+.15*tw*tw,.4+.52*tw,av)*uPres;float sz=mix(.72,1.,av)*(1.+1.5*s2*s2);',
  ' if(uHole.z>0.){al*=mix(smoothstep(uHole.z*.85,uHole.z*1.45,length(p.xy-uHole.xy)),1.,a);}',   /* loose dust never sits on the face: only the grains already on their way into the image may cross it */
  ' vec2 d=p.xy-uPtr.xy;float g=exp(-dot(d,d)/(uScale*uScale*.12))*uPtr.z;p.xy+=vec2(-d.y,d.x)*g*.8;sz*=1.+.7*g;al*=1.+g;',   /* the cursor stirs the dust like air */
  ' if(uThr>0.){float u=clamp((uThr-s*.3)/.62,0.,1.2);',
  '  if(s2<.58){float e=pow(min(u,1.),1.7);vec3 mid=mix(p,uTarget,.5)+vec3(0.,uScale*.5*(.4+s2),uScale*.4*(s-.5));p=mix(mix(p,mid,e),mix(mid,uTarget,e),e);',
  '   al=max(al,.45*uPres)*(1.+.6*sin(3.14159*min(u,1.)))*(1.-smoothstep(1.,1.18,u));sz*=1.2;}',     /* more than half the grains fly on and open the next window */
  '  else{p+=curl(p/uScale+s*7.,uT)*uScale*.45*uThr-vec3(0.,uScale*.3*uThr*uThr,0.);al*=1.-smoothstep(.1,.95,uThr);}}',   /* the rest exhale apart */
  ' vCol=uPal[int(aCol+.5)];vA=al;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,sz*uPx*3.4*(10./-mv.z));}'].join('\n');
var FS = 'varying vec3 vCol; varying float vA; void main(){vec2 c=gl_PointCoord*2.-1.;float r2=dot(c,c);float i=exp(-r2*9.)+exp(-r2*2.6)*.3;float I=i*max(vA,0.);gl_FragColor=vec4(vCol*I,min(1.,I*.85));}';

function init(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' }); renderer.setClearColor(0x000000, 0);
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100); camera.position.set(0, 0, CAMZ);
  var rn = rng(4242), i; seed = new Float32Array(MAXN); aHome = new Float32Array(MAXN * 3); aDust = new Float32Array(MAXN * 3); aCol = new Float32Array(MAXN);
  for (i = 0; i < MAXN; i++) { var u = rn() * 2 - 1, a = rn() * TAU, s = Math.sqrt(1 - u * u), q = 0.55 + 0.75 * Math.pow(rn(), 0.6);   /* a loose shell */
    aDust[i * 3] = q * s * Math.cos(a); aDust[i * 3 + 1] = q * u; aDust[i * 3 + 2] = q * s * Math.sin(a) * 0.6; seed[i] = rn(); aHome[i * 3] = aDust[i * 3]; aHome[i * 3 + 1] = aDust[i * 3 + 1]; aHome[i * 3 + 2] = aDust[i * 3 + 2]; }
  geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(aDust, 3)); geo.setAttribute('aDust', new THREE.BufferAttribute(aDust, 3));
  geo.setAttribute('aHome', new THREE.BufferAttribute(aHome, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); geo.setAttribute('aCol', new THREE.BufferAttribute(aCol, 1)); aOrd = new Float32Array(MAXN); aOrd.set(seed); geo.setAttribute('aOrd', new THREE.BufferAttribute(aOrd, 1));
  var pal = [[0.902, 0.169, 0.118], [0.95, 0.30, 0.24], [0.30, 0.07, 0.07], [0.20, 0.05, 0.05], [0.78, 0.07, 0.06], [0.42, 0.10, 0.09]]   /* v3: a white page, so the light grains become deep ink-red (the post: red and dark on white) */.map(function (c) { return new THREE.Vector3(c[0], c[1], c[2]); });
  mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uAssembly: { value: 0 }, uPres: { value: 0 }, uThr: { value: 0 }, uT: { value: 0 }, uPx: { value: 1 }, uScale: { value: 1 }, uBeat: { value: 0 }, uYaw: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uTarget: { value: new THREE.Vector3() },
      uPtr: { value: new THREE.Vector3() }, uDustC: { value: new THREE.Vector3() }, uHole: { value: new THREE.Vector3() }, uDustS: { value: new THREE.Vector2(1, 1) }, uPal: { value: pal } } });
  points = new THREE.Points(geo, mat); points.frustumCulled = false; scene.add(points);   /* real positions live in the shader, so the auto bounding sphere is wrong */
  var mv = function (x, y) { if (ptr.has) { var v = Math.hypot(x - ptr.lx, y - ptr.ly); ptr.swirl = Math.min(1, ptr.swirl + v * 0.012); } ptr.has = true; ptr.lx = ptr.x = x; ptr.ly = ptr.y = y; };
  addEventListener('pointermove', function (e) { mv(e.clientX, e.clientY); }, { passive: true }); addEventListener('pointerdown', function (e) { mv(e.clientX, e.clientY); ptr.swirl = Math.min(1, ptr.swirl + 0.5); }, { passive: true });
}
function resize(w, h, pxs) { W = w; H = h; renderer.setPixelRatio(pxs); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); WPP = 2 * CAMZ * Math.tan(FOV * Math.PI / 360) / h; mat.uniforms.uPx.value = pxs; }
function world(x, y, v) { return v.set((x - W / 2) * WPP, -(y - H / 2) * WPP, 0); }
function loadHome(id) {   /* swap the homes in place and flag the one attribute for upload */
  var c = cloud(id); aHome.set(c.pos.subarray(0, c.n * 3)); for (var i = c.n; i < MAXN; i++) { aHome[i * 3] = aDust[i * 3]; aHome[i * 3 + 1] = aDust[i * 3 + 1]; aHome[i * 3 + 2] = aDust[i * 3 + 2]; }
  /* the start order: half the seed, half the way from the heart of the image to its rim, then ranked so the starts stay even in time (no crowd, no spike) */
  if (!c.ord) { var key = new Float32Array(MAXN), ix = new Uint32Array(MAXN), j; for (j = 0; j < MAXN; j++) { key[j] = 0.5 * seed[j] + 0.5 * Math.min(1, Math.hypot(aHome[j * 3], aHome[j * 3 + 1])); ix[j] = j; }
    ix.sort(function (p, q) { return key[p] - key[q]; }); c.ord = new Float32Array(MAXN); for (j = 0; j < MAXN; j++) c.ord[ix[j]] = j / (MAXN - 1); }
  aOrd.set(c.ord); geo.attributes.aOrd.needsUpdate = true;
  aCol.set(c.col); geo.attributes.aHome.needsUpdate = true; geo.attributes.aCol.needsUpdate = true; loaded = id; return c;
}
var blank = true;
/* st: { id, cx, cy, r (px: half size of the image), dcx, dcy (px: the centre of the dust field), dw, dh (px: its half size; the loose shell reaches 1.3 x that), hx, hy, hr (px: the face, kept clear of loose dust), asm 0..1, pres 0..1, thr 0..1.3, tx, ty (px: the next window), A (ambient seconds), T (line seconds, for the slow turn) } */
function frame(st, dt) {
  ptr.swirl *= Math.pow(0.05, dt || 0.016);
  if (!st || !st.id || !MAP[st.id] || st.pres <= 0.002) { if (!blank) { renderer.clear(); blank = true; } return; }
  var c = loaded === st.id ? CLOUD[st.id] : loadHome(st.id), u = mat.uniforms; blank = false;
  u.uAssembly.value = st.asm; u.uPres.value = st.pres; u.uThr.value = st.thr; u.uT.value = st.A; u.uScale.value = st.r * WPP; world(st.cx, st.cy, u.uCenter.value); world(st.tx, st.ty, u.uTarget.value);
  world(st.dcx === undefined ? st.cx : st.dcx, st.dcy === undefined ? st.cy : st.dcy, u.uDustC.value); if (st.hr) { world(st.hx, st.hy, u.uHole.value); u.uHole.value.z = st.hr * WPP; } else u.uHole.value.set(0, 0, 0);
  u.uDustS.value.set(st.dw * WPP, st.dh * WPP); u.uYaw.value = c.spin ? 0.5 * Math.sin(st.A * 0.35) + st.T * 0.1 : c.sway * Math.sin(st.A * 0.55 + 1);
  var hb = st.A * 1.25 % 1, atk = Math.min(1, hb / 0.07); atk = atk * atk * (3 - 2 * atk); u.uBeat.value = (c.beat ? 0.06 * (atk * Math.exp(-hb * 9) + 0.6 * Math.exp(-Math.pow((hb - 0.22) * 9, 2))) : 0.012 * Math.sin(st.A * 1.5)) * st.asm;
  world(ptr.x, ptr.y, u.uPtr.value); u.uPtr.value.z = 0;   /* v3: calm, the cursor does not stir the image */
  renderer.render(scene, camera);
}
/* probe: the same path as the vertex shader (forming part: no cursor, no throw), on the CPU, for a few grains → screen px. Measurement only. */
function curlJ(x, y, z, t) { return [Math.sin(y * 1.3 + t * .5) + Math.cos(z * 1.1 - t * .4), Math.sin(z * 1.2 - t * .45) + Math.cos(x * 1.4 + t * .5), Math.sin(x * 1.1 + t * .4) + Math.cos(y * 1.3 - t * .5)]; }
function probe(idx) { var u = mat.uniforms, out = [], S = u.uScale.value, C = u.uCenter.value, DC = u.uDustC.value, DS = u.uDustS.value, yw = u.uYaw.value, cy = Math.cos(yw), sy = Math.sin(yw), bt = 1 + u.uBeat.value, T = u.uT.value, g = u.uAssembly.value;
  idx.forEach(function (i) { var s = seed[i], s2 = (s * 71.37 + aCol[i] * .173) % 1, hx = aHome[i * 3], hy = aHome[i * 3 + 1], hz = aHome[i * 3 + 2], dx = aDust[i * 3], dy = aDust[i * 3 + 1], dz = aDust[i * 3 + 2];
    var a = Math.min(1, Math.max(0, (g - aOrd[i] * .7) / .3)); a = a * a * (3 - 2 * a); var fl = Math.sin(a * Math.PI);
    var h = [(hx * cy + hz * sy) * S * bt, hy * S * bt, (-hx * sy + hz * cy) * S * bt], c1 = curlJ(hx * 2.3 + s * 9, hy * 2.3 + s * 9, hz * 2.3 + s * 9, T), home = [C.x + h[0] + c1[0] * S * .007, C.y + h[1] + c1[1] * S * .007, C.z + h[2] + c1[2] * S * .007];
    var c2 = curlJ(dx * 1.9 + s * 5, dy * 1.9 + s * 5, dz * 1.9 + s * 5, T * .6), dust = [DC.x + dx * DS.x + c2[0] * S * .14, DC.y + dy * DS.y + c2[1] * S * .14, DC.z + dz * S + c2[2] * S * .14];
    var o = [dust[0] - home[0], dust[1] - home[1], dust[2] - home[2]], sw = (s2 < .82 ? 1 : -1) * (.5 + .6 * s2) * fl, cw = Math.cos(sw), sn = Math.sin(sw), ox = o[0] * cw - o[1] * sn, oy = o[0] * sn + o[1] * cw;
    var p = [home[0] + ox * (1 - a), home[1] + oy * (1 - a), home[2] + o[2] * (1 - a)], c3 = curlJ(p[0] * .9 / S + s * 3, p[1] * .9 / S + s * 3, p[2] * .9 / S + s * 3, T * .5);
    p = [p[0] + c3[0] * S * .22 * fl, p[1] + c3[1] * S * .22 * fl, p[2] + c3[2] * S * .22 * fl]; var k = CAMZ / (CAMZ - p[2]);
    out.push([W / 2 + p[0] * k / WPP, H / 2 - p[1] * k / WPP, a]); }); return out; }
window.AW_IDEA = { probe: probe, init: init, resize: resize, frame: frame, has: function (id) { return !!MAP[id]; }, form: function (id) { return MAP[id]; }, n: MAXN, mobile: MOBILE, forms: Object.keys(FORMS) };
})();
