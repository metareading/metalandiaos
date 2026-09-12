/* nova-zhena-tests/host-wrap-мери.js · мерене в host-обвивката (пейст в конзолата на host-wrap.html) */
(() => {
  const de = document.documentElement, vw = de.clientWidth;
  const canv = [...document.querySelectorAll('.mfig canvas[data-фигура]')].map(c => { const r = c.getBoundingClientRect(); return { вид: c.dataset.фигура, left: Math.round(r.left), width: Math.round(r.width), fullBleed: Math.abs(r.left) <= 1 && Math.abs(r.width - vw) <= 2, hidden: c.hidden }; });
  const fab = document.getElementById('fab'), fr = fab && fab.getBoundingClientRect();
  return { ready: !!window.__hostWrapReady, vw, scrollWidth: de.scrollWidth, hscroll: de.scrollWidth > vw, режим: window.__мфиг && __мфиг.режим, canv,
    fab: fr && { position: getComputedStyle(fab).position, bottomGap: Math.round(innerHeight - fr.bottom), left: Math.round(fr.left), width: Math.round(fr.width) },
    bodyBg: getComputedStyle(document.body).backgroundColor, bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 50), hostHeaderVisible: !!document.querySelector('.sp-header') && getComputedStyle(document.querySelector('.sp-header')).display !== 'none' };
})();
