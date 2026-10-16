/* MET-1755 · TEDxSofia адвент календар · двигателят (частиците · решетката · картата) · общ за /tedx-advent/ и /tedx-advent-white/ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var grid = $('#grid'), cv = $('#fx'), over = $('#over'), card = $('#card');
  var СТЕСНЕН = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]reduced=1/.test(location.search);
  var ТЕЛЕФОН = window.matchMedia('(max-width: 759px)').matches;
  var СЛАБ = (navigator.hardwareConcurrency || 8) <= 4;
  /* темата: тъмна (/tedx-advent/) · светла (/tedx-advent-white/ · <html data-theme="light">) — в светлата „бялото“ на частиците е черно */
  var СВЕТЛА = document.documentElement.getAttribute('data-theme') === 'light';
  var БЯЛО = СВЕТЛА ? '#151313' : '#ffffff';
  var ПАЛ = СВЕТЛА ? ['#E62B1E', '#c41f13', '#151313', '#E62B1E', '#5A5A5A', '#FF5A47'] : ['#E62B1E', '#FF5A47', '#FBFBFB', '#ffffff', '#D62215', '#f3f3f3'];
  var ПОЗ = ['p-br', 'p-tl', 'p-c', 'p-tr', 'p-bl'];
  var ЦВЕТ = ['r', 'k', 'w'];

  /* (б) място за звука на TED — без звук до решение на Митрандир; тук се закача, ако дойде */
  function звук(/* 'open' | 'close' */) {}

  /* ── отворените дни: удобство за зрителя, само в неговия браузър ── */
  var видени = {};
  try { видени = JSON.parse(localStorage.getItem('tedx-advent-seen') || '{}') || {}; } catch (e) { видени = {}; }
  function запомни(n) { видени[n] = 1; try { localStorage.setItem('tedx-advent-seen', JSON.stringify(видени)); } catch (e) {} }

  /* ── решетката ── */
  var клетки = ЛЕКЦИИ.map(function (л, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'day ' + ЦВЕТ[(i + Math.floor(i / 3)) % 3] + ' ' + ПОЗ[(i * 7) % 5] + (видени[л.n] ? ' opened' : '');
    b.dataset.n = л.n;
    b.setAttribute('aria-label', 'Ден ' + л.n + ': ' + л.speaker + ' — ' + л.talk);
    b.innerHTML = '<svg aria-hidden="true"><use href="#i' + (i % 12) + '"/></svg><span class="num" aria-hidden="true">' + л.n + '</span><span class="seen"></span>';
    b.addEventListener('click', function () { отвори(i, b); });
    grid.appendChild(b);
    return b;
  });

  /* ══ ЧАСТИЦИТЕ · 2D canvas ══ */
  var ctx = cv.getContext && cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
  function размер() { W = innerWidth; H = innerHeight; if (!ctx) return; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  размер(); addEventListener('resize', function () { размер(); if (ПАУЗА && ctx) рисувай(); });

  var P = [];                 /* {x,y,vx,vy,tx,ty,m,k,c,s,a,d,fix,life} · m: 0 свободна · 1 търси · 2 сняг · 3 гасне */
  var СНЯГ = СТЕСНЕН ? 0 : (ТЕЛЕФОН ? 60 : 120);
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function цвят() { return ПАЛ[(Math.random() * ПАЛ.length) | 0]; }
  function снежинка(отгоре) {
    return { x: rnd(0, W), y: отгоре ? rnd(-40, -4) : rnd(0, H), vx: 0, vy: rnd(.25, .8), m: 2, c: Math.random() < (СВЕТЛА ? .45 : .22) ? '#E62B1E' : (СВЕТЛА ? '#8a8585' : '#ffffff'),
      s: Math.random() < .12 ? rnd(2.6, 4) : rnd(.8, 1.8), a: 0, A: rnd(.25, .75), ph: rnd(0, 6.28), fix: 1 };
  }

  /* точки по рамката на заоблен правоъгълник */
  function рамка(r, n, out, ins) {
    var w = r.width - ins * 2, h = r.height - ins * 2, per = 2 * (w + h);
    for (var k = 0; k < n; k++) {
      var d = Math.random() * per, x, y;
      if (d < w) { x = d; y = 0; } else if (d < w + h) { x = w; y = d - w; } else if (d < 2 * w + h) { x = w - (d - w - h); y = h; } else { x = 0; y = h - (d - 2 * w - h); }
      out.push([r.left + ins + x + rnd(-.8, .8), r.top + ins + y + rnd(-.8, .8)]);
    }
  }
  /* точки в глифа на номер — пробва се на скрит canvas със същия шрифт */
  var глифКеш = {};
  function глиф(текст, el) {
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), key = текст + '|' + fs;
    if (глифКеш[key]) return глифКеш[key];
    var w = Math.ceil(fs * 1.4 * текст.length), h = Math.ceil(fs * 1.2), c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d'); g.fillStyle = '#000';
    g.font = '700 ' + fs + 'px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(текст, w / 2, h / 2);
    var d = g.getImageData(0, 0, w, h).data, pts = [], st = fs > 60 ? 2 : 1;
    for (var y = 0; y < h; y += st) for (var x = 0; x < w; x += st) if (d[(y * w + x) * 4 + 3] > 120) pts.push([x - w / 2, y - h / 2]);
    return (глифКеш[key] = pts);
  }
  function вГлиф(текст, el, n, out, dx, dy) {
    var pts = глиф(текст, el), r = el.getBoundingClientRect(), cx = r.left + r.width / 2 + (dx || 0), cy = r.top + r.height / 2 + (dy || 0);
    if (!pts.length) return;
    for (var k = 0; k < n; k++) { var p = pts[(Math.random() * pts.length) | 0]; out.push([cx + p[0], cy + p[1]]); }
  }
  function вПравоъгълник(r, n, out) { for (var k = 0; k < n; k++) out.push([rnd(r.left, r.right), rnd(r.top, r.bottom)]); }

  /* форма на клетка i (в координати на страницата), отместена с (ox,oy) */
  function формаКлетка(i, n, ox, oy) {
    var b = клетки[i], r = b.getBoundingClientRect(), out = [], num = b.querySelector('.num');
    рамка(r, Math.round(n * .55), out, 2);
    вГлиф(String(ЛЕКЦИИ[i].n), num, n - out.length, out);
    for (var k = 0; k < out.length; k++) { out[k][0] += scrollX + (ox || 0); out[k][1] += scrollY + (oy || 0); }
    return out;
  }

  var таймери = [];
  /* ?pause=мс · замразява кадъра в този момент от старта (за снимка на анимацията в средата) */
  var ПАУЗА = +((location.search.match(/[?&]pause=(\d+)/) || [])[1] || 0), СЪБИТИЯ = [];
  function по(ms, fn) { if (ПАУЗА) СЪБИТИЯ.push([ms, fn]); else таймери.push(setTimeout(fn, ms)); }
  /* пауза: физиката се смята на стъпки по 16.67 ms до момента, после един кадър — снимката не зависи от скоростта на браузъра */
  function замрази() {
    for (var vt = 0; vt <= ПАУЗА; vt += 16.67) {
      СЪБИТИЯ = СЪБИТИЯ.filter(function (е) { if (е[0] <= vt) { е[1](); return false; } return true; });
      стъпка(1, vt / 1000);
    }
    рисувай(); window.__advent.фаза += ' · пауза ' + ПАУЗА + ' ms';
  }
  window.__advent = { частици: P, фаза: 'чака' };
  var тече = false, ts0 = 0;
  function пусни() { if (!тече && ctx) { тече = true; ts0 = performance.now(); requestAnimationFrame(кадър); } }
  function кадър(now) {
    var dt = Math.min(2.5, (now - ts0) / 16.67); ts0 = now;
    стъпка(dt, now / 1000);
    var живи = рисувай();
    if (живи && !document.hidden) requestAnimationFrame(кадър); else { тече = false; ctx.clearRect(0, 0, W, H); }
  }
  /* физиката · dt в кадри по 16.67 ms */
  function стъпка(dt, t) {
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      if (p.d > 0) p.d -= dt * 16.67;        /* чака реда си */
      if (p.m === 1 && p.d <= 0) {           /* търси целта · пружина */
        p.vx = (p.vx + (p.tx - p.x) * p.k * dt) * Math.pow(.84, dt);
        p.vy = (p.vy + (p.ty - p.y) * p.k * dt) * Math.pow(.84, dt);
        if (p.a < 1) p.a = Math.min(1, p.a + .06 * dt);
      } else if (p.m === 0 || p.m === 1) {   /* свободна · лек вятър */
        p.vx *= Math.pow(.97, dt); p.vy = p.vy * Math.pow(.97, dt) + .015 * dt;
        p.vx += Math.sin(t * 1.3 + p.y * .01) * .02 * dt;
        if (p.a < (p.A || 1)) p.a = Math.min(p.A || 1, p.a + .05 * dt);
      } else if (p.m === 2) {                /* сняг */
        p.vx = Math.sin(t * .8 + p.ph) * .35; if (p.a < p.A) p.a += .01 * dt;
        if (p.y > H + 8) { var n = снежинка(true); n.a = 0; P[i] = p = n; }
      } else if (p.m === 3) {                /* гасне */
        p.vx *= Math.pow(.95, dt); p.vy = p.vy * Math.pow(.95, dt) + .02 * dt; p.a -= (p.fade || .025) * dt;
        if (p.a <= 0) { P.splice(i, 1); continue; }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  function рисувай() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = СВЕТЛА ? 'source-over' : 'lighter';
    var sx = scrollX, sy = scrollY, живи = 0;
    for (var i = 0; i < P.length; i++) {
      var p = P[i], x = p.fix ? p.x : p.x - sx, y = p.fix ? p.y : p.y - sy;
      живи++;
      if (x < -20 || y < -60 || x > W + 20 || y > H + 60) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
      ctx.fillStyle = ctx.strokeStyle = p.c;
      if (p.s > 2.5) {                       /* снежинка-искра: кръстче */
        var s = p.s; ctx.lineWidth = .8; ctx.beginPath();
        ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
        ctx.moveTo(x - s * .6, y - s * .6); ctx.lineTo(x + s * .6, y + s * .6); ctx.moveTo(x + s * .6, y - s * .6); ctx.lineTo(x - s * .6, y + s * .6);
        ctx.stroke();
      } else ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    return живи;
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && P.length) пусни(); });

  function частица(x, y, fix) { return { x: x, y: y, vx: 0, vy: 0, tx: x, ty: y, m: 0, k: rnd(.035, .07), c: цвят(), s: rnd(1, 2.2), a: 0, d: 0, fix: fix ? 1 : 0 }; }
  function разтвори(списък, оставиСняг) {
    списък.forEach(function (p) {
      if (оставиСняг && Math.random() < оставиСняг) {
        if (!p.fix) { p.x -= scrollX; p.y -= scrollY; p.fix = 1; }
        p.m = 2; p.vy = rnd(.25, .7); p.A = rnd(.25, .7); p.ph = rnd(0, 6.28); p.s = Math.random() < .2 ? rnd(2.6, 3.6) : p.s;
      }
      else { p.m = 3; p.fade = rnd(.015, .04); p.vx += rnd(-.6, .6); p.vy += rnd(-.9, .2); }
    });
  }

  /* ══ ВЪВЕДЕНИЕТО · частиците сглобяват 24-те квадратчета разместени, после ги събират по ред ══ */
  var готово = false;
  function покажиКлетките(бързо) {
    if (готово) return; готово = true; window.__advent.фаза = 'решетка';
    клетки.forEach(function (b, i) { if (бързо) b.classList.add('in'); else setTimeout(function () { b.classList.add('in'); }, i * 28); });
  }
  function въведение() {
    if (СТЕСНЕН || !ctx) { клетки.forEach(function (b) { b.classList.add('in'); }); готово = true; return; }
    var наКл = ТЕЛЕФОН ? (СЛАБ ? 70 : 120) : (СЛАБ ? 110 : 180);
    /* разбъркване: клетка i първо се сглобява на мястото на клетка разб[i] */
    var разб = клетки.map(function (_, i) { return i; });
    for (var k = разб.length - 1; k > 0; k--) { var j = (Math.random() * (k + 1)) | 0, tmp = разб[k]; разб[k] = разб[j]; разб[j] = tmp; }
    var групи = [];
    клетки.forEach(function (b, i) {
      var ri = b.getBoundingClientRect(), rj = клетки[разб[i]].getBoundingClientRect();
      var крайни = формаКлетка(i, наКл), ox = rj.left - ri.left, oy = rj.top - ri.top;
      var група = крайни.map(function (pt) {
        var p = частица(rnd(0, W) + scrollX, rnd(-H * .15, H * 1.05) + scrollY, false);
        p.c = Math.random() < .5 ? БЯЛО : (Math.random() < .7 ? '#E62B1E' : '#FF5A47');
        p.s = rnd(1.3, 2.4); p.vx = rnd(-.4, .4); p.vy = rnd(-.2, .6); p.end = pt; p.mid = [pt[0] + ox, pt[1] + oy];
        P.push(p); return p;
      });
      групи.push(група);
    });
    for (var s = 0; s < СНЯГ; s++) P.push(снежинка(false));
    /* 1 · разместени (≈0.3 s) */
    window.__advent.фаза = 'частици';
    по(300, function () {
      window.__advent.фаза = 'разместени';
      групи.forEach(function (г, i) { г.forEach(function (p) { p.m = 1; p.tx = p.mid[0]; p.ty = p.mid[1]; p.d = i * 18 + rnd(0, 140); }); });
    });
    /* 2 · разместват се и се събират по ред (≈1.7 s) */
    по(1700, function () {
      window.__advent.фаза = 'събират се';
      групи.forEach(function (г, i) { г.forEach(function (p) { p.tx = p.end[0]; p.ty = p.end[1]; p.k = rnd(.03, .055); p.d = rnd(0, 220); }); });
    });
    /* 3 · квадратчетата се появяват, частиците стават сняг (≈2.9 s) */
    по(2900, function () { покажиКлетките(!!ПАУЗА); });
    по(3250, function () { групи.forEach(function (г) { разтвори(г, .05); }); });
    if (ПАУЗА) замрази(); else пусни();
  }
  /* докосване по време на въведението → направо до решетката */
  addEventListener('pointerdown', function () {
    if (!готово && !ПАУЗА) { таймери.forEach(clearTimeout); покажиКлетките(true); P.forEach(function (p) { if (p.mid && p.m !== 3) { p.m = 3; p.fade = .05; } }); }
  }, { once: true });

  /* ══ КАРТАТА НА ДЕНЯ · клетката се разпада, частиците сглобяват картата ══ */
  var отворена = -1, зает = false, последнаКл = null;
  var e = { num: $('#c-num'), kick: $('#c-kick'), talk: $('#c-talk'), sp: $('#c-speaker'), idea: $('#c-idea'), go: $('#c-go'), prev: $('#c-prev'), next: $('#c-next'), body: $('#c-body') };
  function попълни(i) {
    var л = ЛЕКЦИИ[i];
    e.num.textContent = л.n;
    e.kick.textContent = 'ден ' + л.n + ' от 24 · TED';
    e.talk.textContent = л.talk;
    e.sp.textContent = л.speaker;
    e.idea.textContent = л.idea; e.idea.hidden = !л.idea;
    e.go.href = л.url; e.go.setAttribute('aria-label', 'Гледай лекцията на ' + л.speaker + ' в TED.com (нов прозорец)');
    e.prev.textContent = i > 0 ? '‹ ден ' + ЛЕКЦИИ[i - 1].n : ''; e.prev.style.visibility = i > 0 ? '' : 'hidden';
    e.next.textContent = i < ЛЕКЦИИ.length - 1 ? 'ден ' + ЛЕКЦИИ[i + 1].n + ' ›' : ''; e.next.style.visibility = i < ЛЕКЦИИ.length - 1 ? '' : 'hidden';
    запомни(л.n); клетки[i].classList.add('opened');
  }
  function отвори(i, b) {
    if (зает || отворена >= 0) return;
    if (!готово) покажиКлетките(true);
    зает = true; отворена = i; последнаКл = b; звук('open');
    b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
    попълни(i);
    document.documentElement.classList.add('lock');
    over.classList.add('show'); over.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { over.classList.add('dim'); });
    if (СТЕСНЕН || !ctx) { card.classList.add('on'); зает = false; $('#c-x').focus(); return; }
    /* 1 · клетката се разпада */
    var rc = b.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
    var N = ТЕЛЕФОН ? (СЛАБ ? 380 : 560) : (СЛАБ ? 600 : 900);
    var от = []; вПравоъгълник(rc, N, от);
    /* 2 · целите: рамката на картата + големият номер + редовете текст */
    var rk = card.getBoundingClientRect(), цели = [];
    рамка(rk, Math.round(N * .42), цели, 1);
    вГлиф(String(ЛЕКЦИИ[i].n), e.num, Math.round(N * .28), цели);
    var редове = [e.talk, e.sp, e.go]; if (!e.idea.hidden) редове.push(e.idea);
    var ост = N - цели.length, наРед = Math.floor(ост / редове.length);
    редове.forEach(function (el) { var r = el.getBoundingClientRect(); вПравоъгълник({ left: r.left, right: r.left + Math.min(r.width, r.width * .96), top: r.top + r.height * .3, bottom: r.bottom - r.height * .3 }, наРед, цели); });
    var група = от.map(function (pt, k) {
      var p = частица(pt[0], pt[1], true), ъ = Math.atan2(pt[1] - cy, pt[0] - cx) + rnd(-.6, .6), сила = rnd(2, 7);
      p.c = Math.random() < .55 ? БЯЛО : '#E62B1E'; p.a = 1; p.vx = Math.cos(ъ) * сила; p.vy = Math.sin(ъ) * сила;
      var ц = цели[k % цели.length]; p.tx = ц[0]; p.ty = ц[1]; p.m = 1; p.d = rnd(160, 420); p.k = rnd(.05, .09);
      P.push(p); return p;
    });
    пусни();
    setTimeout(function () { card.classList.add('on'); }, 820);
    setTimeout(function () { разтвори(група, .06); зает = false; $('#c-x').focus({ preventScroll: true }); }, 1150);
  }
  function затвори() {
    if (отворена < 0 || зает) return;
    зает = true; звук('close');
    var b = последнаКл, i = отворена;
    card.classList.remove('on'); over.classList.remove('dim');
    var край = function () { over.classList.remove('show'); over.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('lock'); отворена = -1; зает = false; if (b) b.focus({ preventScroll: true }); };
    if (СТЕСНЕН || !ctx) { край(); return; }
    /* картата се разпада обратно в прозорчето */
    var rk = card.getBoundingClientRect(), N = ТЕЛЕФОН ? 320 : 600, от = [];
    рамка(rk, Math.round(N * .6), от, 1); вПравоъгълник(rk, N - от.length, от);
    setTimeout(край, 380);
    var rc = b.getBoundingClientRect(), цели = [];
    рамка(rc, Math.round(N * .6), цели, 2); вПравоъгълник(rc, N - цели.length, цели);
    var група = от.map(function (pt, k) {
      var p = частица(pt[0], pt[1], true); p.a = .9; p.c = Math.random() < .5 ? БЯЛО : '#E62B1E';
      p.vx = rnd(-2, 2); p.vy = rnd(-2, 2); p.tx = цели[k][0]; p.ty = цели[k][1]; p.m = 1; p.d = rnd(60, 220); p.k = rnd(.05, .09);
      P.push(p); return p;
    });
    пусни();
    setTimeout(function () { разтвори(група, 0); }, 900);
  }
  function смени(д) {
    var i = отворена + д; if (i < 0 || i >= ЛЕКЦИИ.length || зает) return;
    e.body.classList.add('fade');
    setTimeout(function () { отворена = i; последнаКл = клетки[i]; попълни(i); e.body.classList.remove('fade'); }, 200);
    if (ctx && !СТЕСНЕН) {           /* искри от номера */
      var r = e.num.getBoundingClientRect();
      for (var k = 0; k < (ТЕЛЕФОН ? 60 : 110); k++) { var p = частица(rnd(r.left, r.left + 90), rnd(r.top, r.bottom), true); p.a = 1; p.vx = rnd(-3, 3); p.vy = rnd(-3, 1); p.m = 3; p.fade = rnd(.02, .04); P.push(p); }
      пусни();
    }
  }
  $('#c-x').addEventListener('click', затвори);
  e.prev.addEventListener('click', function () { смени(-1); });
  e.next.addEventListener('click', function () { смени(1); });
  over.addEventListener('click', function (ev) { if (ev.target === over) затвори(); });
  addEventListener('keydown', function (ev) {
    if (отворена < 0) return;
    if (ev.key === 'Escape') затвори();
    else if (ev.key === 'ArrowLeft') смени(-1);
    else if (ev.key === 'ArrowRight') смени(1);
    else if (ev.key === 'Tab') {     /* фокусът остава в картата */
      var f = [].slice.call(card.querySelectorAll('button,a[href]')).filter(function (x) { return x.offsetParent && x.style.visibility !== 'hidden'; });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });

  /* старт · чака шрифта (за глифовете), но не повече от 1.2 s */
  var тръгна = false;
  function старт() { if (тръгна) return; тръгна = true; въведение(); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(старт); setTimeout(старт, 1200); } else старт();
})();
