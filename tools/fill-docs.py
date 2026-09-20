"""Fill the numeric placeholders of docs/*.md and README.md from real project data.

  python tools/fill-docs.py

Placeholders (kept in the file as HTML comments so the script can be re-run at any time):
  <!--PASS_LINE-->  <!--HEADLINE-->  <!--BIG_PASS-->  <!--METRICS_SHORT-->  <!--METRICS-->  <!--GROUPS-->     (docs/*.md)
  <!--STATS-->  (README: the stats line under the title)   <!--CATALOG-->  (README: the component catalogue with pass counts per category)
Each replaced region is wrapped as  <!--X-->...<!--/X-->  so a second run refreshes it.
"""
import datetime, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools', 'metrics.py'), '--json'], cwd=ROOT).decode('utf-8'))

total, ok, bad = m['reference_stories'], m['stories_pass'], m['stories_fail']
pct = round(100 * ok / total, 1)
aa = m.get('stories_pass_aa_only', 0)
aa_note = (f' (из них {aa} — с допуском anti-aliasing: не более 12 краевых пикселей, разница цвета не более 40 уровней; остальные {ok - aa} совпадают точно)' if aa else '')
today = datetime.date.today().strftime('%d.%m.%Y')

values = {
    'PASS_LINE': f'**{ok} из {total} ({pct}%)**',
    'HEADLINE': f'**{ok} из {total} историй ({pct}%) проходят попиксельную сверку** во всех проверяемых состояниях' + aa_note + '; цель — 100%',
    'BIG_PASS': f'{ok} из {total}',
    'METRICS_SHORT': f'{ok}/{total} историй ({pct}%), {m["component_dirs"]} компонентов, {m["icons_generated"]} иконок, 4 темы, таблица 24/24',
}

rows = [
    ('Эталонных историй Storybook (gen2)', m['reference_stories']),
    ('Групп историй в эталоне', m['reference_story_groups']),
    ('Эталонных скриншотов (все состояния)', m['reference_screenshots']),
    ('**Историй проходят сверку (DOM + боксы + пиксели)**', f'{ok} из {total} ({pct}%)'),
    ('из них только с допуском anti-aliasing (≤12 краевых пикселей, Δ≤40)', aa),
    ('Историй не проходят сейчас', bad),
    ('Состояний сверено (последний прогон каждой истории)', m['states_compared_last_run']),
    ('Сценариев поведения (`tools/interactions`)', m['interaction_scenarios']),
    ('Папок компонентов / файлов `.svelte`', f'{m["component_dirs"]} / {m["component_svelte_files"]}'),
    ('Строк кода библиотеки (Svelte + TS, без иконок)', f'{m["lib_loc_svelte_ts"]:,}'.replace(',', ' ')),
    ('Файлов историй / строк', f'{m["story_files"]} / {m["stories_loc"]:,}'.replace(',', ' ')),
    ('Иконок (генерируются из исходников)', m['icons_generated']),
    ('Токенов на тему × тем', f'{m["theme_variables_per_theme"]} × 4'),
    ('CSS компонентов, КБ (1:1 из эталона)', m['components_css_kb']),
    ('Модулей исходников React для портирования', m['react_modules_extracted']),
]
table = '\n'.join(['| Показатель | Значение |', '|---|---|'] + [f'| {a} | {b} |' for a, b in rows]) + f'\n\n_Данные на {today}, `python tools/metrics.py`._'

groups = ['| Группа эталона | Проходит / всего |', '|---|---|']
for g, (p, f, t) in m['groups'].items():
    mark = ' ✅' if p == t else ''
    groups.append(f'| {g} | {p} / {t}{mark} |')
values['METRICS'] = table
values['GROUPS'] = '\n'.join(groups)

# ---- README: the stats line and the catalogue of components by category
barrel = open(os.path.join(ROOT, 'src', 'lib', 'index.ts'), encoding='utf-8').read()
n_components = len([p for p in re.findall(r"^export \{ default as \w+ \} from '\./components/(.*)';", barrel, re.M) if not p.startswith('Icons/')])
tg = m['groups'].get('TableGrid/TableGrid', [0, 0, 0])
values['STATS'] = (f'**{total}** историй эталона &nbsp;·&nbsp; **{ok}** ({pct}%) проходят сверку &nbsp;·&nbsp; **{n_components}** компонентов &nbsp;·&nbsp; '
                   f'**{m["icons_generated"]}** иконок &nbsp;·&nbsp; **4** темы &nbsp;·&nbsp; таблица **{tg[0]}/{tg[2]}**')

# category -> (what is inside, story groups of the reference); every group of the reference must be listed exactly once
CATALOG = [
    ('Основа', 'Button, IconButton, FunctionButton, CloseButton, FloatingActionButton, Typography, Box, ScrollBar, иконки, дизайн-токены',
     ['Components/Buttons', 'Components/FloatingActionButton', 'Components/Typography', 'Components/Box', 'Tools/ScrollBar', 'Icons/16', 'Icons/24', 'Design Tokens/*']),
    ('Ввод', 'Input, InputCard, InputNumberStepper, Textarea, Checkbox, RadioButton, Switch, Slider, Stepper, SegmentedControl',
     ['Components/Input', 'Components/InputCard', 'Components/InputNumberStepper', 'Components/Textarea', 'Components/Checkboxes', 'Components/RadioButtons',
      'Components/Switch', 'Components/Slider', 'Components/Stepper', 'Components/SegmentedControl']),
    ('Выбор', 'Select, Multiselect, DropdownMenu, Chip, Tag', ['Components/Select', 'Components/Multiselect', 'Components/DropdownMenu', 'Components/Chips', 'Components/Tag']),
    ('Даты', 'InputDate, PickerDate (день, месяц, год, диапазон, время)', ['Components/InputDate', 'Components/PickerDate']),
    ('Файлы', 'File, FileUpload', ['Components/File', 'Components/FileUpload']),
    ('Оверлеи', 'Modal, Drawer, Popover, Tooltip, Overlay, usePopper',
     ['Patterns & Recipes/Modal', 'Patterns & Recipes/Drawer', 'Components/Popover', 'Components/Tooltip', 'Components/Overlay', 'Tools/usePopper']),
    ('Навигация', 'SideMenu, TopMenu, Tabs, Breadcrumbs, Wizard, Accordion',
     ['Patterns & Recipes/SideMenu', 'Patterns & Recipes/TopMenu', 'Components/Tabs', 'Components/Breadcrumbs', 'Components/Wizard', 'Patterns & Recipes/Accordion']),
    ('Данные', 'TableGrid (+ ActionBar), Tree, Pagination', ['TableGrid/TableGrid', 'Tree/Tree', 'Components/Pagination']),
    ('Обратная связь', 'Notification (тосты и inline), Loader, Badge, Counter', ['Components/Notification', 'Components/Loader', 'Components/Badge', 'Components/Counter']),
]


def _pick(patterns):
    got = set()
    for pat in patterns:
        got |= {g for g in m['groups'] if (g.startswith(pat[:-1]) if pat.endswith('*') else g == pat)}
    return got


seen = set()
cat = ['| Категория | Что входит | Историй проходит |', '|---|---|---|']
for name, what, patterns in CATALOG:
    gs = _pick(patterns)
    seen |= gs
    p, t = sum(m['groups'][g][0] for g in gs), sum(m['groups'][g][2] for g in gs)
    cat.append(f'| **{name}** | {what} | {p} / {t}{" ✅" if p == t else ""} |')
if seen != set(m['groups']):
    print('WARNING: story groups missing in the README catalogue:', sorted(set(m['groups']) - seen))
cat.append(f'| **Итого** | {m["component_dirs"]} папок компонентов, {n_components} экспортов, {m["icons_generated"]} иконок | **{ok} / {total}** |')
values['CATALOG'] = '\n'.join(cat)
# a line that starts with `<!--` is a raw HTML block in Markdown: markdown after the marker on the SAME line is not rendered (bold, tables),
# so the README regions are wrapped in newlines
for key in ('STATS', 'CATALOG'):
    values[key] = f'\n{values[key]}\n'

# other themes: read design/diff/theme-<theme>.report.json written by `compare.py --theme <theme> --report ...`
THEME_NAMES = {'rtk_default_dark': 'Rostelecom · тёмная', 'rtk_purple_light': 'Purple · светлая', 'rtk_purple_dark': 'Purple · тёмная'}
trows = ['| Тема | Историй сверено | Проходят | из них с допуском AA | Не проходят |', '|---|---|---|---|---|']
for t, label in THEME_NAMES.items():
    rp = os.path.join(ROOT, 'design', 'diff', f'theme-{t}.report.json')
    if not os.path.exists(rp):
        continue
    rep = json.load(open(rp, encoding='utf-8'))
    n = good = aa_n = 0
    bad_ids = []
    for sid, r in rep.items():
        if r.get('_status') == 'NOREF' or sid.startswith('design-tokens-'):   # token pages choose their theme file via `globals`, not via the body class
            continue
        sts = [v for k, v in r.items() if not k.startswith('_')]
        n += 1
        if sts and all(v['ok'] for v in sts):
            good += 1
            aa_n += 1 if any(v.get('aa') for v in sts) else 0
        else:
            bad_ids.append(sid)
    trows.append(f'| {label} (`{t}`) | {n} | **{good}** | {aa_n} | {len(bad_ids)}{(": " + ", ".join("`" + b + "`" for b in bad_ids[:6])) if bad_ids else ""} |')
values['THEMES'] = '\n'.join(trows) + '\n\n_Состояния: default, фокус, hover, клик, открытые списки; допуск 3 уровня канала и «AA» до 48 краевых пикселей (Δ ≤ 64); прогон: `compare.py --theme <тема>`._'

paths = [os.path.join(ROOT, 'docs', n) for n in os.listdir(os.path.join(ROOT, 'docs')) if n.endswith('.md')] + [os.path.join(ROOT, 'README.md')]
for path in paths:
    text = open(path, encoding='utf-8').read()
    for key, val in values.items():
        text = re.sub(rf'<!--{key}-->(.*?<!--/{key}-->)?', lambda _m: f'<!--{key}-->{val}<!--/{key}-->', text, flags=re.S)
    open(path, 'w', encoding='utf-8').write(text)
print(f'docs refreshed: {ok}/{total} ({pct}%) pass, {bad} fail')
