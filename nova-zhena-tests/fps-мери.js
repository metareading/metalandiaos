/* nova-zhena-tests/fps-мери.js · v0.1 · 12.09.2026 · доер Б
   Пейст в конзолата на ВИДИМ браузър / телефон (Safari: Settings → Advanced → Web Inspector · или Chrome remote).
   Скролва до всяка фигура, чака сглобяването и мери FPS 2 s (критерий ≥ 45). Скрит таб → rAF мълчи → числото е 0/безсмислено. */
(async () => {
  const М = window.__мфиг;
  if (!М || М.режим !== 'webgl') return { режим: М && М.режим, бележка: 'не е webgl режим — постери' };
  const out = [];
  for (const ф of М.фигури) {
    const c = ф.сцена.querySelector ? (ф.сцена.querySelector('canvas') || ф.сцена) : ф.сцена; ф.сцена.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 900));
    const fps = await М.мери(2000);
    out.push({ вид: ф.вид, fps, ok: fps >= 45, платно: Math.round(c.getBoundingClientRect().width) + 'x' + Math.round(c.getBoundingClientRect().height) + ' (px ' + (c.width || '?') + 'x' + (c.height || '?') + ')', сглоб: +ф.сглоб.toFixed(2) });
  }
  const r = { hidden: document.hidden, dpr: devicePixelRatio, vp: innerWidth + 'x' + innerHeight, зрънца: М.брой, ua: navigator.userAgent.slice(0, 90), out };
  try { console.table(out); } catch (e) {}
  return r;
})();
