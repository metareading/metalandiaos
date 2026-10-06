import * as THREE from 'three';

/* ═════════ ФИЛМОВИЯТ ДЕКОР · Филмова въртележка (MET-1276 · ADR 0123) ═════════
   Шевът: decor(scene, config) → { paintCard, dust, riders, step } + decor.fonts · двигателят (engine.js) остава байт-идентичен.
   Какво се вижда: снимачна площадка в нощта — въртяща се сцена с филмова лента по борда · релси · прожектори с лъчи · стойки и рампа на фона · лъчът на Сърцето в средата.
   Картата = кадър (ъгли на визьор + клапа) на една Снимачна площадка · в кадъра стоят двамата ѝ Метагерои от Eidolon-прах (riders).
   Думите идват от DOM-а (data-heroes · data-accent ← config.js) · цветовете от токените в :root (НЖ sep2026) · площадката сменя само акцента.
   Състоянието се чете отвън: window.__proto.state() (поток · фокус · избор) + body[data-hero] (избраният Метагерой пълни екрана). */

const HEROES = n => n.split('|').map(s => { const [id, name, production] = s.split(':'); return { id, name, production }; });
const HW = .74, HH = 1.11;                               // герой в света (в кадъра на картата)

/* Метагерой: силует от две багри (светлина + акцент) · рисуван, после става прах */
function paintHero(id, ac, li) {
  const W = 256, H = 384, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.lineCap = x.lineJoin = 'round'; x.translate(128, 376); const s = id === 'teen' ? .86 : 1; x.scale(s, s);
  const path = pts => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); };
  const line = (pts, w, col = li) => { x.strokeStyle = col; x.lineWidth = w; path(pts); x.stroke(); };
  const poly = (pts, col = ac) => { x.fillStyle = x.strokeStyle = col; x.lineWidth = 8; path(pts); x.closePath(); x.fill(); x.stroke(); };
  const dot = (a, b, r, col = li) => { x.fillStyle = col; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); };
  const legs = () => { line([[-13, -150], [-17, -8]], 22); line([[13, -150], [18, -8]], 22); line([[-19, -4], [-32, -4]], 9, ac); line([[16, -4], [31, -4]], 9, ac); };
  const dress = w => poly([[-19, -190], [19, -190], [w, -8], [-w, -8]]);
  const torso = (sh, y1) => poly([[-sh, -256], [sh, -256], [17, y1], [-17, y1]], li);
  const head = (dx = 0) => { line([[dx, -280], [0, -258]], 15); dot(dx, -300, 25); };
  const hair = () => { line([[-23, -316], [-31, -284], [-27, -252]], 11, ac); line([[23, -316], [31, -284], [27, -252]], 11, ac); };
  if (id === 'woman') { dress(62); torso(25, -188); head(); hair(); line([[-25, -250], [-52, -206], [-72, -164]], 12); line([[25, -250], [56, -222], [82, -256]], 12); }
  else if (id === 'man') { legs(); torso(36, -148); head(); line([[-36, -250], [-45, -200], [-40, -152]], 14); line([[36, -250], [46, -202], [28, -172]], 14); line([[-17, -150], [17, -150]], 8, ac); line([[0, -252], [0, -206]], 7, ac); }
  else if (id === 'teen') { legs(); poly([[-33, -250], [-49, -244], [-51, -182], [-31, -178]]); torso(30, -148); head();
    x.strokeStyle = ac; x.lineWidth = 9; x.beginPath(); x.arc(0, -300, 31, Math.PI * .85, Math.PI * 2.15); x.stroke();
    line([[30, -250], [53, -288], [61, -334]], 12); line([[-30, -250], [-37, -200], [-30, -162]], 12); }
  else if (id === 'mother') { x.translate(-30, 0); dress(52); torso(25, -188); head(); dot(-15, -324, 12, ac);
    line([[-25, -250], [-45, -206], [-40, -166]], 12); line([[25, -250], [49, -202], [62, -152]], 12);
    line([[78, -100], [62, -152]], 9); poly([[77, -106], [99, -106], [108, -42], [68, -42]]); line([[80, -40], [80, -8]], 10); line([[96, -40], [96, -8]], 10); dot(88, -130, 17); }
  else if (id === 'reader') { legs(); torso(33, -148); head(4); line([[-33, -250], [-47, -204], [-18, -190]], 13); line([[33, -250], [47, -204], [18, -190]], 13);
    poly([[-46, -224], [0, -208], [0, -176], [-46, -192]]); poly([[46, -224], [0, -208], [0, -176], [46, -192]]); line([[0, -208], [0, -176]], 4, li); }
  else if (id === 'writer') { dress(56); torso(25, -188); head(); hair(); line([[25, -250], [50, -262], [62, -300]], 12); poly([[62, -300], [82, -336], [94, -366], [72, -346]]);
    line([[-25, -250], [-46, -216], [-58, -184]], 12); poly([[-80, -198], [-46, -202], [-42, -160], [-76, -156]]); }
  else if (id === 'storyteller') { dress(64); torso(25, -188); head(); dot(15, -324, 12, ac); line([[-25, -250], [-58, -270], [-84, -312]], 12); line([[25, -250], [58, -270], [84, -312]], 12);
    for (let k = 0; k < 7; k++) { const a = Math.PI * (k + .5) / 7; dot(Math.cos(a) * 88, -330 - Math.sin(a) * 34, k % 2 ? 4 : 7, ac); } }
  else { legs(); torso(35, -148); head(); x.fillStyle = ac; x.beginPath(); x.ellipse(-4, -322, 31, 11, -.2, 0, 7); x.fill();
    line([[35, -250], [58, -262], [44, -288]], 13); poly([[32, -296], [92, -322], [92, -268]]);
    line([[-35, -250], [-50, -202], [-58, -164]], 13); poly([[-92, -160], [-40, -160], [-40, -124], [-92, -124]]); line([[-94, -168], [-40, -180]], 9, ac); }
  return cv;
}

export default function decor(scene, config) {
const { renderer, carousel, cards, N, U, R_RIDE, canvasTex } = config;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
const T = { bg: tok('--bg'), bg2: tok('--bg2'), gold: tok('--gold'), gold3: tok('--gold3'), light: tok('--light'), dark: tok('--parchink'), serif: tok('--serif'), sans: tok('--sans') };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
const R_DECK = 3.3, SETS = [], BEAMS = [], v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
for (const c of cards) { c.accent = c.el.dataset.accent || T.gold; c.heroes = HEROES(c.el.dataset.heroes); }

function canvas(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); return cv; }
function fade(stops, radial) {                           // прелив за лъчи и светли езера
  return canvasTex(canvas(radial ? 256 : 4, 256, (x, w, h) => { const g = radial ? x.createRadialGradient(128, 128, 2, 128, 128, 127) : x.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, c]) => g.addColorStop(p, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
}
function fitFont(x, text, weight, size, min, family, maxW) { for (; size > min; size -= 2) { x.font = `${weight} ${size}px ${family}`; if (x.measureText(text).width <= maxW) break; } x.font = `${weight} ${size}px ${family}`; }

/* картата: кадър на Снимачна площадка · ъгли на визьор · клапа · под двамата герои — име и продукция (дословно от DOM-а) */
function paintCard(c, glow) {
  return canvas(624, 800, (x, W, H) => {
    if (!glow) { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(T.bg2, .34)); g.addColorStop(.6, rgba(T.bg, .6)); g.addColorStop(1, rgba(T.bg, .88));
      x.fillStyle = g; x.fillRect(10, 10, W - 20, H - 20); }
    x.strokeStyle = c.accent; x.lineWidth = glow ? 8 : 5; x.lineCap = 'square';
    for (const [a, b, sx, sy] of [[14, 14, 1, 1], [W - 14, 14, -1, 1], [14, H - 14, 1, -1], [W - 14, H - 14, -1, -1]]) { x.beginPath(); x.moveTo(a + 78 * sx, b); x.lineTo(a, b); x.lineTo(a, b + 78 * sy); x.stroke(); }
    x.fillStyle = c.accent; for (let k = 0; k < 9; k++) { const a = 132 + k * 40; x.beginPath(); x.moveTo(a + 14, 30); x.lineTo(a + 36, 30); x.lineTo(a + 22, 58); x.lineTo(a, 58); x.closePath(); x.fill(); }
    x.fillRect(W / 2 - 1, 598, 2, 96);
    if (glow) return;                                    // думите остават чисти на листа · прахът е от визьора и клапата
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    c.heroes.forEach((h, j) => { const cx = W * (.27 + .46 * j), maxW = W * .44 - 20;
      fitFont(x, h.name, 600, 64, 44, T.serif, maxW); x.fillStyle = T.light; x.shadowColor = rgba(c.accent, .5); x.shadowBlur = 18; x.fillText(h.name, cx, 646); x.shadowBlur = 0;
      fitFont(x, h.production, 500, 40, 38, T.sans, maxW); x.fillStyle = c.accent; x.fillText(h.production, cx, 706); });
  });
}

  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(T.bg, 1); scene.fog = new THREE.Fog(T.bg, 16, 46);

  /* нощта: купол · под · циклорама (топъл отблясък зад рампата) */
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 24, 16, 0, Math.PI * 2, 0, Math.PI * .6), new THREE.MeshBasicMaterial({ map: fade([[0, T.bg], [.7, T.bg2], [1, T.dark]]), side: THREE.BackSide, fog: false }));
    sky.position.y = -5; scene.add(sky);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: T.dark, roughness: .92 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const cyc = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ map: fade([[0, rgba(T.gold3, .5)], [.5, rgba(T.gold3, .14)], [1, rgba(T.gold3, 0)]], true), transparent: true, depthWrite: false, fog: false }));
    cyc.position.set(0, 6, -17); scene.add(cyc); }

  /* светлини */
  scene.add(new THREE.HemisphereLight(T.light, T.bg, .34));
  const key = new THREE.PointLight(T.gold, 70, 30, 1.9); key.position.set(0, 5.2, 0); scene.add(key);
  const fill = new THREE.PointLight(T.light, 60, 40, 2); fill.position.set(3.4, 4.2, 12); scene.add(fill);

  const M = { dark: new THREE.MeshStandardMaterial({ color: T.dark, roughness: .78 }), deckSide: null,
    gold: new THREE.MeshStandardMaterial({ color: T.gold, roughness: .4, metalness: .4, emissive: T.gold3, emissiveIntensity: .7 }),
    rail: new THREE.MeshStandardMaterial({ color: T.gold3, roughness: .45, metalness: .5, emissive: T.gold3, emissiveIntensity: .25 }) };

  /* ═══ въртящата се сцена: под с марки за всяка площадка · борд от филмова лента · златен ръб ═══ */
  const add = (geo, mat, y, parent = carousel) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; parent.add(m); return m; };
  { const deck = canvasTex(canvas(1024, 1024, (x, Z) => { const o = Z / 2;
      const g = x.createRadialGradient(o, o, 30, o, o, o); g.addColorStop(0, T.gold3); g.addColorStop(.22, T.dark); g.addColorStop(1, T.bg2); x.fillStyle = g; x.fillRect(0, 0, Z, Z);
      [[.97, 5, T.gold], [.6, 2, T.gold3], [.3, 2, T.gold3]].forEach(([r, w, col]) => { x.beginPath(); x.arc(o, o, o * r, 0, 7); x.lineWidth = w; x.strokeStyle = col; x.stroke(); });
      for (const c of cards) { const px = o + Math.sin(c.a) * o * R_RIDE / R_DECK, py = o + Math.cos(c.a) * o * R_RIDE / R_DECK;   // марка „тук стоят героите“
        x.save(); x.translate(px, py); x.rotate(-c.a); x.strokeStyle = c.accent; x.lineWidth = 7; x.lineCap = 'round';
        for (const d of [-118, 118]) { x.beginPath(); x.moveTo(d - 26, 40); x.lineTo(d + 26, 40); x.moveTo(d, 14); x.lineTo(d, 66); x.stroke(); } x.restore(); } }));
    add(new THREE.CylinderGeometry(R_DECK, R_DECK, .2, 64), M.dark, .5);
    add(new THREE.CircleGeometry(R_DECK, 64), new THREE.MeshStandardMaterial({ map: deck, roughness: .62, emissive: 0xffffff, emissiveMap: deck, emissiveIntensity: .16 }), .602).rotation.x = -Math.PI / 2;
    const strip = canvasTex(canvas(1024, 96, (x, W, H) => { x.fillStyle = T.bg; x.fillRect(0, 0, W, H);                                 // филмова лента: перфорация + кадри
      for (let k = 0; k < 64; k++) { x.fillStyle = T.gold; x.fillRect(k * 16 + 4, 8, 8, 12); x.fillRect(k * 16 + 4, H - 20, 8, 12); }
      for (let k = 0; k < 16; k++) { x.fillStyle = rgba(T.gold, k % 2 ? .1 : .2); x.fillRect(k * 64 + 5, 30, 54, 36); } }));
    strip.wrapS = THREE.RepeatWrapping; strip.repeat.x = 2;
    add(new THREE.CylinderGeometry(R_DECK + .02, R_DECK + .1, .4, 64, 1, true), new THREE.MeshStandardMaterial({ map: strip, roughness: .6, emissive: 0xffffff, emissiveMap: strip, emissiveIntensity: .55 }), .38);
    add(new THREE.TorusGeometry(R_DECK, .035, 8, 64), M.gold, .61).rotation.x = Math.PI / 2; }

  /* светло езеро под всяка площадка (акцентът ѝ) + общото под сцената */
  { const poolTex = fade([[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']], true), poolGeo = new THREE.CircleGeometry(1.25, 32);
    for (const c of cards) { const p = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ map: poolTex, color: c.accent, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      p.rotation.x = -Math.PI / 2; p.position.set(Math.sin(c.a) * R_RIDE, .615, Math.cos(c.a) * R_RIDE); carousel.add(p); c.pool = p; }
    const pool = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshBasicMaterial({ map: poolTex, color: T.gold, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = .012; scene.add(pool); }

  /* лъчът на Сърцето: от средата на сцената нагоре в нощта */
  const beamTex = fade([[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]);
  const beamMat = (col, op) => new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  { add(new THREE.TorusGeometry(.46, .03, 8, 24), M.gold, .63).rotation.x = Math.PI / 2;
    const heart = add(new THREE.CylinderGeometry(.42, 1.7, 8, 32, 1, true), beamMat(T.gold, .34), 4.62); heart.rotation.x = Math.PI; BEAMS.push({ m: heart.material, o: .34, ph: 0 }); }

  /* релси около сцената (не се въртят) */
  for (const r of [4.5, 4.86]) { const rail = new THREE.Mesh(new THREE.TorusGeometry(r, .03, 6, 96), M.rail); rail.rotation.x = Math.PI / 2; rail.position.y = .05; scene.add(rail); }
  { const tie = new THREE.BoxGeometry(.5, .03, .09); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, m = new THREE.Mesh(tie, M.dark); m.position.set(Math.sin(a) * 4.68, .03, Math.cos(a) * 4.68); m.rotation.y = a + Math.PI / 2; scene.add(m); } }

  /* прожектори на стойки: триножник · тяло · леща · лъч към сцената */
  const lens = new THREE.MeshBasicMaterial({ color: T.light, toneMapped: false, fog: false });
  function lamp(px, pz, h, col, len, op) {
    const g = new THREE.Group(); g.position.set(px, 0, pz); scene.add(g);
    add(new THREE.CylinderGeometry(.035, .035, h, 6), M.dark, h / 2, g);
    add(new THREE.ConeGeometry(.7, 1.3, 3, 1, true), new THREE.MeshBasicMaterial({ color: T.dark, wireframe: true }), .65, g);
    const head = new THREE.Group(); head.position.y = h; g.add(head);
    v1.set(-px, 2.4 - h, -pz).normalize(); head.quaternion.setFromUnitVectors(v2.set(0, -1, 0), v1);
    add(new THREE.CylinderGeometry(.2, .3, .5, 16), M.dark, .1, head); add(new THREE.CircleGeometry(.27, 20), lens, -.16, head).rotation.x = Math.PI / 2;
    const geo = new THREE.ConeGeometry(len * .3, len, 28, 1, true); geo.translate(0, -len / 2 - .12, 0);
    const m = beamMat(col, op); head.add(new THREE.Mesh(geo, m)); BEAMS.push({ m, o: op, ph: px });
  }
  lamp(-2.5, -5, 5.6, T.gold, 9, .26); lamp(2.7, -5.6, 6.3, T.light, 10, .2); lamp(-7.4, 1.4, 5.2, T.light, 9, .16); lamp(7.6, .6, 5.8, T.gold, 9, .16);

  /* рампа на фона: ферма със софити (силует срещу циклорамата) */
  { const sil = new THREE.MeshBasicMaterial({ color: T.bg, fog: false }), z = -14;
    for (const y of [8.3, 8.9]) { const b = new THREE.Mesh(new THREE.BoxGeometry(26, .09, .09), sil); b.position.set(0, y, z); scene.add(b); }
    for (let i = -13; i <= 13; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .85, .06), sil); b.position.set(i, 8.6, z); b.rotation.z = i % 2 ? .6 : -.6; scene.add(b); }
    for (const px of [-12.6, 12.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.3, 9, .3), sil); b.position.set(px, 4.5, z); scene.add(b); }
    for (const px of [-7.5, -3.6, 0, 3.6, 7.5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .6, .4), sil); b.position.set(px, 7.85, z); scene.add(b);
      const geo = new THREE.ConeGeometry(1.5, 7, 20, 1, true); geo.translate(0, -3.5, 0); const m = beamMat(T.gold, .13), c = new THREE.Mesh(geo, m); c.position.set(px, 7.6, z); scene.add(c); BEAMS.push({ m, o: .13, ph: px * 2 }); } }

function riders() {
  /* ═══ 8-те Метагерои от Eidolon-прах: по двама в кадъра на всяка площадка · в покой са облак, при фокус се сглобяват ═══ */
  for (const c of cards) {
    const set = { c, K: 0, heroes: [] }; SETS.push(set);
    c.heroes.forEach((h, j) => {
      const cv = paintHero(h.id, c.accent, T.light), W = cv.width, H = cv.height, px = cv.getContext('2d').getImageData(0, 0, W, H).data, cand = [];
      for (let i = 3; i < px.length; i += 4) if (px[i] > 90) { const k = i >> 2, e = px[i - 12] < 90 || px[i + 12] < 90 || px[i - W * 12] < 90 || px[i + W * 12] < 90; cand.push(k); if (e) cand.push(k, k); }   // контурът тежи ×3 → силуетът се чете
      const n = 6000, pos = new Float32Array(n * 3), dust = new Float32Array(n * 3), seed = new Float32Array(n * 4), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const k = cand[(Math.random() * cand.length) | 0], x = k % W, y = (k / W) | 0;
        pos[i * 3] = ((x + Math.random()) / W - .5) * HW; pos[i * 3 + 1] = (.5 - (y + Math.random()) / H) * HH; pos[i * 3 + 2] = (Math.random() - .5) * .1;
        const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.cbrt(Math.random()), q = Math.sqrt(1 - u * u);
        dust[i * 3] = r * q * Math.cos(th) * 1.5; dust[i * 3 + 1] = r * u * 1.5 + .2; dust[i * 3 + 2] = r * q * Math.sin(th) * 1.5;
        for (let m = 0; m < 4; m++) seed[i * 4 + m] = Math.random();
        const b = 1 + Math.random() * .3; col[i * 3] = px[k * 4] / 255 * b; col[i * 3 + 1] = px[k * 4 + 1] / 255 * b * .94; col[i * 3 + 2] = px[k * 4 + 2] / 255 * b * .8;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aDust', new THREE.BufferAttribute(dust, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      const g = new THREE.Group(), home = new THREE.Vector3((j - .5) * .74, .22, .07); g.position.copy(home); c.g.add(g);
      const mat = config.grains(1.5), pts = new THREE.Points(geo, mat); pts.frustumCulled = false; g.add(pts);
      set.heroes.push({ id: h.id, j, g, mat, home, A: 0, k: 0 });
    });
  }
}

/* един кадър на декора (от step() на двигателя → същият един rAF) */
function step(F) {
  const { t, dt } = F, P = window.__proto, st = P ? P.state() : { mode: 'flow', idx: -1 }, held = st.mode === 'focus' || st.mode === 'open';
  const chosen = st.mode === 'open' ? document.body.dataset.hero || '' : '', cam = P && chosen ? P.dbg().camera : null;
  for (const set of SETS) {
    const c = set.c, on = held && c.i === st.idx, front = 1 - smooth(.35, 2.2, Math.abs(wrapPi(c.a + F.rot)));
    let K = 0;
    for (const h of set.heroes) {
      const mine = on && chosen === h.id, other = on && chosen && !mine;
      const aT = mine ? 1 : other ? 0 : on ? 1 : front * (held ? .06 : .4);
      h.A += (aT - h.A) * (dt ? 1 - Math.exp(-dt * (on ? (h.j ? 2.3 : 3.6) : 4)) : 0); h.mat.uniforms.uA.value = h.A; h.mat.uniforms.uFocus.value = on ? 1 : 0;
      h.k += ((mine ? 1 : 0) - h.k) * (dt ? 1 - Math.exp(-dt * 3) : 0);
      if (h.k > .002) {                                   // избраният Метагерой идва пред камерата и пълни екрана
        const kk = h.k * h.k * (3 - 2 * h.k);
        if (cam) { cam.getWorldDirection(v1); v2.set(0, 1, 0).applyQuaternion(cam.quaternion); v1.multiplyScalar(3).add(cam.position).addScaledVector(v2, .16);
          c.g.updateWorldMatrix(true, false); h.to = (h.to || new THREE.Vector3()).copy(c.g.worldToLocal(v1)); }
        if (h.to) h.g.position.lerpVectors(h.home, h.to, kk); h.g.scale.setScalar(1 + 1.05 * kk); K = Math.max(K, kk);
      } else if (h.g.scale.x !== 1) { h.g.position.copy(h.home); h.g.scale.setScalar(1); }
    }
    if (K > 0) { c.plane.material.opacity *= 1 - K; c.mat.uniforms.uA.value *= 1 - K; }       // кадърът се разпада в прах зад героя
    c.pool.material.opacity = lerp(.5, 1, on ? 1 : front * .6) * (.9 + .1 * Math.sin(t * 1.7 + c.ph));
  }
  for (const b of BEAMS) b.m.opacity = b.o * (.86 + .14 * Math.sin(t * .6 + b.ph));
}

return { paintCard, riders, step,
  dust: { grain: [1, .96, .84], loose: [1, .86, .62], air: [[.91, .78, .49], [1, .96, .84]], gold: [.91, .78, .49] } };   // прахът: светлина + злато (НЖ sep2026)
}
decor.fonts = ['600 64px "Cormorant Garamond"', '500 40px Inter'];
decor.fontProbe = 'Жена НоваЖена';
decor.paintHero = paintHero;                             // постерът (без WebGL / намалено движение) показва същия силует
