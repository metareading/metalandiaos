/* ═══════════════════════════════════════════════════════════════════════════
   nova-zhena-seam.js · v0.1.1 · 12.09.2026 · SEAM v2 · формата → n8n webhook → Yespo (+HubSpot)
   ───────────────────────────────────────────────────────────────────────────
   Доер Б · MET-621 · Модел: Fable 5.1 (дума на Митрандир 12.09).
   Шевът НЕ носи ключ. Браузърът POST-ва JSON към n8n webhook (публичен URL, без ключ);
   ключът за Yespo живее в n8n. Живият поток днес = „New-Woman Form" (path /webhook/new-woman):
   Yespo POST /api/v1/contact → статична група „Нова Жена форма" · HubSpot контакт · известие
   до екипа · авто-отговор до лийда. Нов сегмент („Нова Жена · сеп 2026") = ЕДИН ред: endpoint.
   Легаси полетата (spheres · problem · want_individual_attention) носят новите стойности
   (режим · въпрос · пълна програма), така сегашният поток ги показва без промяна.
   Публично: window.НЖшев = { режим(m) · изпрати(obj) · товар(form) · конфиг · тел() · viber() }
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var К = Object.assign({
    endpoint: 'https://primary-production-110e3.up.railway.app/webhook/new-woman',
    тел: '+359886788857',
    имейл: 'start@metareading.com',
    източник: 'nova-zhena-v2 · сеп 2026',
    таймаут: 12000,
    форма: 'lead'
  }, window.НЖ_ШЕВ_КОНФИГ || {});

  var ЕТИКЕТ = { live: 'Присъствено · Банско', online: 'Онлайн · Zoom', unsure: 'Още не знам', question: 'Въпрос' };
  var ИМЕЙЛ = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function чист(t) { return String(t || '').replace(/[^\d+]/g, ''); }
  function телЧист(t) { t = чист(t); if (/^00/.test(t)) t = '+' + t.slice(2); if (/^0\d{9}$/.test(t)) t = '+359' + t.slice(1); if (/^359\d{9}$/.test(t)) t = '+' + t; return t; }
  function телЛинк(t) { return 'tel:' + чист(t || К.тел); }
  function viberЛинк(t) { return 'viber://chat?number=' + encodeURIComponent(чист(t || К.тел)); }

  function събери(f) {
    var d = {}; new FormData(f).forEach(function (v, k) { if (typeof v === 'string') d[k] = v.trim(); });
    d.full = !!f.querySelector('[name="full"]:checked');
    var h = f.querySelector('input[name="mode"][type="hidden"]'); if (h && h.value) d.mode = h.value;   /* скритият режим (fab „Задайте въпрос“) печели пред радиото */
    return d;
  }
  function провери(d, f) {
    var г = [], имаВъпрос = !!(f && f.querySelector('[name="question"]'));
    if (!d.name || d.name.length < 2) г.push(['name', 'Как да се обръщаме към Вас?']);
    if (!ИМЕЙЛ.test(d.email || '')) г.push(['email', 'Проверете имейла — на него отговаряме.']);
    if (d.phone && чист(d.phone).replace(/\D/g, '').length < 9) г.push(['phone', 'Телефонът изглежда непълен.']);
    if (d.mode === 'question' && имаВъпрос && !(d.question || '').trim()) г.push(['question', 'Напишете въпроса си — отговаряме лично.']);
    return г;
  }
  function товар(d) {
    var режим = d.mode || 'unsure', въпрос = (d.question || '').replace(/\s+/g, ' ').trim();
    return {
      /* легаси · сегашният n8n поток (известие · HubSpot n89_8_ · Yespo contact) */
      name: d.name, email: (d.email || '').toLowerCase(), phone: телЧист(d.phone),
      spheres: ЕТИКЕТ[режим] || режим,
      problem: въпрос,
      want_individual_attention: режим !== 'question' && !!d.full,
      want_resources_email_only: false,
      /* нови · за потока „Нова Жена · сеп 2026" (сегашният ги подминава без грешка) */
      mode: режим, full: !!d.full, question: въпрос,
      source: К.източник, page: location.href.split('#')[0], ts: new Date().toISOString(), consent: true
    };
  }
  function изпрати(obj) {
    var ac = ('AbortController' in window) ? new AbortController() : null;
    var т = setTimeout(function () { if (ac) ac.abort(); }, К.таймаут);
    return fetch(К.endpoint, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj), signal: ac ? ac.signal : undefined })
      .then(function (r) {
        clearTimeout(т);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text().then(function (t) { try { return JSON.parse(t); } catch (e) { return { ok: true, raw: t }; } });
      }, function (e) { clearTimeout(т); throw e; });
  }

  /* ── UI ── */
  function кутия(f) { return f.closest('.fcard') || f.parentNode; }
  function грешкаЕл(f) {
    var e = f.querySelector('.seam-err');
    if (!e) {
      e = document.createElement('div'); e.className = 'seam-err'; e.setAttribute('role', 'alert');
      e.style.cssText = 'margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(212,137,94,.6);background:rgba(212,137,94,.12);font-size:.9rem;line-height:1.45;color:inherit';
      var b = f.querySelector('button[type="submit"],.cta'); (b && b.parentNode === f) ? f.insertBefore(e, b.nextSibling) : f.appendChild(e);
    }
    return e;
  }
  function покажиГрешка(f, html) { var e = грешкаЕл(f); e.innerHTML = html; e.hidden = false; }
  function скрийГрешка(f) { var e = f.querySelector('.seam-err'); if (e) e.hidden = true; }
  function маркирай(f, г) {
    f.querySelectorAll('[name]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    г.forEach(function (x) { var i = f.querySelector('[name="' + x[0] + '"]'); if (i) i.setAttribute('aria-invalid', 'true'); });
    var п = г[0] && f.querySelector('[name="' + г[0][0] + '"]'); if (п && п.focus) п.focus();
  }
  function неСеПолучи(f) {
    покажиГрешка(f, 'Не се получи по мрежата. Обадете се на <a href="' + телЛинк() + '"><b>' + К.тел.replace(/^\+359(\d{3})(\d{3})(\d{3})$/, '+359 $1 $2 $3') + '</b></a> (и <a href="' + viberЛинк() + '">Viber</a>) или пишете на <a href="mailto:' + К.имейл + '">' + К.имейл + '</a> — отговаряме лично. Може и да опитате пак.');
  }
  function успех(f, obj) {
    var к = кутия(f); к.classList.add('done');
    try { к.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    try { sessionStorage.setItem('нж-шев', obj.ts); } catch (e) {}
    document.dispatchEvent(new CustomEvent('нж:изпратено', { detail: obj }));
  }

  /* ── режими · „Задайте въпрос" = същата форма с поле „въпрос" ── */
  function въпросПолета(f) { return [].slice.call(f.querySelectorAll('[name="question"], .q-wrap, [data-нж-само-въпрос]')); }
  function приложиРежим(f) {
    var r = f.querySelector('input[name="mode"][type="hidden"]') || f.querySelector('[name="mode"]:checked');
    var m = r ? r.value : 'unsure', q = m === 'question';
    въпросПолета(f).forEach(function (el) { if (el.matches('[data-нж-само-въпрос], .q-wrap')) el.hidden = !q; });
    var full = f.querySelector('[name="full"]'); if (full && full.closest('label')) full.closest('label').hidden = q;
    f.setAttribute('data-режим', m);
  }
  function режим(m) {
    var f = форма(); if (!f) return;
    var r = f.querySelector('input[name="mode"][value="' + m + '"]');
    var h0 = f.querySelector('input[name="mode"][type="hidden"]');
    if (r) { r.checked = true; if (h0) h0.remove(); }
    else {
      f.querySelectorAll('input[name="mode"][type="radio"]').forEach(function (x) { x.checked = false; });
      var h = h0; if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = 'mode'; f.appendChild(h); }
      h.value = m;
    }
    приложиРежим(f);
    try { (f.closest('section') || f).scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    var фокус = m === 'question' ? f.querySelector('[name="question"]') : f.querySelector('[name="name"]');
    if (фокус) setTimeout(function () { try { фокус.focus({ preventScroll: true }); } catch (e) { фокус.focus(); } }, 450);
  }

  function форма() { return document.getElementById(К.форма) || document.querySelector('form[data-нж-шев]'); }

  function върже(f) {
    if (f.__нжШев) return; f.__нжШев = true;
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();          /* shell-хендлърът на V2 (console.log + .done) не бива да върви */
      if (f.dataset.sending) return;
      var hp = f.querySelector('[name="company"]'); if (hp && hp.value) { успех(f, товар(събери(f))); return; }  /* honeypot · ботът вижда „успех" */
      var d = събери(f), г = провери(d, f);
      скрийГрешка(f); маркирай(f, г);
      if (г.length) { покажиГрешка(f, г.map(function (x) { return x[1]; }).join('<br>')); return; }
      var obj = товар(d), btn = f.querySelector('button[type="submit"]'), стар = btn && btn.innerHTML;
      f.dataset.sending = '1'; if (btn) { btn.disabled = true; btn.innerHTML = 'Изпращаме…'; }
      изпрати(obj).then(function () { успех(f, obj); }, function (err) {
        console.warn('[НЖ шев] неуспех:', err && err.message);
        неСеПолучи(f); document.dispatchEvent(new CustomEvent('нж:грешка', { detail: { error: String(err && err.message), товар: obj } }));
      }).then(function () { delete f.dataset.sending; if (btn) { btn.disabled = false; btn.innerHTML = стар; } });
    }, true);
    f.querySelectorAll('input[name="mode"]').forEach(function (r) { r.addEventListener('change', function () { var h = f.querySelector('input[name="mode"][type="hidden"]'); if (h) h.remove(); приложиРежим(f); }); });
    приложиРежим(f);
    var m = (location.search.match(/[?&]mode=(live|online|unsure|question)/) || [])[1]; if (m) режим(m);
  }
  function вържеЛинкове() {
    document.querySelectorAll('#fab a[href="#form"], #fab a.cta').forEach(function (a) { if (a.hasAttribute('data-нж-режим')) return; a.addEventListener('click', function () { var fab = a.closest('#fab'); if (fab && fab.classList.contains('q')) режим('question'); }); });  /* V2.1 · доер А: fab.q = „Задайте въпрос“ */
    document.querySelectorAll('[data-нж-режим]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); режим(el.getAttribute('data-нж-режим')); }); });
    document.querySelectorAll('a[data-нж-тел]').forEach(function (a) { a.href = телЛинк(a.getAttribute('data-нж-тел')); });
    document.querySelectorAll('a[data-нж-viber]').forEach(function (a) { a.href = viberЛинк(a.getAttribute('data-нж-viber')); });
  }
  function старт() { var f = форма(); if (f) върже(f); вържеЛинкове(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', старт); else старт();

  window.НЖшев = { конфиг: К, режим: режим, изпрати: изпрати, товар: function (f) { return товар(събери(f || форма())); }, провери: function (f) { f = f || форма(); return провери(събери(f), f); }, тел: телЛинк, viber: viberЛинк, версия: '0.1.1' };
})();
