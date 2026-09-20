"""Behavioural check + screenshots of the chart module (`src/lib/charts`, demo route `/charts`). Playwright, headless Chromium, ONE browser, sequential.

  python tools/check-charts.py                                   # 4 themes x motion off / on, the SSR check, the screenshots
  python tools/check-charts.py --themes rtk_default_light rtk_purple_dark --motion 0 --no-shots
  python tools/check-charts.py --shots-only                      # only docs/img/charts-*.png
  python tools/check-charts.py --quick                           # 2 themes, no reduced-motion / responsive rounds

What is asserted (there is no reference implementation: the original design system has no charts, so the checks are about the module itself):

  every theme x motion:  no console errors / warnings; every chart has a non-empty SVG with the expected number of marks (lines, areas, bars,
      slices, dots, legend items, focusable points, rows of the hidden data table); no NaN / undefined anywhere; the hidden summary is really
      visually hidden and is the `aria-describedby` of the image; axis ticks are sane (3-8 of them, evenly spaced "nice" numbers, no overlapping
      labels, gridline per tick); series colours ARE the palette variables; the palette clears the reference method's gates on the surface of the
      theme (contrast >= 3:1, adjacent colour-blind and normal-vision distances) and the chart text reaches 4.5:1;
  interaction:  a tooltip opens on hover and on keyboard focus with the right content, closes again, and NEVER moves the layout; the crosshair
      follows; the legend hides / shows a series (aria-pressed, the mark disappears and comes back, the last one cannot be hidden) and emphasises
      on hover; the plot has ONE tab stop with roving focus (arrows / Home / End / Escape); donut: hover, centre label, legend toggle; `onSelect`
      by click and by Enter; the data update morphs progressively with motion on and instantly with motion off; the draw-in plays on mount with
      motion on and again when the data arrives after an empty start; the charts follow the width of the window while it is being resized;
  motion on vs off:  after the animation settles the geometry is identical (the "final state is the original" rule);
  reduced motion:  `prefers-reduced-motion: reduce` switches every chart to the instant path even with the provider on;
  responsive:  at 820 and 390 px nothing overflows its card, labels do not collide;
  SSR:  `node tools/check-charts-ssr.mjs` (the server output is a finished chart, nothing needs window / document at import).

Screenshots (docs/img/charts-*.png, optimised like tools/screenshots.py): charts-dashboard-light / -purple-dark, one per chart type
(charts-line / -bar / -funnel / -donut / -pie / -sparkline), charts-variants, charts-themes, charts-palette.

Needs the playground dev server on :5180 (started with `node tools/up.mjs` when it is not running), `pip install playwright pillow`.
Exit code 0 = every check passed.
"""
import argparse
import io
import math
import re
import socket
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:  # pragma: no cover
    pass

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'img'
LIGHT, DARK, PLIGHT, PDARK = 'rtk_default_light', 'rtk_default_dark', 'rtk_purple_light', 'rtk_purple_dark'
THEMES = [LIGHT, DARK, PLIGHT, PDARK]
THEME_TITLES = {LIGHT: 'Rostelecom · светлая', DARK: 'Rostelecom · тёмная', PLIGHT: 'Purple · светлая', PDARK: 'Purple · тёмная'}

# ───────────────────────────────────────────────────────────────────────────────────────── colour maths (the reference method's validator)
# OKLab / OKLCH, Machado-Oliveira-Fernandes (2009) colour-blindness simulation at severity 1.0, WCAG contrast; thresholds as in the method:
# adjacent colour-blind distance >= 8 (OKLab x100), normal-vision floor >= 15, marks >= 3:1 on the surface, chroma >= 0.10 (soft), lightness band.
MACHADO = {
    'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
}


def srgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def lin(c):
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def oklab(rgb_lin):
    r, g, b = rgb_lin
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]


def simulate(h, kind):
    r, g, b = lin(srgb(h))
    M = MACHADO[kind]
    return [max(0.0, min(1.0, M[i][0] * r + M[i][1] * g + M[i][2] * b)) for i in range(3)]


def delta_e(a, b, kind=None):
    x = oklab(simulate(a, kind) if kind else lin(srgb(a)))
    y = oklab(simulate(b, kind) if kind else lin(srgb(b)))
    return 100 * math.dist(x, y)


def rel_lum(h):
    r, g, b = lin(srgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    hi, lo = sorted((rel_lum(a), rel_lum(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def lch(h):
    L, a, b = oklab(lin(srgb(h)))
    return L, math.hypot(a, b)


def validate_palette(palette, surface, dark):
    """-> list of (name, level, detail); level is 'pass' | 'warn' | 'fail'"""
    res = []
    band = (0.48, 0.67) if dark else (0.43, 0.77)
    off = [(c, round(lch(c)[0], 3)) for c in palette if not band[0] <= lch(c)[0] <= band[1]]
    res.append(('lightness band %.2f-%.2f' % band, 'pass' if not off else 'warn', 'all inside' if not off else f'{len(off)} outside (brighter than the reference band): {off}'))
    low = [(c, round(lch(c)[1], 3)) for c in palette if lch(c)[1] < 0.095]
    res.append(('chroma floor', 'pass' if not low else 'fail', 'all >= 0.095' if not low else f'reads gray: {low}'))
    pairs = list(zip(palette, palette[1:]))
    cvd = min(min(delta_e(a, b, 'protan'), delta_e(a, b, 'deutan')) for a, b in pairs)
    res.append(('adjacent colour-blind distance >= 8', 'pass' if cvd >= 8 else 'fail', f'worst {cvd:.1f}'))
    nrm = min(delta_e(a, b) for a, b in pairs)
    res.append(('adjacent normal-vision distance >= 15', 'pass' if nrm >= 15 else 'fail', f'worst {nrm:.1f}'))
    cs = [contrast(c, surface) for c in palette]
    res.append(('contrast vs surface >= 3:1', 'pass' if min(cs) >= 3 else ('warn' if min(cs) >= 2.9 else 'fail'), 'min %.2f (slot %d)' % (min(cs), cs.index(min(cs)) + 1)))
    return res


# ───────────────────────────────────────────────────────────────────────────────────────── browser side
INIT = """(() => {
  const FIXED = Date.UTC(2026, 8, 18, 9, 0, 0), RD = Date;
  class FD extends RD { constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); } static now() { return FIXED; } }
  window.Date = FD;
  let s = 123456789;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
})();"""

# the page's own <style> is not needed: every measurement below is taken from the DOM of the charts
PROBE = """() => {
  const $$ = (s, r) => [...r.querySelectorAll(s)];
  const root = (id) => { const e = document.querySelector(`[data-testid="${id}"]`); return e && (e.classList.contains('rt-chart') ? e : e.querySelector('.rt-chart')); };
  const info = (r) => {
    if (!r) return null;
    const img = r.querySelector('svg[role=img]') || r.querySelector('[role=img]');
    const sum = r.querySelector('.rt-chart__sr p');
    const sr = r.querySelector('.rt-chart__sr');
    const srBox = sr && sr.getBoundingClientRect();
    return {
      svgs: $$('svg[role=img]', r).length,
      label: img ? (img.getAttribute('aria-label') || '') : '',
      describedby: img ? (img.getAttribute('aria-describedby') || '') : '',
      describedText: img && img.getAttribute('aria-describedby') ? ((document.getElementById(img.getAttribute('aria-describedby')) || {}).textContent || '') : '',
      lines: $$('path.rt-chart__line', r).length, areas: $$('path.rt-chart__area', r).length, dots: $$('circle.rt-chart__dot:not(.rt-chart__dot--active)', r).length,
      bars: $$('path.rt-chart__bar', r).length, barLabels: $$('text.rt-chart__bar-label', r).length, sparkBars: $$('path.rt-chart__spark-bar', r).length,
      slices: $$('path.rt-chart__slice', r).length, legend: $$('.rt-chart__legend-item', r).length,
      hits: $$('.rt-chart__hit', r).length, tabbable: $$('.rt-chart__hit[tabindex="0"]', r).length,
      srRows: $$('.rt-chart__sr tbody tr', r).length, srVisible: srBox ? (srBox.width > 2 || srBox.height > 2) : null,
      empty: !!r.querySelector('.rt-chart__empty'), center: !!r.querySelector('.rt-chart__center'),
      yTicks: $$('text.rt-chart__tick--y', r).length, xTicks: $$('text.rt-chart__tick--x', r).length, grid: $$('.rt-chart__grid line', r).length,
      bad: $$('*', r).some((e) => [...e.attributes].some((a) => /NaN|undefined|Infinity/.test(a.value))) || /NaN|undefined/.test(r.textContent),
      overflow: r.scrollWidth - r.clientWidth, motion: r.getAttribute('data-motion'),
      summary: sum ? sum.textContent : '',
    };
  };
  const ids = ['chart-revenue', 'chart-stages', 'chart-funnel', 'chart-sources', 'v-line-smooth', 'v-line-points', 'v-line-long', 'v-line-one', 'v-line-empty',
    'v-bar-grouped', 'v-bar-stacked', 'v-bar-horizontal', 'v-bar-hstacked', 'v-donut-center', 'v-pie', 'v-custom-colors', 'v-time-axis'];
  const out = {};
  for (const id of ids) out[id] = info(root(id));
  for (const id of ['kpi-revenue', 'kpi-deals', 'kpi-conv', 'kpi-check', 'v-spark', 'managers-table']) {
    const c = document.querySelector(`[data-testid="${id}"]`);
    out[id] = c ? { sparks: $$('.rt-chart--spark', c).length, imgs: $$('.rt-chart--spark svg[role=img]', c).length,
      labels: $$('.rt-chart--spark svg[role=img]', c).map((e) => e.getAttribute('aria-label') || ''),
      paths: $$('.rt-chart--spark path.rt-chart__line', c).length, sparkBars: $$('path.rt-chart__spark-bar', c).length, dots: $$('circle.rt-chart__dot', c).length,
      bad: $$('*', c).some((e) => [...e.attributes].some((a) => /NaN|undefined|Infinity/.test(a.value))) } : null;
  }
  return out;
}"""

# resolved colours (canvas turns any CSS colour, including color-mix(), into 8-bit sRGB)
COLOURS = """() => {
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const host = document.querySelector('[data-testid="chart-revenue"]');
  const el = document.createElement('div'); host.appendChild(el);
  const hex = (css) => { el.style.background = css; const c = getComputedStyle(el).backgroundColor; ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data; return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  const over = (fg, bg) => { el.style.background = fg; const c = getComputedStyle(el).backgroundColor; ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data; return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  const surface = hex('var(--atmr-bg-surface1)');
  const res = { surface, palette: Array.from({ length: 10 }, (_, i) => hex(`var(--rt-chart-${i + 1})`)), other: hex('var(--rt-chart-other)'),
    text: over('var(--atmr-fg-soft)', surface), muted: over('var(--atmr-fg-muted)', surface), fg: over('var(--atmr-fg-default)', surface) };
  // the marks of the revenue chart, as painted
  const strokes = [...host.querySelectorAll('path.rt-chart__line')].map((p) => { el.style.background = getComputedStyle(p).stroke; return hex(getComputedStyle(p).stroke); });
  res.lineStrokes = strokes;
  // chart text as painted: tick labels, legend, tooltip
  const paint = (sel, prop) => { const e = host.querySelector(sel); return e ? over(getComputedStyle(e)[prop], surface) : null; };
  res.tickText = paint('text.rt-chart__tick--y', 'fill');
  res.legendText = paint('.rt-chart__legend-item', 'color');
  const src = document.querySelector('[data-testid="chart-sources"]');
  const inSrc = (sel, prop) => { const e = src && src.querySelector(sel); return e ? over(getComputedStyle(e)[prop], surface) : null; };
  res.shareText = inSrc('.rt-chart__legend-secondary', 'color');
  res.centreText = inSrc('.rt-chart__center-label', 'color');
  el.remove();
  return res;
}"""

GEOM = """(sel) => {
  const root = document.querySelector(sel);
  const R = root.getBoundingClientRect();
  const box = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, text: e.textContent.trim(), rot: !!e.getAttribute('transform'), ax: parseFloat(e.getAttribute('x')) }; };
  return { root: { l: R.left, r: R.right, t: R.top, b: R.bottom },
    y: [...root.querySelectorAll('text.rt-chart__tick--y')].map(box), x: [...root.querySelectorAll('text.rt-chart__tick--x')].map(box),
    grid: [...root.querySelectorAll('.rt-chart__grid line')].map((e) => e.getBoundingClientRect().top) };
}"""

PATHS = """() => {
  const root = (id) => { const e = document.querySelector(`[data-testid="${id}"]`); return e && (e.classList.contains('rt-chart') ? e : e.querySelector('.rt-chart')); };
  const d = (id, sel) => [...root(id).querySelectorAll(sel)].map((p) => p.getAttribute('d'));
  return { revenueLines: d('chart-revenue', 'path.rt-chart__line'), revenueArea: d('chart-revenue', 'path.rt-chart__area'), bars: d('chart-stages', 'path.rt-chart__bar'),
    funnel: d('chart-funnel', 'path.rt-chart__bar'), slices: d('chart-sources', 'path.rt-chart__slice'),
    sparks: [...document.querySelectorAll('[data-testid=managers-table] .rt-chart--spark path.rt-chart__line')].map((p) => p.getAttribute('d')) };
}"""

# records `attr` of the first element matching `sel` on every animation frame for `ms`, optionally starting with a click on `btn`
SAMPLE = """async ([sel, attr, ms, btn]) => {
  const out = [], t0 = performance.now();
  const rec = () => { const e = document.querySelector(sel); out.push([Math.round(performance.now() - t0), e ? e.getAttribute(attr) : null]); };
  rec();
  if (btn) document.querySelector(btn).click();
  await new Promise((res) => { const tick = () => { rec(); performance.now() - t0 < ms ? requestAnimationFrame(tick) : res(); }; requestAnimationFrame(tick); });
  return out;
}"""

# background sampler (started before a real Playwright click, read afterwards)
BG_SAMPLE_START = """([sel, attr, ms]) => {
  window.__rec = []; const t0 = performance.now();
  const tick = () => { const e = document.querySelector(sel); window.__rec.push([Math.round(performance.now() - t0), e ? e.getAttribute(attr) : null]); if (performance.now() - t0 < ms) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}"""


# ───────────────────────────────────────────────────────────────────────────────────────── helpers
def nums(s):
    return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', s or '')]


def close_paths(a, b, tol=0.06):
    """two lists of SVG path strings equal up to `tol` px in every number"""
    if len(a) != len(b):
        return False
    for x, y in zip(a, b):
        nx, ny = nums(x), nums(y)
        if len(nx) != len(ny) or any(abs(p - q) > tol for p, q in zip(nx, ny)):
            return False
    return True


def parse_ru(text):
    """'1,5 млн' -> 1500000.0, '500 тыс.' -> 500000.0, '0' -> 0.0, anything else -> None"""
    s = text.replace(' ', ' ').replace(' ', ' ').replace('−', '-').strip()
    m = re.fullmatch(r'(-?\d[\d ]*(?:,\d+)?)\s*(тыс\.|млн|млрд|трлн)?', s)
    if not m:
        return None
    v = float(m.group(1).replace(' ', '').replace(',', '.'))
    return v * {None: 1, 'тыс.': 1e3, 'млн': 1e6, 'млрд': 1e9, 'трлн': 1e12}[m.group(2)]


def is_nice(step):
    if step <= 0:
        return False
    k = 10 ** math.floor(math.log10(step))
    return round(step / k, 6) in (1.0, 2.0, 5.0, 10.0)


def port_open(host, port):
    with socket.socket() as s:
        s.settimeout(0.6)
        return s.connect_ex((host, port)) == 0


class Report:
    def __init__(self):
        self.results = []
        self.scope = ''

    def ok(self, name, cond, extra=''):
        cond = bool(cond)
        self.results.append(cond)
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f'  [{extra}]' if extra and not cond else (f'  {extra}' if extra else '')), flush=True)
        return cond

    def warn(self, name, extra=''):
        print(f'  WARN  {name}  {extra}', flush=True)

    @property
    def failed(self):
        return self.results.count(False)


def open_page(browser, base, theme, motion, w=1360, h=1000, reduced=False, scale=1, init=False):
    ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale, locale='ru-RU', timezone_id='Europe/Moscow',
                              reduced_motion='reduce' if reduced else 'no-preference')
    if init:
        ctx.add_init_script(INIT)
    pg = ctx.new_page()
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text[:260]}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)[:260]))
    pg.goto(f'{base}/charts?theme={theme}&motion={motion}', wait_until='networkidle')
    pg.wait_for_function('document.fonts.status === "loaded"')
    pg.wait_for_selector('[data-testid=dashboard] svg[role=img]')
    if motion in ('0', 'off') or reduced:
        pg.wait_for_timeout(500)
    else:
        # the draw-in (800 ms + the stagger of the bars) must be over before anything is measured: no clip-path reveal left, every bar drawn
        # (a bar that has not started to grow is not in the DOM yet). A slow machine takes longer than any fixed sleep.
        pg.wait_for_function("() => !document.querySelector('[data-testid=dashboard] clipPath') && document.querySelectorAll('[data-testid=chart-stages] path.rt-chart__bar').length === 15", timeout=20000)
        pg.wait_for_timeout(400)
    return ctx, pg, logs


# ───────────────────────────────────────────────────────────────────────────────────────── the checks
EXPECT = {
    # id: dict of expected exact counts / ranges
    'chart-revenue': dict(svgs=1, lines=3, areas=1, legend=3, hits=12, tabbable=1, srRows=12, yTicks=(3, 8), xTicks=(3, 12)),
    'chart-stages': dict(svgs=1, bars=15, legend=3, hits=5, tabbable=1, srRows=5, yTicks=(3, 8), xTicks=(5, 5)),
    'chart-funnel': dict(svgs=1, bars=5, barLabels=5, legend=0, hits=5, tabbable=1, srRows=5),
    'chart-sources': dict(svgs=1, slices=5, legend=5, hits=5, tabbable=1, srRows=5, center=True),
    'v-line-smooth': dict(svgs=1, lines=1, areas=1, legend=0, hits=9, srRows=9),
    'v-line-points': dict(svgs=1, lines=3, dots=15, legend=3, hits=5),
    'v-line-long': dict(svgs=1, lines=2, legend=2, hits=6, srRows=6),
    'v-line-one': dict(svgs=1, lines=1, hits=1, srRows=1),
    'v-line-empty': dict(svgs=0, empty=True, lines=0, hits=0),
    'v-bar-grouped': dict(svgs=1, bars=15, legend=3, hits=5),
    'v-bar-stacked': dict(svgs=1, bars=15, barLabels=5, legend=3, hits=5),
    'v-bar-horizontal': dict(svgs=1, bars=15, legend=3, hits=5),
    'v-bar-hstacked': dict(svgs=1, bars=15, barLabels=5, legend=3, hits=5),
    'v-donut-center': dict(svgs=1, slices=5, legend=5, center=True, hits=5),
    'v-pie': dict(svgs=1, slices=5, legend=5, center=False, hits=5),
    'v-custom-colors': dict(svgs=1, bars=10, legend=2, hits=5),
    'v-time-axis': dict(svgs=1, lines=1, areas=1, legend=0, hits=60),
}


def check_structure(pg, r):
    probe = pg.evaluate(PROBE)
    for cid, exp in EXPECT.items():
        got = probe.get(cid)
        if not r.ok(f'{cid}: found', got is not None):
            continue
        bad = []
        for k, v in exp.items():
            g = got[k]
            if isinstance(v, tuple):
                if not v[0] <= g <= v[1]:
                    bad.append(f'{k}={g} not in {v}')
            elif g != v:
                bad.append(f'{k}={g} != {v}')
        r.ok(f'{cid}: element counts', not bad, ', '.join(bad))
        r.ok(f'{cid}: no NaN / undefined', not got['bad'])
        if not exp.get('empty'):
            r.ok(f'{cid}: role=img with aria-label + hidden summary (aria-describedby)', got['label'].strip() and got['describedby'] and len(got['describedText']) > 20 and got['srVisible'] is False,
                 f"label={got['label']!r} describedby={got['describedby']!r} srVisible={got['srVisible']}")
        else:
            r.ok(f'{cid}: empty state is an image with a label', got['label'].strip() != '')
        r.ok(f'{cid}: does not overflow its container', got['overflow'] <= 1, f"{got['overflow']}px")
    # sparklines: KPI tiles, the "variants" card, the TableGrid cells
    for cid, (imgs, lines) in {'kpi-revenue': (1, 1), 'kpi-deals': (1, 1), 'kpi-conv': (1, 1), 'kpi-check': (1, 1), 'managers-table': (8, 8)}.items():
        g = probe[cid]
        r.ok(f'{cid}: {imgs} sparkline(s) with a summary label, {lines} line(s)', g and g['imgs'] == imgs and g['paths'] == lines and all('значени' in l or 'нет' in l for l in g['labels']) and not g['bad'], str(g))
    sp = probe['v-spark']
    r.ok('v-spark: 6 sparklines (line, area, bar, smooth, empty, one point): 3 lines + 2 washes\' lines, bars, 1 empty', sp['imgs'] == 6 and sp['sparkBars'] == 12 and sp['paths'] >= 4 and any('нет данных' in l for l in sp['labels']) and any('одно значение' in l for l in sp['labels']) and not sp['bad'], str(sp))
    return probe


def check_ticks(pg, r):
    for cid, sel in [('chart-revenue', '[data-testid=chart-revenue]'), ('chart-stages', '[data-testid=chart-stages]'), ('v-line-long', '[data-testid=v-line-long] .rt-chart'),
                     ('v-bar-grouped', '[data-testid=v-bar-grouped] .rt-chart'), ('v-bar-hstacked', '[data-testid=v-bar-hstacked] .rt-chart'), ('v-time-axis', '[data-testid=v-time-axis] .rt-chart'),
                     ('chart-funnel', '[data-testid=chart-funnel]')]:
        g = pg.evaluate(GEOM, sel)
        ys = g['y']
        vals = [parse_ru(t['text']) for t in ys]
        if ys and all(v is not None for v in vals):  # numeric value axis
            steps = [b - a for a, b in zip(vals, vals[1:])]
            r.ok(f'{cid}: y ticks are ascending, evenly spaced, "nice" (1/2/5 x 10^k)', all(s > 0 for s in steps) and max(steps) - min(steps) < 1e-6 * max(1, abs(max(vals))) and is_nice(steps[0]) if steps else True, f'{[t["text"] for t in ys]}')
            pos = [(t['t'] + t['b']) / 2 for t in ys]
            gaps = [a - b for a, b in zip(pos, pos[1:])]  # bottom -> top: y decreases
            r.ok(f'{cid}: y ticks are at least 20 px apart', all(x >= 20 for x in gaps), f'{[round(x) for x in gaps]}')
            r.ok(f'{cid}: {len(ys)} y ticks (3..8) and a gridline per tick', 3 <= len(ys) <= 8 and len(g['grid']) in (len(ys), 0), f"{len(ys)} ticks, {len(g['grid'])} lines")
        for axis in ('x', 'y'):
            boxes = sorted(g[axis], key=lambda b: (b['l'], b['t']))
            if boxes and boxes[0]['rot']:
                # rotated labels: their boxes overlap by construction; what matters is that the anchors are far enough apart for the line height
                sp = [b['ax'] - a['ax'] for a, b in zip(boxes, boxes[1:])]
                r.ok(f'{cid}: rotated {axis} labels are >= 22 px apart', all(x >= 22 for x in sp), str([round(x) for x in sp]))
                continue
            clash = [(a['text'], b['text']) for a, b in zip(boxes, boxes[1:]) if not (a['r'] + 1 <= b['l'] or a['b'] <= b['t'] + 1 or b['b'] <= a['t'] + 1)]
            r.ok(f'{cid}: {axis} tick labels do not collide', not clash, str(clash[:3]))
        inside = [t['text'] for t in g['x'] + g['y'] if t['l'] < g['root']['l'] - 1 or t['r'] > g['root']['r'] + 1]
        r.ok(f'{cid}: tick labels stay inside the chart box', not inside, str(inside[:4]))


def check_palette(pg, r, theme):
    c = pg.evaluate(COLOURS)
    dark = theme.endswith('_dark')
    for name, level, detail in validate_palette(c['palette'], c['surface'], dark):
        if level == 'warn':
            r.warn(f'palette {name}', detail)
        else:
            r.ok(f'palette ({theme}) {name}', level == 'pass', detail)
    r.ok(f'palette ({theme}): the neutral "other" slot reads on the surface (>= 3:1)', contrast(c['other'], c['surface']) >= 3, '%.2f' % contrast(c['other'], c['surface']))
    r.ok(f'palette ({theme}): all ten slots are different', len(set(c['palette'])) == 10, str(c['palette']))
    r.ok(f'palette ({theme}): the lines of the revenue chart use slots 1-3', c['lineStrokes'] == c['palette'][:3], f"{c['lineStrokes']} vs {c['palette'][:3]}")
    # text: 4.5:1 for the axis labels and the legend (fg-soft / fg-default on the surface); the design system's own "muted" grey is reported only
    for what, hexv in (('axis labels', c['tickText']), ('legend labels', c['legendText']), ('donut shares in the legend', c['shareText']), ('donut centre caption', c['centreText'])):
        r.ok(f'text contrast ({theme}) {what} >= 4.5:1', hexv and contrast(hexv, c['surface']) >= 4.5, f'{hexv} on {c["surface"]}: %.2f' % (contrast(hexv, c['surface']) if hexv else 0))
    return c['palette']


def tip_state(root):
    tip = root.locator('.rt-chart__tooltip')
    return dict(open=tip.get_attribute('data-open') == 'true', title=(tip.locator('.rt-chart__tooltip-title').inner_text() if tip.locator('.rt-chart__tooltip-title').count() else ''),
                rows=tip.locator('.rt-chart__tooltip-row').count(), text=tip.inner_text())


def card_boxes(pg):
    return pg.eval_on_selector_all('[data-testid=dashboard] > .card, [data-testid=dashboard] > div', 'els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })')


def check_line(pg, r, motion):
    root = pg.locator('[data-testid=chart-revenue]')
    root.scroll_into_view_if_needed()
    plot = root.locator('.rt-chart__plot')
    box = plot.bounding_box()
    before = card_boxes(pg)
    scroll_h = pg.evaluate('document.documentElement.scrollHeight')
    pg.mouse.move(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.4)
    pg.wait_for_timeout(500)
    t = tip_state(root)
    r.ok('line: hover opens the tooltip with the month, 3 series and rouble values', t['open'] and re.fullmatch(r'[А-Яа-я]+ 2026', t['title']) and t['rows'] == 3 and '₽' in t['text'], str(t))
    cur = root.locator('.rt-chart__cursor')
    r.ok('line: crosshair + 3 active markers at the hovered x', float(cur.get_attribute('opacity') or 0) > 0.9 and cur.locator('circle').count() == 3 and cur.locator('line.rt-chart__crosshair').count() == 1)
    r.ok('line: the tooltip stays inside the plot', (lambda tb: tb['x'] >= box['x'] - 1 and tb['x'] + tb['width'] <= box['x'] + box['width'] + 1 and tb['y'] >= box['y'] - 1 and tb['y'] + tb['height'] <= box['y'] + box['height'] + 1)(root.locator('.rt-chart__tooltip').bounding_box()))
    r.ok('line: opening the tooltip does not move anything (no layout jump)', card_boxes(pg) == before and pg.evaluate('document.documentElement.scrollHeight') == scroll_h)
    # follows the pointer: the title changes when the pointer moves to another month
    first = t['title']
    pg.mouse.move(box['x'] + box['width'] * 0.15, box['y'] + box['height'] * 0.4)
    pg.wait_for_timeout(500)
    r.ok('line: the tooltip follows the pointer to another month', tip_state(root)['title'] != first, f"{first} -> {tip_state(root)['title']}")
    # near the right edge the tooltip flips to the left of the crosshair instead of leaving the plot
    pg.mouse.move(box['x'] + box['width'] * 0.97, box['y'] + box['height'] * 0.4)
    pg.wait_for_timeout(500)
    tb, cb = root.locator('.rt-chart__tooltip').bounding_box(), root.locator('.rt-chart__crosshair').bounding_box()
    r.ok('line: near the edge the tooltip flips to the left and stays inside', tb['x'] + tb['width'] <= box['x'] + box['width'] + 1 and tb['x'] + tb['width'] <= cb['x'] + 24, f'{tb} {cb}')
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    r.ok('line: leaving the plot closes the tooltip', not tip_state(root)['open'] and root.locator('.rt-chart__tooltip').evaluate('e => getComputedStyle(e).visibility') == 'hidden')

    # legend: hide / show, emphasis on hover, the last series stays
    item = lambda name: root.locator('.rt-chart__legend-item', has_text=name)
    mark = lambda key: float(root.locator(f'path.rt-chart__line[data-series={key}]').get_attribute('opacity') or 0)
    item('План 2026').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(600)
    r.ok('legend: a click hides the series (aria-pressed=false, the line fades out, the others stay)', item('План 2026').get_attribute('aria-pressed') == 'false' and mark('plan') < 0.05 and mark('fact') > 0.95 and mark('prev') > 0.95, f"{mark('plan')} {mark('fact')} {mark('prev')}")
    pg.mouse.move(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.4)
    pg.wait_for_timeout(450)
    r.ok('legend: the tooltip lists only the visible series', tip_state(root)['rows'] == 2, str(tip_state(root)))
    pg.mouse.move(2, 2)
    item('План 2026').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(600)
    r.ok('legend: a second click brings it back', item('План 2026').get_attribute('aria-pressed') == 'true' and mark('plan') > 0.95, str(mark('plan')))
    item('План 2026').click()
    item('Факт 2025').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    item('Факт 2026').click()  # the last visible one: must be refused
    pg.wait_for_timeout(300)
    r.ok('legend: the last visible series cannot be hidden', item('Факт 2026').get_attribute('aria-pressed') == 'true' and mark('fact') > 0.95)
    item('План 2026').click()
    item('Факт 2025').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    # hover emphasis
    item('Факт 2026').hover()
    pg.wait_for_timeout(600)
    r.ok('legend: hovering an item emphasises its series (the others recede)', mark('fact') > 0.95 and mark('plan') < 0.5 and mark('prev') < 0.5, f"{mark('fact')} {mark('plan')} {mark('prev')}")
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)

    # keyboard: Tab from the legend enters the plot at ONE point; arrows / Home / End move; Escape hides the tooltip; Tab leaves
    item('Факт 2025').focus()
    pg.keyboard.press('Tab')
    active = pg.evaluate("() => { const a = document.activeElement; return { cls: a.className, inChart: !!a.closest('[data-testid=chart-revenue]'), label: a.getAttribute('aria-label') || '' }; }")
    r.ok('keyboard: Tab from the legend lands on a data point of the chart', 'rt-chart__hit' in active['cls'] and active['inChart'] and 'Факт 2026' in active['label'], str(active))
    pg.wait_for_timeout(450)
    t0 = tip_state(root)
    r.ok('keyboard: the focused point shows the tooltip (first month)', t0['open'] and t0['title'].startswith('Январь'), str(t0))
    r.ok('keyboard: the plot shows a focus ring', root.locator('.rt-chart__plot').evaluate('e => getComputedStyle(e).outlineStyle') != 'none')
    pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(450)
    t1 = tip_state(root)
    pg.keyboard.press('End')
    pg.wait_for_timeout(450)
    t2 = tip_state(root)
    pg.keyboard.press('Home')
    pg.wait_for_timeout(450)
    t3 = tip_state(root)
    r.ok('keyboard: ArrowRight / End / Home move between the months', t1['title'].startswith('Февраль') and t2['title'].startswith('Декабрь') and t3['title'].startswith('Январь'), f"{t1['title']} {t2['title']} {t3['title']}")
    r.ok('keyboard: roving tabindex (one tab stop in the plot)', root.locator('.rt-chart__hit[tabindex="0"]').count() == 1 and root.locator('.rt-chart__hit[tabindex="-1"]').count() == 11)
    pg.keyboard.press('Escape')
    pg.wait_for_timeout(450)
    r.ok('keyboard: Escape closes the tooltip', not tip_state(root)['open'])
    pg.keyboard.press('Tab')
    left = pg.evaluate("() => !document.activeElement.closest('[data-testid=chart-revenue] .rt-chart__hits')")
    r.ok('keyboard: the next Tab leaves the plot (no tab trap, no tab stop per point)', left)
    pg.mouse.move(2, 2)
    pg.locator('body').click(position={'x': 2, 'y': 2})


def check_bar(pg, r):
    root = pg.locator('[data-testid=chart-stages]')
    root.scroll_into_view_if_needed()
    plot = root.locator('.rt-chart__plot')
    box = plot.bounding_box()
    before = card_boxes(pg)
    pg.mouse.move(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.5)  # the 3rd of 5 categories
    pg.wait_for_timeout(500)
    t = tip_state(root)
    r.ok('bar: hover opens the tooltip of the category with 3 series and the total', t['open'] and t['title'] == 'Предложение' and t['rows'] == 4 and 'Всего' in t['text'] and '54' in t['text'], str(t))
    ops = root.locator('path.rt-chart__bar').evaluate_all('els => els.map(e => [+e.getAttribute("data-index"), +e.getAttribute("opacity")])')
    r.ok('bar: the hovered category stays, the others recede', all(o >= 0.95 for i, o in ops if i == 2) and all(o < 0.7 for i, o in ops if i != 2), str(ops[:6]))
    r.ok('bar: no layout jump', card_boxes(pg) == before)
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    # stacked <-> grouped
    def tops():
        return root.locator('path.rt-chart__bar[data-series=small]').evaluate_all('els => els.map(e => Math.round(e.getBoundingClientRect().left))')
    stacked_x = tops()
    pg.locator('[data-testid=stack-switch]').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    grouped_x = tops()
    r.ok('bar: the switch regroups the bars (stacked -> grouped), same number of bars', stacked_x != grouped_x and root.locator('path.rt-chart__bar').count() == 15, f'{stacked_x} vs {grouped_x}')
    pg.locator('[data-testid=stack-switch]').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    # legend hides a series: its bars disappear, the domain rescales
    y_before = root.locator('text.rt-chart__tick--y').all_inner_texts()
    root.locator('.rt-chart__legend-item', has_text='Малые').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(700)
    y_after = root.locator('text.rt-chart__tick--y').all_inner_texts()
    r.ok('bar: hiding a series removes its bars and rescales the value axis', root.locator('path.rt-chart__bar[data-series=small]').count() == 0 and y_before != y_after and root.locator('.rt-chart__legend-item[aria-pressed=false]').count() == 1, f'{y_before} -> {y_after}')
    root.locator('.rt-chart__legend-item', has_text='Малые').click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(700)
    r.ok('bar: showing it again restores the bars', root.locator('path.rt-chart__bar').count() == 15)
    # keyboard
    root.locator('.rt-chart__legend-item').last.focus()
    pg.keyboard.press('Tab')
    pg.wait_for_timeout(450)
    a = tip_state(root)
    pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(450)
    b = tip_state(root)
    r.ok('bar: keyboard focus shows the tooltip of the category; arrows move', a['open'] and a['title'] == 'Новый' and b['title'] == 'Квалификация', f"{a['title']} -> {b['title']}")
    pg.keyboard.press('Escape')
    pg.locator('body').click(position={'x': 2, 'y': 2})
    # funnel: value labels sit at the ends of the bars, inside the chart, one per bar
    f = pg.evaluate("""() => { const r = document.querySelector('[data-testid=chart-funnel]'); const R = r.getBoundingClientRect();
      const bars = [...r.querySelectorAll('path.rt-chart__bar')].map(e => e.getBoundingClientRect()); const labels = [...r.querySelectorAll('text.rt-chart__bar-label')].map(e => [e.getBoundingClientRect(), e.textContent]);
      return { bars: bars.map(b => [b.left, b.right, b.top]), labels: labels.map(([b, t]) => [b.left, b.right, b.top, t]), R: [R.left, R.right] }; }""")
    lens = [b[1] - b[0] for b in f['bars']]
    r.ok('funnel: bars shrink stage by stage', all(x > y for x, y in zip(lens, lens[1:])), str([round(x) for x in lens]))
    r.ok('funnel: labels (value · share) are inside the chart and do not touch the bars', all(l[1] <= f['R'][1] + 1 and (l[0] >= b[1] or l[1] <= b[1]) for l, b in zip(f['labels'], f['bars'])) and all('%' in l[3] for l in f['labels']), str(f['labels'][:2]))


def check_donut(pg, r):
    root = pg.locator('[data-testid=chart-sources]')
    root.scroll_into_view_if_needed()
    plot = root.locator('.rt-chart__plot')
    box = plot.bounding_box()
    cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    total = root.locator('.rt-chart__center-value').inner_text().replace(' ', ' ')
    r.ok('donut: the centre shows the total', total.replace(' ', '') == '1200', total)
    # the first slice (38 %) spans 0..137 degrees clockwise from 12 o'clock: its middle is at ~68 degrees
    R = box['width'] / 2 - 7
    rad = R * (1 + 0.62) / 2
    ang = math.radians(68)
    before = card_boxes(pg)
    pg.mouse.move(cx + rad * math.sin(ang), cy - rad * math.cos(ang))
    pg.wait_for_timeout(500)
    r.ok('donut: hover on a segment: the centre shows its value, name and share (a ring with the default centre has no tooltip on top of it)',
         root.locator('.rt-chart__tooltip').count() == 0 and root.locator('.rt-chart__center-value').inner_text().replace(' ', ' ') == '456' and 'Сайт' in root.locator('.rt-chart__center-label').inner_text() and '38' in root.locator('.rt-chart__center-label').inner_text(), root.locator('.rt-chart__center').inner_text())
    ops = root.locator('path.rt-chart__slice').evaluate_all('els => els.map(e => +e.getAttribute("opacity"))')
    r.ok('donut: the active segment stays, the others recede', ops[0] > 0.95 and all(o < 0.7 for o in ops[1:]), str(ops))
    r.ok('donut: no layout jump', card_boxes(pg) == before)
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)
    r.ok('donut: the centre returns to the total', root.locator('.rt-chart__center-value').inner_text().replace(' ', ' ').replace(' ', '') == '1200')
    # legend: hide a segment
    item = root.locator('.rt-chart__legend-item', has_text='Рекомендации')
    item.click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(700)
    r.ok('donut: a legend click hides a segment (4 drawn, total 912, aria-pressed=false)', root.locator('path.rt-chart__slice').count() == 4 and item.get_attribute('aria-pressed') == 'false' and root.locator('.rt-chart__center-value').inner_text().replace(' ', ' ').replace(' ', '') == '912', root.locator('.rt-chart__center-value').inner_text())
    item.click()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(700)
    r.ok('donut: and shows it again', root.locator('path.rt-chart__slice').count() == 5 and root.locator('.rt-chart__center-value').inner_text().replace(' ', ' ').replace(' ', '') == '1200')
    # keyboard
    root.locator('.rt-chart__legend-item').first.focus()
    pg.evaluate("() => document.querySelector('[data-testid=chart-sources] .rt-chart__hit[tabindex=\"0\"]').focus()")
    pg.wait_for_timeout(450)
    a = root.locator('.rt-chart__center-label').inner_text()
    pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(450)
    b = root.locator('.rt-chart__center-label').inner_text()
    r.ok('donut: keyboard focus walks over the segments (the centre follows)', 'Сайт' in a and 'Рекомендации' in b, f'{a!r} -> {b!r}')
    pg.keyboard.press('Escape')
    pg.locator('body').click(position={'x': 2, 'y': 2})
    # pie: no hole, the hover still works
    pie = pg.locator('[data-testid=v-pie] .rt-chart')
    pie.scroll_into_view_if_needed()
    pb = pie.locator('.rt-chart__plot').bounding_box()
    pg.mouse.move(pb['x'] + pb['width'] * 0.5, pb['y'] + pb['height'] * 0.5)
    pg.wait_for_timeout(500)
    r.ok('pie: hover at the centre opens a segment (there is no hole)', tip_state(pie)['open'])
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(300)
    dc = pg.locator('[data-testid=v-donut-center] .rt-chart')
    dc.scroll_into_view_if_needed()
    db = dc.locator('.rt-chart__plot').bounding_box()
    pg.mouse.move(db['x'] + db['width'] / 2 + 60, db['y'] + db['height'] / 2 - 24)
    pg.wait_for_timeout(500)
    r.ok('donut with a custom centre snippet: the snippet gets the active segment AND the tooltip is on', tip_state(dc)['open'] and '%' in dc.locator('.rt-chart__center').inner_text(), dc.locator('.rt-chart__center').inner_text())
    pg.mouse.move(2, 2)


def check_data_update(pg, r, motion, theme):
    """the "Обновить" button re-draws the revenue chart: morph with motion on, instant with motion off"""
    sel = '[data-testid=chart-revenue] path.rt-chart__line[data-series=fact]'
    pg.locator('[data-testid=chart-revenue]').scroll_into_view_if_needed()
    rec = pg.evaluate(SAMPLE, [sel, 'd', 900, '[data-testid=refresh]'])
    ds = [d for _, d in rec if d]
    distinct = list(dict.fromkeys(ds))
    if motion:
        r.ok('motion on: a data update morphs progressively (many intermediate shapes)', len(distinct) >= 5 and distinct[0] != distinct[-1], f'{len(distinct)} distinct shapes')
        settled = [t for t, d in rec if d == distinct[-1]]
        r.ok('motion on: ...and settles within ~0.6 s', settled and settled[0] < 700, f'settled at {settled[:1]} ms')
    else:
        r.ok('motion off: a data update is instant (no intermediate shapes)', len(distinct) <= 2 and distinct[0] != distinct[-1], f'{len(distinct)} distinct shapes')
        r.ok('motion off: ...already on the first frame after the click', rec[1][1] == distinct[-1] or rec[2][1] == distinct[-1], f'{[t for t, _ in rec[:4]]}')


def check_intro(pg, r, motion):
    """switching motion ON re-creates the charts: their draw-in plays (a growing clip rectangle / bars); OFF never clips"""
    if motion:
        # the page was opened with motion=1: the intro is over by now, so replay it by toggling the engine (re-creates the charts)
        pg.locator('[data-testid=engine-spring]').click()
        pg.wait_for_timeout(50)
        pg.locator('[data-testid=engine-tween]').click()
        rec = pg.evaluate(SAMPLE, ['[data-testid=chart-revenue] clipPath rect', 'width', 1100, None])
        widths = [float(v) for _, v in rec if v is not None]
        r.ok('motion on: the line chart draws in (a clip that grows from the left)', len(widths) >= 4 and widths[0] < widths[-1] * 0.6 and all(b >= a - 1e-6 for a, b in zip(widths, widths[1:])), f'{len(widths)} frames, {widths[:1]}..{widths[-1:]}')
        r.ok('motion on: ...and the clip is gone when it is over (nothing is left half-drawn)', rec[-1][1] is None and pg.locator('[data-testid=chart-revenue] clipPath').count() == 0)
        pg.locator('[data-testid=engine-spring]').click()
        pg.locator('[data-testid=engine-tween]').click()
        rec = pg.evaluate(SAMPLE, ['[data-testid=chart-stages] path.rt-chart__bar[data-series=small]', 'd', 1100, None])
        ds = list(dict.fromkeys(d for _, d in rec if d))
        r.ok('motion on: the bars grow from the baseline (many intermediate shapes)', len(ds) >= 6, f'{len(ds)} shapes')
        pg.wait_for_timeout(1200)
    else:
        r.ok('motion off: no clip-path reveal exists in the charts', pg.locator('[data-testid=chart-revenue] clipPath').count() == 0 and pg.locator('[data-testid=chart-revenue][data-motion=off]').count() == 1)


def check_live_resize(pg, r):
    """the charts follow their container while the page is open (ResizeObserver): the drawing is re-laid out at the new width, then again at the old one"""
    js = """(sel) => { const r = document.querySelector(sel); const svg = r.querySelector('svg.rt-chart__svg'); const plot = r.querySelector('.rt-chart__plot');
      const vb = svg.getAttribute('viewBox').split(' ').map(Number); const last = [...r.querySelectorAll('.rt-chart__hit')].pop();
      return { vbW: vb[2], plotW: plot.getBoundingClientRect().width, hitLeft: parseFloat(last.style.left), ticks: r.querySelectorAll('text.rt-chart__tick--x').length }; }"""
    sel = '[data-testid=chart-revenue]'
    pg.locator(sel).scroll_into_view_if_needed()
    a = pg.evaluate(js, sel)
    pg.set_viewport_size({'width': 1150, 'height': 1000})  # still the 12-column layout (the single-column one starts below 1100 px), so the card gets narrower
    pg.wait_for_timeout(500)
    b = pg.evaluate(js, sel)
    pg.set_viewport_size({'width': 1360, 'height': 1000})
    pg.wait_for_timeout(500)
    c = pg.evaluate(js, sel)
    r.ok('live resize: the drawing follows a narrower container and comes back (viewBox = plot width, points re-positioned)',
         abs(a['vbW'] - a['plotW']) <= 1 and b['vbW'] < a['vbW'] - 40 and abs(b['vbW'] - b['plotW']) <= 1 and b['hitLeft'] < a['hitLeft'] - 40 and abs(c['vbW'] - a['vbW']) <= 1, f'{a} {b} {c}')


def check_select(pg, r):
    """`onSelect`: a click (line, bar, donut) and Enter on a keyboard-focused point report the position"""
    sel = pg.locator('[data-testid=selection]')
    line = pg.locator('[data-testid=chart-revenue]')
    line.scroll_into_view_if_needed()
    b = line.locator('.rt-chart__plot').bounding_box()
    pg.mouse.click(b['x'] + b['width'] * 0.5, b['y'] + b['height'] * 0.4)
    pg.wait_for_timeout(200)
    r.ok('onSelect: a click on the line chart reports the month', re.fullmatch(r'Выбрано: месяц: [а-я]+', sel.inner_text().strip()) is not None, sel.inner_text())
    pg.mouse.move(2, 2)
    line.locator('.rt-chart__legend-item').last.focus()
    pg.keyboard.press('Tab')
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(200)
    r.ok('onSelect: Enter on the focused first point reports January', sel.inner_text().strip() == 'Выбрано: месяц: январь', sel.inner_text())
    pg.keyboard.press('Escape')
    pg.locator('body').click(position={'x': 2, 'y': 2})
    bar = pg.locator('[data-testid=chart-stages]')
    bar.scroll_into_view_if_needed()
    bb = bar.locator('.rt-chart__plot').bounding_box()
    pg.mouse.click(bb['x'] + bb['width'] * 0.92, bb['y'] + bb['height'] * 0.5)
    pg.wait_for_timeout(200)
    r.ok('onSelect: a click on the last category of the bar chart reports it', sel.inner_text().strip() == 'Выбрано: этап «Договор»', sel.inner_text())
    don = pg.locator('[data-testid=chart-sources]')
    don.scroll_into_view_if_needed()
    db = don.locator('.rt-chart__plot').bounding_box()
    R = db['width'] / 2 - 7
    rad = R * (1 + 0.62) / 2
    ang = math.radians(68)
    pg.mouse.click(db['x'] + db['width'] / 2 + rad * math.sin(ang), db['y'] + db['height'] / 2 - rad * math.cos(ang))
    pg.wait_for_timeout(200)
    r.ok('onSelect: a click on a donut segment reports it', sel.inner_text().strip() == 'Выбрано: источник «Сайт» — 456', sel.inner_text())
    pg.mouse.move(2, 2)


def check_late_data(pg, r, motion):
    """data that arrives after the chart was mounted empty: the empty state gives way to a chart, which draws in with motion on"""
    root = '[data-testid=v-line-empty] .rt-chart'
    pg.locator(root).scroll_into_view_if_needed()
    if motion:
        rec = pg.evaluate(SAMPLE, ['[data-testid=v-line-empty] clipPath rect', 'width', 1100, '[data-testid=load-data]'])
        widths = [float(v) for _, v in rec if v is not None]
        r.ok('late data, motion on: the chart draws in when the data arrives (a growing clip)', len(widths) >= 4 and widths[0] < widths[-1] * 0.6 and all(b >= a - 1e-6 for a, b in zip(widths, widths[1:])), f'{len(widths)} frames {widths[:1]}..{widths[-1:]}')
    else:
        pg.locator('[data-testid=load-data]').click()
        pg.wait_for_timeout(300)
        r.ok('late data, motion off: the chart appears at once, never clipped', pg.locator(root + ' clipPath').count() == 0)
    pg.wait_for_timeout(1100)
    r.ok('late data: the empty state is replaced by a drawn chart (line + area + table)', pg.locator(root + ' .rt-chart__empty').count() == 0 and pg.locator(root + ' path.rt-chart__line').count() == 1 and pg.locator(root + ' path.rt-chart__area').count() == 1 and pg.locator(root + ' .rt-chart__sr tbody tr').count() == 9 and pg.locator(root + ' clipPath').count() == 0)
    pg.locator('[data-testid=load-data]').click()
    pg.wait_for_timeout(500)
    r.ok('late data: clearing the data brings the empty state back', pg.locator(root + ' .rt-chart__empty').count() == 1 and pg.locator(root + ' svg').count() == 0)


def check_hover_motion(pg, r, motion):
    """the legend emphasis glides with motion on and is immediate with motion off"""
    root = pg.locator('[data-testid=chart-revenue]')
    root.scroll_into_view_if_needed()
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(300)
    item = root.locator('.rt-chart__legend-item', has_text='Факт 2026')
    bb = item.bounding_box()
    pg.evaluate(BG_SAMPLE_START, ['[data-testid=chart-revenue] path.rt-chart__line[data-series=plan]', 'opacity', 900])
    pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    pg.wait_for_timeout(1000)
    rec = pg.evaluate('window.__rec') or []
    vals = list(dict.fromkeys(round(float(v), 3) for _, v in rec if v is not None))
    if motion:
        r.ok('motion on: the emphasis (the other series recede) glides', len(vals) >= 4 and vals[0] > 0.95 and vals[-1] < 0.4, str(vals[:8]))
    else:
        r.ok('motion off: the emphasis is immediate (one step)', len(vals) <= 2 and vals[-1] < 0.4, str(vals))
    pg.mouse.move(2, 2)
    pg.wait_for_timeout(500)


def check_states(pg, r):
    # the single point is drawn, the empty state says so, the time axis picks calendar ticks
    one = pg.evaluate("""() => { const r = document.querySelector('[data-testid=v-line-one] .rt-chart'); return { dots: r.querySelectorAll('circle.rt-chart__dot').length, x: [...r.querySelectorAll('text.rt-chart__tick--x')].map(e => e.textContent.trim()) }; }""")
    r.ok('single point: one marker and its label on the x axis', one['dots'] >= 1 and one['x'] == ['Сентябрь'], str(one))
    empty = pg.evaluate("""() => { const r = document.querySelector('[data-testid=v-line-empty] .rt-chart'); const e = r.querySelector('.rt-chart__empty'); return { text: e ? e.textContent.trim() : null, label: e ? e.getAttribute('aria-label') : null, svg: r.querySelectorAll('svg').length }; }""")
    r.ok('empty data: a text instead of a chart, labelled, no svg', empty['text'] == 'Нет данных' and 'Нет данных' in empty['label'] and empty['svg'] == 0, str(empty))
    tx = pg.evaluate("""() => [...document.querySelectorAll('[data-testid=v-time-axis] text.rt-chart__tick--x')].map(e => e.textContent.trim())""")
    r.ok('time axis: calendar ticks (month / day names)', len(tx) >= 2 and all(re.search(r'[а-я]', t) for t in tx), str(tx))
    lg = pg.evaluate("""() => [...document.querySelectorAll('[data-testid=v-line-long] text.rt-chart__tick--x')].map(e => e.textContent.trim())""")
    r.ok('long data + numeric x: ticks formatted by xFormat', all(t.startswith('нед.') for t in lg) and len(lg) >= 2, str(lg))
    # custom colours: the `colors` prop wins over the palette
    col = pg.evaluate("""() => { const p = document.querySelector('[data-testid=v-custom-colors] path.rt-chart__bar'); return getComputedStyle(p).fill; }""")
    ref = pg.evaluate("""() => { const d = document.createElement('div'); d.style.color = 'var(--atmr-success-default)'; document.querySelector('[data-testid=v-custom-colors]').appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; }""")
    r.ok('custom colours: `colors=[...]` paints the marks (success token)', col == ref, f'{col} vs {ref}')
    # the palette can be overridden by a CSS variable on the chart
    over = pg.evaluate("""() => { const root = document.querySelector('[data-testid=v-bar-grouped] .rt-chart'); root.style.setProperty('--rt-chart-1', 'rgb(1, 2, 3)');
      const f = getComputedStyle(root.querySelector('path.rt-chart__bar')).fill; root.style.removeProperty('--rt-chart-1'); return f; }""")
    r.ok('override: --rt-chart-1 set on the chart repaints series 1', over == 'rgb(1, 2, 3)', over)


def check_motion_equal(store, theme, r):
    a, b = store.get((theme, '0')), store.get((theme, '1'))
    if not a or not b:
        return
    for k in a:
        r.ok(f'motion on vs off ({theme}): identical geometry after the animation ({k})', close_paths(a[k], b[k]), f'{len(a[k])} vs {len(b[k])} paths')


def check_reduced(browser, base, r, theme):
    ctx, pg, logs = open_page(browser, base, theme, '1', reduced=True)
    modes = pg.eval_on_selector_all('[data-testid=dashboard] .rt-chart', 'els => [...new Set(els.map(e => e.getAttribute("data-motion")))]')
    r.ok('prefers-reduced-motion: every chart runs the instant path even with the provider on', modes == ['off'], str(modes))
    rec = pg.evaluate(SAMPLE, ['[data-testid=chart-revenue] path.rt-chart__line[data-series=fact]', 'd', 400, '[data-testid=refresh]'])
    ds = list(dict.fromkeys(d for _, d in rec if d))
    r.ok('prefers-reduced-motion: a data update is instant', len(ds) <= 2 and pg.locator('[data-testid=chart-revenue] clipPath').count() == 0, f'{len(ds)} shapes')
    r.ok('prefers-reduced-motion: no console errors / warnings', not logs, '; '.join(logs[:3]))
    ctx.close()


def check_responsive(browser, base, r, theme):
    for w in (820, 390):
        ctx, pg, logs = open_page(browser, base, theme, '0', w=w, h=900)
        probe = pg.evaluate(PROBE)
        over = {k: v['overflow'] for k, v in probe.items() if v and 'overflow' in v and v['overflow'] > 1}
        r.ok(f'{w}px: no chart overflows its container', not over, str(over))
        bad = pg.evaluate("""() => { const out = [];
          for (const card of document.querySelectorAll('.card')) { const C = card.getBoundingClientRect();
            for (const t of card.querySelectorAll('svg.rt-chart__svg text, .rt-chart__tooltip, .rt-chart__legend')) { const b = t.getBoundingClientRect();
              if (b.width && (b.right > C.right + 1 || b.left < C.left - 1)) out.push((t.textContent || t.className).trim().slice(0, 20)); } } return out.slice(0, 6); }""")
        r.ok(f'{w}px: labels and legends stay inside their cards', not bad, str(bad))
        # rotated labels (narrow bar charts) overlap as boxes by construction: for them the anchors must be far enough apart for the line height
        coll = pg.evaluate("""() => { const out = [];
          for (const svg of document.querySelectorAll('svg.rt-chart__svg')) {
            const els = [...svg.querySelectorAll('text.rt-chart__tick--x')].filter(e => e.getBoundingClientRect().width);
            if (els.some(e => e.getAttribute('transform'))) { const xs = els.map(e => parseFloat(e.getAttribute('x'))).sort((a, b) => a - b); for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] < 22) out.push('rot' + i); continue; }
            const ts = els.map(e => e.getBoundingClientRect()).sort((a, b) => a.left - b.left);
            for (let i = 1; i < ts.length; i++) if (ts[i].left < ts[i - 1].right - 0.5 && !(ts[i].top >= ts[i - 1].bottom || ts[i].bottom <= ts[i - 1].top)) out.push(i); } return out; }""")
        r.ok(f'{w}px: x tick labels do not collide (rotated ones are >= 22 px apart)', not coll, str(coll))
        pg.locator('[data-testid=chart-revenue] .rt-chart__plot').hover(position={'x': 120, 'y': 100})
        pg.wait_for_timeout(400)
        tb = pg.locator('[data-testid=chart-revenue] .rt-chart__tooltip').bounding_box()
        pb = pg.locator('[data-testid=chart-revenue] .rt-chart__plot').bounding_box()
        r.ok(f'{w}px: the tooltip fits inside the plot', tb['x'] >= pb['x'] - 1 and tb['x'] + tb['width'] <= pb['x'] + pb['width'] + 1, f'{tb} {pb}')
        r.ok(f'{w}px: no console errors / warnings', not logs, '; '.join(logs[:3]))
        ctx.close()


# ───────────────────────────────────────────────────────────────────────────────────────── screenshots
def optimise(img):
    from PIL import Image
    return img.convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


MAX_W = 1400  # as in tools/screenshots.py


def save(img, name):
    from PIL import Image
    if img.width > MAX_W:
        img = img.resize((MAX_W, round(img.height * MAX_W / img.width)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.png'
    optimise(img).save(path, format='PNG', optimize=True)
    print(f'  {path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size // 1024} KB', flush=True)
    return path


def grab(pg, sel, pad=0):
    from PIL import Image
    loc = pg.locator(sel).first
    loc.scroll_into_view_if_needed()
    pg.wait_for_timeout(120)
    return Image.open(io.BytesIO(loc.screenshot())).convert('RGB')


def card_of(testid):
    return f'.card:has([data-testid="{testid}"]), .card[data-testid="{testid}"]'


def hover_in(pg, sel, fx, fy):
    pg.locator(sel).first.scroll_into_view_if_needed()
    pg.wait_for_timeout(120)
    b = pg.locator(sel).first.bounding_box()
    pg.mouse.move(b['x'] + b['width'] * fx, b['y'] + b['height'] * fy)
    pg.wait_for_timeout(500)


def grid(images, cols, gap=24, bg=(248, 249, 250), pad=24):
    """contact sheet: images of any size, `cols` per row (the same helper as tools/screenshots.py)"""
    from PIL import Image
    rows = [images[i:i + cols] for i in range(0, len(images), cols)]
    col_w = [max((r[c].width for r in rows if c < len(r)), default=0) for c in range(cols)]
    row_h = [max(i.height for i in r) for r in rows]
    sheet = Image.new('RGB', (pad * 2 + sum(col_w) + gap * (cols - 1), pad * 2 + sum(row_h) + gap * (len(rows) - 1)), bg)
    y = pad
    for r, rh in zip(rows, row_h):
        x = pad
        for c, im in enumerate(r):
            sheet.paste(im, (x, y))
            x += col_w[c] + gap
        y += rh + gap
    return sheet


def shots(browser, base):
    from PIL import Image, ImageDraw, ImageFont
    print('screenshots:', flush=True)

    def font(size):
        for f in ('segoeui.ttf', 'Segoe UI.ttf', 'arial.ttf', 'DejaVuSans.ttf'):
            try:
                return ImageFont.truetype(f, size)
            except OSError:
                continue
        return ImageFont.load_default(size)

    def body_bg(pg):
        m = re.findall(r'\d+', pg.evaluate("() => getComputedStyle(document.body).backgroundColor"))
        return tuple(int(x) for x in m[:3])

    # 1. the dashboard in two themes (retina is not needed: the images are wide)
    for theme, tag in ((LIGHT, 'light'), (PDARK, 'purple-dark')):
        ctx, pg, logs = open_page(browser, base, theme, '0', w=1360, h=1000, scale=1, init=True)
        save(grab(pg, '[data-testid=dashboard]'), f'charts-dashboard-{tag}')
        ctx.close()

    # 2. one image per chart type (light theme, retina), with the interaction that shows it best
    ctx, pg, logs = open_page(browser, base, LIGHT, '0', w=1360, h=1000, scale=2, init=True)
    hover_in(pg, '[data-testid=chart-revenue] .rt-chart__plot', 0.55, 0.42)
    save(grab(pg, card_of('chart-revenue')), 'charts-line')
    pg.mouse.move(2, 2)
    hover_in(pg, '[data-testid=chart-stages] .rt-chart__plot', 0.32, 0.5)
    save(grab(pg, card_of('chart-stages')), 'charts-bar')
    pg.mouse.move(2, 2)
    save(grab(pg, card_of('chart-funnel')), 'charts-funnel')
    b = pg.locator('[data-testid=chart-sources] .rt-chart__plot').bounding_box()
    pg.mouse.move(b['x'] + b['width'] / 2 + 66, b['y'] + b['height'] / 2 - 26)
    pg.wait_for_timeout(500)
    save(grab(pg, card_of('chart-sources')), 'charts-donut')
    pg.mouse.move(2, 2)
    save(grab(pg, card_of('managers-table')), 'charts-sparkline')
    hover_in(pg, '[data-testid=v-pie] .rt-chart__plot', 0.3, 0.4)
    save(grab(pg, card_of('v-pie')), 'charts-pie')
    pg.mouse.move(2, 2)
    ctx.close()
    ctx, pg, logs = open_page(browser, base, LIGHT, '0', w=1360, h=1000, scale=1, init=True)
    save(grab(pg, '[data-testid=variants]'), 'charts-variants')
    ctx.close()

    # 3. the four themes: the revenue line (hovered) and the donut of every theme in one sheet + the palette strip of every theme
    cells, strips = [], []
    f = font(15)
    for theme in THEMES:
        ctx, pg, logs = open_page(browser, base, theme, '0', w=1360, h=1000, scale=1, init=True)
        bg = body_bg(pg)
        light = theme.endswith('_light')
        ink = (90, 96, 110) if light else (190, 195, 205)
        hover_in(pg, '[data-testid=chart-revenue] .rt-chart__plot', 0.55, 0.42)
        card = grab(pg, card_of('chart-revenue'))
        pg.mouse.move(2, 2)
        don = grab(pg, card_of('chart-sources'))
        pal = grab(pg, '[data-testid=palette-strip]')
        cell = Image.new('RGB', (card.width + don.width + 16, max(card.height, don.height) + 30), bg)
        cell.paste(card, (0, 30))
        cell.paste(don, (card.width + 16, 30))
        ImageDraw.Draw(cell).text((4, 5), THEME_TITLES[theme], fill=ink, font=f)
        cells.append(cell)
        strip = Image.new('RGB', (pal.width + 230, pal.height + 14), bg)
        strip.paste(pal, (224, 7))
        ImageDraw.Draw(strip).text((8, strip.height // 2 - 9), THEME_TITLES[theme], fill=ink, font=f)
        strips.append(strip)
        ctx.close()
    save(grid(cells, 2, gap=16, bg=(128, 128, 128), pad=8), 'charts-themes')
    save(grid(strips, 1, gap=0, bg=(128, 128, 128), pad=0), 'charts-palette')
    total = sum(p.stat().st_size for p in OUT.glob('charts-*.png'))
    print(f'  charts-*.png: {len(list(OUT.glob("charts-*.png")))} files, {total / 1024:.0f} KB', flush=True)


# ───────────────────────────────────────────────────────────────────────────────────────── main
def run_combo(browser, base, theme, motion, r, store):
    """one theme x motion round; the dev server is shared (another agent's edit can trigger a full reload mid-run), so it is retried once"""
    for attempt in (1, 2):
        mark = len(r.results)
        print(f'[{theme}  motion={"on" if motion == "1" else "off"}]' + ('  (retry)' if attempt == 2 else ''), flush=True)
        ctx = None
        try:
            ctx, pg, logs = open_page(browser, base, theme, motion)
            check_structure(pg, r)
            check_ticks(pg, r)
            if motion == '0':
                check_palette(pg, r, theme)
            store[(theme, motion)] = pg.evaluate(PATHS)
            check_states(pg, r)
            check_line(pg, r, motion == '1')
            check_bar(pg, r)
            check_donut(pg, r)
            check_hover_motion(pg, r, motion == '1')
            check_late_data(pg, r, motion == '1')
            check_select(pg, r)
            check_live_resize(pg, r)
            check_intro(pg, r, motion == '1')
            check_data_update(pg, r, motion == '1', theme)
            r.ok('no console errors / warnings', not logs, '; '.join(dict.fromkeys(logs))[:600])
            return
        except Exception as e:  # noqa: BLE001 - report and retry
            print(f'  ! {type(e).__name__}: {str(e).splitlines()[0][:220]}', flush=True)
            del r.results[mark:]
            if attempt == 2:
                r.ok(f'{theme} motion={motion}: the round ran to the end', False, f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        finally:
            if ctx:
                ctx.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--themes', nargs='*', default=THEMES)
    ap.add_argument('--motion', default='0,1', help='comma separated: 0 (off), 1 (on)')
    ap.add_argument('--no-shots', action='store_true')
    ap.add_argument('--shots-only', action='store_true')
    ap.add_argument('--no-ssr', action='store_true')
    ap.add_argument('--quick', action='store_true', help='2 themes, no reduced-motion / responsive rounds')
    a = ap.parse_args()
    themes = [LIGHT, PDARK] if a.quick and a.themes == THEMES else a.themes
    motions = [m for m in a.motion.split(',') if m]

    if not port_open('127.0.0.1', 5180):
        print('dev server is not running: node tools/up.mjs', flush=True)
        subprocess.run(['node', 'tools/up.mjs'], cwd=ROOT, check=False, shell=sys.platform == 'win32')
    r = Report()
    store = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        try:
            if not a.shots_only:
                for theme in themes:
                    for motion in motions:
                        run_combo(browser, a.base, theme, motion, r, store)
                    check_motion_equal(store, theme, r)
                if not a.quick:
                    print('[reduced motion]', flush=True)
                    check_reduced(browser, a.base, r, themes[0])
                    print('[responsive]', flush=True)
                    check_responsive(browser, a.base, r, themes[0])
                    if PDARK in themes:
                        check_responsive(browser, a.base, r, PDARK)
            if not a.shots_only and not a.no_ssr:
                print('[SSR]', flush=True)
                p = subprocess.run(['node', 'tools/check-charts-ssr.mjs'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', shell=sys.platform == 'win32')
                for line in p.stdout.splitlines():
                    ok = line.startswith('PASS')
                    r.ok('ssr: ' + line[6:].split('  ')[0].strip(), ok, line[6:] if not ok else '')
                if p.returncode not in (0, 1) or (not p.stdout.strip()):
                    r.ok('ssr: script ran', False, (p.stderr or '')[-400:])
            if not a.no_shots:
                shots(browser, a.base)
        finally:
            browser.close()
    print(f'\n{len(r.results) - r.failed} passed, {r.failed} failed', flush=True)
    sys.exit(1 if r.failed else 0)


if __name__ == '__main__':
    main()
