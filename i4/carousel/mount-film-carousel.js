/* Филмова въртележка · свързващият скрипт (глуе) · 1:1 от inline <script type="module"> на _proto/film-carousel/index.html (MET-1276)
   MET-1456: обвит в mountFilmCarousel(el, { decor, config }) — шевът за следващите 23 контрола (спек US21 · ADR 0130) — за адаптера FilmCarousel.tsx · добавки = 2 реда (#invite · #next-step).
   Селекторите на глуето са в el; двигателят (engine.js · байт-идентичен · не се пипа) сам взима document.body · #stage · #gl и няма unmount (паспорт).
   Поток: покой → фокус → избор → режим игра (Роля · Продукция · бутон „Скрийнинг“ → уебинара) · dispatchEvent('metahero', { hero, set }) · навигация само при клик на бутона. */
import { mount } from './engine.js';

export function mountFilmCarousel(el, { decor, config }) {
const $ = s => el.querySelector(s), body = document.body, root = document.documentElement;
const join = (set, key) => set.heroes.map(h => h[key]).join(' · ');
$('#stage').setAttribute('aria-label', config.ui.stage); $('.bulbs').setAttribute('aria-label', config.ui.sets); $('#pick').setAttribute('aria-label', config.ui.heroes); $('.back').setAttribute('aria-label', config.ui.back); $('#invite').textContent = config.ui.invite; $('#title').textContent = config.ui.title; $('#title').insertAdjacentHTML('beforeend', ' <em></em>'); $('#title em').textContent = config.ui.titleEm; $('#subtitle').textContent = config.ui.subtitle;   // MET-1456: поканата в покой · заглавието върху изображението (дума 09.10)
$('.sheet-body').innerHTML = config.sets.map(s => `<article id="${s.id}" data-title="${join(s, 'name')}" data-teaser="${join(s, 'production')}" data-accent="${s.accent}" data-heroes="${s.heroes.map(h => [h.id, h.name, h.production, h.accent || s.accent].join(':')).join('|')}"></article>`).join('');
$('#pick').innerHTML = config.sets.map(s => `<div data-set="${s.id}" hidden>${s.heroes.map(h => `<button type="button" data-hero="${h.id}"><b>${h.name}</b><span>${h.production}</span></button>`).join('')}</div>`).join('');

mount({ decor });                       // двигателят не се пипа · декорът и думите идват отвън
const P = window.__proto, groups = [...el.querySelectorAll('#pick div')];
let tap = null, down = null, wasOpen = false, openedAt = 0;

function choose(set, h) {               // избран Метагерой → пълни екрана · събитието носи героя и площадката
  body.dataset.hero = h.id; $('#hero h1').innerHTML = '<em></em> '; $('#hero h1 em').textContent = `${config.ui.role}:`; $('#hero h1').append(h.name); $('#hero p').textContent = `${config.ui.production}: ${h.production}`;   // режим игра (дума 09.10): „Роля: <герой>“ · „Продукция: <продукция>“ (думите на героя само в config)
  const nxt = $('#next-step'); nxt.textContent = config.ui.next; nxt.href = config.ui.nextHref;   // бутон „Скрийнинг“ → уебинарът · навигация само при клик
  if (body.classList.contains('poster')) $('.hero-art').replaceChildren(decor.paintHero(h.id, h.accent || set.accent, getComputedStyle(root).getPropertyValue('--light').trim()));
  if (P.state().mode !== 'open') P.open(config.sets.indexOf(set));
  $('.back').focus({ preventScroll: true });
  dispatchEvent(new CustomEvent('metahero', { detail: { hero: h.id, set: set.id } }));
}
function back() {                       // връщане без close() на двигателя → няма обиколка и награда
  const st = P.state(), poster = body.classList.contains('poster');
  if (body.dataset.hero) { delete body.dataset.hero; if (!poster) P.focus(st.idx); else sync(); }
  else if (st.mode === 'open') P.focus(st.idx);
  else P.flow();
}
function sync() {
  const st = P.state(), held = st.mode === 'focus' || st.mode === 'open', set = held ? config.sets[st.idx] : null;
  if (st.mode !== 'open' && body.dataset.hero) delete body.dataset.hero;
  const hero = set && body.dataset.hero && set.heroes.find(h => h.id === body.dataset.hero);
  root.style.setProperty('--accent', hero ? hero.accent : set ? set.accent : 'var(--gold)');
  groups.forEach(g => { g.hidden = !set || g.dataset.set !== set.id; });
  if (st.mode === 'open' && !wasOpen && tap && tap.i === st.idx && performance.now() - tap.t < 500) choose(set, set.heroes[tap.side]);
  if (st.mode === 'open' && !wasOpen) openedAt = performance.now();
  wasOpen = st.mode === 'open'; tap = null;
}
new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] });
$('#pick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const set = config.sets[P.state().idx]; choose(set, set.heroes.find(h => h.id === b.dataset.hero)); });
$('.back').addEventListener('click', back); $('#veil').addEventListener('click', () => { if (performance.now() - openedAt > 500) back(); });   // тапът, който отвори, носи и click → не го броим
addEventListener('keydown', e => { if (e.key === 'Escape' && P.state().mode === 'open') { e.stopImmediatePropagation(); back(); } }, true);
/* тап върху героя в кадъра: лявата половина = първият, дясната = вторият (двигателят отваря площадката, тук се избира кой) */
addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; }, true);
addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 9 || !e.target.closest('#stage')) return;
  const st = P.state(); if (st.mode === 'focus') tap = { i: st.idx, side: e.clientX < innerWidth / 2 ? 0 : 1, t: performance.now() };
}, true);
sync();
}
