#!/usr/bin/env python3
"""nova-zhena-seam-патч.py · v0.1 · 12.09.2026 · доер Б · MET-621
Прилага шева върху страницата (доер А или МО3 го пускат — доер Б НЕ пипа nova-zhena-v2.html):
  1) заменя маркера <!-- SEAM v2: Yespo segment … --> с <script>…nova-zhena-seam.js…</script> (инлайн · за Skillplate-паст)
  2) маха shell-хендлъра на формата (console.log + .done) от втория <script>; ако вече е махнат/променен — само предупреждава
     (шевът и сам го обезсилва: capture + stopImmediatePropagation).
Употреба:  python3 nova-zhena-seam-патч.py nova-zhena-v2.html                       # на място
           python3 nova-zhena-seam-патч.py nova-zhena-v2.html изход.html --img-prefix ../   # копие (preview в nova-zhena-tests/)
"""
import re, sys, pathlib, datetime
args = [a for a in sys.argv[1:] if not a.startswith('--')]
src = pathlib.Path(args[0] if args else 'nova-zhena-v2.html'); dst = pathlib.Path(args[1]) if len(args) > 1 else src
pref = sys.argv[sys.argv.index('--img-prefix') + 1] if '--img-prefix' in sys.argv else ''
h = src.read_text(encoding='utf-8'); js = pathlib.Path(__file__).with_name('nova-zhena-seam.js').read_text(encoding='utf-8')
if 'nova-zhena-seam.js v' in h: sys.exit('вече приложен · нищо не правя')
блок = '<!-- SEAM v2 · ПРИЛОЖЕН %s · формата → n8n webhook → Yespo/HubSpot · nova-zhena-seam.js v0.1.1 инлайн -->\n<script>\n%s\n</script>' % (datetime.date.today().isoformat(), js)
h, n1 = re.subn(r'<!-- SEAM v2: Yespo segment[^>]*-->', lambda m: блок, h, count=1)
h, n2 = re.subn(r"\n  /\* form shell . SEAM v2: Yespo segment \(фаза 2\) \*/\n  \$\('#lead'\)\.addEventListener\('submit',e=>\{.*?\n  \}\);\n", "\n  /* form shell премахнат · шевът е nova-zhena-seam.js (инлайн след маркера SEAM v2) */\n", h, count=1, flags=re.S)
if pref: h = re.sub(r'(src|href)="img/', r'\1="%simg/' % pref, h); h = re.sub(r"url\((['\"]?)img/", r"url(\1%simg/" % pref, h)
if n1 != 1: sys.exit('❌ SEAM-маркерът не е намерен (n=%d) — нищо не е записано' % n1)
dst.write_text(h, encoding='utf-8')
print('патч OK → %s · маркер %d · shell-хендлър %s · %d B' % (dst, n1, 'махнат' if n2 == 1 else '⚠️ не е намерен (шевът го обезсилва сам)', len(h.encode('utf-8'))))
