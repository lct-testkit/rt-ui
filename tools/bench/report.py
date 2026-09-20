"""Rewrite the generated tables of docs/BENCHMARK.md from tools/bench/results/{size,runtime}.json.

  python tools/bench/report.py                       # rewrites the blocks between the markers in docs/BENCHMARK.md
  python tools/bench/report.py --doc /tmp/copy.md --runtime tools/bench/results/runtime.smoke.json   # try it on a copy

Markers (already in the doc; everything between them is replaced, the rest of the doc is never touched):
  <!--BENCH_SIZE-->...<!--/BENCH_SIZE-->        bundle sizes, tree-shaking probe, marginal cost of components
  <!--BENCH_RUNTIME-->...<!--/BENCH_RUNTIME-->  budgets summary, scenario load, table, mount, leaks, CSS coverage
  <!--BENCH_ENV-->...<!--/BENCH_ENV-->          machine / browser / tool versions of the run
"""
import argparse
import json
import re
import sys
from pathlib import Path

BENCH = Path(__file__).resolve().parent
DOC = BENCH.parent.parent / 'docs' / 'BENCHMARK.md'

# ---- budgets: section 4 of docs/BENCHMARK.md -------------------------------------------------------------------
BUDGET_S2_BROTLI_KB = 100      # form (S2), JS + CSS of one theme, brotli, without fonts
BUDGET_TABLE_1000_MS = 150     # first render of a 1000-row table, desktop
BUDGET_SCROLL_FPS = 55         # scrolling 10 000 rows with virtualization
BUDGET_LEAK_PCT = 5            # heap growth after 200 open/close cycles
BUDGET_REMOUNT_1000_MS = 30    # re-mounting 1000 buttons

KB = 1024
NA = '—'
ORDER = ['s0', 's0r', 's1', 's1b', 's1n', 's2', 's3', 's4', 's5']


def ordered(d):
    return sorted(d.items(), key=lambda kv: ORDER.index(kv[0]) if kv[0] in ORDER else 99)


def skb(n):
    return f'{n / KB:+.1f}'


def kb(n, d=1):
    return NA if n is None else f'{n / KB:.{d}f}'


def num(v, d=1):
    if v is None:
        return NA
    return f'{v:.{d}f}'.replace('.0', '') if d == 1 and abs(v) >= 100 else f'{v:.{d}f}'


def med(g, key, d=1, spread=False):
    """median of a stat dict {key: {median,min,max}} -> text; spread adds (min-max)"""
    s = (g or {}).get(key)
    if not s:
        return NA
    t = num(s['median'], d)
    if spread and s['n'] > 1:
        t += f' ({num(s["min"], d)}–{num(s["max"], d)})'
    return t


def medv(g, key):
    s = (g or {}).get(key)
    return s['median'] if s else None


def status(ok):
    return NA if ok is None else ('пройден' if ok else '**НЕ пройден**')


def table(head, rows, align=None):
    align = align or ['l'] + ['r'] * (len(head) - 1)
    sep = ['---:' if a == 'r' else '---' for a in align]
    out = ['| ' + ' | '.join(head) + ' |', '|' + '|'.join(sep) + '|']
    out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
    return '\n'.join(out)


# ------------------------------------------------------------------------------------------------ size block
def size_block(size):
    if not size:
        return '_Нет данных: выполните `npm run bench:size`, затем `npm run bench:report`._'
    sc = size['scenarios']
    v = size.get('versions', {})
    out = [f'Сборка: Vite {v.get("vite")}, Svelte {v.get("svelte")}, JS — {size["settings"]["jsMinifier"]}, CSS — {size["settings"]["cssMinifier"]} '
           f'{v.get("lightningcss") or ""}; gzip уровень {size["settings"]["gzipLevel"]}, brotli качество {size["settings"]["brotliQuality"]}; '
           f'КБ = 1024 байта; JS и CSS — только чанки, которые страница грузит сразу; шрифты отдельно. Дата: {size["generatedAt"][:10]}.', '']
    rows = []
    for sid, s in ordered(sc):
        if 'error' in s:
            rows.append([f'**{sid}**', s.get('title', ''), 'ошибка сборки', '', '', '', '', '', '', ''])
            continue
        total_br = s['total']['brotli']
        budget = NA
        if sid == 's2':
            budget = f'≤ {BUDGET_S2_BROTLI_KB} КБ br: {status(total_br / KB <= BUDGET_S2_BROTLI_KB)}'
        title = s['title'] + (' *' if s.get('extra') else '')
        rows.append([title, s['imports'], kb(s['js']['raw']), kb(s['js']['gzip']), kb(s['js']['brotli']),
                     kb(s['css']['raw']), kb(s['css']['gzip']), kb(s['css']['brotli']), f'**{kb(total_br)}**', budget])
    out.append(table(['Сценарий', 'Что импортирует', 'JS raw', 'JS gzip', 'JS br', 'CSS raw', 'CSS gzip', 'CSS br', 'JS+CSS br', 'Бюджет'], rows,
                     ['l', 'l'] + ['r'] * 7 + ['l']))
    out.append('\n\\* — дополнительные сценарии сверх S0–S5 (проверка tree-shaking, см. ниже).')

    base = next((s for s in sc.values() if s.get('fonts', {}).get('woff2', {}).get('raw')), None)
    if base:
        w = base['fonts']['woff2']
        hashed = re.compile(r'-[A-Za-z0-9_]{6,}(?=[.]woff)')
        names = ', '.join(hashed.sub('', f['file'].split('/')[-1]) + ' ' + kb(f['raw']) for f in w['files'])
        out.append(f'\n**Шрифты** (Rostelecom Basis, woff2, отдельной строкой, в JS+CSS не входят): {names}; итого **{kb(w["raw"])} КБ** '
                   f'(woff2 уже сжат, gzip/br почти не помогают: {kb(w["brotli"])} КБ br). Начертание Light поставляется только как woff ({kb(base["fonts"]["woff"]["raw"])} КБ вместе с запасными woff).')

    # tree-shaking probe
    s1, s1b, s1n = sc.get('s1'), sc.get('s1b'), sc.get('s1n')
    if s1 and s1b and 'js' in s1 and 'js' in s1b:
        out.append('\n#### Tree-shaking: одна кнопка напрямую и через barrel\n')
        rows = []
        for name, s in (('S1: `import Button from …/Button.svelte` (прямой импорт)', s1),
                        ('S1b: `import { Button } from src/lib/index.ts` (barrel, поле `sideEffects` из package.json)', s1b),
                        ('S1n: то же, но `sideEffects` игнорируется (что было бы без поля)', s1n)):
            if s and 'js' in s:
                m = s.get('modules', {})
                rows.append([name, kb(s['js']['raw']), kb(s['js']['brotli']), m.get('libCount', NA), m.get('count', NA)])
        out.append(table(['Вариант', 'JS raw, КБ', 'JS br, КБ', 'модулей `src/lib` в бандле', 'модулей всего'], rows))
        extra_b = s1b['js']['raw'] - s1['js']['raw']
        if extra_b < 1024:
            note = ('\nBarrel не тяжелее прямого импорта (разница ' + str(extra_b) + ' Б), то есть tree-shaking через `src/lib/index.ts` работает: '
                    'его обеспечивает поле `"sideEffects": ["**/*.css"]` в `package.json`.')
        else:
            note = ('\n**Через barrel в бандл попадает ' + kb(extra_b) + ' КБ лишнего JS (×' + f'{s1b["js"]["raw"] / s1["js"]["raw"]:.1f}' + ' к прямому импорту):** сборщик считает модули библиотеки и её '
                    'зависимостей (imask, dayjs, virtua …) имеющими побочные эффекты — проверьте поле `sideEffects` в `package.json`.')
        if s1n and 'js' in s1n:
            note += ' Без этого поля (S1n) barrel тащил бы ' + kb(s1n['js']['raw'] - s1['js']['raw']) + ' КБ лишнего JS (×' + f'{s1n["js"]["raw"] / s1["js"]["raw"]:.1f}' + ').'
        out.append(note)

    # marginal cost
    mg = {k: v for k, v in size.get('marginal', {}).items() if k != '_baseline' and 'error' not in v}
    if mg:
        b = size['marginal'].get('_baseline', {})
        out.append(f'\n#### Цена каждого компонента сверх S1 (кнопка: JS {kb(b.get("js", {}).get("brotli"))} КБ br, CSS {kb(b.get("css", {}).get("brotli"))} КБ br)\n')
        rows = [[k, skb(v['js']['raw']), skb(v['js']['gzip']), skb(v['js']['brotli']), skb(v['css']['brotli']), '+' + str(v['libModules'])]
                for k, v in sorted(mg.items(), key=lambda kv: -kv[1]['js']['brotli'])]
        out.append(table(['Компонент (S1 + он)', 'JS raw', 'JS gzip', 'JS br', 'CSS br', 'модулей lib'], rows))
        out.append('\nCSS монолитный (`components.css` подключается целиком), поэтому CSS почти не зависит от набора компонентов; '
                   'CSS авторского расширения (`ext.css`, только движение) в сборку не попадает: его импортируют лишь `@lct-testkit/rt-ui/ext` и `ExtMotionProvider`; Modal / Drawer подтягивают только крошечную раскладку `fullHeight` (`ext/layout-modal.css` / `layout-drawer.css`, ≈ 1 КБ каждая).')
        parts = [mg[k]['js']['brotli'] for k in ('Input', 'Select', 'Checkbox', 'Switch', 'Modal') if k in mg]
        s2 = sc.get('s2')
        if len(parts) == 5 and s1 and s2 and 'js' in s2:
            out.append(f'Проверка на пропорциональность: S2 − S1 = {kb(s2["js"]["brotli"] - s1["js"]["brotli"])} КБ br, сумма отдельных цен '
                       f'Input + Select + Checkbox + Switch + Modal = {kb(sum(parts))} КБ br (разница — общий код: Popper, DropdownMenu, virtua, Svelte runtime).')
    return '\n'.join(out)


# ------------------------------------------------------------------------------------------------ env block
def env_block(run, size):
    if not run:
        if not size:
            return '_Нет данных: выполните `npm run bench:runtime`, затем `npm run bench:report`._'
        v = size.get('versions', {})
        rows = [['Сборка (bench:size)', f'{size["generatedAt"][:16].replace("T", " ")} UTC; Node {v.get("node")}, Vite {v.get("vite")}, Svelte {v.get("svelte")}, React {v.get("react")}, Lightning CSS {v.get("lightningcss")}'],
                ['Браузер, CPU, память', '_появятся после `npm run bench:runtime`_']]
        return table(['Параметр', 'Значение'], rows, ['l', 'l'])
    e, st = run['env'], run['settings']
    rows = [
        ['Процессор', f'{e.get("cpu")} ({e.get("threads")} потоков)'],
        ['Память', f'{e.get("ram_gb")} ГБ'],
        ['ОС', e.get('os')],
        ['Браузер', f'Chromium {e.get("chromium")} ({"headless" if e.get("headless") else "с окном"}, viewport {e.get("viewport")}), Playwright {e.get("playwright")}'],
        ['Инструменты', f'Node {e.get("node")}, Vite {e.get("vite")}, Svelte {e.get("svelte")}, React {e.get("react")}, Python {e.get("python")}'],
        ['Калибровка CPU', f'{e.get("cpu_calibration_ms")} мс (фиксированный JS-цикл 3·10⁷ sqrt; медиана из 7; нужен, чтобы сравнивать прогоны между машинами и ловить фоновую нагрузку)'],
        ['Прогон', f'{e.get("date", "")[:16].replace("T", " ")} UTC, {run.get("elapsed_s", "?")} с; запусков {st["runs"]} после {st["warmup"]} прогревочных '
                   f'(таблица 10 000 строк: {st["big_runs"]} после {st["big_warmup"]}), троттлинг CPU {"×" + str(st["throttle"]) if st.get("throttle") else "выключен"}, '
                   f'прокрутка {st["scroll_ms"]} мс, циклов попапов {st["leak_cycles"]}'],
        ['Условия', e.get('note', '')],
    ]
    return table(['Параметр', 'Значение'], rows, ['l', 'l'])


# ------------------------------------------------------------------------------------------------ runtime block
def runtime_block(run, size):
    if not run:
        return '_Нет данных: выполните `npm run bench:runtime`, затем `npm run bench:report`._'
    passes = run['passes']
    p1 = passes.get('cpu1', {})
    p4 = next((v for k, v in passes.items() if k != 'cpu1'), None)
    label4 = next((f'×{v["cpu_rate"]:g}' for k, v in passes.items() if k != 'cpu1'), '×4')
    out = []

    # ---- budgets
    t = p1.get('table', {})
    mt = p1.get('mount', {})
    lk = p1.get('leak', {})
    sc = (size or {}).get('scenarios', {})
    rows = []
    s2 = sc.get('s2')
    if s2 and 'total' in s2:
        v = s2['total']['brotli'] / KB
        rows.append(['Форма (S2): JS + CSS одной темы, brotli, без шрифтов', f'≤ {BUDGET_S2_BROTLI_KB} КБ', f'{v:.1f} КБ', status(v <= BUDGET_S2_BROTLI_KB)])
    for mode in ('all', 'paged', 'virtual'):
        g = t.get(f't1000_{mode}')
        if g:
            v = medv(g, 'mount_ms')
            rows.append([f'Первый рендер таблицы на 1 000 строк (режим `{mode}`{", каждая строка в DOM" if mode == "all" else ""})', f'≤ {BUDGET_TABLE_1000_MS} мс',
                         f'{v:.0f} мс' if v is not None else NA, status(None if v is None else v <= BUDGET_TABLE_1000_MS) if mode == 'all' else NA])
    g = t.get('t10000_virtual')
    if g:
        v = medv(g, 'scroll_fps')
        vis = medv(g, 'table_visible_cells')
        shown = f'{v:.1f} fps ({num(medv(g, "scroll_slow_frames_pct"))} % медленных кадров)' if v is not None else NA
        if vis is not None and vis == 0:
            shown += ', **тело таблицы пустое** (видимых ячеек: 0)'
            st = 'не применимо: виртуализация ничего не показывает'
        else:
            st = status(None if v is None else v >= BUDGET_SCROLL_FPS)
        rows.append(['Прокрутка 10 000 строк с виртуализацией', f'≥ {BUDGET_SCROLL_FPS} fps', shown, st])
    for kind, title in (('popover', 'Popover'), ('select', 'Select'), ('modal', 'Modal')):
        g = lk.get(kind)
        if g and 'heap_growth_pct' in g:
            v = medv(g, 'heap_growth_pct')
            rows.append([f'Утечки: heap после {run["settings"]["leak_cycles"]} циклов открыть/закрыть ({title})', f'< {BUDGET_LEAK_PCT} %', f'{v:+.1f} %', status(v < BUDGET_LEAK_PCT)])
    g = mt.get('button_1000')
    if g:
        v = medv(g, 'remount_ms')
        rows.append(['Повторное монтирование 1 000 кнопок', f'≤ {BUDGET_REMOUNT_1000_MS} мс', f'{v:.1f} мс', status(v <= BUDGET_REMOUNT_1000_MS)])
    if rows:
        out.append('#### Бюджеты (раздел 4)\n')
        out.append(table(['Критерий', 'Бюджет', 'Измерено (CPU ×1)', 'Статус'], rows, ['l', 'r', 'r', 'l']))
        out.append('')

    # ---- scenarios
    ss = p1.get('scenarios', {})
    if ss:
        s4 = (p4 or {}).get('scenarios', {})
        out.append('#### Загрузка сценариев (production-сборка, свежий контекст на каждый запуск)\n')
        out.append('`ready` — от начала навигации до готовности DOM после `mount`; `mount` — только `mount()` + эффекты; '
                   '`Script/Style/Layout/Task` — CDP `Performance.getMetrics` (мс, за всю загрузку); heap — после принудительного GC.\n')
        rows = []
        for sid, g in ordered(ss):
            if 'ready_ms' not in g:
                rows.append([sid, 'ошибка', '', '', '', '', '', '', '', '', ''])
                continue
            rows.append([f'**{sid}**', med(g, 'ready_ms', 0, True), med(g, 'fcp_ms', 0), med(g, 'mount_ms', 0), med(g, 'script_ms', 0), med(g, 'style_ms', 0),
                         med(g, 'layout_ms', 0), med(g, 'task_ms', 0), med(g, 'dom_elements', 0), med(g, 'heap_kb', 0), med(g, 'css_rules', 0)])
        out.append(table(['Сценарий', 'ready, мс', 'FCP, мс', 'mount, мс', 'Script', 'Style', 'Layout', 'Task', 'DOM-элементов', 'heap, КБ', 'CSS-правил'], rows))
        if s4:
            out.append(f'\nТо же при троттлинге CPU {label4} (медианы):\n')
            rows = [[f'**{sid}**', med(g, 'ready_ms', 0, True), med(g, 'fcp_ms', 0), med(g, 'mount_ms', 0), med(g, 'script_ms', 0), med(g, 'style_ms', 0), med(g, 'task_ms', 0)]
                    for sid, g in ordered(s4) if 'ready_ms' in g]
            out.append(table(['Сценарий', f'ready {label4}, мс', 'FCP, мс', 'mount, мс', 'Script', 'Style', 'Task'], rows))
        out.append('')

    # ---- table
    if t:
        t4 = (p4 or {}).get('table', {})
        out.append('#### Таблица (S3): 8 колонок, сортировка, выбор, раскрытие каждой 10-й строки\n')
        out.append('Режимы: `all` — все строки в DOM, `paged` — 20 строк на страницу через `Pagination`, `virtual` — `virtual` таблицы (virtua, экспериментальный). '
                   '«Первый рендер» — `mount()` + эффекты; fps и доля кадров дольше 16,7 мс (+1 мс допуска) — программная прокрутка контейнера '
                   f'{run["settings"]["scroll_ms"]} мс; сортировка / выбрать все / раскрыть — от клика до следующего кадра.\n')
        rows = []
        for key, g in sorted(t.items(), key=lambda kv: (kv[1].get('rows', 0), ['all', 'paged', 'virtual'].index(kv[1].get('mode', 'all')) if kv[1].get('mode') in ('all', 'paged', 'virtual') else 9)):
            if 'mount_ms' not in g:
                rows.append([f'{g.get("rows", key)}', g.get('mode', ''), 'ошибка', '', '', '', '', '', '', '', '', '', ''])
                continue
            r4 = t4.get(key, {})
            rows.append([f'{g["rows"]:,}'.replace(',', ' '), g['mode'], med(g, 'mount_ms', 0, True), med(r4, 'mount_ms', 0), med(g, 'table_rows_in_dom', 0), med(g, 'table_visible_cells', 0), med(g, 'dom_elements', 0),
                         num((medv(g, 'heap_kb') or 0) / 1024) if medv(g, 'heap_kb') is not None else NA, med(g, 'scroll_fps', 1), med(g, 'scroll_slow_frames_pct', 0),
                         med(g, 'sort_ms', 0), med(g, 'select_all_ms', 0), med(g, 'expand_ms', 0)])
        out.append(table(['Строк', 'Режим', 'Первый рендер, мс', f'рендер {label4}, мс', 'строк в DOM', 'видимых ячеек', 'DOM-элементов', 'heap, МБ', 'fps', 'медл. кадров, %', 'сортировка, мс', 'выбрать все, мс', 'раскрыть, мс'], rows,
                         ['r', 'l'] + ['r'] * 11))
        out.append('')

    # ---- mount
    if mt:
        m4 = (p4 or {}).get('mount', {})
        out.append('#### Монтирование N компонентов\n')
        out.append('«Холодный» — первый `mount()` на свежей странице, «повторный» — медиана трёх следующих после `unmount()`, «+paint» — до двух кадров после монтирования.\n')
        rows = []
        for key, g in mt.items():
            if 'mount_cold_ms' not in g:
                rows.append([key, 'ошибка', '', '', '', '', ''])
                continue
            r4 = m4.get(key, {})
            rows.append([f'{g["n"]} × {g["kind"]}', med(g, 'mount_cold_ms', 1, True), med(g, 'remount_ms', 1, True), med(g, 'unmount_ms', 1), med(g, 'mount_painted_ms', 0),
                         med(g, 'dom_elements', 0), f'{med(r4, "mount_cold_ms", 0)} / {med(r4, "remount_ms", 0)}'])
        out.append(table(['Случай', 'холодный, мс', 'повторный, мс', 'unmount, мс', '+paint, мс', 'DOM-элементов', f'{label4}: холодный / повторный'], rows))
        out.append('')

    # ---- leaks
    if lk:
        out.append(f'#### Утечки: {run["settings"]["leak_cycles"]} циклов открыть/закрыть\n')
        out.append('Heap измеряется после принудительного GC (`HeapProfiler.collectGarbage` ×3) до и после серии; «наклон» — МНК по точкам каждые 25 %; '
                   '`control` — «пустой» переключаемый блок Svelte: уровень шума самого стенда. Попапы Popover/Select остаются в DOM в закрытом состоянии (как в React).\n')
        rows = []
        for kind, g in lk.items():
            if 'heap_growth_pct' not in g:
                rows.append([kind, 'ошибка', '', '', '', '', '', ''])
                continue
            bud = NA if kind == 'control' else status(medv(g, 'heap_growth_pct') < BUDGET_LEAK_PCT)
            rows.append([kind, med(g, 'heap_start_kb', 0), med(g, 'heap_end_kb', 0), f'{medv(g, "heap_growth_pct"):+.1f}', num(medv(g, 'heap_slope_kb_per_100_cycles'), 1),
                         f'{num(medv(g, "heap_growth_2nd_half_pct"), 1)}', f'{med(g, "dom_elements_start", 0)} → {med(g, "dom_elements_end", 0)}',
                         f'{med(g, "listeners_start", 0)} → {med(g, "listeners_end", 0)}', bud])
        out.append(table(['Попап', 'heap до, КБ', 'heap после, КБ', 'рост, %', 'наклон, КБ/100 циклов', 'рост 2-й половины, %', 'DOM-элементов', 'слушателей', f'Бюджет (< {BUDGET_LEAK_PCT} %)'], rows,
                         ['l'] + ['r'] * 7 + ['l']))
        out.append('')

    # ---- coverage
    cv = p1.get('coverage', {})
    if cv:
        out.append('#### CSS coverage (`CSS.startRuleUsageTracking`, правил `CSSStyleRule` в CSSOM)\n')
        rows = []
        for key, g in cv.items():
            if 'rules_total' not in g:
                rows.append([key, 'ошибка', '', '', '', ''])
                continue
            rows.append([{'s2': 'S2 (форма)', 's3': 'S3 (таблица, 1000 строк, `paged`)'}.get(key, key), f'{g["rules_total"]:,}'.replace(',', ' '),
                         f'{g["rules_used_after_load"]} ({g["rules_used_after_load_pct"]:.1f} %)', f'{g["rules_used_after_interaction"]} ({g["rules_used_after_interaction_pct"]:.1f} %)',
                         f'{g["bytes_used_after_load_pct"]:.1f} % / {g["bytes_used_after_interaction_pct"]:.1f} %',
                         'да' if not g.get('interaction_error') else 'частично: ' + (g['interaction_error'] or '')])
        out.append(table(['Страница', 'Правил в CSS', 'Использовано после загрузки', 'после сценария взаимодействий', 'Доля байт CSS: загрузка / взаимодействие', 'Сценарий выполнен'], rows,
                         ['l', 'r', 'r', 'r', 'r', 'l']))
        out.append('\nВзаимодействия: фокус и ввод, выбор в `Select`, чекбокс, переключатель, открытие/закрытие `Modal` (S2); сортировка, выбор всех, раскрытие строки, '
                   '`Select` размера страницы, следующая страница (S3). Правила состояний, которые сценарий не вызывает (ошибки, disabled, другие размеры и варианты), остаются «неиспользованными» — '
                   'это нижняя граница, а не мерка «мёртвого» CSS.')
    return '\n'.join(out).rstrip()


# ------------------------------------------------------------------------------------------------ main
def replace_block(text, name, body):
    pat = re.compile(rf'(<!--{name}-->)(.*?)(<!--/{name}-->)', re.S)
    if not pat.search(text):
        sys.exit(f'marker <!--{name}--> ... <!--/{name}--> not found in the doc')
    return pat.sub(lambda m: f'{m.group(1)}\n{body}\n{m.group(3)}', text, count=1)


def load(path):
    p = Path(path)
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--doc', default=str(DOC))
    ap.add_argument('--size', default=str(BENCH / 'results' / 'size.json'))
    ap.add_argument('--runtime', default=str(BENCH / 'results' / 'runtime.json'))
    a = ap.parse_args()
    size, run = load(a.size), load(a.runtime)
    if not size and not run:
        sys.exit('no results: run `npm run bench:size` and/or `npm run bench:runtime` first')
    doc = Path(a.doc)
    raw = doc.open(encoding='utf-8', newline='').read()  # newline='' keeps the CRLF of the doc
    crlf = '\r\n' in raw
    text = raw.replace('\r\n', '\n')
    text = replace_block(text, 'BENCH_SIZE', size_block(size))
    text = replace_block(text, 'BENCH_ENV', env_block(run, size))
    text = replace_block(text, 'BENCH_RUNTIME', runtime_block(run, size))
    doc.write_text(text.replace('\n', '\r\n') if crlf else text, encoding='utf-8', newline='')
    print(f'updated {doc}: size {"yes" if size else "no data"}, runtime {"yes" if run else "no data"}')


if __name__ == '__main__':
    main()
