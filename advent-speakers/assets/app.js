/* advent wall v3 (MET-2518) · the social post template, a still wall, a tap opens one speaker, reading first.
   Nothing on the wall moves by itself: no chain, no dust, no snow, no loop. The only motion is inside an open speaker:
   the metaidea forms once by the Eidolon (assets/ideas.js), calm, whole in under 3 s. No audio anywhere. */
(function () {
'use strict';
var D = window.AW_DATA, CAST = D.cast, ORDER = D.order, $ = function (s) { return document.querySelector(s); };
var BYN = {}; ORDER.forEach(function (o) { BYN[o.n] = o; });
var SPEAKERS = ORDER.filter(function (o) { return o.kind === 'speaker'; });

/* the post's grid: 5 columns x 6 rows, square n at [col, row, width, height] (read off the template image) */
var GRID = { 1: [0, 0, 1, 1], 2: [1, 0, 2, 1], 4: [3, 0, 1, 1], 17: [4, 0, 1, 1], 9: [0, 1, 1, 1], 5: [1, 1, 1, 1], 7: [2, 1, 2, 1], 24: [4, 1, 1, 1],
  6: [0, 2, 1, 2], 3: [1, 2, 1, 1], 19: [2, 2, 1, 1], 16: [3, 2, 1, 2], 21: [4, 2, 1, 1], 11: [1, 3, 1, 1], 23: [2, 3, 1, 1], 12: [4, 3, 1, 1],
  10: [0, 4, 1, 1], 18: [1, 4, 2, 1], 22: [3, 4, 1, 1], 15: [4, 4, 1, 2], 20: [0, 5, 1, 1], 14: [1, 5, 1, 1], 13: [2, 5, 1, 1], 8: [3, 5, 1, 1] };
/* the red squares' grain gradients: deep red in one corner, white in the other, as on the post */
var REDG = { 1: 'linear-gradient(315deg,#d40f18 0%,#e8362e 40%,#f4b8b3 78%,#fdeceb 100%)', 2: 'linear-gradient(260deg,#d40f18 0%,#e5322b 30%,#f2aaa4 70%,#fdeceb 100%)',
  15: 'linear-gradient(0deg,#d40f18 0%,#e5302a 42%,#f5bdb8 80%,#fff 100%)', 24: 'linear-gradient(20deg,#d40f18 0%,#e8362e 42%,#f4b8b3 82%,#fdeceb 100%)' };

var PH = false, W = 0, H = 0, C = 0, G = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

/* where the face sits in a box of aspect A (w/h): object-position so the face is near the upper middle */
function facePos(c, A) { var b = c.lm && c.lm.box || [0.3, 0.2, 0.4, 0.33], fx = b[0] + b[2] / 2, fy = b[1] + b[3] / 2, ia = 0.8, px = 50, py = 30;
  if (A >= ia) { var vy = ia / A; if (vy < 1) py = Math.max(0, Math.min(1, (fy - 0.46 * vy) / (1 - vy))) * 100; }
  else { var vx = A / ia; if (vx < 1) px = Math.max(0, Math.min(1, (fx - 0.5 * vx) / (1 - vx))) * 100; }
  return px.toFixed(1) + '% ' + py.toFixed(1) + '%'; }

/* a photo square is drawn once into its own canvas at screen size (cover + the face position): a still bitmap, no re-decoding of the big photo */
function paintSq(b, o) {
  var im = b._img, cv = b._cv, w = parseFloat(b.style.width), h = parseFloat(b.style.height); if (!im || !im.naturalWidth || !w || !h) return;
  var pw = Math.round(w * DPR), ph = Math.round(h * DPR); if (cv.width === pw && cv.height === ph && cv._done) return;
  cv.width = pw; cv.height = ph; var iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(pw / iw, ph / ih), dw = iw * s, dh = ih * s;
  var pos = facePos(CAST[o.id], w / h).split(' ').map(parseFloat), dx = (pw - dw) * pos[0] / 100, dy = (ph - dh) * pos[1] / 100, x = cv.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.drawImage(im, dx, dy, dw, dh); cv._done = true;
}

/* ── profile: 24 badges, two currencies (meaning: speakers read · giving: giving lines read). Per viewer, in localStorage, never required. ── */
var KEY = 'aw3-profile', P = { seen: {}, read: {}, give: {} };
try { var raw = localStorage.getItem(KEY); if (raw) { var q = JSON.parse(raw); if (q && q.seen) P = q; } } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
function count(o) { return Object.keys(o).length; }
function chip() { $('#cN').innerHTML = count(P.seen) + '<small>/24</small>'; $('#cM').textContent = count(P.read); $('#cG').textContent = count(P.give); }
function earn(o) { P.seen[o.n] = 1; if (o.kind === 'speaker') { P.read[o.id] = 1; if (o.giving) P.give[o.id] = 1; } save(); chip(); }

/* ── the wall ── */
var wall = $('#wall'), SQ = {};
ORDER.forEach(function (o) {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'sq'; b.setAttribute('role', 'listitem'); b.dataset.n = o.n;
  if (o.kind === 'speaker') { var c = CAST[o.id]; b.classList.add('ph'); b.setAttribute('aria-label', o.n + ' · ' + c.name);
    var cv = document.createElement('canvas'); cv.className = 'ph-c'; b.appendChild(cv); b._cv = cv; b._img = new Image(); b._img.onload = function () { paintSq(b, o); }; b._img.src = c.photo; }
  else { b.classList.add('red'); b.style.setProperty('--g', REDG[o.n]); b.setAttribute('aria-label', o.n + (o.n === 24 ? ' · значките' : ' · ' + (o.n === 1 ? 'Смисълът да даваш' : 'лекторите'))); }
  var no = document.createElement('span'); no.className = 'no'; no.textContent = o.n; b.appendChild(no);
  b.addEventListener('click', function () { openN(o.n, true); });
  wall.appendChild(b); SQ[o.n] = b;
});

function layout() {
  W = innerWidth; H = innerHeight; PH = W / H < 0.85; document.body.classList.toggle('ph', PH);
  var title = $('#title'), arc = $('#arc'), hx = $('#hx'), ted = $('#ted'), key = $('#key'), can = $('#candle'), hint = $('#hint'), ch = $('#chip');
  var top, gx, gy, gw, gh, tf, af, ah, hxs;
  if (!PH) {
    C = Math.floor(Math.min(H * 0.118, W * 0.088)); G = Math.round(C * 0.075);
    gw = 5 * C + 4 * G; gh = 6 * C + 5 * G; tf = C * 0.74; af = C * 0.17; ah = C * 0.44; hxs = C * 0.2; top = Math.round(H * 0.03);
  } else {
    C = Math.floor((W - 32) / 5.3); G = Math.round(C * 0.075);
    gw = 5 * C + 4 * G; gh = 6 * C + 5 * G; tf = 40; af = 12.5; ah = 30; hxs = 15; top = 54;
  }
  /* the title: fit to its width (desktop 1.42 x the grid, as on the post; phone: the screen less the gutters) */
  title.style.fontSize = tf + 'px'; var want = PH ? W - 32 : Math.min(gw * 1.42, W - 40); tf = tf * want / title.scrollWidth; title.style.fontSize = tf.toFixed(2) + 'px';
  var tw = title.scrollWidth, aw = tw * 0.74;
  arc.setAttribute('width', aw); arc.setAttribute('height', ah); arc.style.left = (W - aw) / 2 + 'px'; arc.style.top = top + 'px';
  $('#arcP').setAttribute('d', 'M ' + (aw * 0.02) + ' ' + (ah * 0.98) + ' Q ' + (aw / 2) + ' ' + (-ah * 0.62) + ' ' + (aw * 0.98) + ' ' + (ah * 0.98));
  var at = arc.querySelector('text'); at.style.fontSize = af + 'px'; at.style.letterSpacing = (af * 0.62) + 'px';
  hx.style.fontSize = hxs + 'px'; hx.style.left = 0; hx.style.right = 0; hx.style.top = (top + ah + hxs * 0.05) + 'px';
  var ty = top + ah + hxs * 1.25; title.style.left = (W - tw) / 2 + 'px'; title.style.top = ty + 'px';
  gy = Math.round(ty + tf * 1.12 + (PH ? 10 : C * 0.12)); gx = Math.round((W - gw) / 2);
  wall.style.left = gx + 'px'; wall.style.top = gy + 'px'; wall.style.width = gw + 'px'; wall.style.height = gh + 'px';
  ORDER.forEach(function (o) { var g = GRID[o.n], b = SQ[o.n], w = g[2] * C + (g[2] - 1) * G, h = g[3] * C + (g[3] - 1) * G;
    b.style.left = g[0] * (C + G) + 'px'; b.style.top = g[1] * (C + G) + 'px'; b.style.width = w + 'px'; b.style.height = h + 'px';
    b.querySelector('.no').style.fontSize = Math.max(11, C * 0.15).toFixed(1) + 'px';
    if (b._cv) paintSq(b, o); });
  if (!PH) {
    var kh = 4.1 * C, kw = kh * 110 / 330; key.style.height = kh + 'px'; key.style.width = kw + 'px'; key.style.left = (gx - kw * 0.72) + 'px'; key.style.top = (gy + gh - kh + C * 0.05) + 'px';
    var chh = 2.75 * C, cw = chh * 150 / 330; can.style.height = chh + 'px'; can.style.width = cw + 'px'; can.style.left = (gx + gw - cw * 0.16) + 'px'; can.style.top = (gy + gh - chh + C * 0.02) + 'px';
    ted.style.left = (gx + gw + C * 0.16) + 'px'; ted.style.top = (gy + C * 0.02) + 'px'; ted.style.fontSize = (C * 0.165) + 'px'; ted.style.textAlign = 'left';
    ted.querySelector('.lg').style.fontSize = (C * 0.3) + 'px'; ted.style.right = 'auto'; ted.style.width = 'auto';
    hint.style.left = (gx + gw + C * 0.16) + 'px'; hint.style.top = (gy + 1.25 * C) + 'px'; hint.style.width = (1.9 * C) + 'px'; hint.style.textAlign = 'left'; hint.style.fontSize = Math.max(13, C * 0.12) + 'px';
    ch.style.left = (gx + gw + C * 0.16) + 'px'; ch.style.top = (gy + 1.95 * C) + 'px';
  } else {
    var by = gy + gh + 14, room = H - by - 14, kh2 = Math.min(200, room), kw2 = kh2 * 110 / 330, ch2 = Math.min(200, room), cw2 = ch2 * 150 / 330;
    key.style.height = kh2 + 'px'; key.style.width = kw2 + 'px'; key.style.left = '18px'; key.style.top = by + 'px';
    can.style.height = ch2 + 'px'; can.style.width = cw2 + 'px'; can.style.left = (W - 14 - cw2) + 'px'; can.style.top = by + 'px';
    ted.style.left = '16px'; ted.style.right = '16px'; ted.style.top = '12px'; ted.style.width = 'auto'; ted.style.fontSize = '12.5px'; ted.style.textAlign = 'left';
    ted.querySelector('.lg').style.fontSize = '21px';
    var midL = 18 + kw2 + 6, midR = W - 14 - cw2 - 6;
    hint.style.left = midL + 'px'; hint.style.width = (midR - midL) + 'px'; hint.style.top = (by + kh2 * 0.18) + 'px'; hint.style.fontSize = '14px'; hint.style.textAlign = 'center';
    ch.style.left = (midL + (midR - midL) / 2 - ch.offsetWidth / 2) + 'px'; ch.style.top = (by + kh2 * 0.18 + 58) + 'px';
  }
  if (cur && cur.kind === 'speaker') sizeSpeaker();
}

/* ── the open speaker ── */
var cur = null, CUT = {}, loopOn = false, t0 = 0, last = 0, ideaReady = false, frames = [];
var IB = $('#ideaBox'), IC = $('#idea');
function load(src) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }

/* the photo cut out by its mask (blue channel of the aux map), with one red line round it: one colour, no dots */
function cutout(id, dw, dh) {
  var c = CAST[id];
  return Promise.all([load(c.photo), load(c.aux)]).then(function (im) {
    var ph = im[0], ax = im[1]; if (!ph) return null;
    var iw = ph.naturalWidth, ih = ph.naturalHeight, S = 1, LINE = (PH ? 2.6 : 3.2);
    /* the mask at the photo's size */
    var m = document.createElement('canvas'); m.width = iw; m.height = ih; var mx = m.getContext('2d');
    if (ax) { mx.imageSmoothingQuality = 'high'; mx.drawImage(ax, 0, 0, iw, ih); var d = mx.getImageData(0, 0, iw, ih), p = d.data, top = ih;
      for (var i = 0, n = iw * ih; i < n; i++) { var bl = p[i * 4 + 2], a = Math.max(0, Math.min(1, (bl - 105) / 70)); p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = 0; p[i * 4 + 3] = Math.round(a * 255); if (a > 0.5 && top === ih) top = Math.floor(i / iw); }
      mx.putImageData(d, 0, 0); } else { mx.fillRect(0, 0, iw, ih); var top = 0; }
    /* crop: air above the hair, then fit the box */
    var air = Math.round(ih * 0.03), y0 = Math.max(0, top - air), chh = ih - y0;
    S = Math.min(dw * 0.94 / iw, dh * 0.92 / chh); var ow = Math.round(iw * S * DPR), oh = Math.round(chh * S * DPR), r = LINE * DPR, pad = Math.ceil(r + 2);
    var o = document.createElement('canvas'); o.width = ow + 2 * pad; o.height = oh + pad; var ox = o.getContext('2d');
    /* 1 · the line: the mask grown by r, filled with one red */
    for (var k = 0; k < 24; k++) { var A = k / 24 * Math.PI * 2; ox.drawImage(m, 0, y0, iw, chh, pad + Math.cos(A) * r, pad + Math.sin(A) * r, ow, oh); }
    ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#E62B1E'; ox.fillRect(0, 0, o.width, o.height);
    /* 2 · the photo inside its own mask, on top */
    var t = document.createElement('canvas'); t.width = ow; t.height = oh; var tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high';
    tx.drawImage(ph, 0, y0, iw, chh, 0, 0, ow, oh); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(m, 0, y0, iw, chh, 0, 0, ow, oh);
    ox.globalCompositeOperation = 'source-over'; ox.drawImage(t, pad, pad);
    /* 3 · the cut at the bottom fades out (the line too, so no hard edge) */
    ox.globalCompositeOperation = 'destination-out'; var gr = ox.createLinearGradient(0, o.height * 0.86, 0, o.height); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); ox.fillStyle = gr; ox.fillRect(0, o.height * 0.86, o.width, o.height * 0.14);
    /* the mask at output size, kept for the outline check only (__aw3.outline) */
    var mk = document.createElement('canvas'); mk.width = ow; mk.height = oh; mk.getContext('2d').drawImage(m, 0, y0, iw, chh, 0, 0, ow, oh);
    return { c: o, w: o.width / DPR, h: o.height / DPR, line: LINE, pad: pad / DPR, mask: mk, padPx: pad };
  });
}
function sizeSpeaker() {
  if (!cur) return; var pic = $('#sp .pic'), bw = pic.clientWidth, bh = pic.clientHeight, id = cur.id, k = id + ':' + bw + 'x' + bh;
  var cv = $('#sPic');
  (CUT[k] || (CUT[k] = cutout(id, bw, bh))).then(function (r) { if (!r || !cur || cur.id !== id) return; cv.width = r.c.width; cv.height = r.c.height; cv.getContext('2d').drawImage(r.c, 0, 0); cv.style.width = r.w + 'px'; cv.style.height = r.h + 'px'; cv.dataset.line = r.line; cv.dataset.pad = r.pad; cv.dataset.ready = k; cv._cut = r; });
  var box = IB.clientWidth, cw = box * 1.6; if (ideaReady) AW_IDEA.resize(cw, cw, DPR);
}
function lineHTML(o) {
  var s = o.shown, h;
  if ((o.q === 5 || o.giving) && s.charAt(0) === '…') { var rest = s.slice(1).replace(/^\s+/, ''); h = /^да даваш/.test(rest) ? '<span class="stem">Смисълът</span> ' + esc(rest) : '<span class="stem">Смисълът да даваш</span> ' + esc(rest); }
  else h = esc(s);
  return h;
}
function openSpeaker(o) {
  var c = CAST[o.id]; cur = o;
  $('#sName').textContent = c.name; $('#sLine').innerHTML = lineHTML(o); $('#sNo').textContent = o.n; $('#sCr').textContent = c.credit || '';
  $('#sTopic').textContent = c.topic; var bi = $('#sBadge'); bi.src = c.photo; bi.style.objectPosition = facePos(c, 1);
  $('#sArts').innerHTML = c.arts.map(function (a) { var lab = a.q === 1 || a.ql === 'Кой си ти?' ? '' : '<div class="aq">' + esc(a.ql) + '</div>'; return '<div class="art">' + lab + '<div class="at">' + esc(a.t) + '</div></div>'; }).join('');
  var slot = $('#sSlot'), v = $('#sVid'); slot.classList.remove('has'); v.onloadedmetadata = function () { slot.classList.add('has'); }; v.onerror = function () { slot.classList.remove('has'); }; v.src = 'intro/' + o.id + '.mp4';
  var cv = $('#sPic'); cv.width = 1; cv.height = 1; delete cv.dataset.ready;
  show('#sp'); $('#sp .body').scrollTop = 0; $('#sp .wrap').scrollTop = 0;
  earn(o); $('#sCoins').innerHTML = '<i class="coin m"></i>смисъл ' + count(P.read) + '/20 · <i class="coin g"></i>даване ' + count(P.give) + '/8';
  sizeSpeaker(); IB.style.display = AW_IDEA.has(o.id) ? '' : 'none';
  t0 = performance.now(); last = t0; frames = []; if (!loopOn) { loopOn = true; requestAnimationFrame(tick); }
  $('#sX').focus({ preventScroll: true, focusVisible: false });
}
/* the metaidea: pres fades in 0.5 s, the grains travel home between 0.25 s and 2.85 s (each on its own seed time), then it only breathes */
var FORM0 = 0.25, FORMD = 2.6;
function tick(now) {
  if (!cur || cur.kind !== 'speaker') { loopOn = false; if (ideaReady) AW_IDEA.frame(null, 0.016); return; }
  var t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now; frames.push(now); if (frames.length > 600) frames.shift();
  if (ideaReady && AW_IDEA.has(cur.id)) { var box = IB.clientWidth, cw = box * 1.6, asm = Math.max(0, Math.min(1, (t - FORM0) / FORMD)), pres = Math.min(1, t / 0.5); pres = pres * pres * (3 - 2 * pres);
    AW_IDEA.frame({ id: cur.id, cx: cw / 2, cy: cw / 2, r: box * 0.42, dcx: cw / 2, dcy: cw / 2, dw: box * 0.4, dh: box * 0.4, asm: asm, pres: pres, thr: 0, tx: 0, ty: 0, A: t, T: t }, dt); }
  requestAnimationFrame(tick);
}

/* ── an event square: 1 the theme · 2 and 15 the two parts of the wall · 24 the badges ── */
function openEvent(o) {
  cur = o; earn(o);
  if (o.n === 24) { profile(); return; }
  var list = o.n === 1 ? [] : o.n === 2 ? SPEAKERS.filter(function (s) { return s.n < 15; }) : SPEAKERS.filter(function (s) { return s.n > 15; });
  $('#eT').textContent = o.n === 1 ? 'Смисълът да даваш' : o.n === 2 ? 'Лекторите' : 'Смисълът да даваш…';
  $('#eP').innerHTML = o.n === 1 ? 'TEDx Sofia · <b>28 Ноември</b> · Дом на киното.<br>20 лектори, 24 квадратчета. Докосни квадратче със снимка и прочети какво казва лекторът.'
    : o.n === 2 ? 'Дванадесет лектори за себе си. Избери един и прочети.' : 'Осем лектори за това защо даваме. Избери един и прочети.';
  $('#eN').innerHTML = list.map(function (s) { var c = CAST[s.id]; return '<button type="button" data-n="' + s.n + '"><img alt="" src="' + c.photo + '" style="object-position:' + facePos(c, 1) + '"><b>' + s.n + '</b> ' + esc(c.name) + '</button>'; }).join('');
  show('#ev');
}
function profile() {
  $('#pM').textContent = count(P.read); $('#pG').textContent = count(P.give);
  $('#pB').innerHTML = ORDER.map(function (o) { var got = !!P.seen[o.n], c = CAST[o.id], inner, label;
    if (o.kind === 'speaker') { inner = got ? '<img alt="" src="' + c.photo + '" style="object-position:' + facePos(c, 1) + '">' : o.n; label = got ? c.topic : '·'; }
    else { inner = o.n; label = o.n === 1 ? 'TEDxSofia' : o.n === 2 ? 'лекторите' : o.n === 15 ? 'даването' : 'значките'; }
    return '<button type="button" class="' + (got ? 'got' : 'no') + '" data-n="' + o.n + '" aria-label="' + o.n + (got ? ' · ' + esc(label) : ' · още не') + '"><span class="r">' + inner + '</span><span class="t">' + esc(label) + '</span></button>'; }).join('');
  show('#pr');
}

/* ── open, close, history (the phone's back closes) ── */
var openSheet = null;
function show(sel) { ['#sp', '#ev', '#pr'].forEach(function (s) { $(s).classList.toggle('on', s === sel); }); openSheet = sel; }
function openN(n, push) {
  var o = BYN[n]; if (!o) return; if (push) { try { history.pushState({ n: n }, '', '#' + n); } catch (e) {} }
  if (o.kind === 'speaker') openSpeaker(o); else openEvent(o);
}
function close(fromPop) {
  if (!openSheet) return; var n = cur && cur.n; show(null); cur = null; var v = $('#sVid'); try { v.pause(); } catch (e) {}
  if (!fromPop && history.state && history.state.n) { try { history.back(); } catch (e) {} }
  if (n && SQ[n]) SQ[n].focus({ preventScroll: true, focusVisible: false });
}
addEventListener('popstate', function (e) { if (e.state && e.state.n) openN(e.state.n, false); else close(true); });
['#sX', '#sBack', '#eX', '#eBack', '#pX', '#pBack'].forEach(function (s) { $(s).addEventListener('click', function () { close(false); }); });
$('#eN').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { show(null); openN(+b.dataset.n, false); } });
$('#pB').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && P.seen[b.dataset.n] && +b.dataset.n !== 24) { show(null); openN(+b.dataset.n, false); } });
$('#chip').addEventListener('click', function () { cur = BYN[24]; try { history.pushState({ n: 24 }, '', '#24'); } catch (e) {} earn(BYN[24]); profile(); });
$('#pReset').addEventListener('click', function () { P = { seen: {}, read: {}, give: {} }; save(); chip(); profile(); });
addEventListener('keydown', function (e) { if (e.key === 'Escape') close(false); });
['#sp', '#ev', '#pr'].forEach(function (s) { $(s).addEventListener('click', function (e) { if (e.target === $(s)) close(false); }); });

/* ── start ── */
try { AW_IDEA.init(IC); ideaReady = true; } catch (e) { ideaReady = false; IB.style.display = 'none'; }
var rz = 0; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(layout, 60); });
layout(); chip();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
var qs = new URLSearchParams(location.search);
if (qs.get('open')) openN(+qs.get('open'), false); else if (qs.get('profile')) { cur = BYN[24]; profile(); }

/* test hooks (read only, no effect on the page) */
window.__aw3 = {
  rect: function (n) { var r = SQ[n].getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; },
  open: function (n) { openN(n, false); }, close: function () { close(true); },
  state: function () { return { open: openSheet, n: cur && cur.n, id: cur && cur.id, name: openSheet === '#sp' ? $('#sName').textContent : null, ph: PH, C: C, W: W, H: H, seen: count(P.seen), read: count(P.read), give: count(P.give) }; },
  fps: function (ms) { var a = frames.length; return new Promise(function (res) { var s = performance.now(), n0 = frames.length; setTimeout(function () { var e = performance.now(); res(+((frames.length - n0) / ((e - s) / 1000)).toFixed(1)); }, ms || 3000); }); },
  form: function () { var t = (performance.now() - t0) / 1000; return { t: +t.toFixed(2), asm: +Math.max(0, Math.min(1, (t - FORM0) / FORMD)).toFixed(3), whole_at: FORM0 + FORMD }; },
  /* the outline: pixels drawn outside the photo's own mask (the ring) → their hue. One colour = one hue. */
  outline: function () { var c = $('#sPic'), r = c._cut; if (!r) return null; var o = r.c, w = o.width, h = o.height, d = o.getContext('2d').getImageData(0, 0, w, h).data,
      mk = r.mask.getContext('2d').getImageData(0, 0, r.mask.width, r.mask.height).data, mw = r.mask.width, mh = r.mask.height, pad = r.padPx, n = 0, hs = {}, hmin = 999, hmax = -1, smin = 9;
    for (var y = 0; y < h * 0.84; y++) for (var x = 0; x < w; x++) { var i = (y * w + x) * 4; if (d[i + 3] < 200) continue; var mx = x - pad, my = y - pad, ma = (mx >= 0 && my >= 0 && mx < mw && my < mh) ? mk[(my * mw + mx) * 4 + 3] : 0; if (ma > 0) continue;
      var R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255, mxv = Math.max(R, G, B), mnv = Math.min(R, G, B), hue = 0, s = mxv ? (mxv - mnv) / mxv : 0;
      if (mxv !== mnv) { if (mxv === R) hue = 60 * (((G - B) / (mxv - mnv)) % 6); else if (mxv === G) hue = 60 * ((B - R) / (mxv - mnv) + 2); else hue = 60 * ((R - G) / (mxv - mnv) + 4); } if (hue < 0) hue += 360;
      n++; var hk = Math.round(hue); hs[hk] = (hs[hk] || 0) + 1; hmin = Math.min(hmin, hue); hmax = Math.max(hmax, hue); smin = Math.min(smin, s); }
    return { ring_px: n, hue_min: +hmin.toFixed(2), hue_max: +hmax.toFixed(2), hues: hs, sat_min: +smin.toFixed(3) }; },
  pic: function () { var c = $('#sPic'), r = c.getBoundingClientRect(); return { ready: c.dataset.ready || null, line: +c.dataset.line || 0, x: r.left, y: r.top, w: r.width, h: r.height, bw: c.width, bh: c.height }; }
};
})();
