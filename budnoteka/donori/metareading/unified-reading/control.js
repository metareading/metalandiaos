/* metalandia-нов-контрол · скеле v2 (MET-941) · ЕДИН ES-модул: диригент „Прах" + Eidolon (WebGL · three r160 локален) + mount(el, config)
   Съдържанието идва САМО от config.js (W2) · стилът от control.css (НЖ токени · R7) · същият файл се монтира в skillplate/metalandiaos и в website/ (Control.tsx).
   ENGINE:BEGIN…ENGINE:END = общият двигател · байт-идентичен с assets/control/control.js на умението (scripts/jev_gate.py мери md5) · нов ефект → Skill(metalandia-живо-платно), после обратно в умението. */
import * as THREE from 'three';

/* ENGINE:BEGIN */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&](reduced|nogl)=1/.test(location.search);
const наЕкран = (el, m = 0) => { const r = el.getBoundingClientRect(); return r.bottom > -m && r.top < innerHeight + m; };

/* ЕДИН rAF-диригент · рисува само видимото · заспива при 0 активни · reduced → един кадър */
export const Прах = globalThis.__Прах || (globalThis.__Прах = (() => { const реги = []; let жив = false, t0 = performance.now(), посл = t0, празни = 0, кадри = 0;
  function кадър(now) { const dt = Math.min(0.05, (now - посл) / 1000); посл = now; const t = (now - t0) / 1000; let активни = 0; кадри++;
    for (const r of реги) { if (r.когато && !r.когато()) continue; if (r.el && !наЕкран(r.el, 160)) continue; r.рисувай(t, dt, now); активни++; }
    if (reduce || document.hidden) { жив = false; return; }
    празни = активни ? 0 : празни + 1; if (празни > 150) { жив = false; return; }
    requestAnimationFrame(кадър); }
  const буди = () => { if (!жив) { жив = true; посл = performance.now(); празни = 0; requestAnimationFrame(кадър); } };
  addEventListener('scroll', буди, { passive: true }); addEventListener('resize', буди); document.addEventListener('visibilitychange', () => { if (!document.hidden) буди(); });
  return { добави(r) { реги.push(r); буди(); return r; }, махни(r) { const i = реги.indexOf(r); if (i >= 0) реги.splice(i, 1); }, буди, get кадри() { return кадри; } }; })());   /* един диригент на СТРАНИЦА · и при няколко контрола */

/* EIDOLON · образ A → прах (вълна · вихър · течащ поток) → образ B · един THREE.Points · uM 0→1 · нула свой цикъл (кара го Прах) */
const VERT = `
uniform float uT,uM,uAsp,uPx;
attribute vec3 aB,aCol,aColB; attribute float aSeed;
varying vec3 vC; varying float vA;
const float PI=3.14159265; const vec3 GOLD=vec3(0.9098,0.7804,0.4941); const vec3 LIGHT=vec3(1.0,0.9608,0.8392);
vec2 rot2(vec2 v,float a){ float c=cos(a),s=sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }
void main(){
  float sd=aSeed; vec2 a=position.xy, b=aB.xy;
  float d=clamp(0.5-0.5*a.x/uAsp,0.0,1.0)*0.40+sd*0.24;                       /* вълната тръгва отдясно */
  float m=clamp(uM*1.64-d,0.0,1.0), e=m*m*(3.0-2.0*m), w=sin(PI*e);
  vec2 p=mix(a,b,e);
  p=rot2(p, w*(0.9+sd*1.5));                                                  /* вихърът */
  p+=w*0.17*vec2(sin(a.y*5.0+uT*1.3+sd*40.0), cos(a.x*4.0-uT*1.1+sd*31.0));   /* течащият поток */
  float tw=pow(0.5+0.5*sin(uT*(1.1+sd*2.3)+sd*60.0),7.0);                     /* искрене */
  float l=mix(position.z,aB.z,e);
  vC=mix(aCol,aColB,e)*1.25+GOLD*tw*0.35+w*0.22*LIGHT;
  vA=(0.03+0.5*tw)*(0.15+0.85*l*l)+w*0.6*(0.4+0.6*l);
  gl_Position=vec4(p.x/uAsp,p.y,0.0,1.0);
  gl_PointSize=uPx*1.7*(1.0+w*0.8);
}`;
const FRAG = `
varying vec3 vC; varying float vA;
void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d)*vA; if(a<0.004) discard; gl_FragColor=vec4(vC,a); }`;

export function eidolon(canvas, stage, imgA, imgB, приЗагуба) {
  let renderer = null; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  const MQ = matchMedia('(max-width: 899px)'), LOW = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2;
  const DPR = Math.min(devicePixelRatio || 1, MQ.matches ? 2 : 1.75);
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000, 0); renderer.debug.onShaderError = () => приЗагуба && приЗагуба();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); приЗагуба && приЗагуба(); });
  const U = { uT: { value: 0 }, uM: { value: 0 }, uAsp: { value: 1 }, uPx: { value: DPR } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const scene = new THREE.Scene(), cam = new THREE.Camera(); let pts = null, готов = false, W = 0, H = 0, N = 0, asp0 = 0;
  const проба = (img, cw, ch) => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d', { willReadFrequently: true });
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    g.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh); return g.getImageData(0, 0, cw, ch).data; };       /* = object-fit:cover · center */
  function построй() {
    W = stage.clientWidth; H = stage.clientHeight; if (!W || !H || !imgA.naturalWidth || !imgB.naturalWidth) return false; const asp = W / H;
    N = MQ.matches ? (LOW ? 16000 : 28000) : (LOW ? 30000 : 54000);
    const cw = 180, ch = Math.max(48, Math.round(cw / asp)); let pa, pb; try { pa = проба(imgA, cw, ch); pb = проба(imgB, cw, ch); } catch (e) { return false; }
    const A = new Float32Array(N * 3), B = new Float32Array(N * 3), CA = new Float32Array(N * 3), CB = new Float32Array(N * 3), S = new Float32Array(N);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const вземи = (px, P, C, i) => { let u = 0, v = 0, l = 0, k = 0;                                           /* сглобяване на образ: гъстота ∝ светлината */
      for (let tr = 0; tr < 5; tr++) { u = rnd(); v = rnd(); k = (Math.min(ch - 1, v * ch | 0) * cw + Math.min(cw - 1, u * cw | 0)) * 4; l = (px[k] * .3 + px[k + 1] * .59 + px[k + 2] * .11) / 255; if (rnd() < .22 + .78 * l) break; }
      P[i * 3] = (u * 2 - 1) * asp; P[i * 3 + 1] = 1 - v * 2; P[i * 3 + 2] = l; C[i * 3] = px[k] / 255; C[i * 3 + 1] = px[k + 1] / 255; C[i * 3 + 2] = px[k + 2] / 255; };
    for (let i = 0; i < N; i++) { вземи(pa, A, CA, i); вземи(pb, B, CB, i); S[i] = rnd(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(A, 3)); geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
    geo.setAttribute('aCol', new THREE.BufferAttribute(CA, 3)); geo.setAttribute('aColB', new THREE.BufferAttribute(CB, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(S, 1));
    if (pts) { scene.remove(pts); pts.geometry.dispose(); }
    pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    U.uAsp.value = asp; U.uPx.value = DPR * Math.max(0.85, Math.min(1.5, H / 560)); renderer.setSize(W, H, false); asp0 = asp; return true; }
  готов = построй();
  let rt = 0; const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    if (!готов || Math.abs(w / h - asp0) > 0.03) готов = построй(); else { W = w; H = h; renderer.setSize(w, h, false); } Прах.буди(); }, 140); }) : null;
  if (ro) ro.observe(stage);
  return { кадър(t, m) { if (!готов) return; U.uT.value = t; U.uM.value = m; renderer.render(scene, cam); },
    спри() { if (ro) ro.disconnect(); if (pts) pts.geometry.dispose(); mat.dispose(); renderer.dispose(); },
    info() { return { N, готов, W, H, dpr: DPR, three: THREE.REVISION }; } }; }
/* ENGINE:END */

/* ── помощници на скелето ── */
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const редове = a => (a || []).slice(0, 3).map(r => `<p class="ред">${r}</p>`).join('');            /* R2 · ≤3 реда на екран */
const стъпало = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ── ЖИВАТА КНИГА · УАУ-слой (MET-1251) · свой двигател СЛЕД ENGINE:END · кара го Прах (нула втори rAF) ──
   ЕДИН уред, три органа на една страница: лещата обхваща поле · окото тече по реда със скорост · местата на колелото пазят думите.
   Текстът се ражда от прах (m .5→1 · скролът е господар) и не напуска сцената · запомненото остава знак върху страницата. Съдържание: config.книга (дословно). */
function книга(st, к, вземиМ, кредит) {
  const dpr = Math.min(2, devicePixelRatio || 1), кор = h('div', 'книга'), фон = h('div', 'кн-фон'), стр = h('div', 'страница'), cv = h('canvas', 'кн-прах'), x = cv.getContext('2d');
  const обвий = s => s.split(' ').map(d => `<span class="д">${d}</span>`).join(' ');
  стр.innerHTML = `<h2 class="кн-загл">${обвий(к.заглавие)}</h2>
    <div class="кн-поле"><div class="кн-лента">${к.полета.map(p => `<div class="к-поле">${p.загл ? `<h3 class="к-загл">${обвий(p.загл)}</h3>` : ''}${p.текст ? `<p class="к-текст">${обвий(p.текст)}</p>` : ''}</div>`).join('')}</div></div>
    <div class="леща"><span class="лег ниво" role="group" aria-label="${к.ниво}">${к.нива.map(n => `<button type="button">${n}</button>`).join('<i>·</i>')}</span><button type="button" class="лег темпо" aria-label="${к.скорост}"></button></div>
    <div class="печати">${к.печати.map(p => `<span class="печат"><i></i>${p}</span>`).join('')}</div>`;
  cv.setAttribute('aria-hidden', 'true'); кор.append(фон, h('small', 'кредит кн-кредит', кредит || ''), стр, cv); st.append(кор);
  const загл = стр.querySelector('.кн-загл'), кутия = стр.querySelector('.кн-поле'), леща = стр.querySelector('.леща'), печати = [...стр.querySelectorAll('.печат')],
    бНива = [...стр.querySelectorAll('.ниво button')], бТемпо = стр.querySelector('.темпо'), капак = st.querySelector('figcaption'), кред = кор.querySelector('.кн-кредит');
  const чисто = s => s.replace(/[^\p{L}\p{N}-]/gu, ''), css = getComputedStyle(кор), шрифт = getComputedStyle(загл).fontFamily;
  const rgb = n => { const v = css.getPropertyValue(n).trim(), k = parseInt(v.slice(1), 16); return /^#[0-9a-f]{6}$/i.test(v) ? `${k >> 16},${(k >> 8) & 255},${k & 255}` : '232,199,126'; };   /* боите идват от токените (R7) */
  const злато = rgb('--акцент'), светло = rgb('--light'), тъмно = rgb('--bg'), З = a => `rgba(${злато},${a})`, С = a => `rgba(${светло},${a})`;
  const лента = кутия.firstElementChild, полета = к.полета.map((p, i) => { const el = лента.children[i], ду = [...el.querySelectorAll('.д')];
    return { el, ду, ключ: p.дума ? ду.find(d => чисто(d.textContent) === p.дума) : null, знаци: (p.загл || '').length + (p.текст || '').length, линии: [], всички: [], L: 0 }; });
  let поле = 0, ниво = 0, темпо = Math.max(0, к.скорости.findIndex(c => c.темпо >= 500)), жива = false, родена = false, фаза = 'леща', τ = 0, s = 0, четени = 0, ex = 0, ey = 0,
    мери = true, зрънца = null, bT = 0, θ = 0, флаш = 0, полет = null, посл = '', W = 0, H = 0, wc = [0, 0], bx = 0, by = 0;
  const пазени = [], искри = [], удари = [];

  /* редовете на едно поле: окото тече по тях · s = изминат път в px · думата светва, щом окото я мине */
  const линииНа = p => { p.линии = []; let L = 0;                                  /* по offset-и: лентата се плъзга, мерим полето в покой (bx,by = началото на кутията в сцената) */
    for (const d of p.ду) { const hh = d.offsetHeight, y = by + d.offsetTop - p.el.offsetTop + hh / 2, x0 = bx + d.offsetLeft; let л = p.линии[p.линии.length - 1];
      if (!л || Math.abs(л.y - y) > hh * .6) { л = { y, h: hh, x0, x1: 0, s0: 0, думи: [] }; p.линии.push(л); }
      л.x1 = x0 + d.offsetWidth; л.думи.push({ d, x1: л.x1 }); }
    for (const л of p.линии) { л.s0 = L; L += л.x1 - л.x0; for (const w of л.думи) { w.s1 = л.s0 + w.x1 - л.x0; w.л0 = л.s0; } }
    p.L = L; p.всички = p.линии.flatMap(л => л.думи); };
  const лещаНа = () => { const el = полета[поле].el;                      /* текстът тече през лещата: лентата се плъзга, полето застава под нея · абзац = полето · страница = цялата страница */
    лента.style.transform = `translateY(${-el.offsetTop}px)`; кутия.style.setProperty('--дъно', (el.offsetHeight + 26) + 'px');
    леща.style.top = (ниво ? 8 : кутия.offsetTop - 12) + 'px'; леща.style.height = (ниво ? стр.clientHeight - 16 : el.offsetHeight + 24) + 'px'; };

  /* раждане от прах: зрънцата са пикселите на самите букви (заглавие + първо поле) · при b=1 всяко е точно на мястото си → DOM текстът поема */
  const посей = () => { const o = document.createElement('canvas'); o.width = W; o.height = H; const c2 = o.getContext('2d', { willReadFrequently: true }), о = st.getBoundingClientRect(); let y0 = 1e9, y1 = 0;
    c2.fillStyle = '#fff'; c2.textBaseline = 'alphabetic';
    for (const d of [...загл.querySelectorAll('.д'), ...полета[0].ду]) { const свой = d.closest('.к-поле'), r = свой ? { left: о.left + bx + d.offsetLeft, top: о.top + by + d.offsetTop - свой.offsetTop, width: d.offsetWidth, height: d.offsetHeight } : d.getBoundingClientRect(), cs = getComputedStyle(d), т = d.textContent; c2.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      let me = c2.measureText(т); const k = r.width / (me.width || 1); if (Math.abs(k - 1) > .02) { c2.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`; me = c2.measureText(т); }
      c2.fillText(т, r.left - о.left, r.top - о.top + (r.height + me.fontBoundingBoxAscent - me.fontBoundingBoxDescent) / 2); y0 = Math.min(y0, r.top - о.top); y1 = Math.max(y1, r.top + r.height - о.top); }
    const Y0 = Math.max(0, Math.floor(y0) - 2), HH = Math.max(1, Math.min(H, Math.ceil(y1) + 2) - Y0), px = c2.getImageData(0, Y0, W, HH).data, т = [];
    for (let yy = 0; yy < HH; yy += 2) for (let xx = (yy >> 1) % 2; xx < W; xx += 2) if (px[(yy * W + xx) * 4 + 3] > 96) т.push(xx, yy + Y0);
    const n = Math.min(2600, т.length / 2), крачка = (т.length / 2) / (n || 1); зрънца = [];
    for (let i = 0; i < n; i++) { const j = Math.floor(i * крачка) * 2, tx = т[j], ty = т[j + 1];
      зрънца.push({ tx, ty, sx: tx + (Math.random() - .5) * 300, sy: Math.random() * y0 * .92, d: Math.min(1, .6 * (ty - y0) / (y1 - y0 + 1) + .22 * tx / W + Math.random() * .18), a: Math.random() * 6.283 }); } };
  const прахНа = b => { const дошли = new Path2D(), летят = new Path2D();
    for (const z of зрънца) { const e0 = Math.max(0, Math.min(1, (b - z.d * .5) / .5)); if (e0 <= 0) continue; const e = e0 * e0 * (3 - 2 * e0), q = 1 - e;
      (e > .985 ? дошли : летят).rect(z.sx + (z.tx - z.sx) * e + Math.sin(z.a + e * 5) * q * 30 - .7, z.sy + (z.ty - z.sy) * e + Math.cos(z.a * 1.7 + e * 4) * q * 22 - .7, 1.5, 1.5); }
    x.fillStyle = З(.62); x.fill(летят); x.fillStyle = С(.96); x.fill(дошли); };
  const наредба = () => { мери = false; W = st.clientWidth; H = st.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    кутия.style.height = Math.max(...полета.map(p => p.el.offsetHeight)) + 'px'; фон.style.height = (стр.offsetHeight + 150) + 'px'; кред.style.bottom = (стр.offsetHeight + 10) + 'px';
    const о = st.getBoundingClientRect(), r = стр.getBoundingClientRect(), rк = кутия.getBoundingClientRect(); wc = [r.right - о.left - 70, r.top - о.top + 22]; bx = rк.left - о.left; by = rк.top - о.top; полета.forEach(линииНа); лещаНа(); посей(); };

  /* печатите остават върху страницата · всеки нов удар = пулс */
  const печат = i => { const e = печати[i]; if (!e) return; e.classList.add('удар'); e.classList.remove('пулс'); void e.offsetWidth; e.classList.add('пулс'); };
  /* думата тръгва към колелото · на страницата остава знакът ѝ (.пазена) */
  const пусни = d => { if (полет) return; const о = st.getBoundingClientRect(), r = d.getBoundingClientRect(); d.classList.add('пазена');
    полет = { дума: чисто(d.textContent), x: r.left - о.left + r.width / 2, y: r.top - о.top + r.height / 2, t: 0 }; удари.push({ x: полет.x, y: полет.y, t: 0 }); Прах.буди(); };
  const към = (i, първо) => { поле = i; const p = полета[i]; полета.forEach((q, j) => q.el.classList.toggle('тук', j === i)); p.ду.forEach(d => d.classList.remove('ч'));
    четени = 0; s = 0; фаза = 'леща'; τ = 0; лещаНа(); леща.classList.remove('блик'); void леща.offsetWidth; леща.classList.add('блик');
    if (първо && p.линии[0]) { ex = p.линии[0].x0 - 24; ey = p.линии[0].y; } if (reduce && печати[0]) печати[0].classList.add('удар'); };
  /* потокът: лещата обхваща (Възприето) → окото тече със скоростта (Прочетено) → колелото пази думата (Запомнено) → следващото поле · окото не спира */
  const ход = dt => { if (reduce) return; const p = полета[поле]; τ += dt;
    if (фаза === 'леща') { if (τ > .6) { печат(0); фаза = 'четене'; } }
    else if (фаза === 'четене') { s += dt * p.L / Math.max(.9, p.знаци / (к.скорости[темпо].темпо * .1));
      while (четени < p.всички.length && (ниво ? p.всички[четени].л0 : p.всички[четени].s1) <= s) p.всички[четени++].d.classList.add('ч');
      if (s >= p.L) { while (четени < p.всички.length) p.всички[четени++].d.classList.add('ч'); печат(1); if (p.ключ && !p.ключ.classList.contains('пазена')) пусни(p.ключ); фаза = 'обръщане'; τ = 0; } }
    else if (τ > .55) към((поле + 1) % полета.length); };
  const окоНа = dt => { const p = полета[поле], n = p.линии.length; if (!n) return; let л = p.линии[n - 1], tx, ty;
    if (ниво) { tx = (p.линии[0].x0 + Math.max(...p.линии.map(q => q.x1))) / 2; ty = p.линии[0].y + (л.y - p.линии[0].y) * Math.min(1, s / (p.L || 1)); for (const q of p.линии) if (q.y >= ty - 1) { л = q; break; } }
    else { for (const q of p.линии) if (s < q.s0 + q.x1 - q.x0) { л = q; break; } tx = Math.min(л.x1, л.x0 + Math.max(0, s - л.s0)); ty = л.y; }
    const k = reduce ? 1 : Math.min(1, dt * (фаза === 'четене' ? 20 : 6)); ex += (tx - ex) * k; ey += (ty - ey) * k;
    const oy = ey + л.h / 2 + 3, g = x.createRadialGradient(ex, ey, 0, ex, ey, 38); g.addColorStop(0, З(.3)); g.addColorStop(1, З(0)); x.fillStyle = g; x.fillRect(ex - 38, ey - 38, 76, 76);   /* светлината върху думите */
    if (!ниво && ex - 14 > л.x0) { const gl = x.createLinearGradient(ex - 96, 0, ex, 0); gl.addColorStop(0, З(0)); gl.addColorStop(1, З(.75)); x.strokeStyle = gl; x.lineWidth = 1.4; x.beginPath(); x.moveTo(Math.max(л.x0, ex - 96), oy); x.lineTo(ex - 13, oy); x.stroke(); }
    x.strokeStyle = С(.92); x.lineWidth = 1.2; x.beginPath(); x.moveTo(ex - 12, oy); x.quadraticCurveTo(ex, oy - 8, ex + 12, oy); x.quadraticCurveTo(ex, oy + 8, ex - 12, oy); x.stroke();          /* окото язди под реда */
    x.fillStyle = С(1); x.beginPath(); x.arc(ex, oy, 2.7, 0, 6.283); x.fill(); };
  /* колелото: 8 места · мястото под стрелката чака думата · пълните места се завъртат наляво · в средата = последната пазена дума */
  const колелоНа = dt => { const [cx, cy] = wc, R = 44; θ += (-пазени.length * Math.PI / 4 - θ) * Math.min(1, dt * 5); флаш = Math.max(0, флаш - dt * 1.4);
    x.fillStyle = `rgba(${тъмно},.86)`; x.beginPath(); x.arc(cx, cy, R + 9, 0, 6.283); x.fill();
    x.strokeStyle = З(.6); x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, R, 0, 6.283); x.stroke(); x.beginPath(); x.arc(cx, cy, R - 9, 0, 6.283); x.stroke();
    x.fillStyle = З(1); x.beginPath(); x.moveTo(cx - 5, cy - R - 14); x.lineTo(cx + 5, cy - R - 14); x.lineTo(cx, cy - R - 7); x.fill();
    for (let i = 0; i < 8; i++) { const a = θ - Math.PI / 2 + i * Math.PI / 4, има = i < пазени.length;
      x.beginPath(); x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, има ? 5 : 3.4, 0, 6.283); x.fillStyle = има ? З(1) : `rgba(${тъмно},1)`; x.fill(); x.strokeStyle = З(има ? 1 : .65); x.stroke(); }
    if (флаш > 0) { x.strokeStyle = З(флаш); x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, R + 9 + (1 - флаш) * 16, 0, 6.283); x.stroke(); }
    const д = пазени[пазени.length - 1]; if (д) { x.font = `italic 600 19px ${шрифт}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = С(1); x.fillText(д, cx, cy + 1, 62); } };
  const полетНа = dt => {
    if (полет) { полет.t += dt / .9; const f = Math.min(1, полет.t), e = f * f * (3 - 2 * f), u = 1 - e, [cx, cy] = wc, mx = (полет.x + cx) / 2 - 50, my = Math.min(полет.y, cy) - 60,
        px = u * u * полет.x + 2 * u * e * mx + e * e * cx, py = u * u * полет.y + 2 * u * e * my + e * e * cy;
      for (let i = 0; i < 2; i++) искри.push({ x: px + (Math.random() - .5) * 28, y: py + (Math.random() - .5) * 10, t: 0 });
      x.font = `italic 600 ${19 + Math.sin(f * Math.PI) * 5}px ${шрифт}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = С(1); x.fillText(полет.дума, px, py);
      if (f >= 1) { if (пазени.length < 8) пазени.push(полет.дума); else пазени[7] = полет.дума; печат(2); флаш = 1; полет = null; } }
    for (let i = искри.length - 1; i >= 0; i--) { const q = искри[i]; q.t += dt * 1.5; if (q.t >= 1) { искри.splice(i, 1); continue; } x.fillStyle = З((1 - q.t) * .9); x.fillRect(q.x, q.y + q.t * 12, 1.6, 1.6); }
    for (let i = удари.length - 1; i >= 0; i--) { const u = удари[i]; u.t += dt * 1.4; if (u.t >= 1) { удари.splice(i, 1); continue; } x.strokeStyle = З(1 - u.t); x.lineWidth = 1.5; x.beginPath(); x.arc(u.x, u.y, 9 + u.t * 28, 0, 6.283); x.stroke(); } };

  const рисувай = (t, dt) => { const m = вземиМ(), b = Math.max(0, Math.min(1, (m - .5) / .47)), вид = стъпало(.3, .7, m).toFixed(2) + (1 - стъпало(.12, .42, m)).toFixed(2);
    if (вид !== посл) { посл = вид; кор.style.setProperty('--к', вид.slice(0, 4)); if (капак) капак.style.opacity = вид.slice(4); }
    if (мери && m > .2) наредба(); if (!зрънца) return;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); if (m <= .2) return;
    const род = b >= .995; if (род !== родена) { родена = род; кор.classList.toggle('родена', род); bT = 0; if (!род) { жива = false; кор.classList.remove('жива'); поле = 0; лещаНа(); } }
    if (!родена) return прахНа(b);
    bT += dt; if (bT < .6 && !reduce) { x.globalAlpha = 1 - bT / .6; прахНа(1); }
    if (!жива) { жива = true; кор.classList.add('жива'); към(поле, true); }
    ход(dt); x.globalAlpha = reduce ? 1 : Math.min(1, bT / .5); колелоНа(dt); окоНа(dt); x.globalAlpha = 1; полетНа(dt); };

  стр.addEventListener('click', e => { e.stopPropagation(); const d = e.target.closest('.д'); if (d && жива && d.closest('.тук')) пусни(d); });   /* тап върху страницата не обръща героя · тап върху дума → колелото я пази */
  const покажиНиво = () => { бНива.forEach((b, i) => b.setAttribute('aria-pressed', String(i === ниво))); лещаНа(); };
  бНива.forEach((b, i) => b.addEventListener('click', () => { ниво = i; покажиНиво(); Прах.буди(); }));
  const покажиТемпо = () => { const c = к.скорости[темпо]; бТемпо.textContent = `${c.име} · ${c.темпо}`; };
  бТемпо.addEventListener('click', () => { темпо = (темпо + 1) % к.скорости.length; покажиТемпо(); Прах.буди(); });
  покажиНиво(); покажиТемпо();
  const преоразмери = () => { мери = true; Прах.буди(); }; addEventListener('resize', преоразмери); if (document.fonts) document.fonts.ready.then(преоразмери);
  const рег = Прах.добави({ el: st, рисувай });
  return { info: () => ({ жива, родена, поле, фаза, дял: +(s / (полета[поле].L || 1)).toFixed(2), ниво: к.нива[ниво], темпо: к.скорости[темпо].темпо, пазени: [...пазени], зрънца: зрънца ? зрънца.length : 0 }),
    спри() { Прах.махни(рег); removeEventListener('resize', преоразмери); } };
}

/* mount(el, config) → unmount() · R6 · едно и също в skillplate/metalandiaos и в website/components/controls/<Име>.tsx */
export function mount(el, config) {
  const c = config, г = c.герой, чистачи = [], бройЕтапи = (c.етапи || []).length;
  el.classList.add('контрол'); if (c.акцент) el.style.setProperty('--акцент', c.акцент);
  el.innerHTML = '';

  /* ГЕРОЙ · R1 преобразяване (проблем → еликсир) · R2 образ ≥60 % · скролът е господар · тапът обръща и ДЪРЖИ (MED-V1) */
  const hero = h('section', 'герой екран'), st = h('figure', 'сцена');
  st.innerHTML = `<img class="а" src="${г.проблем.образ}" alt="${г.проблем.alt || ''}"><img class="б" src="${г.еликсир.образ}" alt="${г.еликсир.alt || ''}"><canvas aria-hidden="true"></canvas>
    <figcaption><h1>${г.заглавие}</h1>${редове(г.редове)}<small class="кредит">${г.кредит || ''}</small></figcaption><i class="тап" aria-hidden="true"></i>`;
  hero.append(st); el.append(hero);
  const [imgA, imgB, cv] = [st.querySelector('.а'), st.querySelector('.б'), st.querySelector('canvas')], тап = st.querySelector('.тап');
  let m = 0, цел = 0, държи = false, скролПри = 0, E = null, авто = 0;
  const покажи = () => { imgA.style.opacity = String(1 - стъпало(0.02, 0.4, m)); imgB.style.opacity = String(стъпало(0.6, 0.98, m)); hero.dataset.m = m.toFixed(2); };
  const постави = (s, ръчно) => { цел = s; if (ръчно) { държи = true; скролПри = scrollY; clearTimeout(авто); тап.classList.add('seen'); } Прах.буди(); };
  const клик = () => постави(цел > 0.5 ? 0 : 1, true); st.addEventListener('click', клик);
  const скрол = () => { if (държи && Math.abs(scrollY - скролПри) < 24) return; държи = false;
    const r = hero.getBoundingClientRect(), ход = r.height - innerHeight; if (ход > 8) цел = Math.max(0, Math.min(1, -r.top / (ход * .5))); };   /* първата половина ражда страницата · втората я държи отворена */
  addEventListener('scroll', скрол, { passive: true }); чистачи.push(() => removeEventListener('scroll', скрол));
  const загуба = () => { if (E) { E = null; st.classList.remove('gl'); } };
  const старт = () => { if (reduce) return; E = eidolon(cv, st, imgA, imgB, загуба); if (E && E.info().готов) st.classList.add('gl'); else E = null; Прах.буди(); };
  Promise.all([imgA, imgB].map(i => i.decode ? i.decode().catch(() => 0) : 0)).then(старт);
  const рГерой = Прах.добави({ el: st, рисувай(t, dt) {
    if (reduce) { m = цел; покажи(); return; }
    const k = dt / 2.4; m = цел > m ? Math.min(цел, m + k) : Math.max(цел, m - k); покажи(); if (E) E.кадър(t, m); } });
  чистачи.push(() => { Прах.махни(рГерой); if (E) E.спри(); clearTimeout(авто); });
  if (!reduce) авто = setTimeout(() => { if (цел === 0 && scrollY < 40 && наЕкран(st)) постави(1, false); }, 3600);   /* УАУ веднага · веднъж */

  const К = c.книга ? книга(st, c.книга, () => m, (г.кредит || '').split(' → ').pop()) : null; if (К) чистачи.push(К.спри);   /* Живата Книга · страницата се отваря от праха на героя */
  const тяло = т => т.текст ? `<p>${т.текст}</p>` : ['защо', 'как', 'какво'].filter(k => т[k]).map(k => `<p><b>${(c.въпроси || {})[k] || ''}</b> ${т[k]}</p>`).join('');

  /* ЕТАПИ · R4 един етап = един екран · R8 частите се събират като карти · R5 карта = големият образ + 4 затваряния */
  const събрани = new Set(), брояч = h('div', 'брояч'); брояч.setAttribute('aria-live', 'polite');
  const обнови = () => { брояч.textContent = `${събрани.size} / ${бройЕтапи}`; el.classList.toggle('пълно', бройЕтапи > 0 && събрани.size === бройЕтапи); };
  const карта = h('div', 'карта'); карта.setAttribute('role', 'dialog'); карта.setAttribute('aria-modal', 'true'); карта.hidden = true;
  let връщане = null;
  const затвори = () => { if (карта.hidden) return; карта.hidden = true; document.documentElement.classList.remove('карта-отворена'); if (връщане) връщане.focus(); };
  const отвори = (e, i, от) => { връщане = от; събрани.add(i); обнови();
    карта.innerHTML = `<button class="х" aria-label="Затвори">✕</button><figure><img src="${e.образ}" alt="${e.alt || e.заглавие}"><figcaption><h2>${(e.карта && e.карта.име) || e.заглавие}</h2>${тяло(e.карта || {})}<small class="кредит">${e.кредит || ''}</small></figcaption></figure>`;
    карта.hidden = false; document.documentElement.classList.add('карта-отворена'); карта.querySelector('.х').focus(); };
  let y0 = null;
  карта.addEventListener('click', e => { if (e.target === карта || e.target.closest('.х')) затвори(); });                 /* ✕ + тап извън */
  карта.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  карта.addEventListener('touchend', e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 70) затвори(); y0 = null; });   /* свайп надолу */
  карта.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); карта.querySelector('.х').focus(); } });   /* фокусът остава в картата */
  const esc = e => { if (e.key === 'Escape') затвори(); }; addEventListener('keydown', esc); чистачи.push(() => removeEventListener('keydown', esc));
  const io = new IntersectionObserver(es => es.forEach(x => x.target.classList.toggle('вкадър', x.isIntersecting)), { threshold: 0.35 });
  (c.етапи || []).forEach((e, i) => {
    const s = h('section', 'етап екран'); s.dataset.етап = e.ключ;
    s.innerHTML = `<button class="образ" aria-label="Отвори картата: ${e.заглавие}"><img loading="lazy" src="${e.образ}" alt="${e.alt || e.заглавие}"></button><div class="текст"><span class="ключ">${i + 1} · ${e.ключ}</span><h2>${e.заглавие}</h2>${редове(e.редове)}</div>`;
    const b = s.querySelector('.образ'); b.addEventListener('click', () => отвори(e, i, b)); io.observe(s); el.append(s); });
  чистачи.push(() => io.disconnect());

  /* НАГРАДА · R8 накрая · отключва се, когато всички карти са събрани */
  const н = c.награда || {}, край = h('section', 'награда екран');
  край.innerHTML = `<h2>${н.заглавие || ''}</h2>${редове(н.редове)}${н.cta ? `<a class="cta" href="${н.cta.href}">${н.cta.текст}</a>` : ''}`;
  const сл = н.следваща;
  if (сл) { const кут = h('div', 'следваща'); кут.setAttribute('role', 'group'); кут.setAttribute('aria-label', сл.заглавие);
    кут.innerHTML = `<h3>${сл.заглавие}</h3><p class="ред">${сл.подсказка || ''}</p><div class="деп" role="group" aria-label="Дейност">${сл.дейности.map((d, i) => `<button type="button" class="дей" aria-pressed="false" data-i="${i}"><b>${d.име}</b><span>${d.защо}</span></button>`).join('')}</div><div class="ритъм" role="group" aria-label="Ритъм">${сл.ритми.map((r, i) => `<button type="button" aria-pressed="false" data-i="${i}">${r}</button>`).join('')}</div><p class="торба" aria-live="polite"></p>`;
    const избор = { д: -1, р: -1 }, торба = кут.querySelector('.торба');
    const зададе = (sel, k) => кут.querySelectorAll(sel).forEach(b => b.addEventListener('click', () => { избор[k] = +b.dataset.i; кут.querySelectorAll(sel).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      торба.textContent = избор.д >= 0 && избор.р >= 0 ? `${сл.дейности[избор.д].име} · ${сл.ритми[избор.р]} → +1 ${сл.светлина} · +1 ${сл.злато}` : ''; }));
    зададе('.деп .дей', 'д'); зададе('.ритъм button', 'р'); край.querySelector('h2').after(кут); }
  st.setAttribute('role', 'img'); st.setAttribute('aria-label', (г.заглавие || '') + ' · ' + (г.редове || []).join(' '));
  el.append(край, брояч, карта); io.observe(край); обнови(); скрол();

  const api = () => { чистачи.forEach(f => f()); el.innerHTML = ''; el.classList.remove('контрол', 'пълно'); };
  api.info = () => ({ m: +m.toFixed(3), цел, gl: !!E, reduce, кадри: Прах.кадри, събрани: събрани.size, етапи: бройЕтапи, eidolon: E ? E.info() : null, книга: К ? К.info() : null });
  api.постави = s => постави(s, true);
  return api;
}
