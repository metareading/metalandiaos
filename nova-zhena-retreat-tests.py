#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
nova-zhena-retreat-tests.py · структурният ШЕВ на страницата за записаните „Нова Жена · ретрийт · 18–22 септември 2026"
MET-786 (спек § Testing Decisions · шев 1) · 16.09.2026 · Fable 5.1 High (дума на Митрандир 16.09)

Чете ДВАТА HTML файла като текст (nova-zhena-retreat-sep2026.html + new-woman/retreat/sep2026/index.html) и проверява договора:
  • 5-те дни / 8-те стъпки в ред (Д1 = 1+2 · Д2 = 3+4 · Д3 = 5+6 · Д4 = 7 · Д5 = 8) · датите 18–22 септември · дъгата Отделяне → Представление
  • цените 1597 / 1321 / 789 / 610 присъстват в евро И в грамове злато (грамовете = евро / курс от страницата, до 0,01 g)
  • *-обяснението (желязо → злато / страдание → съзнание · Мета = злато · Метта = светлина)
  • чеклистът „какво да носят" с артикулите, вързани за дни
  • точковият HUD (светлина + злато) в ъглите + броячът на картите
  • преизползваните рецепти (hero · path · monster · dial · clock · thread · spark · heart) · двигателят дословен (без 5-възловата параметризация)
  • шевът (nova-zhena-seam.js v0.2.1) байт-идентичен с 1-вия script на nova-zhena-v2.html · нула външен script src
  • 0 срещания на „оферта" · хедърът носи версия + дата/час · деплой-копието = източник след обратен sed
Шев 2 (API на двигателя) и шев 3 (Browser pane 390/1280 · console 0 · тапове) тестът НЕ мери — те са в хендофа.

Пускане:  cd /Users/user/metalandiaos && python3 nova-zhena-retreat-tests.py -v
Без зависимости (stdlib) · prior art: nova-zhena-v4-tests.py · test_funiya.py
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'nova-zhena-retreat-sep2026.html'
DEPLOY = ROOT / 'new-woman' / 'retreat' / 'sep2026' / 'index.html'
ИЗВОР = ROOT / 'nova-zhena-v2.html'           # READ-ONLY извор на двигателя и шева

ДНИ = [('Отделяне', '18', ['1', '2']), ('Потапяне', '19', ['3', '4']), ('Посвещение', '20', ['5', '6']),
       ('Завръщане', '21', ['7']), ('Представление', '22', ['8'])]
СТЪПКИ = ['Героиня', 'Чудовище', 'Водач', 'Сценарий', 'Призив', 'Залог', 'Съкровище', 'Еликсир']   # фикс-кръг 1: стъпка 4 „План“ → „Сценарий“ (продукция-рамка · дума 16.09)
ЦЕНИ = {'full': 1597, 'retreat': 1321, 'course': 789, 'online': 610}
РЕЦЕПТИ = ['hero', 'path', 'monster', 'dial', 'clock', 'thread', 'spark', 'heart']
АРТИКУЛИ = ['Планинарски обувки', 'Тенис ракета', 'Бански и кърпа', 'бележник', 'Лаптоп', 'Слушалки', 'Дрехи за сцена', 'крем', 'меко за сядане']
ЗАБРАНЕНИ = ['оферта', 'офертата', 'оферти']
ХЕДЪР_ИД = 'НОВА ЖЕНА · РЕТРИЙТ'

_КЕШ = {}


def чети(p):
    if p not in _КЕШ:
        _КЕШ[p] = p.read_text(encoding='utf-8')
    return _КЕШ[p]


def скриптове(t):
    return re.findall(r'<script\b[^>]*>(.*?)</script>', t, re.S)


def тяло(t):
    return t.split('</head>', 1)[1]


def без_коментари(t):
    return re.sub(r'<!--.*?-->', '', t, flags=re.S)


def видим_текст(t):
    b = без_коментари(тяло(t))
    b = re.sub(r'<script\b[^>]*>.*?</script>', ' ', b, flags=re.S)
    b = re.sub(r'<style>.*?</style>', ' ', b, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', b)


def блок_по_id(t, sid):
    b = re.sub(r'<script\b[^>]*>.*?</script>', ' ', без_коментари(тяло(t)), flags=re.S)
    m = re.search(r'<(section|div|ol|li)\b[^>]*\bid="%s"[^>]*>' % re.escape(sid), b)
    if not m:
        return ''
    таг, дълбочина, начало = m.group(1), 1, m.end()
    for mm in re.finditer(r'<(/?)%s\b[^>]*>' % таг, b[начало:]):
        дълбочина += -1 if mm.group(1) else 1
        if дълбочина == 0:
            return b[начало:начало + mm.start()]
    return ''


def секции(t):
    return [re.search(r'id="([^"]+)"', m.group(1)).group(1) for m in re.finditer(r'<section\b([^>]*)>', без_коментари(тяло(t))) if 'id="' in m.group(1)]


class Основа(unittest.TestCase):
    def setUp(self):
        self.src = чети(SRC)
        self.b = без_коментари(тяло(self.src))
        self.txt = видим_текст(self.src)
        self.sc = скриптове(self.src)

    def съдържа(self, купа, игла, msg):
        self.assertTrue(игла in купа, msg)


class Т1_Идентичност(Основа):
    def test_01_хедърът_носи_версия_дата_час(self):
        head = '\n'.join(self.src.splitlines()[:40])
        заглавни = [l for l in head.splitlines() if l.lstrip().startswith(ХЕДЪР_ИД)]
        self.assertEqual(len(заглавни), 1, f'точно един ред, започващ с „{ХЕДЪР_ИД}“ · намерени {len(заглавни)}')
        self.assertIsNotNone(re.search(r'v1\.\d+(?:\.\d+)?[^\n]*2026-09-\d\d[^\n]*\d\d:\d\d', заглавни[0]), 'първият ред: v1.X + дата + час')
        self.съдържа(head, 'Модел: Fable 5.1', 'хедърът носи модела (М2Q32)')

    def test_02_деплой_копието_е_източникът_след_обратен_sed(self):
        dep = чети(DEPLOY)
        self.assertEqual(len(re.findall(r'["\']img/', dep)), 0, 'деплоят няма относителни img/ пътища')
        обр = re.sub(r'(src=|href=)"/img/', r'\1"img/', dep).replace("'/img/w/p-'", "'img/w/p-'").replace("img:'/img/", "img:'img/")
        self.assertEqual(обр, self.src, 'деплой-копието след обратен sed ≠ източникът')

    def test_03_четири_скрипта_нула_външен_src(self):
        self.assertEqual(len(self.sc), 4, 'конфиг на шева · шев · двигател · драйвер')
        self.assertEqual(re.findall(r'<script\b[^>]*\bsrc=', без_коментари(self.src)), [], 'нула външен script src')

    def test_04_нула_оферта(self):
        low = self.txt.lower()
        for д in ЗАБРАНЕНИ:
            self.assertNotIn(д, low, f'забранена дума: {д}')
        self.съдържа(low, 'предложени', 'речник: „предложение“')

    def test_05_рутът_и_датите(self):
        self.съдържа(self.src, '/new-woman/retreat/sep2026', 'рутът в хедъра')
        self.съдържа(self.txt, '18–22 септември 2026', 'датите в hero')


class Т2_Програма(Основа):
    def test_10_пет_дни_в_ред_с_осемте_стъпки(self):
        дни = re.findall(r'<li class="dayc part" data-ден="(\d)" data-стъпки="([^"]+)"', self.b)
        self.assertEqual([д[0] for д in дни], ['1', '2', '3', '4', '5'], 'петте дни в ред 1→5')
        self.assertEqual([д[1].split() for д in дни], [д[2] for д in ДНИ], 'Д1=1+2 · Д2=3+4 · Д3=5+6 · Д4=7 · Д5=8')
        блок = блок_по_id(self.src, 'days')
        poz = [блок.find(д[0]) for д in ДНИ]
        self.assertTrue(all(p >= 0 for p in poz) and poz == sorted(poz), 'дъгата Отделяне → Потапяне → Посвещение → Завръщане → Представление в ред')
        for _, дата, _ in ДНИ:
            self.съдържа(блок, f'{дата} септември', f'датата {дата} септември в деня')
        for i, ст in enumerate(СТЪПКИ):
            self.assertRegex(блок, r'<span>%d %s</span>' % (i + 1, ст), f'стъпка {i+1} {ст} е етикет в деня')

    def test_11_сутрешните_дейности_по_дни(self):
        блок = блок_по_id(self.src, 'days')
        for д, текст in ((2, 'Байкушева мура'), (3, 'Тенис'), (3, 'колела'), (4, 'минерални басейни'), (5, 'Меттамъж')):
            ден = re.search(r'data-ден="%d".*?</li>' % д, блок, re.S).group(0)
            self.съдържа(ден, текст, f'Д{д}: {текст}')

    def test_12_ден_часовникът_и_ядрото(self):
        блок = блок_по_id(self.src, 'day')
        self.assertEqual(len(re.findall(r'class="mo part"', блок)), 4, 'четири момента')
        for т in ('Сутрин · дейността', 'Следобед · пространство', '15:30 → 20:00', 'Вечер · тишина'):
            self.съдържа(блок, т, т)
        self.съдържа(блок, 'data-фигура="clock"', 'рецепта clock')

    def test_13_чудовището_д1_водачът_д2(self):
        self.assertIn('data-ден="1"', re.search(r'<section[^>]*id="monster"[^>]*>', self.b).group(0), 'чудовището е Д1')
        self.assertIn('data-ден="2"', re.search(r'<section[^>]*id="vodach"[^>]*>', self.b).group(0), 'водачът е Д2')
        self.съдържа(блок_по_id(self.src, 'monster'), 'data-фигура="monster"', 'рецепта monster')
        v = блок_по_id(self.src, 'vodach')
        self.съдържа(v, 'data-фигура="heart"', 'рецепта heart')
        self.assertEqual(len(re.findall(r'class="seal" data-k=', v)), 5, 'петте печата = петте неща')
        for н in ('Преходът', 'Планински колела', 'Спа и минерални басейни', 'Тенис', 'Концертният сеанс'):
            self.съдържа(v, н, f'нещо: {н}')

    def test_14_атентиометърът_1_до_5(self):
        s = блок_по_id(self.src, 'scale')
        self.съдържа(s, 'data-фигура="dial"', 'рецепта dial')
        стъпала = re.findall(r'<li class="part" data-i="(\d)"><span class="n">\d</span><span class="w">([^<]+)<', s)
        self.assertEqual([w.strip() for _, w in стъпала], ['Побъркват ме', 'Дразнят ме', 'Приемам', 'Радост', 'Вдъхновение'], 'скалата 1→5 (фикс-кръг 1: върхът „Съзнание“ → „Вдъхновение“)')

    def test_15_редът_на_секциите(self):
        ids = секции(self.src)
        очаквано = ['hero', 'path', 'day', 'monster', 'vodach', 'scale', 'wheel', 'sched', 'bring', 'price', 'form']
        self.assertEqual(ids, очаквано, 'редът на 11-те секции')


class Т3_Игра(Основа):
    def test_20_HUD_светлина_злато_в_ъглите(self):
        bar = блок_по_id(self.src, 'bar')
        self.assertIn('id="hud-light"', bar); self.assertIn('id="hud-gold"', bar)
        self.assertIn('id="hud-l"', bar); self.assertIn('id="hud-g"', bar)
        self.assertRegex(self.src, r'\.hud\.l\{justify-self:start\}\.hud\.g\{justify-self:end\}', 'светлината вляво · златото вдясно')
        self.assertRegex(self.src, r'#cards\{position:fixed;left:12px;bottom:12px', 'броячът на картите долу вляво')
        self.assertIn('id="hud-c"', self.b, 'броячът на картите')

    def test_21_метаконтролът_колелото(self):
        w = блок_по_id(self.src, 'wheel')
        self.съдържа(w, 'data-фигура="spark"', 'рецепта spark под колелото')
        self.assertIn('id="wheelsvg"', w); self.assertIn('id="wheart"', w)
        for м in ('Здраве', 'Призвание', 'Характер', 'Визия'):
            self.съдържа(w, м, f'Метта: {м}')
        for а in ('Любка', 'Екопътечко', 'Куражку', 'Обемко', 'Хола', 'Фибоначко', 'Творея', 'Доверка'):
            self.съдържа(w, а, f'Мета: {а}')
        др = self.sc[3]
        self.assertEqual(len(re.findall(r"'будечител-\d':\{", др)), 8, '8 карти-будечители')
        self.assertEqual(len(re.findall(r"'ден-\d':\{", др)), 5, '5 карти-дни')
        self.assertEqual(len(re.findall(r"'нещо-\d':\{", др)), 5, '5 карти-неща')
        self.assertIn("'чудовище':{", др); self.assertIn("'багаж':{", др)
        self.assertIn("img/w/p-lyubka.webp", др, 'картите-будечители от хоума (img/w)')

    def test_22_чеклистът_по_дни(self):
        b = блок_по_id(self.src, 'bring')
        self.assertEqual(len(re.findall(r'class="item" data-item="\d"', b)), 9, 'девет артикула')
        for а in АРТИКУЛИ:
            self.съдържа(b, а, f'артикул: {а}')
        групи = b.split('<div class="grp part"')[1:]
        self.assertEqual(len(групи), 4, 'четири групи по ден')
        for д, а in (('Ден 2', 'Планинарски обувки'), ('Ден 3', 'Тенис ракета'), ('Ден 4', 'Бански и кърпа'), ('Всеки ден', 'Слушалки')):
            грп = [g for g in групи if f'<b>{д}</b>' in g]
            self.assertEqual(len(грп), 1, f'група {д}')
            self.съдържа(грп[0], а, f'{а} е в групата {д}')


class Т4_Цени(Основа):
    def курс(self):
        m = re.search(r"КУРС=\{дата:'([^']+)',usdOz:([\d.]+),usdEur:([\d.]+),гр:([\d.]+)\}", self.sc[3])
        self.assertIsNotNone(m, 'курсът е в драйвера')
        return float(m.group(2)) * float(m.group(3)) / float(m.group(4))

    def test_30_четирите_цени_в_евро_и_злато(self):
        p = блок_по_id(self.src, 'price')
        eurg = self.курс()
        for v, e in ЦЕНИ.items():
            карта = re.search(r'<button[^>]*data-нж-вариант="%s"[^>]*data-eur="(\d+)"[^>]*>.*?</button>' % v, p, re.S)
            self.assertIsNotNone(карта, f'предложение {v}')
            self.assertEqual(int(карта.group(1)), e, f'{v} = {e} €')
            self.съдържа(карта.group(0), f'{e} €', f'{v}: еврото е видимо')
            g = ('%.2f' % (e / eurg)).replace('.', ',')
            self.съдържа(карта.group(0), f'{g}<small> g</small>', f'{v}: {g} g злато (статично = курса)')
        self.assertNotIn('оферта', p.lower())

    def test_31_звездичката_и_курсът(self):
        p = блок_по_id(self.src, 'price')
        self.съдържа(p, 'Не превръщаме желязото в злато, а страданието в съзнание', '*-обяснението')
        self.съдържа(p, 'всичко Мета при нас е в злато, а всичко Метта — в светлина', 'Мета = злато · Метта = светлина')
        self.assertRegex(p, r'Курс: \d+,\d\d € за грам злато · \d\d\.\d\d\.2026', 'курсът с дата')
        self.assertAlmostEqual(self.курс(), 120.60, delta=0.01, msg='курсът 16.09: 120,60 €/g')

    def test_32_без_срокове_капаро_планове(self):
        p = видим_текст('<head></head>' + блок_по_id(self.src, 'price')).lower()
        for д in ('капаро', 'вноск', 'до 15', 'подаръч', '%'):
            self.assertNotIn(д, p, f'чистите цени: без „{д}“')


class Т5_Двигател(Основа):
    def test_40_осемте_рецепти_на_платната(self):
        for р in РЕЦЕПТИ:
            self.assertEqual(self.b.count(f'data-фигура="{р}"'), 1, f'една сцена {р}')

    def test_41_двигателят_е_дословен_с_петвъзлова_параметризация(self):
        извор = скриптове(чети(ИЗВОР))[1]
        дв = self.sc[2]
        self.assertIn('ВЪЗЛИ_N = 5', дв, 'петте дни = 5 възела')
        # обратната замяна връща извора дословно (плюс един ред в хедъра на двигателя)
        обр = дв
        обр = обр.replace("var ВЪЗЛИ_N = 5; /* ретрийт · петте дни (v4.2 носеше твърдо 8) */ var ВЪЗЛИ = []; for (var вк = 0; вк < ВЪЗЛИ_N; вк++) ВЪЗЛИ.push(път(вк / (ВЪЗЛИ_N - 1)));",
                        "var ВЪЗЛИ = []; for (var вк = 0; вк < 8; вк++) ВЪЗЛИ.push(път(вк / 7));")
        обр = обр.replace("N - ВЪЗЛИ_N * (ЯДРО + ОРЕОЛ)", "N - 8 * (ЯДРО + ОРЕОЛ)").replace("for (k = 0; k < ВЪЗЛИ_N; k++) {\n      var v = ВЪЗЛИ[k];", "for (k = 0; k < 8; k++) {\n      var v = ВЪЗЛИ[k];")
        обр = обр.replace("data[i] = k / (ВЪЗЛИ_N - 1);", "data[i] = k / 7;")
        обр = обр.replace("'  float litN = up * ' + (ВЪЗЛИ_N - 1).toFixed(1) + ';',", "'  float litN = up * 7.0;',").replace("'    float kk = datv * ' + (ВЪЗЛИ_N - 1).toFixed(1) + ';',", "'    float kk = datv * 7.0;',")
        обр = re.sub(r'\n   РЕТРИЙТ \(MET-786[^\n]*', '', обр, count=1)
        self.assertEqual(обр, извор, 'двигателят ≠ изворът след обратната параметризация')

    def test_42_шевът_е_байт_идентичен(self):
        self.assertEqual(self.sc[1], скриптове(чети(ИЗВОР))[0], 'шевът (nova-zhena-seam.js v0.2.1) не е дословен')
        self.assertIn("window.НЖ_ШЕВ_КОНФИГ = { източник: 'nova-zhena-retreat-sep2026", self.sc[0], 'източникът на формата е тази страница')
        f = блок_по_id(self.src, 'form')
        self.assertIn('id="lead"', f); self.assertIn('name="question"', f)
        self.assertEqual(len(re.findall(r'data-нж-вариант="', self.b)), 4, 'четирите предложения са и вариантите на шева')

    def test_43_канонът_магичен_контрол_части_свързване(self):
        for sid in ('hero', 'path', 'day', 'monster', 'vodach', 'scale', 'wheel', 'sched', 'bring', 'price'):
            sec = re.search(r'<section[^>]*id="%s"[^>]*>' % sid, self.b).group(0)
            self.assertIn('magic', sec, f'{sid} е магичен блок')
            n = len(re.findall(r'class="[^"]*\bpart\b', блок_по_id(self.src, sid)))
            self.assertGreaterEqual(n, 3, f'{sid}: ≥3 части (има {n})')
        self.assertIn("section.magic", self.sc[3]); self.assertIn('animateMotion', self.sc[3], 'златните частици по нишките')
        self.assertEqual(self.b.count('class="tap"'), 8, 'подсказка „докоснете“ на осемте сцени')


class Т6_ФиксКръг1(Основа):
    """Седемте таргетирани корекции (казуси на Митрандир · 16.09 · v1.1)."""

    def test_50_двайсет_и_първата_карта_въпрос_от_формата(self):
        др = self.sc[3]
        self.assertIn("'въпрос':{", др, '21-вата карта „въпрос“ е в КАРТИ')
        карти = re.findall(r"'(?:ден-\d|нещо-\d|будечител-\d|чудовище|багаж|въпрос)':\{", др)
        self.assertEqual(len(карти), 21, 'общо 21 карти (беше 20 + въпросът)')
        # отключва се САМО от успешното изпращане на формата (шевът dispatch-ва нж:изпратено · не по скрол)
        self.assertRegex(др, r"addEventListener\('нж:изпратено',\s*\(\)\s*=>\{\s*карта\('въпрос'", 'въпросът се вика от нж:изпратено')
        self.съдържа(self.b, '<span id="hud-ct">21</span>', 'HUD знаменателят е 21')
        self.съдържа(блок_по_id(self.src, 'wheel'), '21 карти', 'колелото описва 21 карти')

    def test_51_дневен_ритъм_три_пояса(self):
        s = блок_по_id(self.src, 'sched')
        слотове = re.findall(r'<div class="slot(?: dinner)? part"', s)
        self.assertEqual(len(слотове), 3, 'три пояса (Част 1 · вечеря · Част 2)')
        for t in ('15:30 → 17:30', '17:30 → 18:30', '18:30 → 20:00'):
            self.съдържа(s, t, f'поясът {t}')
        self.assertEqual(len(re.findall(r'class="slot dinner', s)), 1, 'вечерята е по средата (dinner)')

    def test_52_концертен_сеанс_само_д1_нула_свещи(self):
        self.assertNotIn('свещи', self.txt, 'нула „свещи“ във видимия текст')
        self.assertNotIn('на свещи', self.txt)
        дни = re.findall(r'<li class="dayc part" data-ден="(\d)".*?</li>', self.b, re.S)  # само по DOM ред
        блок = блок_по_id(self.src, 'days')
        части = re.split(r'(<li class="dayc part" data-ден="\d")', блок)
        карти_дни = {}
        for i in range(1, len(части), 2):
            д = re.search(r'data-ден="(\d)"', части[i]).group(1)
            карти_дни[д] = части[i] + части[i + 1]
        self.assertIn('концертен сеанс', карти_дни['1'].lower(), 'концертният сеанс е в Ден 1')
        for д in ('2', '3', '4', '5'):
            self.assertNotIn('концерт', карти_дни[д].lower(), f'нула концерт в Ден {д}')

    def test_53_план_станал_сценарий(self):
        self.assertIsNone(re.search(r'\b[Пп]лан\b', self.txt), 'нула „План“ като самостоятелна дума (стъпката вече е „Сценарий“)')
        self.съдържа(self.txt, 'Сценарий', 'стъпката „Сценарий“ присъства')
        блок = блок_по_id(self.src, 'days')
        self.assertRegex(блок, r'<span>4 Сценарий</span>', 'стъпка 4 е „Сценарий“ в Ден 2')
        self.съдържа(self.txt, 'помощник-сценарист', 'продукция-рамката (помощник-сценарист)')

    def test_54_атентиометър_върхът_вдъхновение(self):
        s = блок_по_id(self.src, 'scale')
        self.assertNotIn('Съзнание', s, 'нула „Съзнание“ на скалата')
        self.съдържа(s, 'Вдъхновение', 'върхът е „Вдъхновение“')
        self.assertIn("'Вдъхновение'", self.sc[3], 'драйверът носи „Вдъхновение“ на стъпало 5')

    def test_55_колелото_по_голямо_и_pop(self):
        m = re.search(r'\.wheel\{[^}]*\}', self.src)
        self.assertIsNotNone(m, 'правилото .wheel')
        self.съдържа(m.group(0), 'width:min(97vw,470px)', 'колелото е уголемено (фикс-кръг 2: 94vw,440 → 97vw,470)')
        self.assertNotIn('88%,360px', m.group(0), 'v1.0 размерът е махнат от правилото')
        self.assertNotIn('94vw,440px', m.group(0), 'v1.1 размерът е надминат в правилото')
        self.съдържа(self.b, 'id="cardpop"', 'има елемент за POP на картата')
        self.съдържа(self.src, '#cardpop.show', 'CSS за изскачащата карта')
        self.assertIn('function popCard(', self.sc[3], 'popCard в драйвера')
        # фикс-кръг 3: popCard вече се вика от карта() за ВСИЧКИ карти (не само будечители); nodeTap минава през карта()
        self.assertRegex(self.sc[3], r'(?s)function карта\(id,from\)\{.*?popCard\(', 'карта() вика popCard (задържане+оголване за всички карти)')
        self.assertRegex(self.sc[3], r'(?s)function nodeTap\([^)]*\)\{.*?карта\(', 'тапът на будечител минава през карта()')

    def test_56_notion_съдържание(self):
        for текст in ('Petroff', 'ул. Пирин 125', 'Топко Машинков', 'Меттамъж',
                      'Да живееш означава да се радваш', 'Първа репетиция', 'Втора репетиция', 'Генерална репетиция'):
            self.съдържа(self.txt, текст, f'Notion-съдържание: {текст}')


class Т7_ФиксКръг2(Основа):
    """Втора вълна казуси (16.09 · v1.2): дигитален багаж · колело голямо · Пирин · card-vapros."""

    def test_60_дигиталният_багаж_приложения_и_декларация(self):
        b = блок_по_id(self.src, 'bring')
        self.съдържа(b, 'class="digi"', 'блокът „дигиталният багаж“')
        for app in ('Таблици на Шулте', 'Storytel', 'Spreeder', 'Живко Шофьорков', 'Claude', 'Obsidian', 'Декларация'):
            self.съдържа(b, app, f'приложение/декларация: {app}')
        for url in ('storytel.com/bg', 'spreeder.com', 'claude.ai/download', 'obsidian.md', 'docs.google.com/forms'):
            self.съдържа(b, url, f'линк: {url}')
        self.assertNotIn('МетаТийн', b, 'декларацията за детето (МетаТийн) е махната')
        self.assertNotIn('(МетаЧетене)', b, 'скобите на декларацията са махнати')
        digi = b.split('class="digi"', 1)[1]
        self.assertRegex(digi, r'Попълване с\s*<b>\s*ДА\s*</b>', 'декларацията иска ДА')
        self.съдържа(digi, 'филмова продукция', 'ДА за целите на филмовата продукция')
        self.съдържа(digi, 'питаме изрично', 'кадри за сайт/социални → питаме изрично')

    def test_61_колелото_голямо_геометрия(self):
        др = self.sc[3]
        self.assertRegex(др, r'R_IN=128,\s*R_OUT=152,\s*R_N=112', 'геометрията на колелото е изнесена навън (беше 112/134/96)')
        self.assertRegex(др, r"svgel\('image',\{x:-24,y:-24,width:48,height:48", 'портретите на възлите са по-големи (48px)')
        self.съдържа(self.b, 'scale(1.32)', 'сърцето в центъра е уголемено')
        m = re.search(r'\.wheel\{[^}]*\}', self.src)
        self.съдържа(m.group(0), '97vw', 'кутията на колелото е по-широка')

    def test_62_пирин_панорама(self):
        p = блок_по_id(self.src, 'path')
        self.съдържа(self.b, 'class="pirinband"', 'банд със снимка на Пирин')
        self.съдържа(self.src, 'img/nz/journey-panorama.webp', 'панорамата на Пирин от старата страница')

    def test_63_карта_въпрос_специалната_картинка(self):
        self.assertIn("'въпрос':{n:'Въпросът · изпратен',img:'img/nz/card-vapros.webp'", self.sc[3], '21-вата карта ползва специалната card-vapros')


class Т8_ФиксКръг3(Основа):
    """Контрол-фикс пас П5 (v1.3 · Opus 4.8 High): гладки контроли + правилни имена · нула нова архитектура."""

    def test_70_именуване_ритмомер(self):
        # „часовник“ → РИТМОМЕР във видимия текст (двигателят/aria остават непокътнати вътрешно)
        self.assertNotIn('часовник', self.txt.lower(), 'нула видима дума „часовник“ (стана РИТМОМЕР)')
        d = блок_по_id(self.src, 'day')
        self.съдържа(d, 'Ден-<em>ритмомер</em>', 'заглавието на деня е „Ден-ритмомер“')
        self.съдържа(d, 'Докоснете ритмомера', 'подсказката ползва „ритмомера“')
        self.съдържа(d, 'data-фигура="clock"', 'рецептата clock (двигателят) е непокътната')

    def test_71_метаконтрол_махнат_протагонисти(self):
        self.assertNotIn('метаконтрол', self.txt.lower(), 'видимата дума „метаконтрол“ е махната от UI')
        w = блок_по_id(self.src, 'wheel')
        self.съдържа(w, 'Протагонисти · светлозлатната нишка', 'kicker-ът на колелото → „протагонисти“')
        self.assertNotIn('Метаконтрол ·', w, 'старият kicker „Метаконтрол ·“ го няма във видимия блок')
        self.съдържа(w, 'Светлозлатното <em>колело</em>', 'контролът остава „Светлозлатното колело“')

    def test_72_сърцето_на_колелото_Вие(self):
        w = блок_по_id(self.src, 'wheel')
        self.съдържа(w, '>Вие</text>', 'в сърцето на колелото стои „Вие“')
        self.assertNotIn('>атентиометър</text>', w, 'старият лейбъл „атентиометър“ в сърцето е сменен')

    def test_73_attentiometer_латиница_двойно_t(self):
        s = блок_по_id(self.src, 'scale')
        self.assertRegex(s, r'\bAttentiometer\b', 'латинско „Attentiometer“ (двойно t) присъства')
        self.assertNotIn('Atentiometer', s, 'нула единично-t „Atentiometer“')
        # позиция: атентиометърът (scale) е НАД будечителите (wheel)
        ids = секции(self.src)
        self.assertLess(ids.index('scale'), ids.index('wheel'), 'атентиометърът е над колелото/будечителите')

    def test_74_петте_полета_на_атентиометъра_пълни(self):
        s = блок_по_id(self.src, 'scale')
        малки = re.findall(r'<li class="part" data-i="\d"><span class="n">\d</span><span class="w">[^<]+<small>([^<]+)</small>', s)
        self.assertEqual(len(малки), 5, 'петте стъпала имат под-текст')
        for m in малки:
            self.assertTrue(m.strip(), 'полето не е празно')

    def test_75_части_клик_отваря_съдържание(self):
        # структурно: тапът на нещо/печат минава през openSeal, който показва скритата .sp
        dr = self.sc[3]
        self.assertIn("thingEls.forEach((s,k)=>s.addEventListener('click'", dr, 'частите-неща имат click')
        self.assertIn("sealEls.forEach((s,k)=>s.addEventListener('click'", dr, 'печатите имат click')
        self.assertRegex(dr, r'(?s)function openSeal\(k\)\{.*?pages\.forEach\(\(p,i\)=>\{p\.hidden=i!==k\}\)', 'openSeal разкрива съответната .sp')
        v = блок_по_id(self.src, 'vodach')
        self.assertEqual(len(re.findall(r'<div class="sp" data-k="\d" hidden>', v)), 5, 'петте .sp части със съдържание')

    def test_76_будечител_pattern_за_всички_карти(self):
        dr = self.sc[3]
        # карта() пуска popCard (задържане+оголване), а не бързото прелети, когато има #cardpop
        self.assertRegex(dr, r'if\(!reduce\s*&&\s*cardpop\)\s*popCard\(k\);\s*else\s*прелети\(', 'карта() ползва popCard за всички карти')

    def test_77_скрол_центриране_на_дните(self):
        self.assertRegex(self.src, r'\.dayc\{[^}]*scroll-margin-top:calc\(var\(--bar\)', '.dayc има scroll-margin под лентата')
        dr = self.sc[3]
        self.assertIn('центрирайДен', dr, 'има центриране на отворения ден')
        self.assertRegex(dr, r"центрирайДен\(d\)\{[^}]*block:'center'", 'денят се центрира (block:center)')

    def test_78_омекотен_преход_на_лицата(self):
        dr = self.sc[3]
        self.assertRegex(dr, r"face\.style\.transition='opacity \.5s cubic-bezier", 'кросфейдът на лицата е омекотен (0.5s ease-in-out)')
        self.assertRegex(self.src, r'\.faces button\{[^}]*transition:all \.5s cubic-bezier', 'бутоните на лицата с по-мазен преход')

    def test_79_дигиталният_багаж_три_глави_динамичен(self):
        b = блок_по_id(self.src, 'bring')
        for таг in ('Необходими', 'Силно препоръчителни', 'Препоръчителни'):
            self.assertRegex(b, r'<span class="tag">%s</span>' % таг, f'глава: {таг}')
        self.assertEqual(len(re.findall(r'<div class="chapter(?: open)?">', b)), 3, 'три глави')
        self.assertEqual(len(re.findall(r'<div class="chapter open">', b)), 1, 'първата глава е отворена по подразбиране')
        # динамика: главите се отварят/скриват при тап
        self.assertIn("$$('.digi .chapter .ch-h')", self.sc[3], 'главите имат тап-хендлър (отваря/скрива)')
        self.assertRegex(self.src, r'\.digi \.chapter\.open \.ch-body\{[^}]*max-height', 'CSS за разгъване на главата')

    def test_80_miracle_of_mind(self):
        b = блок_по_id(self.src, 'bring')
        self.съдържа(b, 'Miracle of Mind', 'Miracle of Mind е добавен')
        self.съдържа(b, 'https://isha.sadhguru.org/eu/en/miracle-of-mind', 'линкът към Miracle of Mind')
        self.съдържа(b, 'class="mom"', 'икона-лого за Miracle of Mind')
        # Miracle of Mind + Storytel са в главата „Силно препоръчителни“
        глави = re.split(r'<div class="chapter(?: open)?">', b)
        силно = [g for g in глави if 'Силно препоръчителни' in g]
        self.assertEqual(len(силно), 1, 'главата „Силно препоръчителни“')
        for n in ('Miracle of Mind', 'Storytel'):
            self.съдържа(силно[0], n, f'{n} е в „Силно препоръчителни“')

    def test_81_протагонист_панел_и_без_дубъл_име(self):
        # тап на протагонист отваря #wheelinfo (роля + история); картата носи името → без #wi-nm (без 2× текст)
        self.съдържа(self.b, 'id="wheelinfo"', 'инфо-панелът на протагониста')
        self.assertNotIn('id="wi-nm"', self.b, 'името е махнато от панела (картата го носи · без 2×)')
        self.assertIn('id="wi-rl"', self.b); self.assertIn('id="wi-tx"', self.b)
        dr = self.sc[3]
        self.assertIn('const РОЛИ=[', dr, 'данните за протагонистите (роля + история)')
        self.assertEqual(len(re.findall(r"\{r:'[^']+',\s*t:'", dr)), 8, 'осем протагониста с роля+история')
        self.assertRegex(dr, r'(?s)function nodeTap\([^)]*\)\{[^}]*showInfo\(k\)', 'тапът на протагонист вика showInfo')
        self.assertNotIn('wiNm', dr, 'панелът не пише име (референцията wiNm е махната · без 2×)')
        w = блок_по_id(self.src, 'wheel')
        self.съдържа(w, 'докоснете протагонист', 'подсказката е „докоснете протагонист“')
        self.съдържа(w, 'Продуценти и Протагонисти', 'будечителите въведени като Продуценти и Протагонисти')

    def test_82_popcard_по_голяма(self):
        m = re.search(r'#cardpop\{[^}]*\}', self.src)
        self.assertIsNotNone(m, 'правилото #cardpop')
        self.съдържа(m.group(0), 'width:min(82vw,330px)', 'popCard е по-голяма (беше 58vw,210)')
        self.assertNotIn('min(58vw,210px)', m.group(0), 'старият размер е махнат')

    def test_83_водачът_лозанов_и_сърцето(self):
        v = блок_по_id(self.src, 'vodach')
        self.съдържа(v, 'Use Your Brain and Follow Your Heart', 'цитатът на д-р Лозанов')
        self.съдържа(v, 'Лозанов', 'авторът е посочен')
        self.assertRegex(v, r'<h2[^>]*>Какво Ви е', 'заглавието на Водача е „Какво Ви е на сърце“')
        self.assertIn('data-фигура="heart"', v, 'рецептата heart е непокътната')

    def test_84_пеперудата_интерактивна(self):
        b = self.b
        self.съдържа(b, 'id="butterfly"', 'слотът на пеперудата')
        self.съдържа(b, 'id="bflycanvas"', 'пеперудата е canvas (интерактивна), не статичен SVG')
        self.assertNotIn('<svg class="bfly"', b, 'старият статичен SVG е махнат')
        # пеперудата НЕ е <section> — редът на 11-те секции е непокътнат
        self.assertEqual(len(секции(self.src)), 11, 'пак 11 секции (пеперудата е div, не section)')
        dr = self.sc[3]
        self.assertIn("$('#bflycanvas')", dr, 'анимацията рисува на canvas-а')
        self.assertRegex(dr, r'getContext\(.2d.\)', 'пеперудата е 2D-canvas (self-contained · нула WebGL/зависимост)')
        self.assertRegex(dr, r'requestAnimationFrame\(рисувай\)', 'крилете пляскат (rAF цикъл)')
        self.assertRegex(dr, r"cv\.addEventListener\('pointerdown'", 'тап = литват (интерактивност)')
        # канонът на self-contained: пак точно 4 script-а, нула външен src
        self.assertEqual(len(self.sc), 4, 'пак 4 script-а (пеперудата е в 4-тия, не нов таг)')


class Т9_КартаНаСвета(Основа):
    """MET-807 (17.09 · Fable 5.1 Max · фикс-кръг 1) · контролът «КАРТА НА СВЕТА» = МЕТАСФЕРА под hero-фигурата: един уред (алетиометър) ·
    4 Метта вътре (светлина) · 8 Мета около (злато) · общо сърце = ос · стрелка за избор · клик отваря карта · медальон-мап · 2D-canvas прах · reduced = постер · нула регресия."""
    ВЪНШНИ = [3, 8, 6, 11, 2, 10, 7, 5]          # багуа-пръстенът = 3×3 мрежата от реф-образа, развита по часовника от N (Ум)
    ВЪТРЕШНИ = [1, 9, 4, 12]                      # Монадата: Здраве NE · Призвание SE · Характер SW · Визия NW
    ТРИГРАМИ = {5: '000', 3: '101', 8: '110', 7: '001', 6: '011', 10: '111', 2: '010', 11: '100'}
    КОЛЕЛО = {1: 'доверка', 2: 'любка', 3: 'еко', 4: 'куражку', 5: 'любка', 6: 'хола', 7: 'хола', 8: 'обемко', 9: 'куражку', 10: 'творея', 11: 'фибо', 12: 'творея'}
    МЕДАЛЬОНИ = {1: 'nz-sfera-01-хипократ.png', 2: 'nz-sfera-02-бетовен.png', 3: 'nz-sfera-03-кюри.png', 4: 'nz-sfera-04-жана-дарк.png', 5: 'nz-sfera-05-орфей.png',
                 6: 'nz-sfera-06-деметра.png', 7: 'nz-sfera-07-ботев.png', 8: 'nz-sfera-08-лоренцо.png', 9: 'ЕТАЛОН-леонардо-призвание-светлина.png',
                 10: 'ЕТАЛОН-моцарт-творчество-злато.png', 11: 'nz-sfera-11a-питагор.png', 12: 'nz-sfera-12-лао-дзъ.png'}

    def _hero(self):
        return блок_по_id(self.src, 'hero')

    def _скелет(self):
        h = self._hero(); return h[h.index('<svg class="mm-skel"'):h.index('</svg>') + 6]

    def _блок(self):
        m = re.search(r'/\* ══ КАРТА НА СВЕТА · mettabook(.*?)/\* верификационна кука', self.sc[3], re.S)
        self.assertIsNotNone(m, 'блокът на контрола е в 4-тия (драйвер) script')
        return m.group(1)

    def _таблица(self):
        m = re.search(r'const ОБЛАСТИ=\[\n(.*?)\n    \];', self._блок(), re.S)
        self.assertIsNotNone(m, 'таблицата ОБЛАСТИ')
        return m.group(1)

    def test_90_контролът_е_в_hero_под_фигурата_не_секция(self):
        h = self._hero()
        self.съдържа(h, 'id="mettamap"', 'контролът живее ВЪТРЕ в #hero')
        self.assertLess(h.index('id="fig-hero"'), h.index('id="mettamap"'), 'под hero-фигурата')
        self.assertLess(h.index('id="mettamap"'), h.index('class="parts three"'), 'преди трите части на hero')
        self.assertNotIn('<section', h, 'не е вложена секция')
        self.assertEqual(секции(self.src), ['hero', 'path', 'day', 'monster', 'vodach', 'scale', 'wheel', 'sched', 'bring', 'price', 'form'], 'редът на 11-те секции непокътнат')
        self.assertIn('<figure class="mettamap" id="mettamap" data-reveal', h, 'блокът е <figure> с reveal')

    def test_91_един_уред_метта_вътре_мета_около_сърце_стрелка(self):
        sk = self._скелет()
        self.assertEqual(len(re.findall(r'data-мандала="', sk)), 1, 'ЕДНА мандала = един уред (метасферата), не две')
        self.съдържа(sk, 'data-мандала="метасфера"', 'метасферата')
        self.assertLess(sk.index('data-пръстен="мета"'), sk.index('data-пръстен="метта"'), 'външният пръстен (Мета · злато) се рисува под вътрешния (Метта · светлина · отгоре)')
        възли = [int(n) for n in re.findall(r'<g class="mm-n" data-n="(\d+)"', sk)]
        self.assertEqual(възли, self.ВЪНШНИ + self.ВЪТРЕШНИ, '8-те Мета по багуа-пръстена (от N по часовника) · после 4-те Метта вътре')
        ъгли = {int(n): int(a) for n, a in re.findall(r'<g class="mm-n" data-n="(\d+)"[^>]*data-a="(\d+)"', sk)}
        self.assertEqual([ъгли[n] for n in self.ВЪНШНИ], [0, 45, 90, 135, 180, 225, 270, 315], 'Ум N · Финанси NE · Род E · Мъдрост SE · Емоции S · Творчество SW · Среда W · Любов NW = мрежата развита')
        self.assertEqual({n: ъгли[n] for n in self.ВЪТРЕШНИ}, {1: 45, 9: 135, 4: 225, 12: 315}, 'Монадата: Здраве NE · Призвание SE · Характер SW · Визия NW (както в образа)')
        радиуси = {int(n): (int(a), int(b)) for n, a, b in re.findall(r'<g class="mm-n" data-n="(\d+)"[^>]*data-r0="(\d+)" data-r1="(\d+)"', sk)}
        self.assertTrue(all(радиуси[n][0] > 118 for n in self.ВЪНШНИ) and all(радиуси[n][1] < 118 for n in self.ВЪТРЕШНИ), '4-те Метта са ВЪТРЕ (r<118) · 8-те Мета отвън')
        имена = re.findall(r'<text class="nm"><textPath href="#mm-p\d+" startOffset="50%" text-anchor="middle">([^<]+)</textPath></text>', sk)
        self.assertEqual(имена, ['УМ', 'ФИНАНСИ', 'РОД', 'МЪДРОСТ', 'ЕМОЦИИ', 'ТВОРЧЕСТВО', 'СРЕДА', 'ЛЮБОВ', 'ЗДРАВЕ', 'ПРИЗВАНИЕ', 'ХАРАКТЕР', 'ВИЗИЯ'], 'имената са извити по дъгата (компас-роза)')
        self.assertEqual(len(re.findall(r'<path id="mm-p\d+" d="M[^"]+" fill="none"/>', sk)), 12, '12 дъги за имената в defs')
        триг = {int(n): tg for n, tg in re.findall(r'<g class="mm-n" data-n="(\d+)"[^>]*data-триграма="([01]{3})"', sk)}
        self.assertEqual(триг, self.ТРИГРАМИ, 'багуа-триграмите дословно от образа · само на 8-те Порти')
        self.assertEqual(len(re.findall(r'<polygon class="oct"', sk)), 1, 'багуа-октагонът = вътрешният ръб на външния пръстен')
        self.assertEqual(len(re.findall(r'<circle class="bez"', sk)), 1, 'бордюрът на уреда'); self.assertEqual(len(re.findall(r'<path class="tick"', sk)), 1, 'деленията (алетиометър)')
        self.assertEqual(len(re.findall(r'data-сърце="част"', sk)), 12, 'във всяка от 12-те области живее умалено ин-ян')
        self.assertEqual(len(re.findall(r'data-сърце="цяло"', sk)), 1, 'ЕДНО общо сърце = оста на уреда')
        self.assertLess(sk.index('data-пръстен="метта"'), sk.index('data-сърце="цяло"'), 'сърцето е най-отгоре')
        self.assertRegex(sk, r'<g class="mm-needle" transform="rotate\(135 200 200\) translate\(200 200\) scale\(0\.62\) translate\(-200 -200\)">', 'стрелката за избор · покой = Призвание (SE · 135° · скъсена до вътрешния пръстен)')
        self.assertIn("const дължина=k=>възли[k].r1<118?0.62:1;", self._блок(), 'вътрешна област → стрелката се скъсява')
        стр = sk[sk.index('<g class="mm-needle"'):]
        for част in ('<path class="lem"', '<polygon class="spear"', '<circle class="cw"', '<circle class="pivot"'):
            self.съдържа(стр, част, f'стрелката носи {част}')

    def test_92_валутата_светлина_вътре_злато_около(self):
        sk = self._скелет(); h = self._hero()
        мета = sk[sk.index('data-пръстен="мета"'):sk.index('data-пръстен="метта"')]; метта = sk[sk.index('data-пръстен="метта"'):sk.index('data-сърце="цяло"')]
        self.assertEqual(set(re.findall(r'<g class="mm-n"[^>]*data-валута="([^"]+)"', мета)), {'злато'}, 'външният пръстен е само злато')
        self.assertEqual(set(re.findall(r'<g class="mm-n"[^>]*data-валута="([^"]+)"', метта)), {'светлина'}, 'вътрешният пръстен е само светлина')
        двойки = re.findall(r'<g class="mm-a" role="button" tabindex="0" data-n="(\d+)" data-валута="(светлина|злато)"', h)
        self.assertEqual(sorted(int(n) for n, v in двойки if v == 'светлина'), [1, 4, 9, 12]); self.assertEqual(sorted(int(n) for n, v in двойки if v == 'злато'), [2, 3, 5, 6, 7, 8, 10, 11])
        t = self._таблица()
        self.assertEqual({int(n): v for n, v in re.findall(r"\{n:(\d+), име:'[^']+', пълно:'[^']+', валута:'(светлина|злато)'", t)},
                         {n: ('светлина' if n in (1, 4, 9, 12) else 'злато') for n in range(1, 13)}, 'валутата в таблицата на драйвера')
        self.съдържа(h, 'id="mm-sum-l"', 'легендата светлина'); self.съдържа(h, 'id="mm-sum-g"', 'легендата злато')

    def test_93_клик_отваря_картата_нива_заковани_картата_изчистена(self):
        blk = self._блок(); h = self._hero()
        self.assertEqual(len(re.findall(r'<g class="mm-a" role="button" tabindex="0" data-n="\d+"', h)), 12, '12 хит-сектора (SVG · role=button · tabindex)')
        self.assertLess(h.index('<canvas class="mm-dust"'), h.index('<svg class="mm-hit"'), 'хит-слоят е над праха')
        self.assertRegex(blk, r"бутони\.forEach\(b=>\{[\s\S]*?b\.addEventListener\('click',\(\)=>\{[^\n]*отвори\(k\)", 'тап/клик на област → отвори(k)')
        self.assertRegex(blk, r"b\.addEventListener\('keydown'", 'Enter/Space = клик (a11y)')
        self.assertIn('function отвори(k)', blk); self.assertIn('function затвори()', blk); self.assertIn("e.key==='Escape'", blk)
        self.assertRegex(blk, r"b\.addEventListener\('pointerenter'", 'hover = фокус (мишка)')
        self.assertRegex(blk, r'ъгълЦел=възли\[k\]\.a', 'фокус → стрелката сочи областта'); self.assertIn("стрелка.setAttribute('transform','rotate('", blk, 'стрелката се върти около оста (200,200)')
        self.съдържа(self.b, 'id="mmcard"', 'оверлеят на картата')
        к = re.search(r'<div id="mmcard"(.*?)\n</div>\n', self.b, re.S).group(1)
        for част in ('role="dialog"', 'class="mmc-tb"', 'class="mmc-art"', 'class="mmc-bd tl"', 'class="mmc-bd tr"', 'id="mmc-nm"', 'class="mmc-ln"', 'class="mmc-x"'):
            self.съдържа(к, част, f'структурата на изчистената карта · {част}')
        for махнато in ('mmc-ty', 'mmc-ft', 'mmc-bd bl', 'mmc-bd br', 'class="line"'):
            self.assertNotIn(махнато, к, f'картата е изчистена · без {махнато}')
        css = self.src[self.src.index('<style>'):self.src.index('</style>')]
        self.assertIn('.mmc-art{position:relative;z-index:6;border:2px solid var(--gd);border-radius:8px;overflow:hidden;box-shadow:inset 0 0 0 2px rgba(255,240,190,.6);aspect-ratio:4/5;max-height:58vh', css, 'образът е по-голям (4/5 · 58vh · беше 4/4.6 · 44vh)')
        self.assertIn('.mmc-nm{position:relative;z-index:6;font-size:1.65rem;font-weight:700', css, 'името е едро и тъмно (четимо)')
        self.assertNotIn('.mmc::before', css, 'нула двойна art-nouveau рамка (изчистена)')
        self.assertNotIn('Cinzel', self.src, 'нула нов шрифт'); self.assertEqual(len(re.findall(r'<link\b', self.src)), 4, 'нула нов <link>')
        t = self._таблица()
        self.assertRegex(t, r"\{n:9, име:'Призвание', пълно:'Призвание и Кариера', валута:'светлина', ниво:8, буд:'куражку'", 'Призвание 8/10 → Куражку (заковано)')
        self.assertRegex(t, r"\{n:3, име:'Ум', пълно:'Ум и Ментал', валута:'злато', ниво:5, буд:'еко'", 'Ум 5/10 → Екопътечко (заковано)')
        sk = self._скелет()
        свг = {int(n): int(l) for n, l in re.findall(r'<g class="mm-n" data-n="(\d+)" data-валута="[^"]+" data-ниво="(\d+)"', sk)}
        js = {int(n): int(l) for n, l in re.findall(r"\{n:(\d+), име:'[^']+', пълно:'[^']+', валута:'[^']+', ниво:(\d+)", t)}
        self.assertEqual(len(js), 12); self.assertEqual(свг, js, 'пръстените носят нивата на таблицата')
        L = sum(l for n, l in js.items() if n in (1, 4, 9, 12)); G = sum(l for n, l in js.items() if n not in (1, 4, 9, 12))
        self.съдържа(h, f'<b id="mm-sum-l">{L}/40</b>', 'статичната легенда = сумата светлина'); self.съдържа(h, f'<b id="mm-sum-g">{G}/80</b>', 'статичната легенда = сумата злато')
        for n, l in js.items():
            self.assertRegex(h, rf'<g class="mm-a" role="button" tabindex="0" data-n="{n}" [^>]*aria-label="[^"]*ниво {l} от 10', f'aria-етикетът на {n} носи нивото')

    def test_94_медальон_мап_будечители_по_колелото_пазач_протагонист(self):
        t = self._таблица(); blk = self._блок()
        for n, fl in self.МЕДАЛЬОНИ.items():
            self.assertRegex(t, rf"\{{n:{n}, [^\n]*img:'img/nz-sferi/{re.escape(fl)}'", f'медальонът на {n} = {fl} (12-сфери-мап.md)')
            self.assertTrue((ROOT / 'img' / 'nz-sferi' / fl).exists(), f'{fl} е на диска')
        self.assertIn("{име:'Питагор',img:'img/nz-sferi/nz-sfera-11a-питагор.png'},{име:'Фибоначи',img:'img/nz-sferi/nz-sfera-11b-фибоначи.png'}", t, 'Мъдрост = 2 образа')
        self.assertEqual({int(n): b for n, b in re.findall(r"\{n:(\d+), [^\n]*?буд:'([^']+)'", t)}, self.КОЛЕЛО, 'будечител↔област = Колело-СКЕЛЕТ')
        for ключ, име in (('доверка', 'Доверка'), ('любка', 'Любка'), ('еко', 'Екопътечко'), ('куражку', 'Куражку'), ('обемко', 'Обемко'), ('хола', 'Хола'), ('фибо', 'Фибоначко'), ('творея', 'Творея')):
            self.assertRegex(blk, rf"{ключ}:\['{име}','..','", f'{име} в БУД')
        self.assertIn("УМЧО={име:'Умчо Вълчев',роля:'Осъждане',img:'img/ant-умчо.jpg'}", blk); self.assertIn("УМА={име:'Ума Лисева',роля:'Обмисляне',img:'img/ant-ума.jpg'}", blk)
        self.assertRegex(t, r"\{n:3, [^\n]*пазач:БЕГА, прот:УМЧО\}", 'Ум: протагонист-загатнат Умчо Вълчев · пазач Бега (по Еко)')
        self.assertRegex(t, r"\{n:11, [^\n]*пазач:УМА, прот:null\}", 'Мъдрост: пазач Ума Лисева')
        self.assertRegex(t, r"\{n:2, [^\n]*пазач:ЕГО"); self.assertRegex(t, r"\{n:5, [^\n]*пазач:ЕГО")
        self.assertEqual(len(re.findall(r'пазач:null', t)), 8, 'осем области без закован пазач → „—“ (за дума на Митрандир)')
        self.assertEqual(len(re.findall(r'прот:null', t)), 11, 'само Ум има загатнат протагонист')
        for fl in ('ant-его.jpg', 'ant-бега.jpg', 'ant-ума.jpg', 'ant-умчо.jpg'):
            self.assertTrue((ROOT / 'img' / fl).exists(), fl)
        self.assertNotIn('Станка', blk); self.assertNotIn('Страхил', blk); self.assertNotIn('Времетрон', blk)

    def test_95_self_contained_2D_canvas_нула_нова_зависимост(self):
        blk = self._блок()
        self.assertIn("$('#mettadust')", blk, 'прахът рисува на своя canvas'); self.assertRegex(blk, r"getContext\('2d'\)", '2D-canvas')
        for з in ('THREE', 'WebGL', 'webgl', 'gl.create', 'importScripts', 'fetch('):
            self.assertNotIn(з, blk, f'нула {з}')
        self.assertEqual(len(self.sc), 4, 'пак точно 4 script-а'); self.assertEqual(re.findall(r'<script\b[^>]*\bsrc=', без_коментари(self.src)), [], 'нула външен src')
        self.assertIn('<canvas class="mm-dust" id="mettadust"', self._hero())
        self.assertRegex(blk, r'requestAnimationFrame\(кадър\)', 'rAF-цикъл'); self.assertRegex(blk, r"addEventListener\('resize',resize\)")

    def test_96_холограмен_принцип_прахът_свързва_частите_повече_игра(self):
        blk = self._блок()
        self.assertIn('const лемниската=t=>', blk, '∞-потокът'); self.assertRegex(blk, r'ЛЕМ=\{a1:150,a2:80,w:96\}', 'върхът стига външния пръстен (злато) · опашката вътрешния (светлина)')
        self.assertRegex(blk, r'x=200\+lx\*cq-ly\*sq, y=200\+lx\*sq\+ly\*cq', '∞ живее в координатите на стрелката (върти се с нея)')
        self.assertRegex(blk, r'm=clamp\(1-\(rr-60\)/60,0,1\)', 'цветът се прелива по радиуса: светлина вътре → злато навън')
        self.assertIn('const ПОТОК=[]', blk); self.assertIn('const ПРАХ=[]', blk); self.assertIn('const ПРЪСТЕН=[]', blk); self.assertIn('const ИСКРИ=[]', blk)
        self.assertRegex(blk, r'NP=reduce\?110:220', '2× поток (беше 150)'); self.assertRegex(blk, r'n=reduce\?\(5\+v\.обл\.ниво\*2\):\(8\+v\.обл\.ниво\*4\)', 'гъстотата на праха ∝ нивото (по-гъста)')
        self.assertRegex(blk, r'\(0\.24\+0\.56\*lv\)', 'яркостта ∝ нивото')
        self.assertIn('for(let i=0;i<70;i++) ПРЪСТЕН.push', blk); self.assertIn('for(let i=0;i<50;i++) ПРЪСТЕН.push', blk)
        self.assertIn('function изблик(k)', blk, 'изблик от сърцето при избор'); self.assertRegex(blk, r'следа|tip=пол\(176,ъгъл\)', 'следа на стрелката')
        self.assertIn('function фокусирай(k)', blk); self.assertIn('function гостувай(k)', blk, 'в покой стрелката обхожда профила')
        self.assertRegex(blk, r'x\+=\(fx\+Math\.cos\(ang\)\*ro-x\)\*kk', 'фокус → прахът се стича към областта')
        sk = self._скелет()
        лем = re.search(r'<path class="lem" d="M([^"]+)"', sk).group(1)
        self.assertIn('200.0,50.0', лем, '∞ върхът = r 150 (външния пръстен)'); self.assertIn('200.0,280.0', лем, '∞ опашката = r 80 (вътрешния пръстен)'); self.assertIn('200.0,200.0', лем, '∞ кръстът = сърцето')

    def test_97_reduced_motion_постер_и_деплой(self):
        blk = self._блок()
        self.assertRegex(blk, r'if\(reduce\) return;\s*/\* reduced-motion', 'reduced-motion: един статичен кадър, без rAF-цикъл')
        self.assertIn('if(!ctx){', blk, 'без canvas-контекст → SVG-скелетът остава постер, стрелката и картата пак работят')
        h = self._hero()
        self.assertIn('<svg class="mm-skel" viewBox="0 0 400 446"', h, 'SVG-скелетът е статичен в маркъпа (постерът · 400 циферблат + 46 лента)')
        self.assertIn('<div class="tap mm-tap" aria-hidden="true"><i></i><span>докоснете област · карта</span></div>', h, 'подсказката „докоснете“ (закон в · class="tap mm-tap": test_43 брои точно 8 сцени с class="tap")')
        self.assertIn("host.classList.add('seen')", blk, 'подсказката гасне при първа интеракция')
        dep = чети(DEPLOY)
        self.assertIn('id="mettamap"', dep); self.assertIn("img:'/img/nz-sferi/", dep, 'деплой-копието носи абсолютните пътища')
        self.assertIn('MET-807', '\n'.join(self.src.splitlines()[:40]), 'хедърът носи тикета')

if __name__ == '__main__':
    unittest.main()
