#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Структурен verify-гейт (Гейт А · P3) за Меттамер Герой-кукла v14 (MET-895 Фаза 2 · WebGL ред · ADR 0099 · гейт.md §D).
stdlib · чете HTML като текст · Стартирай: python3 mettamer-chovek-tests.py → Ran N OK (нула fail).
WebGL-ред: SVG-постерът + reduced-клонът са ЖЕЛЕЗНИ · three ЛОКАЛЕН · webglcontextlost→постер · ЕДИН rAF (диригентът е в драйвера · модулът не върти свой цикъл)."""
import pathlib, re, unittest
SRC = pathlib.Path(__file__).with_name('mettamer-chovek.html')
T = SRC.read_text(encoding='utf-8')
BODY = T.split('</head>', 1)[1]
SC = re.findall(r'<script\b([^>]*)>(.*?)</script>', T, re.S)
DRV = [b for a, b in SC if 'type=' not in a][0]          # драйверът (класически)
MOD = [b for a, b in SC if 'module' in a][0]              # eidolon-модулът

class ГеройКуклаV14(unittest.TestCase):
    def test_три_скрипта_нула_външен_src(self):
        self.assertEqual(len(SC), 3)                                        # importmap · драйвер · module
        self.assertEqual(len(re.findall(r'<script[^>]*\ssrc=', T)), 0)
    def test_svg_постер_wash_skel_стрелка_hit(self):
        for i in ('mm-wash', 'mm-skel', 'mm-needle', 'mm-hit', 'mm-gl', 'mettadust', 'sfpanel', 'mmcard'):
            self.assertIn('id="%s"' % i, BODY)
    def test_three_локален_нула_cdn(self):
        self.assertIn('importmap', T); self.assertRegex(T, r'vendor/three\.module\.js'); self.assertIn('THREE', MOD)
        for c in ('cdn.', 'jsdelivr', 'unpkg', 'skypack', 'esm.sh'): self.assertNotIn(c, T)
    def test_reduced_клон_постер(self):
        self.assertRegex(MOD, r"prefers-reduced-motion"); self.assertRegex(MOD, r"reduced\|nogl"); self.assertRegex(DRV, r"prefers-reduced-motion")
    def test_тир_стъпаловиден_и_dpr(self):
        self.assertRegex(MOD, r'IS_MOBILE'); self.assertRegex(MOD, r'LOW_POWER'); self.assertIn('18000', MOD); self.assertIn('58000', MOD); self.assertIn('setPixelRatio', MOD)
        self.assertRegex(MOD, r'setDrawRange')                              # FPS-политика: тирът пада без rebuild
    def test_context_loss_handler(self):
        self.assertIn('webglcontextlost', MOD); self.assertIn('webglcontextrestored', MOD); self.assertIn('__мглСпри', MOD)
        self.assertIn('renderer.debug.onShaderError', MOD)                 # ревю v14 MED: шейдър-грешка → постер (three не хвърля)
    def test_канали_маска_под_имената(self):
        self.assertIn('id="mm-chan-mask"', DRV); self.assertIn('mask="url(#mm-chan-mask)"', DRV)   # ревю v14 MED: линията минава ЗАД имената
    def test_един_rAF_диригент(self):
        self.assertEqual(MOD.count('requestAnimationFrame'), 0)            # модулът НЕ върти свой цикъл
        self.assertGreaterEqual(DRV.count('requestAnimationFrame(кадър)'), 2)  # диригентът (старт + цикъл)
        self.assertIn('visibilitychange', DRV)                              # заспива при скрит таб
        self.assertIn('cancelAnimationFrame(rafId)', DRV)                   # ревю v14 HIGH: буди се с ЕДИН цикъл (нула двоен rAF)
    def test_eidolon_слоеве_E1_E7(self):
        for e in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'): self.assertIn(e + ' ·', MOD)
        self.assertIn('sampleProfileArc', MOD)                              # лате-профил (app.js рецепта)
    def test_холограмен_поток_и_валута(self):
        self.assertIn('232/255,199/255,126/255', MOD); self.assertIn('245/255,214/255', MOD)   # злато · светлина
        self.assertIn('uEmb', MOD)                                          # прегръдката тече по каналите
    def test_kukla_канали_по_собствени_позиции(self):
        self.assertRegex(DRV, r"if\(v==='kukla'\)\{[\s\S]{0,1200}?прегрканали\(позКарта\(възли\),function\(n\)")   # собствени позиции + спират на ръба на слота
    def test_печат_триграма_и_лица(self):
        self.assertIn('function рисуйПечат', DRV); self.assertNotIn("code+code", DRV); self.assertIn('ТРИГ[o.n]', DRV)   # дума 25.09: триграма остава
        self.assertIn("../img/nz-sferi/thumb/sf-'+nn+'.webp", DRV)
    def test_акварел_и_мастило_филтри(self):
        for f in ('id="mm-wc"', 'id="mm-ink"', 'feTurbulence', 'feDisplacementMap'): self.assertIn(f, DRV)
    def test_витрувий_фибоначи(self):
        self.assertIn('class="mm-sq"', DRV); self.assertIn('class="mm-fib"', DRV); self.assertIn('1.6180339887', DRV)
    def test_скролът_господар_и_фокус(self):
        for k in ('window.__кукла', 'заключи', 'скролИдx', "role=\"dialog\"", 'Escape'): self.assertIn(k, T)
    def test_наклон_default_и_kill_switch(self):
        self.assertIn("params.get('tilt')!=='depth'", DRV); self.assertIn("params.get('tilt')==='0'||reduce", DRV)   # дума 25.09: наклонът default · ?tilt=depth · ?tilt=0
    def test_текст_извън_праха(self):
        self.assertRegex(T, r'\.sfpanel\{[^}]*z-index:4')                  # панелът над всички слоеве
        self.assertRegex(T, r'\.mm-gl\{[^}]*z-index:1')                    # eidolon ПОД листа
if __name__ == '__main__':
    unittest.main(verbosity=1)
