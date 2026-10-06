import * as THREE from 'three';

/* ═════════ ЦИРКОВИЯТ ДЕКОР · първият декор на въртележката (MET-1275 · ADR 0123) ═════════
   Шевът: decor(scene, config) → { paintCard, dust, riders, step } · двигателят (engine.js) не знае за шатра, коне и панаир.
   Всичко, което се ВИЖДА като стил, е тук: небе · под · шатра · крушки · панаир · коне · звезда · рисуването на картите · цветът на праха · шрифтовете.
   Редовете са пренесени дословно от донора (git show 3be9e12:_proto/eng-carousel-test/index.html) → със същия двигател кадрите са тези на донора.
   config (от двигателя): renderer · carousel (групата, която двигателят върти) · stage (data-*) · cards [{i, a, title, teaser}] · N · STEP · U (общите uniforms)
     · R_RIDE · CW · CH · CY (геометрията на картите) · canvasTex · grains(uSz) (материал „прах“ на двигателя · достъпен от riders() нататък).
   Ред на раждане: decor() = всичко преди картите → двигателят сглобява картите → riders() = това, което язди между тях → прахът на двигателя. */
export default function decor(scene, config) {
const { renderer, carousel, stage, cards, N, STEP, U, R_RIDE, canvasTex } = config;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const R_PLAT = 3.7, R_HORSE = 3.08, HORSES = [];
let wheel = null;
const star1 = { mesh: null, t0: -9, next: 7, x: 0, y: 0 };

function rrect(x, a, b, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else { x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); } }
function wrapLines(x, text, maxW) {
  const words = text.split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (!cur || x.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines;
}
function star(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * .36 : r; x.lineTo(cx + Math.sin(a) * rr, cy - Math.cos(a) * rr); } x.closePath(); x.fill(); }

/* картата: билет от нощно стъкло · рамка от месинг · гирлянда от 7 крушки (свети нейната) · заглавие · тийзър · „Повече…“ */
function paintCard(c, glow) {
  const W = 624, H = 800, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  if (!glow) {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(52,32,70,.95)'); g.addColorStop(1, 'rgba(24,15,36,.97)');
    rrect(x, 10, 10, W - 20, H - 20, 34); x.fillStyle = g; x.fill();
    const rg = x.createRadialGradient(W / 2, 120, 10, W / 2, 120, 400); rg.addColorStop(0, 'rgba(255,190,110,.22)'); rg.addColorStop(1, 'rgba(255,190,110,0)'); x.fillStyle = rg; x.fill();
  }
  rrect(x, 16, 16, W - 32, H - 32, 30); x.lineWidth = glow ? 7 : 5; x.strokeStyle = '#e8a33c'; x.stroke();
  x.save(); x.setLineDash([2, 13]); x.lineCap = 'round'; x.lineWidth = 4.5; x.strokeStyle = 'rgba(246,232,205,.8)'; rrect(x, 35, 35, W - 70, H - 70, 20); x.stroke(); x.restore();
  // гирлянда
  const gx = u => 86 + u * (W - 172), gy = u => 78 + 4 * 30 * u * (1 - u);
  x.beginPath(); for (let k = 0; k <= 40; k++) x.lineTo(gx(k / 40), gy(k / 40)); x.lineWidth = 2; x.strokeStyle = 'rgba(232,163,60,.75)'; x.stroke();
  for (let k = 0; k < N; k++) {
    const u = (k + .5) / N, on = k === c.i, r = on ? 12 : 6.5;
    if (on) { const hg = x.createRadialGradient(gx(u), gy(u) + 6, 2, gx(u), gy(u) + 6, 46); hg.addColorStop(0, 'rgba(255,214,150,.75)'); hg.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = hg; x.fillRect(gx(u) - 50, gy(u) - 44, 100, 100); }
    x.beginPath(); x.arc(gx(u), gy(u) + 6, r, 0, 7); x.fillStyle = on ? '#fff0c8' : 'rgba(232,163,60,.85)'; x.fill();
  }
  // заглавие (менюто на сайта · дословно)
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const maxW = W - 2 * 62; let fs = 100, lines = [];
  for (; fs >= 48; fs -= 4) { x.font = `400 ${fs}px "Yeseva One", Georgia, serif`; lines = wrapLines(x, c.title, maxW); if (lines.length <= 3 && lines.every(l => x.measureText(l).width <= maxW)) break; }
  const lh = fs * 1.1, ty = 318 - (lines.length - 1) * lh / 2 + fs * .34;
  x.fillStyle = '#fbf0d8'; if (!glow) { x.shadowColor = 'rgba(255,180,90,.55)'; x.shadowBlur = 22; }
  lines.forEach((l, k) => x.fillText(l, W / 2, ty + k * lh)); x.shadowBlur = 0;
  // разделител
  const ry = 318 + lines.length * lh / 2 + 34; x.fillStyle = '#e8a33c'; x.fillRect(W / 2 - 92, ry, 70, 3); x.fillRect(W / 2 + 22, ry, 70, 3); star(x, W / 2, ry + 1.5, 13, '#ffd98e');
  // тийзър (дословно от сайта)
  x.font = 'italic 400 37px Lora, Georgia, serif'; x.fillStyle = 'rgba(246,234,208,.92)';
  const tl = wrapLines(x, c.teaser, W - 2 * 64).slice(0, 4), t0 = ry + 70;
  tl.forEach((l, k) => x.fillText(l, W / 2, t0 + k * 49));
  // долен орнамент
  star(x, W / 2, H - 74, 11, '#ffd98e'); star(x, W / 2 - 44, H - 74, 7, '#e8a33c'); star(x, W / 2 + 44, H - 74, 7, '#e8a33c');
  return cv;
}

function fasciaTex(words, k0) {                        // надпис по борда: дословни думи от сайта (data-fascia)
  const W = 4096, H = 176, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#ecdcb4'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#b8341f'; x.fillRect(0, 10, W, 6); x.fillRect(0, H - 16, W, 6);
  x.textBaseline = 'middle'; x.textAlign = 'left'; x.font = '400 104px "Yeseva One", Georgia, serif';
  const parts = []; words.forEach((w, i) => { parts.push({ t: w, w: x.measureText(w).width, c: (i + k0) % 2 ? '#3a2440' : '#a32d1a' }); parts.push({ star: 1, w: 64 }); });
  const sum = parts.reduce((a, p) => a + p.w, 0), k = Math.min(1, (W - 60 * parts.length) / sum), gap = (W - sum * k) / parts.length; let cx = gap / 2;
  for (const p of parts) {
    if (p.star) star(x, cx + 32 * k, H / 2, 30, '#c98a2b');
    else { x.save(); x.translate(cx, H / 2 + 5); x.scale(k, 1); x.fillStyle = p.c; x.fillText(p.t, 0, 0); x.restore(); }
    cx += p.w * k + gap;
  }
  return canvasTex(cv);
}
function lanternTex() {                                 // сводест прозорец-фенер по барабана
  const W = 128, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const path = () => { x.beginPath(); x.moveTo(14, H - 14); x.lineTo(14, 70); x.arc(W / 2, 70, W / 2 - 14, Math.PI, 0); x.lineTo(W - 14, H - 14); x.closePath(); };
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff1c9'); g.addColorStop(.45, '#ffc873'); g.addColorStop(1, '#d9792e'); path(); x.fillStyle = g; x.fill();
  x.strokeStyle = '#6a3a14'; x.lineWidth = 7; path(); x.stroke(); x.lineWidth = 4;
  x.beginPath(); x.moveTo(W / 2, 20); x.lineTo(W / 2, H - 14); for (let k = 1; k < 5; k++) { x.moveTo(14, 70 + k * (H - 84) / 5); x.lineTo(W - 14, 70 + k * (H - 84) / 5); } x.stroke();
  return canvasTex(cv);
}
function paintHorse() {                                  // кон от въртележка (скачащ) · рисуван, после става прах
  const Z = 512, cv = document.createElement('canvas'); cv.width = cv.height = Z; const x = cv.getContext('2d');
  const CREAM = '#f6e7c4', GOLD = '#f0b040', RED = '#d2432a';
  x.lineCap = 'round'; x.lineJoin = 'round';
  const limb = (pts, w0, w1, col) => { x.strokeStyle = col; for (let i = 0; i < pts.length - 1; i++) { x.lineWidth = w0 + (w1 - w0) * i / (pts.length - 2 || 1); x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke(); } };
  // опашка
  x.strokeStyle = GOLD; x.lineWidth = 26; x.beginPath(); x.moveTo(150, 236); x.bezierCurveTo(92, 206, 62, 250, 70, 318); x.stroke();
  x.lineWidth = 15; x.beginPath(); x.moveTo(70, 318); x.bezierCurveTo(72, 352, 60, 372, 46, 388); x.stroke();
  // задни крака (изпънати назад) · предни (свити)
  limb([[176, 292], [132, 352], [84, 372]], 34, 17, CREAM); limb([[200, 300], [168, 372], [126, 410]], 32, 16, CREAM);
  limb([[316, 290], [368, 322], [352, 372]], 30, 15, CREAM); limb([[296, 300], [338, 348], [312, 394]], 28, 15, CREAM);
  x.fillStyle = GOLD; [[84, 372], [126, 410], [352, 372], [312, 394]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 11, 0, 7); x.fill(); });
  // тяло
  x.fillStyle = CREAM; x.save(); x.translate(250, 264); x.rotate(-.1); x.beginPath(); x.ellipse(0, 0, 118, 60, 0, 0, 7); x.fill(); x.restore();
  // врат
  x.beginPath(); x.moveTo(296, 222); x.bezierCurveTo(318, 178, 334, 140, 352, 104); x.lineTo(402, 128); x.bezierCurveTo(392, 176, 378, 236, 352, 286); x.closePath(); x.fill();
  // глава
  x.save(); x.translate(392, 122); x.rotate(.62); x.beginPath(); x.ellipse(0, 0, 58, 28, 0, 0, 7); x.fill(); x.restore();
  x.beginPath(); x.moveTo(350, 96); x.lineTo(352, 62); x.lineTo(372, 90); x.closePath(); x.fill(); x.beginPath(); x.moveTo(368, 92); x.lineTo(378, 60); x.lineTo(392, 96); x.closePath(); x.fill();
  // грива
  x.strokeStyle = GOLD; x.lineWidth = 20; x.beginPath(); x.moveTo(346, 84); x.bezierCurveTo(318, 110, 300, 150, 286, 208); x.stroke();
  x.lineWidth = 11; [[330, 112, 304, 122], [314, 142, 286, 156], [302, 176, 274, 194]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c) / 2, b - 6, c, d); x.stroke(); });
  // юзда
  x.strokeStyle = RED; x.lineWidth = 6; x.beginPath(); x.moveTo(372, 100); x.lineTo(408, 150); x.moveTo(398, 112); x.lineTo(420, 132); x.stroke();
  // седло + чул
  x.fillStyle = RED; x.beginPath(); x.moveTo(196, 212); x.quadraticCurveTo(250, 190, 300, 208); x.lineTo(306, 262); x.quadraticCurveTo(250, 290, 198, 268); x.closePath(); x.fill();
  x.strokeStyle = GOLD; x.lineWidth = 6; x.beginPath(); x.moveTo(198, 268); x.quadraticCurveTo(250, 290, 306, 262); x.stroke(); x.beginPath(); x.moveTo(196, 212); x.quadraticCurveTo(250, 190, 300, 208); x.stroke();
  x.lineWidth = 7; x.strokeStyle = RED; x.beginPath(); x.moveTo(252, 280); x.lineTo(254, 322); x.stroke();
  // око
  x.fillStyle = '#3a2440'; x.beginPath(); x.arc(396, 112, 5, 0, 7); x.fill();
  return cv;
}
function deckTex() {                                    // дъсченият под: лъчи + два боядисани пръстена
  const Z = 1024, cv = document.createElement('canvas'); cv.width = cv.height = Z; const x = cv.getContext('2d'), c = Z / 2;
  const g = x.createRadialGradient(c, c, 40, c, c, c); g.addColorStop(0, '#8a5a34'); g.addColorStop(.7, '#7a4c2c'); g.addColorStop(1, '#5e3a22'); x.fillStyle = g; x.fillRect(0, 0, Z, Z);
  x.strokeStyle = 'rgba(40,20,10,.55)'; x.lineWidth = 3; for (let i = 0; i < 56; i++) { const a = i / 56 * Math.PI * 2; x.beginPath(); x.moveTo(c + Math.cos(a) * 90, c + Math.sin(a) * 90); x.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); x.stroke(); }
  [[.985, 16, '#b8341f'], [.93, 7, '#ecdcb4'], [.42, 10, '#ecdcb4'], [.38, 6, '#b8341f']].forEach(([r, w, col]) => { x.beginPath(); x.arc(c, c, c * r, 0, 7); x.lineWidth = w; x.strokeStyle = col; x.stroke(); });
  return canvasTex(cv);
}
function stripeTex(a, b, stripes) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; const x = cv.getContext('2d'), w = 1024 / stripes;
  for (let i = 0; i < stripes; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * w, 0, w + 1, 128); }
  const sh = x.createLinearGradient(0, 0, 0, 128); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(40,15,5,.28)'); x.fillStyle = sh; x.fillRect(0, 0, 1024, 128);
  return canvasTex(cv);
}

  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.14;
  renderer.setClearColor(0x150f1f, 1);
  scene.fog = new THREE.Fog(0x241b35, 20, 64);

  /* здрач: купол + звезди + земя */
  { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 512; const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
    [[0, '#0e0a1c'], [.42, '#2a1e42'], [.66, '#5a3a58'], [.82, '#a45c4e'], [.92, '#d99457'], [1, '#e8ae62']].forEach(s => g.addColorStop(s[0], s[1]));
    x.fillStyle = g; x.fillRect(0, 0, 4, 512);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 18, 0, Math.PI * 2, 0, Math.PI * .62), new THREE.MeshBasicMaterial({ map: canvasTex(cv), side: THREE.BackSide, fog: false }));
    sky.position.y = -6; scene.add(sky); }
  { const n = 460, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(1 - Math.random() * .62), r = 82; pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.cos(ph) - 4; pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff4dc, size: .6, sizeAttenuation: true, transparent: true, opacity: .85, fog: false }))); }
  { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = '#241a2e'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${40 + Math.random() * 26 | 0},${28 + Math.random() * 20 | 0},${44 + Math.random() * 22 | 0},.5)`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    const tex = canvasTex(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(14, 14);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshStandardMaterial({ map: tex, color: 0x9a8aa0, roughness: .95 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground); }

  /* светлини */
  scene.add(new THREE.HemisphereLight(0x4a3a68, 0x1c1426, .6));
  const dusk = new THREE.DirectionalLight(0xd98a5a, .5); dusk.position.set(-18, 8, -24); scene.add(dusk);
  const heart = new THREE.PointLight(0xffc06a, 62, 30, 1.9); heart.position.set(0, 3.4, 0); scene.add(heart);
  const under = new THREE.PointLight(0xff9d4a, 18, 14, 2); under.position.set(0, 1.2, 0); scene.add(under);
  const fill = new THREE.PointLight(0xe8a468, 90, 40, 2); fill.position.set(3.6, 4.4, 12.4); scene.add(fill);

  const M = {
    cream: new THREE.MeshStandardMaterial({ color: 0xe9d9b4, roughness: .62, metalness: .04 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa32d1a, roughness: .5, metalness: .06 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd9a24a, roughness: .42, metalness: .35, emissive: 0x6a4410, emissiveIntensity: .55 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6e4a2f, roughness: .8 }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xffd9a0, roughness: .2, metalness: .6, emissive: 0xffb45e, emissiveIntensity: 1.25 }),
  };

  /* ═══ въртележката ═══ */
  const add = (geo, mat, y, parent = carousel) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; parent.add(m); return m; };
  add(new THREE.CylinderGeometry(R_PLAT, R_PLAT, .22, 64), M.wood, .6);
  add(new THREE.CircleGeometry(R_PLAT, 64), new THREE.MeshStandardMaterial({ map: deckTex(), roughness: .7 }), .712).rotation.x = -Math.PI / 2;
  add(new THREE.TorusGeometry(R_PLAT, .07, 10, 64), M.red, .72).rotation.x = Math.PI / 2;
  { const tex = stripeTex('#b8341f', '#e6d3a8', 32);
    add(new THREE.CylinderGeometry(R_PLAT, R_PLAT + .15, .5, 64, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: .6, side: THREE.DoubleSide, emissive: 0xff9a50, emissiveMap: tex, emissiveIntensity: .3 }), .35); }
  add(new THREE.CylinderGeometry(.62, .72, 2.9, 24), M.red, 2.15);
  const lanternMat = new THREE.MeshBasicMaterial({ map: lanternTex(), transparent: true, depthWrite: false, toneMapped: false });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = add(new THREE.PlaneGeometry(.34, 1.7), lanternMat, 2.2); p.position.x = Math.sin(a) * .7; p.position.z = Math.cos(a) * .7; p.rotation.y = a;
    const a2 = a + Math.PI / 8, rib = add(new THREE.CylinderGeometry(.03, .03, 2.7, 6), M.brass, 2.15); rib.position.x = Math.sin(a2) * .69; rib.position.z = Math.cos(a2) * .69; }
  add(new THREE.TorusGeometry(.72, .07, 10, 24), M.brass, 3.5).rotation.x = Math.PI / 2;
  { const tex = stripeTex('#c23a22', '#efe0c0', 36);
    add(new THREE.ConeGeometry(R_PLAT + .55, 1.75, 64, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: .72, side: THREE.DoubleSide, emissive: 0xffb066, emissiveMap: tex, emissiveIntensity: .34 }), 4.62);
    add(new THREE.TorusGeometry(R_PLAT + .55, .06, 8, 64), M.red, 3.76).rotation.x = Math.PI / 2;
    const arcs = (stage.dataset.fascia || '').split('||').map(g => g.split('|').filter(Boolean)).filter(g => g.length);   // надписът по борда върти се с въртележката
    arcs.forEach((words, i) => { const ft = fasciaTex(words, i), th = Math.PI * 2 / arcs.length;
      add(new THREE.CylinderGeometry(R_PLAT + .5, R_PLAT + .5, .44, 40, 1, true, i * th, th), new THREE.MeshStandardMaterial({ map: ft, roughness: .55, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .4 }), 3.46); });
    add(new THREE.CylinderGeometry(R_PLAT + .49, R_PLAT + .49, .44, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a1a22, roughness: .8, side: THREE.BackSide, emissive: 0x2a0e14, emissiveIntensity: .5 }), 3.46);
    add(new THREE.SphereGeometry(.24, 16, 12), M.brass, 5.62); }

  /* крушките: ЕДИН Points (ядро + ореол в шейдъра) · гонката по стрехата */
  const bp = [], bb = [];
  const bulb = (x, y, z, size, ca = -1) => { bp.push(x, y, z); bb.push(Math.random() * 6.283, ca, size); };
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; bulb(Math.sin(a) * (R_PLAT + .66), 3.76, Math.cos(a) * (R_PLAT + .66), i % 6 === 0 ? 1.5 : 1.05, a); }
  for (let i = 0; i < 24; i++) { const a = (i + .5) / 24 * Math.PI * 2; bulb(Math.sin(a) * (R_PLAT + .54), 3.19, Math.cos(a) * (R_PLAT + .54), .85); }
  for (let i = 0; i < 10; i++) for (let k = 0; k < 4; k++) { const t = i / 10, a = k / 4 * Math.PI * 2 + .4, r = (R_PLAT + .45) * (1 - t) + .3 * t; bulb(Math.sin(a) * (r + .1), 3.86 + t * 1.7, Math.cos(a) * (r + .1), .85); }
  bulb(0, 5.92, 0, 1.9);
  for (let i = 0; i < 32; i++) { const a = (i + .5) / 32 * Math.PI * 2; bulb(Math.sin(a) * (R_PLAT + .1), .84, Math.cos(a) * (R_PLAT + .1), .6); }
  const bulbMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: U.uPR, uScale: U.uScale }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aB; uniform float uTime,uPR,uScale; varying float vI;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv;
        float chase = aB.y<0. ? 1. : .42+.58*(.5+.5*sin(aB.y*4.-uTime*2.6));
        vI=chase; gl_PointSize=clamp(aB.z*(1.+sin(uTime*5.2+aB.x)*.07)*uScale*uPR*112./(-mv.z),2.,190.); }`,
    fragmentShader: `varying float vI; void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard;
        float core=1.-smoothstep(.08,.24,d), halo=pow(max(1.-d,0.),2.2);
        gl_FragColor=vec4((vec3(1.,.9,.7)*core*1.7+vec3(1.,.58,.24)*halo*.8)*vI,1.); }`
  });
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(bb, 3));
    const p = new THREE.Points(g, bulbMat); p.frustumCulled = false; carousel.add(p); }

  /* светло езеро под въртележката */
  { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), g = x.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(255,180,90,.5)'); g.addColorStop(1, 'rgba(255,160,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(8.4, 40), new THREE.MeshBasicMaterial({ map: canvasTex(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = .012; scene.add(pool); }

  /* далечен панаир: виенско колело + шатри (силуети срещу здрача) */
  { const sil = new THREE.MeshBasicMaterial({ color: 0x0c0814, fog: false });
    wheel = new THREE.Group(); wheel.add(new THREE.Mesh(new THREE.TorusGeometry(6.2, .13, 6, 56), sil));
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.07, 12.4, .07), sil); s.rotation.z = i / 8 * Math.PI; wheel.add(s); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, c = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .3), sil); c.position.set(Math.cos(a) * 6.2, Math.sin(a) * 6.2 - .3, 0); wheel.add(c); }
    wheel.position.set(-8.6, 8.4, -30); scene.add(wheel);
    const leg = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8.6, 4, 1, true), sil); leg.position.set(-8.6, 4.2, -30.2); scene.add(leg);
    [[9, -27, 3.2], [15, -32, 4.2], [-17, -26, 3], [3.5, -36, 3.6]].forEach(([x, z, s]) => { const t = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.15, 8), sil); t.position.set(x, s * .55, z); scene.add(t); }); }

  /* пилоните на картите (месинг) */
  const poleGeo = new THREE.CylinderGeometry(.045, .045, 3.1, 10);
  for (const c of cards) { const pole = new THREE.Mesh(poleGeo, M.brass); pole.position.set(Math.sin(c.a) * (R_RIDE - .14), 2.2, Math.cos(c.a) * (R_RIDE - .14)); carousel.add(pole); }

function riders() {
  /* ═══ конете от прах: между картите, на външния кръг · галопират в такт, сглобяват се отпред и се разпадат отзад ═══ */
  { const cv = paintHorse(), Z = cv.width, px = cv.getContext('2d').getImageData(0, 0, Z, Z).data, cand = [];
    for (let i = 3; i < px.length; i += 4) if (px[i] > 90) { const k = i >> 2, e = px[i - 12] < 90 || px[i + 12] < 90 || px[i - Z * 12] < 90 || px[i + Z * 12] < 90; cand.push(k); if (e) cand.push(k, k); }   // контурът тежи ×3 → силуетът се чете
    const n = 6000, HS = 1.72, pos = new Float32Array(n * 3), dust = new Float32Array(n * 3), seed = new Float32Array(n * 4), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const k = cand[(Math.random() * cand.length) | 0], x = k % Z, y = (k / Z) | 0;
      pos[i * 3] = -((x + Math.random()) / Z - .5) * HS; pos[i * 3 + 1] = (.5 - (y + Math.random()) / Z) * HS; pos[i * 3 + 2] = (Math.random() - .5) * .16;   // огледално: гледа по посоката на въртене
      const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.cbrt(Math.random()), q = Math.sqrt(1 - u * u);
      dust[i * 3] = r * q * Math.cos(th) * 2; dust[i * 3 + 1] = r * u * 1.9 + .5; dust[i * 3 + 2] = r * q * Math.sin(th) * 2;
      for (let j = 0; j < 4; j++) seed[i * 4 + j] = Math.random();
      const b = 1 + Math.random() * .3; col[i * 3] = px[k * 4] / 255 * b; col[i * 3 + 1] = px[k * 4 + 1] / 255 * b * .86; col[i * 3 + 2] = px[k * 4 + 2] / 255 * b * .62;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aDust', new THREE.BufferAttribute(dust, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    for (let i = 0; i < N; i++) {
      const a = (i + .5) * STEP, pole = new THREE.Mesh(poleGeo, M.brass); pole.position.set(Math.sin(a) * R_HORSE, 2.2, Math.cos(a) * R_HORSE); carousel.add(pole);
      const g = new THREE.Group(); g.position.set(Math.sin(a) * (R_HORSE + .03), 1.56, Math.cos(a) * (R_HORSE + .03)); g.rotation.y = a; carousel.add(g);
      const mat = config.grains(1.9);
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; g.add(pts); HORSES.push({ a, g, mat, A: 0, ph: i * 1.8 });
    } }

  /* падаща звезда (на всеки ~15 s · три на финала) */
  { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 8; const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(.85, 'rgba(255,236,200,.9)'); g.addColorStop(1, '#fff'); x.fillStyle = g; x.fillRect(0, 0, 256, 8);
    star1.mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, .11), new THREE.MeshBasicMaterial({ map: canvasTex(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }));
    star1.mesh.rotation.z = -.42; star1.mesh.visible = false; scene.add(star1.mesh); }

}

/* един кадър на декора (вика се от step() на двигателя → същият един rAF) · F = { t, dt, rot, all, shots } · shots се харчи тук */
function step(F) {
  const { t, dt } = F;
  for (const h of HORSES) {
    const aT = lerp(1 - smooth(.6, 2.3, Math.abs(wrapPi(h.a + F.rot))), 1, F.all);           // до картата във фокус конете остават цели (нула облак пред текста)
    h.A += (aT - h.A) * (dt ? 1 - Math.exp(-dt * 4) : 1); h.mat.uniforms.uA.value = h.A;
    h.g.position.y = 1.56 + Math.sin(t * 1.9 + h.ph) * .17; h.g.rotation.z = Math.sin(t * 1.9 + h.ph + 1.1) * .06;
  }
  if (wheel) wheel.rotation.z += dt * .05;
  if (F.shots > 0 ? t > star1.t0 + .8 : t > star1.next) { star1.t0 = t; star1.x = -11 + Math.random() * 10; star1.y = 19 + Math.random() * 7; star1.next = t + 9 + Math.random() * 9; if (F.shots > 0) F.shots--; }
  const sk = (t - star1.t0) / 1.5; star1.mesh.visible = sk >= 0 && sk < 1;
  if (star1.mesh.visible) { star1.mesh.position.set(star1.x + sk * 15, star1.y - sk * 6.7, -44); star1.mesh.material.opacity = Math.sin(sk * Math.PI) * .95; }
}

return { paintCard, riders, step,
  dust: { grain: [1, .9, .72], loose: [1, .82, .6], air: [[1, .78, .5], [1, .94, .82]], gold: [1, .8, .34] } };   // топлината на праха: зрънца на картите · разпилени · въздух (2 тона) · злато при N/N
}
decor.fonts = ['400 80px "Yeseva One"', '400 30px Lora', 'italic 400 30px Lora', '600 30px Lora'];
decor.fontProbe = 'Център LITE';
