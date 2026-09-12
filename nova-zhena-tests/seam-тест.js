/* nova-zhena-tests/seam-тест.js · v0.1 · 12.09.2026 · доер Б
   Тест на шева в конзолата на _seam-preview.html (или на страницата след патча). Три стъпки:
     await НЖтест.валидация()      → празна форма → грешки под бутона, нула заявка
     await НЖтест.грешка()         → фалшив endpoint (localhost 404) → честният error-state, бутонът се връща
     await НЖтест.успех(данни)     → РЕАЛЕН submit към живия webhook (тест-запис · после се трие!)
   Всяка стъпка връща обект с числа; нищо не се пише в страницата извън самата форма. */
window.НЖтест = (() => {
  const f = () => document.getElementById('lead');
  const err = () => { const e = f().querySelector('.seam-err'); return e && !e.hidden ? e.textContent.trim() : null; };
  const done = () => f().closest('.fcard').classList.contains('done');
  const set = (name, v) => { const i = f().querySelector('[name="' + name + '"]'); if (!i) return; if (i.type === 'checkbox') i.checked = !!v; else i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); };
  const radio = v => { const r = f().querySelector('input[name="mode"][value="' + v + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } };
  const submit = () => new Promise(res => { const h = e => { document.removeEventListener('нж:изпратено', h); document.removeEventListener('нж:грешка', h); res(e.type + (e.detail && e.detail.error ? ' · ' + e.detail.error : '')); }; document.addEventListener('нж:изпратено', h); document.addEventListener('нж:грешка', h); setTimeout(() => res('timeout'), 15000); f().requestSubmit(); });
  const попълни = d => { set('name', d.name); set('email', d.email); set('phone', d.phone || ''); radio(d.mode || 'online'); set('full', d.full !== false); if (d.question) set('question', d.question); };
  return {
    валидация: async () => { ['name', 'email', 'phone'].forEach(n => set(n, '')); f().requestSubmit(); await new Promise(r => setTimeout(r, 300)); return { грешка: err(), done: done(), заявка: 'нула (валидацията спира преди fetch)' }; },
    грешка: async d => { const стар = НЖшев.конфиг.endpoint; НЖшев.конфиг.endpoint = location.origin + '/нема-такъв-endpoint-' + Date.now(); попълни(d || { name: 'Тест Грешка', email: 'seam-error-test@example.com', phone: '+359886788857' }); const събитие = await submit(); const r = { събитие, грешка: err(), done: done(), бутон: f().querySelector('button[type=submit]').disabled ? 'блокиран' : 'върнат' }; НЖшев.конфиг.endpoint = стар; return r; },
    успех: async d => { попълни(d); const товар = НЖшев.товар(f()); const събитие = await submit(); return { endpoint: НЖшев.конфиг.endpoint, събитие, грешка: err(), done: done(), товар }; },
    режимВъпрос: () => { НЖшев.режим('question'); const т = НЖшев.товар(f()); return { mode: т.mode, spheres: т.spheres, full: т.full, want_individual_attention: т.want_individual_attention, hidden_input: !!f().querySelector('input[name=mode][type=hidden]') }; }
  };
})();
'НЖтест готов';
