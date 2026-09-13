#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
nova-zhena-v4-tests.py · структурният ШЕВ на V4 „Нова Жена по 8-те стъпки на метаезика"
MET-633 (PRD v1.0 · § Testing Decisions) · роден в Т0 = MET-659 · 13.09.2026 · Fable 5.1 (дума на Митрандир 13.09 03:4x)

Чете ДВАТА HTML файла като текст (nova-zhena-v2.html + new-woman/index.html) и проверява договора на V4.
Тестовете за още непостроеното са ЧЕРВЕНИ ПО ДИЗАЙН — всеки тикет Т1–Т8 прави своите зелени:
  Т1 → ред 1→8 · форма между 4 и 6 · kicker-имена · един голям образ за белезите
  Т2 → рецепта heart · data-фигура="heart"        Т3 → стълбата (#stairs)
  Т4 → вариантите ВЪТРЕ във формата · нула data-нж-вариант извън нея · „Пълната програма" не е заглавие
  Т5 → ритрийт-рейлът (#zalog .rail)              Т6 → дуелът (#duel) · средната линия (#midline) · dial2
  Т7 → обръщащата се карта в Еликсира (#elixir .mo)  Т8 → речникът (0 забранени думи)
  Т9 → всичко зелено + Browser pane (390/1280 · console 0 · FPS · reduced) — това тестът не мери.
Зелени от Т0: шевът (1-ви <script>) байт-идентичен с базата 167dd08 · деплой-копието = източник · хедър v4.0 · 0 „оферта" · 0 цени · нула външен <script src>.

Пускане:  cd /Users/user/metalandiaos && python3 nova-zhena-v4-tests.py -v
Без зависимости (stdlib) · prior art: metabrain/evals/**/kb-zayavka-tests.py · test_funiya.py
"""
import pathlib
import re
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'nova-zhena-v2.html'
DEPLOY = ROOT / 'new-woman' / 'index.html'
БАЗА = '167dd08'   # V2.4 · последният комит преди V4 (шевът е замразен оттам)

СТЪПКИ = ['Героиня', 'Чудовище', 'Водач', 'План', 'Призив', 'Залог', 'Съкровище', 'Еликсир']
ВАРИАНТИ = ['full', 'retreat', 'course', 'online']
ЗАБРАНЕНИ = ['важно', 'запишете се', 'купете']   # без регистър · „оферта" и цените са в test_04 · „група"/„курс" в test_30
ФИГУРИ_V4 = 9   # 7 (V2.4) + heart (Т2) + dial2 (Т6)


_КЕШ = {}


def чети(p: pathlib.Path) -> str:
    if p not in _КЕШ:
        _КЕШ[p] = p.read_text(encoding='utf-8')
    return _КЕШ[p]


def скриптове(t: str):
    return re.findall(r'<script\b[^>]*>(.*?)</script>', t, re.S)


def тяло(t: str) -> str:
    return t.split('</head>', 1)[1]


def без_коментари(t: str) -> str:
    return re.sub(r'<!--.*?-->', '', t, flags=re.S)


def видим_текст(t: str) -> str:
    """Тялото без скриптове, стилове и коментари, с махнати тагове — това, което жената чете."""
    b = без_коментари(тяло(t))
    b = re.sub(r'<script\b[^>]*>.*?</script>', ' ', b, flags=re.S)
    b = re.sub(r'<style>.*?</style>', ' ', b, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', b)


def секции(t: str):
    """[(id, стъпка, позиция)] за всеки <section> в тялото, в реда на документа."""
    out = []
    for m in re.finditer(r'<section\b([^>]*)>', без_коментари(тяло(t))):
        attrs = m.group(1)
        sid = re.search(r'id="([^"]+)"', attrs)
        st = re.search(r'data-стъпка="(\d)"', attrs)
        out.append((sid.group(1) if sid else '?', int(st.group(1)) if st else None, m.start()))
    return out


def блок_на_секция(t: str, sid: str) -> str:
    b = без_коментари(тяло(t))
    m = re.search(r'<section\b[^>]*id="%s"[^>]*>(.*?)</section>' % re.escape(sid), b, re.S)
    return m.group(1) if m else ''


def блок_на_стъпка(t: str, n: int) -> str:
    """Съдържанието на ВСИЧКИ секции с data-стъпка=n, слято."""
    b = без_коментари(тяло(t))
    return ' '.join(re.findall(r'<section\b[^>]*data-стъпка="%d"[^>]*>(.*?)</section>' % n, b, re.S))


class Основа(unittest.TestCase):
    """assertIn/assertRegex върху 50 KB текст дъмпват целия текст при провал — тук провалът е един ред."""

    def setUp(self):
        self.src = чети(SRC)
        self.b = без_коментари(тяло(self.src))
        self.двигател = скриптове(self.src)[1]

    def съдържа(self, купа: str, игла: str, msg: str):
        self.assertTrue(игла in купа, msg)


class Т0_Основа(Основа):
    """Зелени от Т0 · пазят това, което вече е вярно."""

    def test_01_хедърът_носи_v4(self):
        head = '\n'.join(self.src.splitlines()[:60])
        self.съдържа(head, 'v4.0', 'хедърът (коментар-блокът в <head>) трябва да носи v4.0')
        self.assertIsNotNone(re.search(r'v4\.0[^\n]*2026-09-\d\d[^\n]*\d\d:\d\d', head), 'v4.0 без дата/час на промяната')

    def test_02_шевът_е_байт_идентичен_с_базата(self):
        try:
            base = subprocess.run(['git', 'show', f'{БАЗА}:nova-zhena-v2.html'], cwd=ROOT,
                                  capture_output=True, check=True).stdout.decode('utf-8')
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.fail(f'git/базата {БАЗА} не са налични — шевът не може да се провери (не skip: гардът не се изпарява безшумно)')
        self.assertTrue(скриптове(self.src)[0] == скриптове(base)[0],
                        '1-вият <script> (шевът → n8n/Yespo) НЕ се пипа без дума')

    def test_03_три_скрипта(self):
        self.assertEqual(len(скриптове(self.src)), 3, 'шев · двигател · страница — точно три <script>')

    def test_04_нула_оферта_и_цени(self):
        текст = видим_текст(self.src)
        self.assertEqual(len(re.findall(r'[Оо]ферта', текст)), 0, '„оферта" никога')
        цени = re.findall(r'\d[\d\s.,]*\s?(?:лв\.?(?![а-я])|лева\b|€|EUR\b|евро\b)|€\s?\d', текст)
        self.assertEqual(цени, [], f'нула цени на страницата · намерени: {цени[:5]}')

    def test_05_деплой_копието_е_източникът(self):
        self.assertTrue(DEPLOY.exists(), 'new-woman/index.html липсва')
        обратно = re.sub(r'(src=["\'])/img/', r'\1img/', чети(DEPLOY))
        self.assertTrue(обратно == self.src, 'деплой-копието ≠ източник след обратния sed (cp + sed трябва да се пусне пак)')

    def test_06_всяка_секция_носи_стъпка(self):
        s = секции(self.src)
        self.assertGreaterEqual(len(s), 8)
        без = [sid for sid, st, _ in s if st is None]
        self.assertEqual(без, [], f'секции без data-стъпка: {без}')
        self.assertTrue(all(1 <= st <= 8 for _, st, _ in s), 'data-стъпка ∈ 1..8')

    def test_07_нула_външни_скриптове(self):
        self.assertEqual(re.findall(r'<script\b[^>]*src=', self.src), [],
                         'външен <script src> в страница, която събира лични данни')


class Т1_Подредба(Основа):
    """Червени до Т1."""

    def test_10_редът_е_1_до_8(self):
        поредица = [st for _, st, _ in секции(self.src)]
        self.assertEqual(поредица, list(range(1, 9)),
                         f'договор: точно 8 секции · по една на стъпка · в ред 1→8 · има: {поредица}')

    def test_11_формата_е_стъпка_5_между_4_и_6(self):
        s = секции(self.src)
        ф = [(st, pos) for sid, st, pos in s if sid == 'form']
        self.assertEqual(len(ф), 1, 'точно една секция #form')
        st, pos = ф[0]
        self.assertEqual(st, 5, 'формата = стъпка 5 (Призив · по средата)')
        self.assertTrue(any(x == 4 and p < pos for _, x, p in s), 'План (4) преди формата')
        self.assertTrue(any(x == 6 and p > pos for _, x, p in s), 'Залог (6) след формата')

    def test_12_кикерите_носят_имената_на_стъпките(self):
        липсват = []
        for n, име in enumerate(СТЪПКИ, start=1):
            блок = блок_на_стъпка(self.src, n)
            if not re.search(r'class="kicker[^"]*"[^>]*>.{0,80}?' + име, блок, re.S):
                липсват.append(f'{n} {име}')
        self.assertEqual(липсват, [], f'kicker без името на стъпката: {липсват}')

    def test_13_белезите_са_един_голям_образ(self):
        блок = блок_на_секция(self.src, 'marks3')
        self.assertTrue(блок != '', 'секцията на белезите (#marks3) липсва')
        self.assertEqual(len(re.findall(r'<img\b', блок)), 1, 'трите белега = ЕДИН голям образ')


class Т2_Т7_Контроли(Основа):
    """Червени до съответния тикет."""

    def test_20_рецепта_heart(self):                                  # Т2
        self.assertIsNotNone(re.search(r'\bheart:\s*\{', self.двигател), 'осма рецепта heart в РЕЦЕПТИ')
        self.съдържа(self.двигател, 'function genHeart', 'генераторът genHeart (app.js Exhibit II) в двигателя')
        self.съдържа(self.b, 'data-фигура="heart"', 'сцена на сърцето при Водача')

    def test_21_петте_печата_на_водача(self):                         # Т2
        блок = блок_на_стъпка(self.src, 3)
        self.assertEqual(len(re.findall(r'class="seal\b', блок)), 5, 'пет печата около сърцето')

    def test_22_стълбата_на_плана(self):                              # Т3
        блок = блок_на_стъпка(self.src, 4)
        self.съдържа(блок, 'id="stairs"', 'стълбата (#stairs) в План')
        self.assertEqual(len(re.findall(r'class="stair\b', блок)), 4, 'четири стъпала')

    def test_23_вариантите_са_вътре_във_формата(self):                 # Т4
        m = re.search(r'<form\b[^>]*id="lead"[^>]*>(.*?)</form>', self.b, re.S)
        self.assertIsNotNone(m, 'формата #lead липсва')
        стойности = re.findall(r'<input\b[^>]*name="variant"[^>]*value="([^"]+)"', m.group(1))
        self.assertEqual(sorted(стойности), sorted(ВАРИАНТИ), f'radio name="variant" × 4 вътре във формата · има: {стойности}')

    def test_24_нула_вариант_бутони_извън_формата(self):               # Т4
        self.assertEqual(len(re.findall(r'data-нж-вариант=', self.b)), 0, 'бутоните data-нж-вариант (#offer) изчезват')
        self.assertIsNone(re.search(r'<h[123][^>]*>[^<]*Пълната програма', self.b), '„Пълната програма" не е заглавие/фокус')

    def test_25_ритрийт_рейлът_в_залога(self):                         # Т5
        блок = блок_на_стъпка(self.src, 6)
        self.съдържа(блок, 'class="rail"', 'рейлът за втори път (ритрийт-контролът) в Залог')
        self.assertEqual(len(re.findall(r'class="deck\b', блок)), 5, 'пет карти-неща на ритрийта')

    def test_26_дуелът_и_средната_линия(self):                        # Т6
        блок = блок_на_стъпка(self.src, 7)
        self.съдържа(блок, 'id="duel"', 'дуелът 2+2 (#duel) в Съкровището')
        self.съдържа(блок, 'id="midline"', 'средната линия (#midline) с 4 звезди')
        for име in ('Любка', 'Екопътечко', 'Его Илюзорков', 'Бега Илюзоркова'):
            self.съдържа(блок, име, f'{име} в дуела')

    def test_27_компасът_за_втори_път(self):                           # Т6
        self.assertIsNotNone(re.search(r'\bdial2:\s*\{', self.двигател), 'рецепта-псевдоним dial2')
        self.assertIn('data-фигура="dial2"', блок_на_стъпка(self.src, 7), 'компасът-2 в Съкровището')

    def test_28_обръщащата_се_карта_в_еликсира(self):                  # Т7
        блок = блок_на_стъпка(self.src, 8)
        self.съдържа(блок, 'id="elixir"', 'Еликсирът (#elixir)')
        self.assertIsNotNone(re.search(r'class="mo\b', блок), 'обръщащата се карта (.mo · контролът от Деня · за втори път)')

    def test_29_девет_фигури(self):                                    # Т6
        self.assertEqual(len(re.findall(r'data-фигура="', self.b)), ФИГУРИ_V4, '7 + heart + dial2 = 9 сцени')


class Т8_Речник(Основа):
    """Червени до Т8 · речникът на Металандия във видимия текст."""

    def test_30_нула_забранени_думи(self):
        текст = видим_текст(чети(SRC))
        намерени = [д for д in ЗАБРАНЕНИ if re.search(д, текст, re.IGNORECASE)]
        self.assertEqual(намерени, [], f'забранени думи във видимия текст: {намерени}')
        self.assertEqual(len(re.findall(r'\b[Гг]руп[аи]\b', текст)), 0, '„група" → „трупа"')
        self.assertEqual(len(re.findall(r'\b[Кк]урс(?:а|ът|ове|овете)?\b', текст)), 0,
                         '„курс/курса/курсове" (продаващо) → „продукция" (курсист/курсистка остават)')

    def test_31_рамката_говори(self):
        текст = видим_текст(чети(SRC))
        for дума in ('режисьор', 'кастинг', 'трупа', 'продукци', 'андидатств', 'премиера'):
            self.съдържа(текст, дума, f'филмовата рамка: липсва „{дума}"')

    def test_32_v4_термините_говорят(self):                           # Т3 · Т6
        текст = видим_текст(чети(SRC))
        for дума in ('Кандидатстване', 'Скрининг и кастинг', 'Продукцията', 'Постпродукция и премиера',
                     'Вдъхновение', 'Радост', 'С-покой-сте-Вие', 'Неприемане', 'Сянка',
                     'Его Илюзорков', 'Бега Илюзоркова'):
            self.съдържа(текст, дума, f'V4-копи: липсва „{дума}"')


if __name__ == '__main__':
    unittest.main(verbosity=2)
