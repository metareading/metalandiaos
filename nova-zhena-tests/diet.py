#!/usr/bin/env python3
"""nova-zhena-tests/diet.py · v0.1 · 12.09.2026 · доер Б · мери диетата на образите (НЕ пише в img/ · само числа).
Пуск: python3 nova-zhena-tests/diet.py   (от корена на metalandiaos · иска cwebp + Pillow)"""
import re, os, subprocess, tempfile
from PIL import Image
html = open('nova-zhena-v2.html', encoding='utf-8').read()
paths = sorted(set(re.findall(r'img/nz2?/[a-z0-9_-]+\.webp', html)))
T = tempfile.mkdtemp()
def enc(png, q): out = os.path.join(T, 'o.webp'); subprocess.run(['cwebp', '-quiet', '-q', str(q), png, '-o', out], check=True); return os.path.getsize(out)
def variant(im, w, h, maxside, q):
    s = min(1.0, maxside / max(w, h)); im2 = im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im
    png = os.path.join(T, 'v.png'); im2.save(png); return enc(png, q)
tot = {'сега': 0, 'q72': 0, '≤1000/1400·q72': 0, '≤900/1280·q68': 0}
for p in paths:
    im = Image.open(p).convert('RGB'); w, h = im.size; now = os.path.getsize(p)
    a = variant(im, w, h, 99999, 72); b = variant(im, w, h, 1000 if w < h else 1400, 72); c = variant(im, w, h, 900 if w < h else 1280, 68)
    tot['сега'] += now; tot['q72'] += a; tot['≤1000/1400·q72'] += b; tot['≤900/1280·q68'] += c
    print('%-30s %4dx%-4d %8d → q72 %8d · ≤1000 q72 %8d · ≤900 q68 %8d' % (p, w, h, now, a, b, c))
hb = os.path.getsize('nova-zhena-v2.html')
for k, v in tot.items(): print('%-16s образи=%9d B · inline-оценка=%9d B (%.2f MB)' % (k, v, hb + int(v * 1.37), (hb + int(v * 1.37)) / 1e6))
print('цел ≤ 1 500 000 B inline · html сам = %d B (вариант „образи външно · maitapp.com/img“)' % hb)
