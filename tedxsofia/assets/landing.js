/* landing.js · MET-2479 · TEDxSofia 2026 event landing (his pick B · Advent + the live site's navigation).
   Facts from tedxsofia.org (read 15.11, word for word, via the prototype); speakers from wall v2 (assets/speakers.js).
   The metaidea: one Eidolon cloud (assets/ideas.js); its canvas moves between the hero stage and the open card.
   The opening: beads rush out of black space, light, the Eidolon forms, the page rises. The game (MET-2528): 60 answer cards under 20 speakers, read · answer · give on; your own card is the 25th; steps гост → търсач → дарител → цялото. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
var L = 'https://tedxsofia.org', href = function (u) { return u.charAt(0) === '/' ? L + u : u; };
var P = window.SPEAKERS || [];

/* ── facts from the live page ── */
var NAV = [['Начало', '/'], ['За TEDxSofia', '/'], ['Какво е TED / TEDx', '/kakvo-e-ted-tedx.html'], ['FAQ', '/chesto-zadavani-vaprosi.html'], ['Партньори', '/parnyori.html'], ['Видеа', '/2025/videa.html'], ['Блог', '/blog/'], ['Контакти', '/kontakti.html']];
var SOC = [
  ['Facebook', 'https://www.facebook.com/TEDxSofia/', 'M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6 1-.6z'],
  ['X', 'https://twitter.com/TEDx_SOF', 'M4 4h4.6l4 5.6L17.4 4H20l-6.3 7.2L20.6 20H16l-4.3-6-5.2 6H4l6.6-7.6z'],
  ['LinkedIn', 'https://www.linkedin.com/company/tedxsofia/', 'M5 9h3v11H5zM6.5 4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 9h3v1.6c.5-.9 1.7-1.8 3.4-1.8 3 0 3.6 2 3.6 4.6V20h-3v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20h-3z'],
  ['Instagram', 'https://www.instagram.com/tedxsofia/', 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm4 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM17 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z'],
  ['YouTube', 'https://www.youtube.com/channel/UCvqU7DjLnNyjQbzJxBQpfOw', 'M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15V9l5.2 3z'],
  ['Flickr', 'https://www.flickr.com/photos/150168317@N08/', 'M7 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM17 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z']];
var ABOUT_H = 'В духа на идеите, които си струват да бъдат споделени';
var ABOUT = [
  '<strong>TED</strong> (<strong>T</strong>echnology, <strong>E</strong>ntertainment, <strong>D</strong>esign) е медийна организация с нестопанска цел, посветена на разпространението на идеи, обикновено под формата на кратки и въздействащи лекции, обединени под мотото "идеи, които си струва да бъдат споделяни".',
  'Годишната TED конференция кани водещите световни мислители и дейци, за да говорят 18 минути. След това техните презентации са достъпни безплатно на <a href="https://www.ted.com/">TED.com</a>.',
  '<strong>TEDx</strong> е програма от местни самостоятелно организирани събития, които събират хората заедно, за да споделят преживяване в духа на TED.',
  'На нашето събитие TEDxSofia обединяваме видео лекции от TEDTalks и лектори на живо, за да запалим вдъхновена дискусия и да стимулираме създаването на условия за размяна на идеи.'];
var BLOG = [
  ['Лектор на TEDxSofia 2026 – Ирина Иванова', 'https://tedxsofia.org/blog/2026/11/11/lektor-na-tedxsofia-2026-irina-ivanova/'],
  ['Лектор на TEDxSofia 2026 – Досю Амуджев', 'https://tedxsofia.org/blog/2026/11/11/lektor-na-tedxsofia-2026-dosyu-amudzhev/'],
  ['Лектори TEDxSofia 2026 – проф. д-р Милен Богданов', 'https://tedxsofia.org/blog/2026/11/11/lektor-na-tedxsofia-2026-prof-d-r-milen-bogdanov/'],
  ['Лектори TEDxSofia 2026 – Мартин Орлинов', 'https://tedxsofia.org/blog/2026/11/04/lektor-na-tedxsofia-2026-martin-orlinov/']];
var VIDS = [['vfoYB6eL0tQ', 'Георги Проданов', 'Времето, за което никога нямаме време'], ['RHV-0fORffU', 'Стефан Касев', 'Какво има в раницата ви?'], ['RiRNYqrJHv4', 'Николета Свещарска', 'Кариерата, която заслужаваме'], ['26MH-JUVqdM', 'Христо Панчугов', 'Защо да напиша дисертацията си?'], ['BD6RnIVbjoM', 'Петър Сапунджиев', 'Защо продължаваш да се връщаш там'], ['k2Nh3QjuKDg', 'Ема Райчева', 'Как пишете осмицата'], ['QlPIOMWrsbo', 'Виктор Асенов', 'Непобедимият Виктор'], ['nEx9G_6_YKs', 'Димитър Караманчев', 'Мета: Ускеф'], ['I_iBhyhBELw', 'Юрий Генов', 'Бъдеще с дъбче'], ['tmaBoF86tNU', 'Петя Бангьозова', 'Щрак: снимка'], ['mGTc07ePMQo', 'Калина Павлова, Десислава Андонова', 'Тъмнината като вдъхновение']];
var FOOT = [['Начало', '/'], ['Партньори', '/parnyori.html'], ['Видеа', '/2025/videa.html'], ['Блог', '/blog/'], ['Контакти', '/kontakti.html'], ['Общи условия', '/obshti-uslovia.html'], ['GitHub проекти', 'https://github.com/TEDxSofia'], ['Web by TEDxSofia', 'https://github.com/TEDxSofia/TEDxSofia.org-WebSite/']];
var PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>';

$('#nav').innerHTML = NAV.map(function (n, i) { return '<a' + (i ? '' : ' class="on" aria-current="page"') + ' href="' + href(n[1]) + '">' + n[0] + '</a>'; }).join('');
$('#soc').innerHTML = SOC.map(function (s) { return '<a href="' + s[1] + '" aria-label="' + s[0] + '" title="' + s[0] + '"><svg viewBox="0 0 24 24" fill-rule="evenodd"><path d="' + s[2] + '"/></svg></a>'; }).join('');
$('#about').innerHTML = '<div><p class="h">' + ABOUT_H + '</p><p><a href="' + L + '/kakvo-e-ted-tedx.html">Научи повече →</a></p></div><div>' + ABOUT.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>';
$('#blog').innerHTML = BLOG.map(function (b) { return '<a href="' + b[1] + '"><b>' + b[0] + '</b><small>Прочети още →</small></a>'; }).join('');
$('#vids').innerHTML = VIDS.map(function (v) { return '<a href="https://youtu.be/' + v[0] + '"><i>' + PLAY + '</i><span><b>' + v[2] + '</b><small>' + v[1] + '</small></span></a>'; }).join('');
$('#foot').innerHTML = FOOT.map(function (f) { return '<a href="' + href(f[1]) + '">' + f[0] + '</a>'; }).join(' ') + '<span class="gift">TEDxSofia 2026 · <b>Смисълът да даваш</b> · 28.11.2026</span>';

/* ── countdown to 28.11.2026 (date only: no source gives the start hour) ── */
var T0 = new Date('2026-11-28T00:00:00+02:00').getTime();
function tick() { var d = Math.max(0, T0 - Date.now()), v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
  document.querySelectorAll('[data-cd]').forEach(function (c) { c.querySelectorAll('b').forEach(function (b, i) { b.textContent = String(v[i]).padStart(2, '0'); }); }); }
tick(); setInterval(tick, 1000);

/* ── the 24 windows: 20 speakers (wall v2 order) + 4 doors where the prototype had them ── */
var ICON = { t: '<path d="M5 15h38v7a4 4 0 0 0 0 8v7H5v-7a4 4 0 0 0 0-8z"/><path d="M17 15v22" stroke-dasharray="3 3"/>', a: '<circle cx="24" cy="24" r="16"/><path d="M24 22v10M24 16v.5"/>',
  b: '<path d="M9 8h24v32H9z"/><path d="M33 14h6v24a2 2 0 0 1-2 2H9M15 16h12M15 23h12M15 30h8"/>', v: '<rect x="6" y="10" width="36" height="28" rx="4"/><path d="m20 18 11 6-11 6z"/>' };
var DOORS = [{ k: 't', n: 'Билети', u: 'https://epaygo.bg/3488443569' }, { k: 'a', n: 'Какво е TEDx?', card: 'about' }, { k: 'b', n: 'Блог', u: '/blog/' }, { k: 'v', n: 'Видеа', u: '/2025/videa.html' }];
var DOOR_AT = [2, 9, 14, 21], wins = [], pi = 0, di = 0, i;
for (i = 0; i < 24; i++) wins.push(DOOR_AT.indexOf(i) >= 0 ? { door: DOORS[di++] } : { p: P[pi++] });
var SPK = []; wins.forEach(function (w, i) { if (w.p) SPK.push(i); });
var key = function (w) { return w.p ? w.p.id : 'door-' + w.door.k; };

/* ── the game (MET-2528 · T1). The board is the answer cards under each speaker (20 speakers, 60 cards, from 6 questions). One card offers 3 things, each once for points:
   read (смисъл +1, after the card stays open as long as its length asks: 1 s per 15 words, at least 3 s) · your own answer to the same question (смисъл +1, kept in this browser) · give on (даване +1; giving again is allowed, no more points).
   Your answers make your own card, the 25th beside the 24. Steps inside level 1: гост → търсач → дарител → цялото; the last one opens level 3, the hall on 28.11. No server: proof is honesty. ── */
var GKEY = 'tedxsofia26-game';
function blankG() { return { v: 2, c: {}, g: {}, r: {}, a: {}, ap: {}, gp: {} }; }   /* c, g: the records of the old game (windows collected, cards given), kept and still counted */
var G = blankG();
try { var sv = JSON.parse(localStorage.getItem(GKEY) || 'null'); if (sv && typeof sv === 'object') ['c', 'g', 'r', 'a', 'ap', 'gp'].forEach(function (k) { if (sv[k] && typeof sv[k] === 'object') G[k] = sv[k]; }); } catch (e) {}
function saveG() { try { localStorage.setItem(GKEY, JSON.stringify(G)); } catch (e) {} }
var CARDS = [], CBY = {}, READ = {}, TOTAL;
P.forEach(function (p) { p.arts.forEach(function (a, k) { var c = { id: p.id + '-' + a.q, p: p, a: a, n: k + 1, need: Math.max(3, a.t.split(/\s+/).filter(Boolean).length / 15) }; CARDS.push(c); CBY[c.id] = c; }); });
TOTAL = CARDS.length;
function count(f) { return CARDS.filter(f).length; }
function nRead() { return count(function (c) { return G.r[c.id]; }); }
function nAns() { return count(function (c) { return G.a[c.id]; }); }
function nGiv() { return count(function (c) { return G.gp[c.id]; }); }
function isDone(c) { return !!(G.r[c.id] && G.ap[c.id] && G.gp[c.id]); }
function nDone() { return count(isDone); }
function legacy(o) { return wins.filter(function (w) { return w.p && o[w.p.id]; }).length; }
function nMean() { return legacy(G.c) + nRead() + count(function (c) { return G.ap[c.id]; }); }
function nGive() { return legacy(G.g) + nGiv(); }
function badge(p) { return p.arts.length > 0 && p.arts.every(function (a) { return isDone(CBY[p.id + '-' + a.q]); }); }
function got(w) { return !!(w.p && (badge(w.p) || G.c[w.p.id])); }
function gave(w) { return !!(w.p && (G.g[w.p.id] || anyGiven(w.p))); }
function anyGiven(p) { return p.arts.some(function (a) { return G.gp[p.id + '-' + a.q]; }); }
function role() { var d = nDone(), m = nMean(), g = nGive();
  if (d >= TOTAL) return ['цялото', 'Прочете, отговори и даде всичките ' + TOTAL + ' карти. Цялото е у теб.', 'Следва ниво 3: залата на 28.11.2026. Билетите те чакат.'];
  if (g) return ['дарител', 'Даваш нататък.', 'Стани цялото: прочети, отговори и дай всичките ' + TOTAL + ' карти (' + d + ' са готови).'];
  if (m) return ['търсач', 'Събираш смисъл.', 'Стани дарител: дай една карта нататък.'];
  return ['гост', 'Още нямаш точка.', 'Стани търсач: прочети една карта докрай или напиши свой отговор.']; }
var QUEST = { 'гост': 'прочети карта · напиши отговор · дай я нататък', 'търсач': 'дай карта нататък · стани дарител', 'дарител': 'довърши картите: прочети · отговори · дай', 'цялото': 'цялото е у теб · ела на 28.11' }, ROLES = ['гост', 'търсач', 'дарител', 'цялото'], roleWas = null;
var TIX = 'https://epaygo.bg/3488443569';
function hud() { var r = role()[0]; $('#gCards').textContent = nDone(); $('#gTot').textContent = TOTAL; $('#gMean').textContent = nMean(); $('#gGive').textContent = nGive(); $('#gRole').textContent = r;
  if (r === 'цялото') $('#quest').innerHTML = '<a href="' + TIX + '">' + QUEST[r] + ' · билети</a>'; else $('#quest').textContent = QUEST[r];
  if (roleWas !== null && roleWas !== r && ROLES.indexOf(r) > ROLES.indexOf(roleWas)) { var e = $('#gRole'); if (e.animate) e.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.618)', color: '#fff' }, { transform: 'scale(1)' }], { duration: 1000, easing: 'ease-out' });
    setTimeout(function () { toast('нова стъпка: ' + r); if (r === 'цялото' && over.classList.contains('on')) profile(); }, 1700); }
  roleWas = r; ownTile(); whole(); }
/* the whole again: the 24 windows as one small wall near the end of the page */
function whole() { var e = $('#wall'); if (!e) return; e.innerHTML = wins.map(function (w, k) { var g = got(w); return '<button type="button" data-go="' + k + '" aria-label="Прозорец ' + (k + 1) + '"' + (g ? ' class="g' + (gave(w) ? ' gv' : '') + '"' + ' style="background-image:url(assets/img/t-' + w.p.id + '.jpg)"' : '') + '>' + (k + 1) + '</button>'; }).join('');
  var d = nDone(); $('#wholeSt').textContent = d >= TOTAL ? 'Събра цялото: ' + TOTAL + ' от ' + TOTAL + ' карти. Смисъл ' + nMean() + ' · даване ' + nGive() + '.' : d ? 'Готови ' + d + ' от ' + TOTAL + ' карти · смисъл ' + nMean() + ' · даване ' + nGive() : 'Още няма готова карта. Първата е на едно докосване.'; }
function plus(id, txt) { var b = $('#' + id); if (!b || !b.animate) return; var e = document.createElement('em'); e.className = 'plus'; e.textContent = txt || '+1'; b.parentNode.appendChild(e);
  e.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { transform: 'translate(-50%,-10px)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-42px)', opacity: 0 }], { duration: 1618, easing: 'ease-out' }).onfinish = function () { e.remove(); };
  b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.618)' }, { transform: 'scale(1)' }], { duration: 618, easing: 'ease-out' }); }
var toastT = 0; function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 2600); }
function sealIn(b, fresh) { if (b.querySelector('.seal')) return; var e = document.createElement('i'); e.className = 'seal' + (fresh ? ' new' : ''); e.setAttribute('aria-hidden', 'true'); (b.querySelector('.ph') || b).appendChild(e); }
function markWin(i, fresh) { var b = $('.win[data-i="' + i + '"]'), w = wins[i]; if (!b || !w.p) return; b.classList.toggle('got', got(w)); b.classList.toggle('gvn', gave(w)); if (got(w)) sealIn(b, fresh); else { var s = b.querySelector('.seal'); if (s) s.remove(); } }
/* a speaker badge comes when all of that speaker's answer cards are done */
function badgeCheck(p, was) { if (was || !badge(p)) return; var i = wins.findIndex(function (w) { return w.p === p; }); markWin(i, true); pips(); toast('значка „' + p.topic + '“ е твоя'); var g = $('#gotMark'); if (g && openI === i) { g.classList.add('on'); $('em', g).textContent = 'значка'; } }
function copy(t) { try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).catch(function () {}); return; } } catch (e) {}
  try { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } catch (e) {} }
function shareOut(text, url, done) { if (navigator.share && /^https?:$/.test(location.protocol)) navigator.share({ title: 'TEDxSofia 2026', text: text, url: url }).then(function () { done('картата тръгна нататък'); }, function () {});
  else { copy(text + ' ' + url); done('връзката е копирана: прати я на някого'); } }
var pageUrl = function () { return location.href.split('#')[0].split('?')[0]; };
var winOf = function (p) { return wins.findIndex(function (w) { return w.p === p; }); };

/* the 3 things on one answer card (read · your answer · give on); the card's own text stays word for word from the speaker's data */
function acHTML(c, k) { return '<li class="ac' + (c.a.q === 5 ? ' key' : '') + '" data-card="' + c.id + '">' + ef(c.a.q, k) + '<span class="ql">' + esc(c.a.ql) + '</span><p>' + esc(c.a.t) + '</p><div class="acx"></div><div class="share-row" data-slot="share" data-card="' + c.id + '"></div></li>'; }
function acx(el) { var id = el.dataset.card, c = CBY[id], x = $('.acx', el), t0 = $('textarea', x), draft = t0 ? t0.value : null, hadFocus = t0 && document.activeElement === t0;
  var rd = !!G.r[id], mine = G.a[id], gv = !!G.gp[id], ed = el.classList.contains('edit'), S = '<i class="seal" aria-hidden="true"></i>';
  el.style.setProperty('--p', rd ? 1 : Math.min(1, (READ[id] || 0) / c.need));
  x.innerHTML = '<div class="three">' +
    '<span class="chip rd' + (rd ? ' on' : '') + '" data-t="read">' + (rd ? S + 'прочетена' : 'прочети докрай') + '</span>' +
    '<button type="button" class="chip' + (G.ap[id] ? ' on' : '') + '" data-act="ans" aria-expanded="' + (ed ? 'true' : 'false') + '" data-t="answer">' + (G.ap[id] ? S : '') + (mine ? 'твоят отговор' : 'отговори и ти') + '</button>' +
    '<button type="button" class="chip' + (gv ? ' on' : '') + '" data-act="give" data-t="give">' + (gv ? S + 'дадена · дай я пак' : 'дай нататък') + '</button></div>' +
    (ed ? '<div class="mine"><textarea class="ta" maxlength="280" rows="3" aria-label="Твоят отговор на въпроса: ' + esc(c.a.ql) + '" placeholder="Твоят отговор на същия въпрос…"></textarea><div class="row"><button type="button" class="mini go" data-act="save">Запази</button><button type="button" class="mini" data-act="cancel">Откажи</button><small>Остава само в този браузър. Първият запис дава +1 смисъл.</small></div></div>'
     : mine ? '<div class="mine"><p class="own-q">' + esc(mine) + '</p><div class="row"><button type="button" class="mini" data-act="ans">Промени</button><button type="button" class="mini" data-act="clear">Изчисти</button></div></div>' : '');
  var ta = $('textarea', x); if (ta) { ta.value = draft !== null ? draft : (mine || ''); if (hadFocus) ta.focus({ preventScroll: true }); } }
function allAcx() { card.querySelectorAll('.ac[data-card]').forEach(acx); }
function readDone(id, el) { var c = CBY[id], was = badge(c.p); G.r[id] = 1; saveG(); hud(); plus('gMean'); toast('+1 смисъл · картата е прочетена'); if (el) acx(el); badgeCheck(c.p, was); }
function saveAns(id, el) { var c = CBY[id], ta = $('textarea', el), v = ta ? ta.value.replace(/\s+/g, ' ').trim().slice(0, 280) : ''; if (v.length < 2) { toast('Напиши поне няколко думи'); return; }
  var was = badge(c.p), first = !G.ap[id]; G.a[id] = v; G.ap[id] = 1; saveG(); el.classList.remove('edit'); hud(); if (first) plus('gMean'); toast((first ? '+1 смисъл · ' : '') + 'твоят отговор е запазен в този браузър'); acx(el); badgeCheck(c.p, was); }
function clearAns(id, el) { delete G.a[id]; saveG(); el.classList.remove('edit'); hud(); toast('отговорът е изчистен · точката остава'); acx(el); }   /* clearing keeps the point already earned (US7) */
function giveCard(id, el) { var c = CBY[id], i = winOf(c.p), url = pageUrl() + '#w' + (i + 1) + '-' + c.n, text = c.p.name + ' · ' + c.a.ql + ' „' + c.a.t + '“ · TEDxSofia 2026 · Смисълът да даваш';
  shareOut(text, url, function (msg) { var was = badge(c.p), first = !G.gp[id]; G.gp[id] = 1; saveG(); hud(); markWin(i); if (first) plus('gGive'); toast((first ? '+1 даване · ' : '') + msg); if (el) acx(el); badgeCheck(c.p, was); }); }
/* a read counts while ONE card is in focus long enough for its length: the card under the pointer or finger, else the visible card nearest the middle.
   When a card is read the clock stops; the next card starts only after the visitor does something (scroll, tap, move, key), so cards never read themselves.
   The clock also stops when the card is closed, off screen or the tab is hidden; progress is kept per card. */
var tickT = 0, PTT = 0, doneAt = 0, focusId = null;
function touched() { PTT = performance.now(); }
['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (n) { addEventListener(n, touched, { passive: true }); });
setInterval(function () { var now = performance.now(), dt = Math.min(0.6, tickT ? (now - tickT) / 1000 : 0.25); tickT = now; if (!over.classList.contains('on') || document.hidden || openI < 0) { focusId = null; return; }
  var cr = card.getBoundingClientRect(), tb = $('.top', card), top = cr.top + (tb ? tb.offsetHeight : 0), mid = (top + cr.bottom) / 2, best = null, bd = 1e9, under = null;
  var seen = function (el) { var r = el.getBoundingClientRect(), v = Math.min(r.bottom, cr.bottom) - Math.max(r.top, top); return v >= Math.min(r.height, cr.bottom - top) * 0.6; };
  var cur0 = focusId && $('.ac[data-card="' + focusId + '"]', card); if (cur0 && (G.r[focusId] || !seen(cur0))) cur0 = null;   /* the card in focus stays while it is unread and seen */
  if (now - PTT < 4000) { var u = document.elementFromPoint(PT.x, PT.y); under = u && u.closest ? u.closest('.ac[data-card]') : null; if (under && (G.r[under.dataset.card] || !seen(under))) under = null; }
  best = under || cur0;
  if (!best && !(doneAt && PTT < doneAt)) card.querySelectorAll('.ac[data-card]').forEach(function (el) { if (G.r[el.dataset.card] || !seen(el)) return; var r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = el; } });
  if (best && doneAt && PTT < doneAt && best !== cur0) best = null;   /* a new card needs a fresh touch after the last read */
  if (!best) { focusId = null; return; } var id = focusId = best.dataset.card; READ[id] = (READ[id] || 0) + dt; best.style.setProperty('--p', Math.min(1, READ[id] / CBY[id].need));
  if (READ[id] >= CBY[id].need) { doneAt = performance.now(); focusId = null; readDone(id, best); } }, 250);

/* the own card: the 25th. Your answers, your points, your badges; give it on, erase it with one button. Two slots stay empty for the next tickets: the share row (T2) and the dust (T3). */
function ownCount() { return nAns(); }
function ownTile() { var b = $('.win.own'); if (!b) return; $('#ownN', b).textContent = ownCount(); $('#ownS', b).textContent = role()[0]; b.classList.toggle('got', ownCount() > 0); }
function ownCard() { if (!over.classList.contains('on')) back = document.activeElement; var r = role(), mine = CARDS.filter(function (c) { return G.a[c.id]; }), bd = P.filter(badge);
  card.className = 'card prof ownc';
  card.innerHTML = topBar(-1, 'твоята карта · 25') + '<div class="cbody"><p class="q" id="cardH">Твоята карта</p>' +
    '<div class="dust-slot" data-slot="dust" id="ownDust" aria-hidden="true"></div>' +
    '<p class="role-h">' + r[0] + '</p><p class="role-p">' + r[1] + ' ' + r[2] + '</p>' +
    '<ol class="ladder">' + ROLES.map(function (x, k) { var at = ROLES.indexOf(r[0]); return '<li class="' + (k === at ? 'on' : k < at ? 'was' : '') + '">' + x + '</li>'; }).join('') + '<li class="lv3">ниво 3</li></ol>' +
    '<div class="stats"><div><b>' + nMean() + '</b><i>смисъл</i></div><div class="gv"><b>' + nGive() + '</b><i>даване</i></div><div><b>' + nDone() + '<small> / ' + TOTAL + '</small></b><i>карти</i></div></div>' +
    '<h3 class="oh">твоите отговори</h3>' + (mine.length ? '<ul class="own-list">' + mine.map(function (c) { return '<li><span class="ql">' + esc(c.a.ql) + '</span><p class="own-q">' + esc(G.a[c.id]) + '</p><button type="button" class="mini" data-go="' + winOf(c.p) + '" data-card="' + c.n + '">при ' + esc(c.p.name) + '</button></li>'; }).join('') + '</ul>'
      : '<p class="empty">Още няма отговор. Отвори лектор, прочети една карта и напиши своя отговор под нея: той става първият на твоята карта.</p>') +
    '<h3 class="oh">значки <small>' + bd.length + ' от ' + P.length + '</small></h3><div class="badges">' + wins.map(function (w, k) { if (!w.p) return ''; var g = got(w); return '<button type="button" data-go="' + k + '"' + (g ? ' class="g' + (gave(w) ? ' gv' : '') + '"' : '') + '>' + (g ? esc(w.p.topic) : k + 1) + '</button>'; }).join('') + '</div>' +
    '<div class="share-row" data-slot="share" data-card="own"></div>' +
    (r[0] === 'цялото' ? '<div class="next"><p>Цялото е у теб.<small>28.11.2026 · Дом на киното · София</small></p><a class="btn p" href="' + TIX + '">Билети</a></div>' : '') +
    '<div class="own-act"><button type="button" class="btn gv" data-act="own-give"' + (mine.length ? '' : ' disabled') + '>' + HEART + '<span>Дай картата си нататък</span></button><button class="reset" type="button" data-act="erase" id="eraseBtn">изтрий картата и точките</button></div></div>';
  slot = null; cur = null; killForms(); openI = -1; over.classList.add('on'); document.documentElement.style.overflow = 'hidden'; card.scrollTop = 0; wire(); history.replaceState(null, '', '#own');
  card.dispatchEvent(new CustomEvent('landing:card', { detail: { kind: 'own' } })); }
function ownGive() { var mine = CARDS.filter(function (c) { return G.a[c.id]; }); if (!mine.length) return; var url = pageUrl() + '#own', text = 'Моята карта · TEDxSofia 2026 · Смисълът да даваш' + mine.slice(0, 3).map(function (c) { return ' · ' + c.a.ql + ' „' + G.a[c.id] + '“'; }).join('');
  shareOut(text, url, function (msg) { toast(msg); }); }   /* giving the own card gives no points: the points live on the answer cards */
var eraseT = 0;
function erase(btn) { if (!btn.classList.contains('arm')) { btn.classList.add('arm'); btn.textContent = 'натисни пак: изтривам картата и точките'; clearTimeout(eraseT); eraseT = setTimeout(function () { btn.classList.remove('arm'); btn.textContent = 'изтрий картата и точките'; }, 5000); return; }
  clearTimeout(eraseT); G = blankG(); READ = {}; roleWas = null; saveG(); renderGrid(); hud(); if ($('.ownc', over)) ownCard(); else allAcx(); toast('картата и точките са изтрити'); }

function renderGrid() { $('#grid').innerHTML = wins.map(function (w, i) {
  var gs = (got(w) ? ' got' : '') + (gave(w) ? ' gvn' : '');
  if (w.door) { var inner = '<span class="n">' + (i + 1) + '</span><span class="ic"><svg viewBox="0 0 48 48">' + ICON[w.door.k] + '</svg><span class="dl">' + w.door.n + '</span></span>', cls = 'win door' + (w.door.k === 't' ? ' tix' : '');
    return w.door.u ? '<a class="' + cls + '" style="--i:' + i + '" data-i="' + i + '" href="' + href(w.door.u) + '">' + inner + '</a>' : '<button class="' + cls + '" style="--i:' + i + '" type="button" data-i="' + i + '">' + inner + '</button>'; }
  var p = w.p; if (!p) return '';
  return '<button class="win' + gs + '" style="--i:' + i + '" type="button" data-i="' + i + '" aria-label="Прозорец ' + (i + 1) + ': ' + esc(p.name) + '"><span class="ph"><img src="assets/img/t-' + p.id + '.jpg" alt="" decoding="async">' + (got(w) ? '<i class="seal" aria-hidden="true"></i>' : '') + '</span><span class="n">' + (i + 1) + '</span><span class="nm">' + esc(p.name) + '<small>' + esc(p.topic) + '</small></span></button>';
}).join('') + '<button class="win own" style="--i:24" type="button" data-own="1" aria-label="Прозорец 25: твоята карта"><span class="ph"><span class="ow"><b id="ownN">0</b><small>отговора</small></span></span><span class="n">25</span><span class="nm">Твоята карта<small id="ownS">гост</small></span></button>'; }
renderGrid();
hud();

/* ── the metaidea: one canvas, one cloud; it lives on the hero stage or in the open card ── */
var IDEA = window.AW_IDEA, cv = null, ok = false, slot = null, cur = null, last = 0, heroOn = true, heroK = 0, PXS = Math.min(window.devicePixelRatio || 1, 2), asmNow = 0;
var last2 = 0, FORM = 2.6, FADE = 1.0, HOLD = (FORM + FADE) / 0.382;   /* seconds: dust → the whole image · the whole image → dust · one hero form (the image stands whole for 61.8 % of it) */
try { if (IDEA && window.THREE) { cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); IDEA.init(cv); ok = true; } } catch (e) { ok = false; }
function place(s) { if (!ok || !s) return; if (cv.parentNode !== s) s.appendChild(cv); slot = s; fit(); }
function fit() { if (!slot) return; var r = slot.getBoundingClientRect(), w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height)); if (w !== fit.w || h !== fit.h) { fit.w = w; fit.h = h; IDEA.resize(w, h, PXS); } }
function show(id, hold, card, delay) { cur = { id: id, t0: performance.now() / 1000 + (delay || 0), hold: hold, card: card }; asmNow = 0; }
var ease = function (x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
function loop(now) {
  requestAnimationFrame(loop); if (!ok || document.hidden) return;
  var tt = now / 1000, ddt = Math.min(0.05, last2 ? tt - last2 : 0.016); last2 = tt; if (CF.length) formFrames(performance.now() / 1000, ddt);
  if (!slot || !cur) return;
  var t = now / 1000, dt = Math.min(0.05, last ? t - last : 0.016); last = t; fit();
  var w = fit.w, h = fit.h, age = Math.max(0, t - cur.t0), asm = ease(age / FORM), pres = ease(age / 0.5);
  if (cur.hold) { var left = cur.hold - age; if (left < FADE) asm = Math.min(asm, ease(left / FADE)); if (left <= 0) { nextHero(); return; } }
  asmNow = asm;
  if (cur.card !== undefined && asm >= 0.999 && !cur.done) { cur.done = true; pips(); }
  var r = Math.min(w, h) * 0.42, cx = w / 2, cy = h * 0.5;
  IDEA.frame({ id: cur.id, cx: cx, cy: cy, r: r, dcx: cx, dcy: cy, dw: w * 0.36, dh: h * 0.36, hr: 0, asm: asm, pres: pres, thr: 0, tx: cx, ty: cy, A: age, T: age }, dt);
}
requestAnimationFrame(loop);

/* the hero stage: the forms of all 20 speakers, one after another; a tap opens that speaker */
var hero = $('#heroIdea'), over = $('#over'), card = $('#card');
function heroSpeaker() { return wins[SPK[heroK % SPK.length]].p; }
function nextHero(step, delay) { heroK = (heroK + (step === 0 ? 0 : 1)) % SPK.length; var p = heroSpeaker(); $('#heroCap').innerHTML = '<b>' + esc(p.topic) + '</b>прозорец ' + (SPK[heroK] + 1); show(p.id, HOLD, undefined, delay); }
function heroCheck() { var want = ok && heroOn && !over.classList.contains('on'); if (want && slot !== $('#heroSlot')) { place($('#heroSlot')); nextHero(0, heroCheck.first ? 0 : INTRO ? 0.5 : 0); heroCheck.first = 1; } else if (!want && slot === $('#heroSlot')) { slot = null; cur = null; } }
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; heroCheck(); }, { threshold: 0.1 }).observe(hero);
hero.addEventListener('click', function () { openW(SPK[heroK % SPK.length]); });

/* ── the answer cards under the name: each one forms its own Eidolon from dust when it comes into view (own canvas, fewer grains; made when the card opens, freed when it closes) ── */
var QFORM = { 2: 'tree', 3: 'door', 4: 'bridge', 5: 'gift', 7: 'wand' }, QALT = ['ripples', 'wings', 'galaxy'], CFORM = 2.2, CF = [], cfIO = null, PT = { x: 0, y: 0 };
addEventListener('pointermove', function (e) { PT.x = e.clientX; PT.y = e.clientY; }, { passive: true });
function ef(q, k) { return ok ? '<span class="ef" data-f="' + (QFORM[q] || QALT[k % QALT.length]) + '"><span class="efl"></span></span>' : ''; }
function killForms() { if (cfIO) { cfIO.disconnect(); cfIO = null; } CF.forEach(function (f) { f.L.dispose(); f.cv.remove(); }); CF = []; }
function cardForms() { killForms(); if (!ok || !IDEA.make || !('IntersectionObserver' in window)) return; var map = new Map();
  cfIO = new IntersectionObserver(function (es) { es.forEach(function (e) { var f = map.get(e.target); if (!f) return; if (e.isIntersecting && !f.on) f.t0 = performance.now() / 1000 + f.delay; f.on = e.isIntersecting; }); }, { root: card, threshold: 0.35 });
  card.querySelectorAll('.ef').forEach(function (el, k) { try { var cv = document.createElement('canvas'), L = IDEA.make(); cv.setAttribute('aria-hidden', 'true'); L.init(cv); el.appendChild(cv);
    var f = { el: el, cv: cv, L: L, form: el.dataset.f, on: false, t0: 0, delay: 0.15 * k, w: 0, h: 0 }; map.set(el, f); CF.push(f); cfIO.observe(el); } catch (e) {} }); }
function formFrames(t, dt) { CF.forEach(function (f) { if (!f.on) return; var r = f.el.getBoundingClientRect(), w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
  if (w !== f.w || h !== f.h) { f.w = w; f.h = h; f.L.resize(w, h, Math.min(PXS, 1.5)); }
  var age = Math.max(0, t - f.t0), asm = ease(age / CFORM), pres = ease(age / 0.4), R = Math.min(w * 0.4, h * 0.42), cx = w / 2, cy = h / 2;
  f.L.frame({ id: f.form, cx: cx, cy: cy, r: R, dcx: cx, dcy: cy, dw: w * 0.4, dh: h * 0.36, hr: 0, asm: asm, pres: pres, thr: 0, tx: cx, ty: cy, A: age, T: age, px: PT.x - r.left, py: PT.y - r.top }, dt); }); }

/* ── the card (the part): the question, the metaidea above, the person, the words below, never on the image; the 24 pips keep the whole in sight ── */
var back = null, openI = -1, HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>';
function pipsHTML(i) { return '<div class="pips" id="pips" aria-label="прозорец ' + (i + 1) + ' от 24">' + wins.map(function (w, k) { return '<i class="' + (w.door ? 'd ' : '') + (k === i ? 'c' : got(w) ? 'g' : '') + '"></i>'; }).join('') + '</div>'; }
function pips() { var e = $('#pips'); if (e && openI >= 0) e.outerHTML = pipsHTML(openI); }
function topBar(i, label) { return '<div class="top">' + (i >= 0 ? pipsHTML(i) : '<p>' + label + '</p>') + '<button class="x" type="button" aria-label="Затвори">×</button></div>'; }
function openW(i, noHash, k) {
  var w = wins[i]; if (!w) return; if (!over.classList.contains('on')) back = document.activeElement;
  if (w.door) { if (w.door.card !== 'about') { location.href = href(w.door.u); return; }
    card.className = 'card about-card';
    card.innerHTML = topBar(i) + '<div class="cbody"><h2 id="cardH" class="q" style="justify-content:flex-start">какво е TEDx?</h2><p style="font-family:var(--serif);font-style:italic;font-size:var(--f4);line-height:1.25">' + ABOUT_H + '</p>' + ABOUT.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '<p><a class="btn s" href="' + L + '/kakvo-e-ted-tedx.html">Научи повече</a></p></div>';
    slot = null; cur = null; killForms();
  } else {
    var p = w.p, pos = SPK.indexOf(i), pv = SPK[(pos + SPK.length - 1) % SPK.length], nx = SPK[(pos + 1) % SPK.length], cs = CARDS.filter(function (c) { return c.p === p; }).sort(function (a, b) { return (b.a.q === 5) - (a.a.q === 5); }), has = badge(p);
    card.className = 'card';
    card.innerHTML = topBar(i) +
      '<div class="cbody"><p class="q">' + esc(p.ql) + '</p>' +
      (ok ? '<figure class="idea"><div class="slot" id="cardSlot"></div><figcaption>идея · <b>' + esc(p.topic) + '</b><span class="got' + (has ? ' on' : '') + '" id="gotMark"><i class="seal"></i><em>' + (has ? 'значка' : '') + '</em></span></figcaption></figure>' : '') +
      '<figure class="photo"><img src="assets/img/' + p.id + '.jpg" alt="' + esc(p.name) + '">' + (p.credit ? '<figcaption>снимка: ' + esc(p.credit) + '</figcaption>' : '') + '</figure>' +
      '<p class="say">' + esc(p.shown) + '</p>' +
      '<div class="who"><h2 id="cardH">' + esc(p.name) + '</h2><span class="badge">карта ' + (i + 1) + ' · ' + esc(p.topic) + '</span><div class="share-row" data-slot="share" data-card="' + p.id + '"></div></div>' +
      '<ul class="more">' + cs.map(function (c, n) { return acHTML(c, n); }).join('') + '</ul>' +
      '<div class="pn"><button type="button" data-go="' + pv + '">← ' + esc(wins[pv].p.name) + '</button><button type="button" data-go="' + nx + '">' + esc(wins[nx].p.name) + ' →</button></div></div>';
    allAcx();
    if (ok) { place($('#cardSlot')); show(p.id, 0, i, 0.25); cardForms(); }
    if (k && p.arts[k - 1]) { var t = $('.ac[data-card="' + p.id + '-' + p.arts[k - 1].q + '"]', card); if (t) setTimeout(function () { t.scrollIntoView({ block: 'center' }); }, 60); }
  }
  openI = i; doneAt = 0; focusId = null; over.classList.add('on'); document.documentElement.style.overflow = 'hidden'; if (!k) card.scrollTop = 0; wire();
  if (!noHash) history.replaceState(null, '', '#w' + (i + 1));
  if (w.p) card.dispatchEvent(new CustomEvent('landing:card', { detail: { kind: 'speaker', index: i, id: w.p.id } }));
}
function wire() { $('.x', card).onclick = closeW; card.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { openW(+b.dataset.go, false, b.dataset.card && +b.dataset.card); }; }); $('.x', card).focus({ preventScroll: true }); }
card.addEventListener('scroll', touched, { passive: true });   /* a scroll in the card counts as the visitor's touch for the read clock */
/* the actions inside the open card: one listener for the answer cards, the own card and the profile */
card.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b) return; var act = b.dataset.act, el = b.closest('.ac');
  if (act === 'ans') { el.classList.toggle('edit'); acx(el); var t = $('textarea', el); if (t) t.focus(); }
  else if (act === 'cancel') { el.classList.remove('edit'); acx(el); }
  else if (act === 'save') saveAns(el.dataset.card, el);
  else if (act === 'clear') clearAns(el.dataset.card, el);
  else if (act === 'give') giveCard(el.dataset.card, el);
  else if (act === 'own-give') ownGive();
  else if (act === 'erase') erase(b);
  else if (act === 'own') ownCard(); });
/* the profile: where you stand on the steps of level 1, the rules, the speaker badges, the next level */
function profile() { if (!over.classList.contains('on')) back = document.activeElement; var r = role();
  card.className = 'card prof';
  card.innerHTML = topBar(-1, 'твоят профил') + '<div class="cbody"><p class="q" id="cardH">Кой си ти?</p><ol class="ladder">' + ROLES.map(function (x, k) { var at = ROLES.indexOf(r[0]); return '<li class="' + (k === at ? 'on' : k < at ? 'was' : '') + '">' + x + '</li>'; }).join('') + '<li class="lv3">ниво 3</li></ol><p class="role-h">' + r[0] + '</p><p class="role-p">' + r[1] + ' ' + r[2] + '</p>' +
    '<div class="stats"><div><b>' + nMean() + '</b><i>смисъл</i></div><div class="gv"><b>' + nGive() + '</b><i>даване</i></div><div><b>' + nDone() + '<small> / ' + TOTAL + '</small></b><i>карти</i></div></div>' +
    '<ul class="rules"><li><b>смисъл +1</b> · когато прочетеш картата докрай (колкото я държиш отворена, според дължината ѝ).</li><li><b>смисъл +1</b> · когато напишеш свой отговор под нея (остава само в този браузър).</li><li><b>даване +1</b> · когато дадеш картата нататък (веднъж за карта).</li><li><b>значка</b> · когато всички карти на един лектор са готови: прочетени, отговорени и дадени.</li></ul>' +
    '<div class="badges">' + wins.map(function (w, k) { if (!w.p) return ''; var g = got(w); return '<button type="button" data-go="' + k + '"' + (g ? ' class="g' + (gave(w) ? ' gv' : '') + '"' : '') + '>' + (g ? esc(w.p.topic) : k + 1) + '</button>'; }).join('') + '</div>' +
    '<div class="next"><p>' + (r[0] === 'цялото' ? 'Цялото е у теб: ела в залата.' : 'Следващото ниво е залата.') + '<small>28.11.2026 · Дом на киното · София</small></p><a class="btn p" href="' + TIX + '">Билети</a></div>' +
    '<div class="own-act"><button type="button" class="btn s" data-act="own">Твоята карта · 25</button><button class="reset" type="button" data-act="erase" id="resetG">започни играта отначало</button></div></div>';
  slot = null; cur = null; killForms(); openI = -1; over.classList.add('on'); document.documentElement.style.overflow = 'hidden'; card.scrollTop = 0; wire();
}
$('#dock').addEventListener('click', profile);
$('#wall').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) openW(+b.dataset.go); });
function closeW() { if (!over.classList.contains('on')) return; over.classList.remove('on'); document.documentElement.style.overflow = ''; openI = -1; slot = null; cur = null; killForms();
  history.replaceState(null, '', location.pathname + location.search); heroCheck(); if (back && back.focus) back.focus({ preventScroll: true }); }
$('#grid').addEventListener('click', function (e) { var b = e.target.closest('.win'); if (!b) return; if (b.dataset.own) { ownCard(); return; } if (b.tagName === 'A') return; openW(+b.dataset.i); });
over.addEventListener('click', function (e) { if (e.target === over) closeW(); });
addEventListener('keydown', function (e) { if (!over.classList.contains('on')) return; var typing = /^(TEXTAREA|INPUT)$/.test(e.target.tagName);
  if (e.key === 'Escape') closeW();
  else if (!typing && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && wins[openI] && wins[openI].p) { var pos = SPK.indexOf(openI); openW(SPK[(pos + (e.key === 'ArrowRight' ? 1 : SPK.length - 1)) % SPK.length]); }
  else if (e.key === 'Tab') { var f = card.querySelectorAll('button:not([disabled]),a[href],textarea'); if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } });
function fromHash() { if (location.hash === '#own') { ownCard(); return; } var m = /^#w(\d+)(?:-(\d+))?$/.exec(location.hash); if (m && wins[+m[1] - 1]) openW(+m[1] - 1, true, m[2] && +m[2]); }
addEventListener('hashchange', fromHash);

/* ── the video (the 3-minute intro): plays in the page ── */
var fv = $('#filmV'), fb = $('#filmBox');
$('#filmPlay').addEventListener('click', function () { var r = fv.play(); if (r && r.catch) r.catch(function () {}); });
fv.addEventListener('play', function () { fb.classList.add('playing'); });
fv.addEventListener('loadedmetadata', function () { var d = Math.round(fv.duration); if (d > 0) $('#filmLen').textContent = Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0'); });
fv.addEventListener('error', function () { $('#filmMeta').insertAdjacentHTML('beforeend', '<span>видеото не е до тази папка: assets/advent-film.mp4</span>'); });

/* ── the opening and the space: beads rush out of black space from the stage, slow down, then float in depth for the rest of the visit ── */
var INTRO = document.body.classList.contains('pre'), wasIntro = INTRO, introT0 = performance.now(), RUSH = 1.618;   /* seconds of rush */
function introEnd() { if (!INTRO) return; INTRO = false; document.body.classList.remove('pre', 'in'); }
if (INTRO) { (function () { var r = $('#heroIdea').getBoundingClientRect(), b = $('#bloom'); b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px'; })(); document.body.classList.add('in'); document.body.classList.remove('pre'); setTimeout(introEnd, 5200);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { addEventListener(ev, introEnd, { once: true, passive: true }); }); }
(function (cvs) { var c = cvs.getContext('2d'), R = Math.min(window.devicePixelRatio || 1, 2), W, H, F, ps = [], vx, vy, still = matchMedia('(prefers-reduced-motion:reduce)').matches, lastT = 0;
  function sprite(rgb, hi) { var s = document.createElement('canvas'); s.width = s.height = 64; var g = s.getContext('2d'), gr = g.createRadialGradient(25, 23, 1, 32, 32, 30); gr.addColorStop(0, hi); gr.addColorStop(.3, 'rgba(' + rgb + ',.95)'); gr.addColorStop(.72, 'rgba(' + rgb + ',.5)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 30, 0, 6.283); g.fill(); return s; }
  var SR = sprite('230,43,30', 'rgba(255,205,195,1)'), SW = sprite('236,232,226', 'rgba(255,255,255,1)');
  function seed(q, far) { var a = Math.random() * 6.283, d = .08 + Math.random() * .92; q.x = Math.cos(a) * d; q.y = Math.sin(a) * d; q.z = far ? .9 + Math.random() * .1 : .14 + Math.random() * .86; q.s = .4 + Math.random(); q.red = Math.random() < .382; q.px = null; }
  function stage() { var r = hero.getBoundingClientRect(); return [(r.left + r.width / 2) * R, (r.top + r.height / 2) * R]; }
  function size() { W = cvs.width = Math.max(2, innerWidth * R); H = cvs.height = Math.max(2, innerHeight * R); F = Math.max(W, H) * .5; var n = innerWidth < 700 ? 70 : 150, m = INTRO ? Math.round(n * 2.618) : n; ps = []; for (var k = 0; k < m; k++) { var q = {}; seed(q, false); q.x2 = k >= n; if (INTRO) q.z = .35 + Math.random() * .65; ps.push(q); } var s = stage(); vx = s[0]; vy = s[1]; }
  function f(now) { if (!still) requestAnimationFrame(f); if (document.hidden) return; var dt = Math.min(.05, lastT ? (now - lastT) / 1000 : .016); lastT = now;
    var t = (now - introT0) / 1000, k = INTRO && t < RUSH ? Math.pow(1 - t / RUSH, 2) : 0, sp = .008 + 1.1 * k, calm = wasIntro ? Math.min(1, Math.max(0, (t - RUSH * .618) / RUSH)) : 1;
    var tx = W / 2, ty = H * .382; if (INTRO && t < RUSH + .6) { var s = stage(); tx = s[0]; ty = s[1]; } vx += (tx - vx) * Math.min(1, dt * 1.2); vy += (ty - vy) * Math.min(1, dt * 1.2);
    c.clearRect(0, 0, W, H);
    for (var j = 0; j < ps.length; j++) { var q = ps[j]; if (q.dead) continue; q.z -= sp * dt * (.6 + q.s * .5);
      var x = vx + q.x * F / q.z * .34, y = vy + q.y * F / q.z * .34; if (q.z < .1 || x < -40 || x > W + 40 || y < -40 || y > H + 40) { if (q.x2 && k < .3) q.dead = true; else seed(q, true); continue; }
      if (q.x2 && calm > 0) { q.f = (q.f === undefined ? 1 : q.f) - dt / 1.618; if (q.f <= 0) { q.dead = true; continue; } }
      var near = 1 - q.z, big = 1 - .5 * calm, rad = R * (.7 + (q.s * 3.6 * near * near + 1.4 * near) * big), al = Math.min(1, (1 - q.z) * 5) * Math.min(1, (q.z - .1) * 9) * (.95 - .57 * calm) * (q.f === undefined ? 1 : q.f);
      if (k > .02 && q.px !== null) { c.strokeStyle = q.red ? 'rgba(230,43,30,' + (al * .7) + ')' : 'rgba(236,232,226,' + (al * .55) + ')'; c.lineWidth = rad * 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(q.px, q.py); c.lineTo(x, y); c.stroke(); }
      c.globalAlpha = al; c.drawImage(q.red ? SR : SW, x - rad * 1.6, y - rad * 1.6, rad * 3.2, rad * 3.2); c.globalAlpha = 1; q.px = x; q.py = y; } }
  addEventListener('resize', size); size(); requestAnimationFrame(f);
})($('#fx'));

heroCheck(); fromHash();
window.__landing = { open: openW, close: closeW, profile: profile, own: ownCard, erase: function () { var b = $('#eraseBtn'); if (!b) { ownCard(); b = $('#eraseBtn'); } erase(b); erase(b); }, wins: wins.length, speakers: SPK.length, cards: TOTAL, idea: ok, form: FORM,
  state: function () { return { asm: asmNow, id: cur && cur.id, card: cur && cur.card, intro: INTRO }; },
  game: function () { return { read: nRead(), answer: nAns(), give: nGiv(), mean: nMean(), giving: nGive(), step: role()[0], own: nAns() > 0 }; },
  markGiven: function (id) { if (CBY[id] && !G.gp[id]) { var was = badge(CBY[id].p); G.gp[id] = 1; saveG(); hud(); markWin(winOf(CBY[id].p)); badgeCheck(CBY[id].p, was); } } };   /* for the share code of T2: a give through Facebook or Instagram counts like any give */
})();
