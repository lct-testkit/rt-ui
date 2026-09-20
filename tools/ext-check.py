"""EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default.

Behavioural check of the author's motion extensions on the demo route /ext (Playwright, headless Chromium).
It proves the two halves of the contract:

  * motion OFF (the default)  -> style values jump to the target immediately (the first animation frame after the click),
                                 original components carry no `rt-ext-*` class / inline variable, `motion={false}` keeps a
                                 Slider exactly original;
  * motion ON (tween / spring) -> the same style values change PROGRESSIVELY (several intermediate frames, > 100 ms) and end at
                                 the target; dragging a Slider thumb is NOT smoothed; the component prop overrides the global
                                 mode; prefers-reduced-motion: reduce switches everything off again.

  python tools/ext-check.py [--base http://127.0.0.1:5180] [--headed] [-v]

Second wave (the last section of the run, `check_second_wave`): Calendar (PickerDate / InputDate), Accordion, Tabs and SideMenu, each loaded twice
(`/ext?cal|acc|tabs|sm=off` and `=svelte`) and sampled on every animation frame:

  * motion OFF   -> the ORIGINAL path: no rt-ext-* markers, no extension inline styles at any frame, the original inline CSS transition / class flips;
  * motion ON    -> the animation really runs (progressive, monotonic, > 100 ms; a Spring where asked) and the FINAL DOM is right: identical to the OFF
                    DOM after the same actions (Tabs: except the documented indicator span + class; the settled tabs are also PIXEL-identical),
  * `motion={false}` / `motion="spring"` beat the mode; prefers-reduced-motion: reduce switches everything off.

Needs the playground dev server (node tools/up.mjs). Exit code 0 = all checks passed. The pixel-for-pixel proof that the ORIGINAL
components did not change with the extension off is `python tools/compare.py` (slider / stepper / wizard / pickerdate / inputdate / accordion /
tabs / sidemenu stories).
"""
import argparse
import sys

from playwright.sync_api import sync_playwright

TOL = 0.6  # percent (or px) tolerance when comparing a sampled value with the target

# runs `trigger()` in the page and reads `read()` on every animation frame for `ms`; `read` returns {name: number}
SAMPLER = """
async ({trigger, read, ms}) => {
  const tr = eval(trigger), rd = eval(read);
  const out = [];
  const t0 = performance.now();
  tr();
  return await new Promise((res) => {
    const f = () => { const t = performance.now() - t0; out.push([t, rd()]); t < ms ? requestAnimationFrame(f) : res(out); };
    requestAnimationFrame(f);
  });
}
"""


# every visible text of the demo must use the Rostelecom font and must not be default-black (= a missing font / colour base)
TEXT_STYLE = """
() => {
  const bad = [], seen = new Set();
  const w = document.createTreeWalker(document.querySelector('main.page'), NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode.textContent.trim();
    const el = w.currentNode.parentElement;
    if (!t || !el || seen.has(el) || el.closest('code, script, style')) continue;
    seen.add(el);
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || !r.width || !r.height) continue;
    if (!/Rostelecom/i.test(cs.fontFamily)) bad.push('font[' + cs.fontFamily.slice(0, 20) + '] ' + t.slice(0, 24));
    if (cs.color === 'rgb(0, 0, 0)') bad.push('black ' + t.slice(0, 24));
  }
  return bad;
}
"""


def click(tid):
    return f"() => document.querySelector('[data-testid={tid}]').click()"


READ = {
    # linear Progress fill width in %
    'bar': "parseFloat(document.querySelector('[data-testid=pg-main] .rt-ext-progress__fill').style.width)",
    'bar_false': "parseFloat(document.querySelector('[data-testid=ov-false] .rt-ext-progress__fill').style.width)",
    'bar_tween': "parseFloat(document.querySelector('[data-testid=ov-tween] .rt-ext-progress__fill').style.width)",
    'bar_spring': "parseFloat(document.querySelector('[data-testid=ov-spring] .rt-ext-progress__fill').style.width)",
    # circular Progress: first number of stroke-dasharray (pathLength = 100)
    'ring': "parseFloat(document.querySelector('[data-testid=pg-ring] .rt-ext-progress__ring-fill').getAttribute('stroke-dasharray'))",
    # Slider (single): thumb position (inline custom property), fill width, tooltip number
    'thumb': "parseFloat(document.querySelector('[data-testid=ext-slider-single] [role=slider]').style.getPropertyValue('--atmr-slider-thumb-position'))",
    'fill': "parseFloat(document.querySelector('[data-testid=ext-slider-single] .atmr-slider__track-fill').style.width)",
    'tip': "parseFloat(document.querySelector('[data-testid=ext-slider-single] .atmr-slider__tooltip-content').textContent)",
    'thumb_off': "parseFloat(document.querySelector('[data-testid=ext-slider-off] [role=slider]').style.getPropertyValue('--atmr-slider-thumb-position'))",
    # Wizard: --rt-ext-fill of the first step (0..100), NaN while the extension is off
    'wiz': "parseFloat(document.querySelector('[data-testid=ext-wizard] .atmr-wizard-horizontal-item').style.getPropertyValue('--rt-ext-fill'))",
    # rtSlide panel height in px
    'panel': "(document.querySelector('[data-testid=ext-panel]')?.getBoundingClientRect().height ?? 0)",
}


def reader(*names):
    return "() => ({" + ", ".join(f"{n}: {READ[n]}" for n in names) + "})"


class Report:
    def __init__(self, verbose):
        self.rows, self.verbose = [], verbose

    def check(self, name, ok, detail=''):
        self.rows.append((name, bool(ok), detail))
        print(('PASS  ' if ok else 'FAIL  ') + name + (f'   [{detail}]' if detail else ''))
        return ok

    @property
    def failed(self):
        return [r for r in self.rows if not r[1]]


def series(samples, name):
    return [(t, v[name]) for t, v in samples]


def analyse(s, start, target):
    """s = [(t_ms, value)] sampled on animation frames after the trigger."""
    vs = [v for _, v in s]
    lo, hi = min(start, target) + TOL, max(start, target) - TOL
    inter = [v for v in vs if lo < v < hi]
    change = next((t for t, v in s if abs(v - start) > TOL), None)
    not_yet = [t for t, v in s if abs(v - target) > TOL]
    settled = (not_yet[-1] if not_yet else 0)
    return {'first': vs[0], 'final': vs[-1], 'inter': len(inter), 'change': change, 'settled': settled,
            'dur': (settled - change) if change is not None else 0, 'vs': vs}


def fmt(a):
    return f"first={a['first']:.1f} final={a['final']:.1f} inter={a['inter']} dur={a['dur']:.0f}ms"


def is_instant(a, target):
    return abs(a['first'] - target) <= TOL and abs(a['final'] - target) <= TOL and a['inter'] == 0


def is_progressive(a, target, monotonic=False):
    ok = abs(a['first'] - target) > TOL and abs(a['final'] - target) <= TOL and a['inter'] >= 3 and a['dur'] > 100
    if ok and monotonic:
        vs = a['vs']
        ok = all(y >= x - 1e-6 for x, y in zip(vs, vs[1:])) if target > vs[0] else all(y <= x + 1e-6 for x, y in zip(vs, vs[1:]))
    return ok


def run(page, trigger, names, ms=1600):
    return page.evaluate(SAMPLER, {'trigger': trigger, 'read': reader(*names), 'ms': ms})


def pick(page, seg):
    page.click(f'[data-testid=motion-{seg}]')
    page.wait_for_timeout(500)  # sliders are re-created on a mode change


def reset(page, ms=2200):
    page.evaluate(click('p-0'))
    page.evaluate(click('s-0'))
    page.evaluate(click('w-reset'))
    page.wait_for_timeout(ms)


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# Second wave (calendar, accordion, tabs, side menu): each block loads the demo section twice, ?<sec>=off and ?<sec>=svelte
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

# a canonical serialisation of an element (attributes and `style` declarations sorted, ids dropped, comments ignored);
# `dropClass` removes class names, `dropSel` removes elements: the documented differences of the motion-on markup
CANON = r"""
({sel, dropClass, dropSel}) => {
  const SKIP = /^(id|for|aria-labelledby|aria-controls|aria-describedby)$/;
  const canon = (n) => {
    if (n.nodeType === 3) return n.textContent;
    if (n.nodeType !== 1) return '';
    if (dropSel && n.matches(dropSel)) return '';
    const attrs = [...n.attributes].filter((a) => !SKIP.test(a.name)).map((a) => {
      let v = a.value;
      if (a.name === 'class' && dropClass) v = v.split(/\s+/).filter((c) => !dropClass.includes(c)).join(' ');
      if (a.name === 'style') v = v.split(';').map((d) => d.trim()).filter(Boolean).sort().join('; ');
      return a.name + '="' + v + '"';
    }).sort();
    const tag = n.tagName.toLowerCase();
    return '<' + tag + (attrs.length ? ' ' + attrs.join(' ') : '') + '>' + [...n.childNodes].map(canon).join('') + '</' + tag + '>';
  };
  const el = document.querySelector(sel);
  return el ? canon(el) : null;
}
"""


def canon(page, sel, drop_class=None, drop_sel=None):
    return page.evaluate(CANON, {'sel': sel, 'dropClass': drop_class, 'dropSel': drop_sel})


def sample(page, trigger, read, ms):
    """[(t_ms, value)]: `trigger` (JS source of a function) is run in the page, `read` (JS source) is evaluated on every animation frame"""
    return page.evaluate(SAMPLER, {'trigger': trigger, 'read': read, 'ms': ms})


def vals(s, i=None):
    return [v if i is None else v[i] for _, v in s]


def mono(vs, up=True, eps=1e-3):
    return all(b >= a - eps for a, b in zip(vs, vs[1:])) if up else all(b <= a + eps for a, b in zip(vs, vs[1:]))


def span_ms(s, pred):
    """how long (ms) `pred(value)` held: from the first to the last frame where it was true"""
    ts = [t for t, v in s if pred(v)]
    return (ts[-1] - ts[0]) if ts else 0


def open_section(browser, url, testid, **ctx_args):
    ctx = browser.new_context(viewport={'width': 1280, 'height': 1000}, locale='ru-RU', **ctx_args)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:300]))
    page.goto(url, wait_until='load')
    page.wait_for_selector(f'[data-testid={testid}]', timeout=30000)
    page.evaluate(f"() => document.querySelector('[data-testid={testid}]').scrollIntoView({{block: 'center'}})")
    page.wait_for_timeout(900)
    return ctx, page, errors


def js_click(sel, nth=0):
    return f"() => document.querySelectorAll({sel!r})[{nth}].click()"


# ─── calendar ────────────────────────────────────────────────────────────────────────────────────────────────────────
CAL_GRIDS = "() => { const g = [...document.querySelectorAll('[data-testid=%s] .atmr-calendar__calendar')]; return [g.length, g.map((x) => +getComputedStyle(x).opacity), g.map((x) => x.getAttribute('style') || ''), g.map((x) => getComputedStyle(x).transform === 'none' ? 0 : new DOMMatrix(getComputedStyle(x).transform).m41)]; }"
CAL_MONTH = "() => (document.querySelector('[data-testid=%s] .atmr-calendar-header__item--month') || {}).textContent"
CAL_YEAR = "() => (document.querySelector('[data-testid=%s] .atmr-calendar-header__item--year') || {}).textContent"


def check_calendar(browser, rep, base):
    finals = {}
    for mode in ('off', 'svelte'):
        tag = f'calendar {mode}'
        ctx, page, errors = open_section(browser, f'{base}/ext?cal={mode}', 'cal-day')
        nxt = js_click('[data-testid=cal-day] .atmr-calendar-header__button', 1)
        prv = js_click('[data-testid=cal-day] .atmr-calendar-header__button', 0)

        # ---- next month -----------------------------------------------------------------------------------------------
        s = sample(page, nxt, CAL_GRIDS % 'cal-day', 700)
        counts = [v[0] for _, v in s]
        two = span_ms(s, lambda v: v[0] == 2)
        if mode == 'off':
            rep.check(f'{tag}: next month changes in place (one grid at every frame, no inline style, no animation)',
                      max(counts) == 1 and all(not v[2][0] for _, v in s) and page.evaluate(CAL_MONTH % 'cal-day') == 'Октябрь', f'grids={sorted(set(counts))}')
        else:
            old = [(t, v) for t, v in s if v[0] == 2]
            rep.check(f'{tag}: next month cross-fades two grids for > 100 ms', two > 100 and set(counts) == {1, 2}, f'two grids for {two:.0f} ms')
            rep.check(f'{tag}: the leaving grid is detached (position: absolute) and the arriving one is not', bool(old) and 'position: absolute' in old[0][1][2][0] and 'position' not in old[0][1][2][1])
            rep.check(f'{tag}: the leaving grid fades out and goes LEFT, the arriving one fades in from the RIGHT (direction = next)',
                      mono([v[1][0] for _, v in old], up=False) and mono([v[1][1] for _, v in old], up=True) and old[-1][1][3][0] < -5 and old[0][1][3][1] > 5,
                      f'x_old={old[-1][1][3][0]:.1f} x_new_start={old[0][1][3][1]:.1f}')
            rep.check(f'{tag}: after the move: one grid, no inline style left', counts[-1] == 1 and not s[-1][1][2][0])
        # header label of the month: slides + fades in (on), plain text (off)
        page.wait_for_timeout(500)
        s = sample(page, prv, "() => { const e = document.querySelector('[data-testid=cal-day] .atmr-calendar-header__item--month'); return [+getComputedStyle(e).opacity, e.getAttribute('style') || '', e.textContent]; }", 600)
        ops = vals(s, 0)
        if mode == 'off':
            rep.check(f'{tag}: the month label is static (no inline style ever)', all(not v[1] for _, v in s) and min(ops) == 1)
        else:
            rep.check(f'{tag}: the month label fades + slides in (inline opacity / translate) and the inline style is gone afterwards',
                      min(ops) < 0.5 and any('translate' in v[1] for _, v in s) and not s[-1][1][1] and s[-1][1][2] == 'Сентябрь', f'min opacity {min(ops):.2f}')
        page.wait_for_timeout(400)

        # ---- change of view: click the month -> the month view ---------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=cal-day] .atmr-calendar-header__item--month').click()",
                   "() => { const c = document.querySelector('[data-testid=cal-day] .atmr-calendar'); const g = c.querySelector('.atmr-calendar__calendar'); return [+getComputedStyle(g).opacity, +getComputedStyle(c).opacity, c.className.includes('--month')]; }", 700)
        if mode == 'off':
            rep.check(f'{tag}: a change of view shows the new view at once', s[0][1][2] and s[0][1][0] == 1 and min(vals(s, 0)) == 1)
        else:
            rep.check(f'{tag}: a change of view zooms the grid in (fade-in) while the calendar box stays opaque', s[0][1][0] < 0.3 and vals(s, 0)[-1] == 1 and min(vals(s, 1)) == 1 and mono(vals(s, 0), up=True),
                      f'grid opacity {s[0][1][0]:.2f}->{vals(s, 0)[-1]}, box min {min(vals(s, 1))}')
        page.wait_for_timeout(300)
        # pick a month -> the day view (Ноябрь: index 10), then select the day 20
        page.evaluate("() => [...document.querySelectorAll('[data-testid=cal-day] .atmr-calendar__item .atmr-calendar__inner')][10].click()")
        page.wait_for_timeout(1000)
        # ---- the highlight of a selected day -----------------------------------------------------------------------------
        s = sample(page, "() => [...document.querySelectorAll('[data-testid=cal-day] .atmr-calendar__item .atmr-calendar__inner')].find((e) => e.textContent.trim() === '20').click()",
                   "() => { const it = [...document.querySelectorAll('[data-testid=cal-day] .atmr-calendar__item')].find((e) => e.textContent.trim() === '20'); const i = it.querySelector('.atmr-calendar__inner'); return [+getComputedStyle(i).opacity, getComputedStyle(i).scale, i.getAttribute('style') || '', it.className.includes('item--focusedFirst')]; }", 600)
        selected = any(v[3] for _, v in s)
        if mode == 'off':
            rep.check(f'{tag}: the selected day is highlighted at once, no inline style on the cell', selected and all(not v[2] for _, v in s) and min(vals(s, 0)) == 1)
        else:
            rep.check(f'{tag}: the selected day softens in (opacity 0.4 -> 1, scale 0.88 -> 1, inline) and the inline style is removed afterwards',
                      selected and min(vals(s, 0)) < 0.8 and any('scale' in v[2] for _, v in s) and not s[-1][1][2], f'min opacity {min(vals(s, 0)):.2f}')
        page.wait_for_timeout(300)
        page.evaluate(nxt)
        page.wait_for_timeout(1200)
        finals[mode] = canon(page, '[data-testid=cal-day]')

        # ---- YEARS_WITH_MONTH: next year ------------------------------------------------------------------------------------
        s = sample(page, js_click('[data-testid=cal-years] .atmr-calendar-header__button', 1), CAL_GRIDS % 'cal-years', 700)
        counts = [v[0] for _, v in s]
        if mode == 'off':
            rep.check(f'{tag}: next year changes in place (one grid)', max(counts) == 1 and page.evaluate(CAL_YEAR % 'cal-years') == '2027')
        else:
            rep.check(f'{tag}: next year cross-fades the month grids (> 100 ms) and ends with one grid', span_ms(s, lambda v: v[0] == 2) > 100 and counts[-1] == 1 and page.evaluate(CAL_YEAR % 'cal-years') == '2027')

        # ---- the per-component prop -----------------------------------------------------------------------------------------
        s = sample(page, js_click('[data-testid=cal-off] .atmr-calendar-header__button', 1), CAL_GRIDS % 'cal-off', 500)
        rep.check(f'{tag}: motion={{false}} is the original whatever the mode (one grid, at once)', max(v[0] for _, v in s) == 1)
        s = sample(page, js_click('[data-testid=cal-slow] .atmr-calendar-header__button', 1), CAL_GRIDS % 'cal-slow', 1500)
        d = span_ms(s, lambda v: v[0] == 2)
        rep.check(f'{tag}: motion={{{{ duration: 900 }}}} cross-fades for ~900 ms whatever the mode', 700 < d < 1150, f'{d:.0f} ms')

        # ---- InputDate: the popover uses the overlay motion, the calendar inside pages ---------------------------------------
        POP = "() => { const p = document.querySelector('.cal-input-popover'); const cs = getComputedStyle(p); return [+cs.opacity, cs.scale, cs.display, p.getAttribute('data-show')]; }"
        page.evaluate("() => document.querySelector('[data-testid=cal-cell-input]').scrollIntoView({block: 'center'})")
        page.wait_for_timeout(300)
        s = sample(page, "() => document.querySelector('[data-testid=cal-input] input').click()", POP, 900)
        if mode == 'off':
            rep.check(f'{tag}: the InputDate popover opens at once', s[0][1][2] != 'none' and s[0][1][0] == 1 and s[0][1][1] == 'none')
        else:
            rep.check(f'{tag}: the InputDate popover opens with the overlay motion (opacity 0 -> 1, scale 0.95 -> 1)', s[0][1][0] < 0.3 and s[0][1][1] != 'none' and vals(s, 0)[-1] == 1 and vals(s, 1)[-1] == 'none', f'first opacity {s[0][1][0]:.2f}')
        s = sample(page, js_click('.cal-input-popover .atmr-calendar-header__button', 1), CAL_GRIDS % 'cal-cell-input', 700)
        if mode == 'off':
            rep.check(f'{tag}: the calendar in the popover changes month in place', max(v[0] for _, v in s) == 1)
        else:
            rep.check(f'{tag}: the calendar in the popover cross-fades the months', span_ms(s, lambda v: v[0] == 2) > 100)
        s = sample(page, "() => document.body.click()", POP, 700)
        if mode == 'off':
            rep.check(f'{tag}: the InputDate popover closes at once', s[0][1][2] == 'none' or s[0][1][3] == 'false')
        else:
            rep.check(f'{tag}: the InputDate popover closes progressively (scale + fade), then is hidden', any(0.05 < v[0] < 0.95 for _, v in s) and s[-1][1][2] == 'none')
        rep.check(f'{tag}: no uncaught page errors', not errors, '; '.join(errors)[:200])
        ctx.close()
    a, b = finals.get('off'), finals.get('svelte')
    rep.check('calendar: the settled DOM after the same actions is identical with motion on and off', a is not None and a == b,
              '' if a == b else next((f'differs at {i}: off=...{a[max(0, i - 40):i + 50]!r} svelte=...{b[max(0, i - 40):i + 50]!r}' for i, (x, y) in enumerate(zip(a, b)) if x != y), 'lengths differ'))
    ctx, page, errors = open_section(browser, f'{base}/ext?cal=svelte', 'cal-day', reduced_motion='reduce')
    s = sample(page, js_click('[data-testid=cal-day] .atmr-calendar-header__button', 1), CAL_GRIDS % 'cal-day', 700)
    rep.check('calendar: prefers-reduced-motion: reduce turns the motion off (one grid at every frame)', max(v[0] for _, v in s) == 1)
    ctx.close()


# ─── accordion ───────────────────────────────────────────────────────────────────────────────────────────────────────
ACC_READ = "() => { const b = document.querySelector('[data-testid=%s-det]'); const w = b.parentElement; const cs = getComputedStyle(b); return [w.style.height, w.getBoundingClientRect().height, w.hasAttribute('hidden'), w.getAttribute('aria-hidden'), +cs.opacity, b.style.opacity + b.style.translate, w.style.transition, w.style.visibility]; }"
ACC_WRAP_SEL = "[data-testid=%s-det]"


def check_accordion(browser, rep, base):
    finals = {}
    for mode in ('off', 'svelte'):
        tag = f'accordion {mode}'
        ctx, page, errors = open_section(browser, f'{base}/ext?acc={mode}', 'acc-1')
        r0 = page.evaluate(ACC_READ % 'acc-1')
        rep.check(f'{tag}: an accordion that is open from the start is open at once (no animation on load)', r0[0].endswith('px') and float(r0[0][:-2]) > 20 and not r0[2] and r0[3] == 'false', str(r0[:4]))
        r1 = page.evaluate(ACC_READ % 'acc-2')
        rep.check(f'{tag}: a closed accordion is hidden (height 0, hidden, aria-hidden)', r1[0] == '0px' and r1[2] and r1[3] == 'true')

        # ---- open acc-2 (the group is `single`: acc-1 closes) ---------------------------------------------------------------
        s = sample(page, js_click('[data-testid=acc-2-sum]'), ACC_READ % 'acc-2', 700)
        hs = vals(s, 1)
        final_h = hs[-1]
        if mode == 'off':
            rep.check(f'{tag}: the ORIGINAL runs: an inline CSS transition of the height stays, the inline height jumps to the final value, the content gets no inline style',
                      all('height' in v[6] for _, v in s) and s[0][1][0] == r0_final(s) and all(not v[5] for _, v in s), f'first inline height {s[0][1][0]}')
            rep.check(f'{tag}: ... and the box still grows progressively through the CSS transition (> 100 ms)', sum(1 for h in hs if 2 < h < final_h - 2) >= 3 and span_ms(s, lambda v: 2 < v[1] < final_h - 2) > 100)
        else:
            rep.check(f'{tag}: opening is a Svelte motion: the height grows progressively (> 100 ms, monotonic) from 0 to the content height, `transition: none` while it runs',
                      mono(hs, up=True) and span_ms(s, lambda v: 2 < v[1] < final_h - 2) > 100 and hs[0] < 5 and any(v[6] == 'none 0s ease 0s' or 'none' in v[6] for _, v in s), f'{hs[0]:.1f} -> {final_h:.1f}')
            ops = vals(s, 4)
            rep.check(f'{tag}: the content fades in while it opens (inline opacity 0 -> 1) and its inline style is gone afterwards', min(ops) < 0.3 and ops[-1] == 1 and mono(ops, up=True) and not s[-1][1][5], f'min opacity {min(ops):.2f}')
            rep.check(f'{tag}: the wrapper is un-hidden when the opening starts', not s[0][1][2] and s[0][1][3] == 'false')
        rep.check(f'{tag}: settled open: height = content height in px, aria-hidden false, visible, the original transition string is back',
                  s[-1][1][0] == f'{final_h:.0f}px' or abs(float(s[-1][1][0][:-2]) - final_h) < 1, str(s[-1][1]))
        page.wait_for_timeout(300)
        rep.check(f'{tag}: the other accordion of the single group has been closed and hidden', page.evaluate(ACC_READ % 'acc-1')[2] is True)

        # ---- close acc-2 --------------------------------------------------------------------------------------------------------
        s = sample(page, js_click('[data-testid=acc-2-sum]'), ACC_READ % 'acc-2', 700)
        hs = vals(s, 1)
        if mode == 'off':
            rep.check(f'{tag}: closing keeps the original path too', all(not v[5] for _, v in s) and s[-1][1][2] is True and s[-1][1][3] == 'true')
        else:
            rep.check(f'{tag}: closing shrinks progressively (monotonic, > 100 ms) and only THEN sets `hidden`', mono(hs, up=False) and span_ms(s, lambda v: 2 < v[1] < hs[0] - 2) > 100 and s[-1][1][2] is True and not s[0][1][2],
                      f'{hs[0]:.1f} -> {hs[-1]:.1f}')
            ops = vals(s, 4)
            rep.check(f'{tag}: the content fades out while it closes and its inline style is removed at the end', min(ops) < 0.3 and not s[-1][1][5])
        page.wait_for_timeout(300)
        # an interrupted move: open, then close 120 ms later, ends closed with no leftovers
        page.evaluate(js_click('[data-testid=acc-3-sum]'))
        page.wait_for_timeout(120)
        page.evaluate(js_click('[data-testid=acc-3-sum]'))
        page.wait_for_timeout(900)
        r = page.evaluate(ACC_READ % 'acc-3')
        rep.check(f'{tag}: an interrupted opening ends closed and clean (height 0, hidden, no inline content style)', r[0] == '0px' and r[2] is True and not r[5] and r[4] == 1, str(r))
        # ---- content that grows while open --------------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=acc-grow-add]').click()", ACC_READ % 'acc-grow', 700)
        hs = vals(s, 1)
        grow = hs[-1] - hs[0]
        if mode == 'off':
            rep.check(f'{tag}: a row added to an open accordion follows through the original CSS transition', grow > 10 and all(not v[5] for _, v in s))
        else:
            rep.check(f'{tag}: a row added to an open accordion GLIDES to the new height (Svelte, > 100 ms, monotonic)', grow > 10 and mono(hs, up=True) and span_ms(s, lambda v: hs[0] + 1 < v[1] < hs[-1] - 1) > 100, f'{hs[0]:.0f} -> {hs[-1]:.0f}')
        page.wait_for_timeout(300)
        # ---- motion={false} / motion="spring" -----------------------------------------------------------------------------------
        s = sample(page, js_click('[data-testid=acc-off-sum]'), ACC_READ % 'acc-off', 700)
        rep.check(f'{tag}: motion={{false}} runs the original whatever the mode (inline CSS transition kept, no inline content style)', all('height' in v[6] for _, v in s) and all(not v[5] for _, v in s))
        s = sample(page, js_click('[data-testid=acc-spring-sum]'), ACC_READ % 'acc-spring', 1600)
        hs = vals(s, 1)
        if mode == 'off':
            rep.check(f'{tag}: motion="spring" animates although the mode is off (a Svelte Spring: inline `transition: none`, fractional heights)', any('none' in v[6] for _, v in s) and span_ms(s, lambda v: 2 < v[1] < hs[-1] - 2) > 60)
        else:
            rep.check(f'{tag}: motion="spring" opens with a Svelte Spring and settles on the content height', span_ms(s, lambda v: 2 < v[1] < hs[-1] - 2) > 60 and abs(hs[-1] - max(hs)) < 3 and hs[-1] > 20 and not s[-1][1][5], f'max {max(hs):.1f} final {hs[-1]:.1f}')
        page.wait_for_timeout(300)
        # settle the demo in the same state in both modes and snapshot the details wrappers
        page.evaluate(js_click('[data-testid=acc-2-sum]'))
        page.wait_for_timeout(900)
        finals[mode] = {k: canon(page, f'div:has(> [data-testid={k}-det])') for k in ('acc-1', 'acc-2', 'acc-3')}
        rep.check(f'{tag}: no uncaught page errors', not errors, '; '.join(errors)[:200])
        ctx.close()
    for k in ('acc-1', 'acc-2', 'acc-3'):
        a, b = finals['off'][k], finals['svelte'][k]
        rep.check(f'accordion: the settled wrapper of {k} (open / closed) is identical with motion on and off', a == b, '' if a == b else f'off={a[:160]!r} svelte={b[:160]!r}')
    ctx, page, errors = open_section(browser, f'{base}/ext?acc=svelte', 'acc-1', reduced_motion='reduce')
    s = sample(page, js_click('[data-testid=acc-2-sum]'), ACC_READ % 'acc-2', 600)
    rep.check('accordion: prefers-reduced-motion: reduce turns the motion off (original path: no inline content style, inline CSS transition kept)', all(not v[5] for _, v in s) and all('height' in v[6] for _, v in s))
    ctx.close()


def r0_final(s):
    """the inline height of the last sample (a string like '108px')"""
    return s[-1][1][0]


# ─── tabs ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
TAB_READ = "() => { const g = document.querySelector('[data-testid=%s-group]'); const i = g.querySelector('.rt-ext-tabs-indicator'); const sel = g.querySelector('.atmr-tabs-item--selected'); const gr = g.querySelector('.atmr-tabs-group__tabs').getBoundingClientRect(); const sr = sel.getBoundingClientRect(); const ir = i ? i.getBoundingClientRect() : null; return [ir ? ir.left - gr.left : null, ir ? ir.width : null, sr.left - gr.left, sr.width, ir ? ir.bottom - sr.bottom : null, sel.textContent.trim(), i ? i.getAttribute('style') : null]; }"
PANEL_READ = "() => { const p = document.querySelector('[data-testid=%s-panel-%s]'); if (!p) return null; const cs = getComputedStyle(p); return [+cs.opacity, cs.transform === 'none' ? 0 : new DOMMatrix(cs.transform).m42, p.getAttribute('style') || '']; }"


def check_tabs(browser, rep, base):
    import io
    from PIL import Image, ImageChops
    shots = {}
    finals = {}
    for mode in ('off', 'svelte'):
        tag = f'tabs {mode}'
        ctx, page, errors = open_section(browser, f'{base}/ext?tabs={mode}', 'tabs-a-group')
        has_ind = page.evaluate("() => !!document.querySelector('[data-testid=tabs-a-group] .rt-ext-tabs-indicator')")
        has_cls = page.evaluate("() => document.querySelector('[data-testid=tabs-a-group]').className.includes('rt-ext-tabs')")
        if mode == 'off':
            rep.check(f'{tag}: the original markup: no indicator element, no rt-ext-tabs class', not has_ind and not has_cls)
        else:
            rep.check(f'{tag}: motion adds one aria-hidden indicator span and the class rt-ext-tabs', has_ind and has_cls and page.evaluate("() => document.querySelector('[data-testid=tabs-a-group] .rt-ext-tabs-indicator').getAttribute('aria-hidden')") == 'true')
            r = page.evaluate(TAB_READ % 'tabs-a')
            rep.check(f'{tag}: the indicator sits exactly under the selected tab from the start (no animation on load)', abs(r[0] - r[2]) < 0.6 and abs(r[1] - r[3]) < 0.6 and abs(r[4]) < 0.6, str(r[:5]))
        # ---- select the third tab --------------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=tabs-a-tab-2]').click()", TAB_READ % 'tabs-a', 700)
        sel = s[-1][1]
        if mode == 'off':
            rep.check(f'{tag}: selecting a tab changes the selection at once (aria-selected, class), no indicator', sel[5] == 'Мобильная связь' and all(v[0] is None for _, v in s))
        else:
            xs = [v[0] for _, v in s]
            target = sel[2]
            rep.check(f'{tag}: the indicator SLIDES to the new tab (left progressive, monotonic, > 100 ms, several intermediate frames)',
                      mono(xs, up=True) and span_ms(s, lambda v: 3 < v[0] < target - 3) > 100 and sum(1 for x in xs if 3 < x < target - 3) >= 3, f'0 -> {target:.1f}')
            rep.check(f'{tag}: ... and rests exactly under the selected tab (left, width, bottom edge within 0.6 px)', abs(sel[0] - sel[2]) < 0.6 and abs(sel[1] - sel[3]) < 0.6 and abs(sel[4]) < 0.6, str(sel[:5]))
            rep.check(f'{tag}: the indicator is an inline-positioned element only (left / top / width / height / opacity written by the Tween)', all(k in sel[6] for k in ('left', 'width', 'top', 'height')))
        # ---- the panel of the newly selected tab ---------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=tabs-a-tab-1]').click()", PANEL_READ % ('tabs-a', '1'), 600)
        s = [(t, v) for t, v in s if v]
        if mode == 'off':
            rep.check(f'{tag}: the panel appears at once (opacity 1 on the first frame, no inline style)', s and s[0][1][0] == 1 and all(not v[2] for _, v in s))
        else:
            ops = vals(s, 0)
            rep.check(f'{tag}: the panel fades and slides in (opacity 0 -> 1, translateY 8 -> 0, monotonic, > 100 ms)', ops[0] < 0.3 and ops[-1] == 1 and mono(ops, up=True) and span_ms(s, lambda v: 0.05 < v[0] < 0.95) > 60 and s[0][1][1] > 3, f'first opacity {ops[0]:.2f}')
        page.wait_for_timeout(600)
        # ---- per-component overrides ------------------------------------------------------------------------------------
        page.evaluate("() => document.querySelector('[data-testid=tabs-off-group]').scrollIntoView({block: 'center'})")
        rep.check(f'{tag}: motion={{false}} keeps the original tabs (no indicator, no class) whatever the mode', not page.evaluate("() => !!document.querySelector('[data-testid=tabs-off-group] .rt-ext-tabs-indicator') || document.querySelector('[data-testid=tabs-off-group]').className.includes('rt-ext-tabs')"))
        page.evaluate("() => document.querySelector('[data-testid=tabs-spring-group]').scrollIntoView({block: 'center'})")
        page.wait_for_timeout(300)
        s = sample(page, "() => document.querySelector('[data-testid=tabs-spring-tab-3]').click()", TAB_READ % 'tabs-spring', 1800)
        xs = [v[0] for _, v in s]
        sel = s[-1][1]
        rep.check(f'{tag}: motion="spring" slides with a Spring (always Svelte), may overshoot a little and rests under the selected tab',
                  all(x is not None for x in xs) and span_ms(s, lambda v: 3 < v[0] < sel[2] - 3) > 60 and max(xs) <= sel[2] + 0.06 * sel[2] and abs(sel[0] - sel[2]) < 0.6, f'max {max(xs):.1f} target {sel[2]:.1f}')
        # ---- the settled tabs look exactly like the original (screenshot of the size s + m groups) ------------------------------
        page.evaluate("() => document.querySelector('[data-testid=tabs-a-group]').scrollIntoView({block: 'center'})")
        page.evaluate("() => document.querySelector('[data-testid=tabs-a-tab-2]').click()")
        page.wait_for_timeout(1200)
        page.mouse.move(2, 2)
        page.wait_for_timeout(300)
        shots[mode] = Image.open(io.BytesIO(page.locator('[data-testid=tabs-a-group]').screenshot())).convert('RGB')
        finals[mode] = canon(page, '[data-testid=tabs-a-group]', drop_class=['rt-ext-tabs'], drop_sel='.rt-ext-tabs-indicator')
        rep.check(f'{tag}: no uncaught page errors', not errors, '; '.join(errors)[:200])
        ctx.close()
    a, b = finals['off'], finals['svelte']
    rep.check('tabs: the settled DOM equals the original except for the documented additions (indicator span + rt-ext-tabs class)', a == b, '' if a == b else next((f'differs at {i}: off=...{a[max(0, i - 40):i + 50]!r} svelte=...{b[max(0, i - 40):i + 50]!r}' for i, (x, y) in enumerate(zip(a, b)) if x != y), 'lengths differ'))
    diff = ImageChops.difference(shots['off'], shots['svelte'])
    rep.check('tabs: the settled tabs are PIXEL-identical to the original (the sliding indicator replaces the per-tab underline exactly)', shots['off'].size == shots['svelte'].size and diff.getbbox() is None, f'diff bbox {diff.getbbox()}')
    ctx, page, errors = open_section(browser, f'{base}/ext?tabs=svelte', 'tabs-a-group', reduced_motion='reduce')
    rep.check('tabs: prefers-reduced-motion: reduce turns the motion off (no indicator, original markup)', not page.evaluate("() => !!document.querySelector('[data-testid=tabs-a-group] .rt-ext-tabs-indicator')"))
    ctx.close()


# ─── side menu ───────────────────────────────────────────────────────────────────────────────────────────────────────
SM_READ = "() => { const r = document.querySelector('[data-testid=%s]'); const lab = r.querySelector('.atmr-side-menu__item .atmr-list-item__content'); return [r.getBoundingClientRect().width, r.className, r.getAttribute('style') || '', lab ? +getComputedStyle(lab).opacity : null, !!r.querySelector('.atmr-side-menu__header .atmr-typography')]; }"
SM_WRAP = "() => { const b = document.querySelector('[data-testid=%s]'); const w = b.parentElement; return [w.style.height, w.getBoundingClientRect().height, w.hasAttribute('hidden'), w.style.overflow, w.style.transition, +getComputedStyle(b).opacity, b.style.opacity + b.style.translate]; }"


def check_sidemenu(browser, rep, base):
    finals = {}
    for mode in ('off', 'svelte'):
        tag = f'sidemenu {mode}'
        ctx, page, errors = open_section(browser, f'{base}/ext?sm={mode}', 'sm-main')
        r0 = page.evaluate(SM_READ % 'sm-main')
        rep.check(f'{tag}: starts open: 256 px wide, class opened, no inline style, no motion class', abs(r0[0] - 256) < 1 and 'atmr-side-menu--opened' in r0[1] and not r0[2] and 'rt-ext' not in r0[1], f'{r0[0]:.1f} {r0[1]}')
        # ---- close ---------------------------------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=sm-main-toggle]').click()", SM_READ % 'sm-main', 900)
        ws = vals(s, 0)
        if mode == 'off':
            rep.check(f'{tag}: closing is the original: the class flips at once, no inline style / motion class, the header title is removed at once',
                      'atmr-side-menu--closed' in s[0][1][1] and all(not v[2] and 'rt-ext' not in v[1] for _, v in s) and not s[0][1][4])
            rep.check(f'{tag}: ... and the width still follows through the CSS transition (> 100 ms)', span_ms(s, lambda v: 60 < v[0] < 250) > 100 and abs(ws[-1] - 56) < 1.5, f'{ws[0]:.0f} -> {ws[-1]:.1f}')
        else:
            mid = [(t, v) for t, v in s if 'rt-ext-side-menu--motion' in v[1]]
            rep.check(f'{tag}: closing is a Svelte motion: the panel carries rt-ext-side-menu--motion and an inline width that shrinks progressively (> 100 ms, monotonic)',
                      len(mid) >= 5 and mono([v[0] for _, v in mid], up=False) and 'width' in mid[0][1][2] and span_ms(s, lambda v: 60 < v[0] < 250) > 100, f'{len(mid)} frames')
            rep.check(f'{tag}: the closed state is rendered only AFTER the move (opened class + labels while it shrinks), then the classes / inline style are the original ones',
                      all('atmr-side-menu--opened' in v[1] for _, v in mid) and 'atmr-side-menu--closed' in s[-1][1][1] and not s[-1][1][2] and 'rt-ext' not in s[-1][1][1] and abs(ws[-1] - 56) < 1.5)
            labs = [(v[0], v[3]) for _, v in mid if v[3] is not None]
            gone_at = next((w for w, o in labs if o < 0.05), None)
            rep.check(f'{tag}: the labels are gone (opacity ~0) BEFORE the panel gets narrow: at that moment it is still > 100 px wide', gone_at is not None and gone_at > 100 and labs[0][1] > 0.9, f'labels gone at width {gone_at}')
            rep.check(f'{tag}: the header title stays in the DOM while it closes and is removed at the end', all(v[4] for _, v in mid) and not s[-1][1][4])
        page.wait_for_timeout(500)
        # ---- open ---------------------------------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=sm-main-toggle]').click()", SM_READ % 'sm-main', 900)
        ws = vals(s, 0)
        if mode == 'off':
            rep.check(f'{tag}: opening: the class flips at once and the panel ends 256 px wide', 'atmr-side-menu--opened' in s[0][1][1] and abs(ws[-1] - 256) < 1.5)
        else:
            mid = [(t, v) for t, v in s if 'rt-ext-side-menu--motion' in v[1]]
            labs = [(v[0], v[3]) for _, v in mid if v[3] is not None]
            first_vis = next((w for w, o in labs if o > 0.3), None)
            rep.check(f'{tag}: opening: the width grows progressively (monotonic, > 100 ms) and the labels appear only once there is room for them (visible from width > 110 px)',
                      mono([v[0] for _, v in mid], up=True) and span_ms(s, lambda v: 70 < v[0] < 230) > 60 and first_vis is not None and first_vis > 110 and abs(ws[-1] - 256) < 1.5, f'labels visible from {first_vis}')
            rep.check(f'{tag}: the panel is back to the original markup when it has opened (no inline style, no motion class)', not s[-1][1][2] and 'rt-ext' not in s[-1][1][1])
        page.wait_for_timeout(500)
        # ---- nested group (SideMenuCollapse) ---------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=sm-main-collapse-trigger]').click()", SM_WRAP % 'sm-main-collapse-content', 800)
        hs = vals(s, 1)
        if mode == 'off':
            rep.check(f'{tag}: the nested group opens through the original CSS transition (inline transition kept, no inline content style)', all('height' in v[4] for _, v in s) and all(not v[6] for _, v in s) and hs[-1] > 40)
        else:
            rep.check(f'{tag}: the nested group opens with a Svelte motion (height progressive, monotonic, > 100 ms; content fades in; inline style removed afterwards)',
                      mono(hs, up=True) and span_ms(s, lambda v: 2 < v[1] < hs[-1] - 2) > 100 and min(vals(s, 5)) < 0.3 and not s[-1][1][6] and hs[-1] > 40, f'{hs[0]:.1f} -> {hs[-1]:.1f}')
        page.wait_for_timeout(400)
        # ---- expand block (SideMenuExpandContent) -------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=sm-main-expand]').click()", SM_WRAP % 'sm-main-expand-content', 800)
        hs = vals(s, 1)
        if mode == 'off':
            rep.check(f'{tag}: the expand block opens through the original path (ends with height auto, overflow visible)', s[-1][1][0] == 'auto' and s[-1][1][3] == 'visible')
        else:
            rep.check(f'{tag}: the expand block opens with a Svelte motion (progressive, monotonic) and settles as the original (height auto, overflow visible, no inline content style)',
                      mono(hs, up=True) and span_ms(s, lambda v: 2 < v[1] < hs[-1] - 2) > 100 and s[-1][1][0] == 'auto' and s[-1][1][3] == 'visible' and not s[-1][1][6], f'{hs[0]:.1f} -> {hs[-1]:.1f}')
        page.wait_for_timeout(400)
        page.evaluate("() => document.querySelector('[data-testid=sm-main-expand]').click()")
        page.wait_for_timeout(900)
        finals[mode] = {'open': canon(page, '[data-testid=sm-main]')}
        page.evaluate("() => document.querySelector('[data-testid=sm-main-collapse-trigger]').click()")
        page.wait_for_timeout(700)
        page.evaluate("() => document.querySelector('[data-testid=sm-main-toggle]').click()")
        page.wait_for_timeout(1000)
        finals[mode]['closed'] = canon(page, '[data-testid=sm-main]')
        # ---- overrides ------------------------------------------------------------------------------------------------------------
        s = sample(page, "() => document.querySelector('[data-testid=sm-off-toggle]').click()", SM_READ % 'sm-off', 700)
        rep.check(f'{tag}: motion={{false}} is the original whatever the mode (no inline style / motion class at any frame)', all(not v[2] and 'rt-ext' not in v[1] for _, v in s))
        s = sample(page, "() => document.querySelector('[data-testid=sm-spring-toggle]').click()", SM_READ % 'sm-spring', 1400)
        ws = vals(s, 0)
        rep.check(f'{tag}: motion="spring" moves the panel with a Spring (always Svelte) and it settles at 56 px with the original markup',
                  span_ms(s, lambda v: 60 < v[0] < 250) > 60 and abs(ws[-1] - 56) < 1.5 and not s[-1][1][2] and 'rt-ext' not in s[-1][1][1], f'{ws[0]:.0f} -> {ws[-1]:.1f}')
        rep.check(f'{tag}: no uncaught page errors', not errors, '; '.join(errors)[:200])
        ctx.close()
    for k in ('open', 'closed'):
        a, b = finals['off'][k], finals['svelte'][k]
        rep.check(f'sidemenu: the settled {k} menu DOM is identical with motion on and off', a == b, '' if a == b else next((f'differs at {i}: off=...{a[max(0, i - 40):i + 50]!r} svelte=...{b[max(0, i - 40):i + 50]!r}' for i, (x, y) in enumerate(zip(a, b)) if x != y), 'lengths differ'))
    ctx, page, errors = open_section(browser, f'{base}/ext?sm=svelte', 'sm-main', reduced_motion='reduce')
    s = sample(page, "() => document.querySelector('[data-testid=sm-main-toggle]').click()", SM_READ % 'sm-main', 600)
    rep.check('sidemenu: prefers-reduced-motion: reduce turns the motion off (no inline style, no motion class)', all(not v[2] and 'rt-ext' not in v[1] for _, v in s))
    ctx.close()


def check_second_wave(browser, rep, base, sections=None):
    for name, fn in (('calendar', check_calendar), ('accordion', check_accordion), ('tabs', check_tabs), ('sidemenu', check_sidemenu)):
        if sections and name not in sections:
            continue
        try:
            fn(browser, rep, base)
        except Exception as e:  # noqa: BLE001  (a broken section must not hide the others)
            rep.check(f'{fn.__name__}: ran to the end', False, f'{type(e).__name__}: {str(e)[:200]}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--headed', action='store_true')
    ap.add_argument('-v', '--verbose', action='store_true')
    ap.add_argument('--only', choices=['all', 'second'], default='all', help="'second' = only the second wave (calendar / accordion / tabs / side menu)")
    ap.add_argument('--sections', default='', help="second wave only: comma list of calendar, accordion, tabs, sidemenu (default: all)")
    args = ap.parse_args()
    rep = Report(args.verbose)
    url = args.base + '/ext'

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed)
        if args.only == 'second':
            check_second_wave(browser, rep, args.base, [x for x in args.sections.split(',') if x] or None)
            browser.close()
            bad = rep.failed
            print(f"\n{len(rep.rows) - len(bad)}/{len(rep.rows)} checks passed")
            return 1 if bad else 0
        ctx = browser.new_context(viewport={'width': 1280, 'height': 1000}, locale='ru-RU')
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)[:300]))
        try:
            page.goto(url, wait_until='load')
            page.wait_for_selector('[data-testid=ext-badge]', timeout=15000)
        except Exception as e:  # noqa: BLE001
            print(f'cannot open {url}: {e}\nstart the servers first: node tools/up.mjs')
            return 2
        page.wait_for_timeout(600)

        # ---- the page itself ---------------------------------------------------------------------------------------
        rep.check('badge "Авторское расширение — вне оригинала" is visible', 'вне оригинала' in page.inner_text('[data-testid=ext-badge]'))
        rep.check('the note says everything is off by default', 'выключено по умолчанию' in page.inner_text('[data-testid=ext-note]').lower())
        rep.check('starts with motion OFF', page.get_attribute('[data-testid=motion-off]', 'aria-pressed') == 'true')
        rep.check('Progress announces data-motion="off"', page.get_attribute('[data-testid=pg-main]', 'data-motion') == 'off')

        # ---- motion OFF: instant, original components untouched -----------------------------------------------------
        page.evaluate(click('p-0')); page.evaluate(click('s-0')); page.wait_for_timeout(300)
        ext_in_originals = page.evaluate(
            "() => document.querySelectorAll('[data-testid=ext-wizard] [class*=\"rt-ext\"], [data-testid=ext-slider-single] [class*=\"rt-ext\"], "
            "[data-testid=ext-slider-range] [class*=\"rt-ext\"]').length")
        rep.check('off: original Slider / Wizard DOM carries no rt-ext-* class', ext_in_originals == 0, f'{ext_in_originals} found')
        wiz_style = page.evaluate("() => [...document.querySelectorAll('[data-testid=ext-wizard] .atmr-wizard-horizontal-item')].map(e => e.getAttribute('style') || '').join('|')")
        rep.check('off: Wizard steps have no --rt-ext-fill inline variable', '--rt-ext-fill' not in wiz_style, wiz_style[:80])

        s = run(page, click('p-100'), ['bar', 'ring'], 800)
        a = analyse(series(s, 'bar'), 0, 100); rep.check('off: Progress bar jumps at once', is_instant(a, 100), fmt(a))
        a = analyse(series(s, 'ring'), 0, 100); rep.check('off: Progress ring jumps at once', is_instant(a, 100), fmt(a))
        s = run(page, click('s-100'), ['thumb', 'fill', 'tip'], 800)
        a = analyse(series(s, 'thumb'), 0, 100); rep.check('off: Slider thumb jumps at once', is_instant(a, 100), fmt(a))
        a = analyse(series(s, 'fill'), 0, 100); rep.check('off: Slider fill jumps at once', is_instant(a, 100), fmt(a))
        rep.check('off: Slider tooltip shows the value', page.inner_text('[data-testid=ext-slider-single] .atmr-slider__tooltip-content').strip() == '100')
        page.evaluate(click('w-reset')); page.wait_for_timeout(300)
        page.evaluate(click('w-next')); page.wait_for_timeout(300)
        wiz_style = page.evaluate("() => [...document.querySelectorAll('[data-testid=ext-wizard] .atmr-wizard-horizontal-item')].map(e => (e.getAttribute('style') || '') + e.className).join('|')")
        rep.check('off: after a step change the Wizard still has no rt-ext-* / --rt-ext-fill', 'rt-ext' not in wiz_style, wiz_style[:80])
        s = run(page, "() => document.querySelector('[data-testid=t-toggle] input').click()", ['panel'], 700)
        full = s[-1][1]['panel']
        a = analyse(series(s, 'panel'), 0, full); rep.check('off: rtSlide panel appears at once (zero-length transition)', full > 20 and is_instant(a, full), fmt(a))
        page.evaluate("() => document.querySelector('[data-testid=t-toggle] input').click()"); page.wait_for_timeout(300)

        # ---- per-component override while the provider is OFF -------------------------------------------------------
        reset(page, 500)
        s = run(page, click('p-100'), ['bar_false', 'bar_tween', 'bar_spring'], 2200)
        a = analyse(series(s, 'bar_false'), 0, 100); rep.check('override: motion={false} is instant', is_instant(a, 100), fmt(a))
        a = analyse(series(s, 'bar_tween'), 0, 100); rep.check('override: motion="tween" animates although the provider is off', is_progressive(a, 100, True), fmt(a))
        a = analyse(series(s, 'bar_spring'), 0, 100); rep.check('override: motion="spring" animates although the provider is off', is_progressive(a, 100), fmt(a))

        # ---- motion ON ----------------------------------------------------------------------------------------------
        for seg in ('tween', 'spring'):
            pick(page, seg)
            rep.check(f'{seg}: Progress announces data-motion="{seg}"', page.get_attribute('[data-testid=pg-main]', 'data-motion') == seg)
            reset(page)
            mono = seg == 'tween'
            s = run(page, click('p-100'), ['bar', 'ring'], 2600)
            a = analyse(series(s, 'bar'), 0, 100); rep.check(f'{seg}: Progress bar changes progressively and ends at the target', is_progressive(a, 100, mono), fmt(a))
            a = analyse(series(s, 'ring'), 0, 100); rep.check(f'{seg}: Progress ring changes progressively and ends at the target', is_progressive(a, 100, mono), fmt(a))
            s = run(page, click('s-100'), ['thumb', 'fill', 'tip'], 2600)
            a = analyse(series(s, 'thumb'), 0, 100); rep.check(f'{seg}: Slider thumb glides to the value', is_progressive(a, 100, mono), fmt(a))
            a = analyse(series(s, 'fill'), 0, 100); rep.check(f'{seg}: Slider fill glides to the value', is_progressive(a, 100, mono), fmt(a))
            a = analyse(series(s, 'tip'), 0, 100); rep.check(f'{seg}: Slider tooltip counts up and ends at the value', a['inter'] >= 3 and abs(a['final'] - 100) < TOL, fmt(a))
            rep.check(f'{seg}: motion={{false}} Slider stays original (ignores value changes)', abs(page.evaluate(READ['thumb_off']) - 20) < TOL, str(page.evaluate(READ['thumb_off'])))
            page.evaluate(click('w-reset')); page.wait_for_timeout(1500)
            s = run(page, click('w-next'), ['wiz'], 2600)
            a = analyse(series(s, 'wiz'), 0, 100); rep.check(f'{seg}: Wizard connector fill sweeps progressively', is_progressive(a, 100, mono), fmt(a))
            s = run(page, "() => document.querySelector('[data-testid=t-toggle] input').click()", ['panel'], 1200)
            full = s[-1][1]['panel']
            a = analyse(series(s, 'panel'), 0, full); rep.check(f'{seg}: rtSlide panel grows progressively', full > 20 and is_progressive(a, full), fmt(a))
            page.evaluate("() => document.querySelector('[data-testid=t-toggle] input').click()"); page.wait_for_timeout(700)

        # ---- Slider pointer handling with motion ON (tween) ---------------------------------------------------------
        pick(page, 'tween'); reset(page)
        page.locator('[data-testid=ext-slider-single]').scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        box = page.locator('[data-testid=ext-slider-single] .atmr-slider__track').bounding_box()
        thumb = page.locator('[data-testid=ext-slider-single] [role=slider]').bounding_box()
        cy = box['y'] + box['height'] / 2
        # click on the track: glides
        tx = box['x'] + box['width'] * 0.8
        page.mouse.move(tx, cy)
        page.evaluate("() => { window.__samples = []; const t0 = performance.now(); const f = () => { window.__samples.push([performance.now() - t0, " + READ['thumb'] + "]); if (performance.now() - t0 < 1200) requestAnimationFrame(f); }; requestAnimationFrame(f); }")
        page.mouse.down(); page.mouse.up()
        page.wait_for_timeout(1300)
        s = [(t, {'thumb': v}) for t, v in page.evaluate('window.__samples')]
        a = analyse(series(s, 'thumb'), 0, 80)
        rep.check('tween: a click on the track glides to the clicked place', is_progressive(a, 80, True), fmt(a))
        # drag by the thumb: NOT smoothed
        thumb = page.locator('[data-testid=ext-slider-single] [role=slider]').bounding_box()
        page.mouse.move(thumb['x'] + thumb['width'] / 2, cy)
        page.mouse.down()
        lag = []
        for frac in (0.55, 0.30, 0.65, 0.10):
            page.mouse.move(box['x'] + box['width'] * frac, cy, steps=2)
            page.evaluate("() => new Promise(r => requestAnimationFrame(() => r()))")
            lag.append((frac * 100, page.evaluate(READ['thumb']), page.evaluate(READ['fill'])))
        page.mouse.up()
        worst = max(max(abs(exp - th), abs(exp - fl)) for exp, th, fl in lag)
        rep.check('tween: dragging a thumb is instant (no smoothing while the pointer is down)', worst <= 1.6, ' '.join(f'{e:.0f}->{t:.1f}/{f:.1f}' for e, t, f in lag))

        # ---- fonts / colours: nothing may fall back to the browser's default serif / black ---------------------------
        for theme in ('rtk_default_light', 'rtk_default_dark', 'rtk_purple_dark'):
            page.goto(f'{url}?theme={theme}&motion=tween', wait_until='load')
            page.wait_for_selector('[data-testid=ext-badge]', timeout=15000)
            page.wait_for_timeout(500)
            page.evaluate("() => document.querySelector('[data-testid=t-toggle] input').click()")  # show the transition panels too
            page.wait_for_timeout(700)
            bad = page.evaluate(TEXT_STYLE)
            rep.check(f'{theme}: all demo text has the Rostelecom font and a theme colour (Stepper, Wizard, Progress ...)', not bad, '; '.join(bad[:4]))
            lab = page.evaluate("() => { const l = document.querySelector('.atmr-stepper__label'), i = document.querySelector('.atmr-stepper__button svg'); return [getComputedStyle(l).color, getComputedStyle(i).fill]; }")
            rep.check(f'{theme}: Stepper label has the colour of its icons (not the default black)', lab[0] == lab[1] and lab[0] != 'rgb(0, 0, 0)', str(lab))
            rep.check(f'{theme}: body carries the theme and rt-base classes', page.evaluate("() => document.body.className").startswith(f'Theme_root_{theme} rt-base'))

        # ---- prefers-reduced-motion: reduce -------------------------------------------------------------------------
        rctx = browser.new_context(viewport={'width': 1280, 'height': 1000}, locale='ru-RU', reduced_motion='reduce')
        rpage = rctx.new_page()
        rpage.goto(url + '?motion=spring', wait_until='load')
        rpage.wait_for_selector('[data-testid=ext-badge]', timeout=15000)
        rpage.wait_for_timeout(600)
        rep.check('reduced motion: the page reports it', 'включена' in rpage.inner_text('[data-testid=rm-state]'))
        rep.check('reduced motion: the segmented control still says spring', rpage.get_attribute('[data-testid=motion-spring]', 'aria-pressed') == 'true')
        rep.check('reduced motion: Progress announces data-motion="off"', rpage.get_attribute('[data-testid=pg-main]', 'data-motion') == 'off')
        rpage.evaluate(click('p-0')); rpage.evaluate(click('s-0')); rpage.wait_for_timeout(400)
        s = run(rpage, click('p-100'), ['bar', 'ring'], 900)
        a = analyse(series(s, 'bar'), 0, 100); rep.check('reduced motion: Progress bar is instant even with spring selected', is_instant(a, 100), fmt(a))
        s = run(rpage, click('s-100'), ['thumb', 'fill'], 900)
        a = analyse(series(s, 'thumb'), 0, 100); rep.check('reduced motion: Slider thumb is instant', is_instant(a, 100), fmt(a))
        s = run(rpage, "() => document.querySelector('[data-testid=t-toggle] input').click()", ['panel'], 700)
        full = s[-1][1]['panel']
        a = analyse(series(s, 'panel'), 0, full); rep.check('reduced motion: rtSlide panel is instant', full > 20 and is_instant(a, full), fmt(a))
        rctx.close()

        rep.check('no uncaught page errors', not errors, '; '.join(errors)[:200])

        # ---- second wave: calendar / accordion / tabs / side menu, each in both modes -------------------------------------
        check_second_wave(browser, rep, args.base)
        browser.close()

    bad = rep.failed
    print(f"\n{len(rep.rows) - len(bad)}/{len(rep.rows)} checks passed")
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
