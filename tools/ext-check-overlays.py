"""EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default.

Behavioural check of the Svelte motion of the OVERLAY family (Popover, Tooltip, DropdownMenu, Select, Multiselect, Modal, Drawer)
on the demo route /ext (block "Оверлеи"), Playwright, headless Chromium.

For every component it runs the same open + close in two fresh page loads (`?ov=off` and `?ov=svelte`) and proves:

  * motion OFF (the default)   -> the extension does nothing. Popover / Tooltip / DropdownMenu / Select / Multiselect appear and disappear at once
                                  (the first animation frame after the click is already the final one). Modal / Drawer keep their ORIGINAL CSS class
                                  transitions (atmr-modal-enter-active / atmr-drawer--entering are seen) and no inline opacity / scale / translate is
                                  ever written to them;
  * motion ON ('svelte')       -> the element animates PROGRESSIVELY: several intermediate frames, monotonic, > 100 ms, ending at the target
                                  (inline opacity / scale / translate are written while it runs; for Modal / Drawer the original class sequence
                                  is not used any more); popover / tooltip grow from the anchor corner without sliding, the drawer slides in from its edge;
  * the FINAL state after the animation (DOM, classes, inline style, box) is identical with motion ON and OFF, open and closed;
  * `?ov=spring` (ExtMotionProvider type="spring"): the same overlays are driven by a Svelte Spring (svelte/motion) instead of a Tween: progressive,
    settles to the same clean final DOM, the drawer's critically damped Spring never overshoots its edge;
  * the `motion` prop of a component beats the mode; prefers-reduced-motion: reduce switches everything off again.

  python tools/ext-check-overlays.py [--base http://127.0.0.1:5180] [--headed] [-v]

Needs the playground dev server (node tools/up.mjs). Exit code 0 = all checks passed. The pixel-for-pixel proof that the ORIGINAL
components did not change with the extension off is `python tools/compare.py` (popover / tooltip / dropdownmenu / select / multiselect / modal / drawer).
"""
import argparse
import json
import re
import sys

from playwright.sync_api import sync_playwright

TOL = 0.03  # tolerance for a 0..1 value
SETTLE = 1300  # ms to wait after an action before taking the "final" snapshot

# runs `trigger` in the page, reads `read()` on every animation frame for `ms`
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

# what is read from a component on every frame: v = visible amount (0..1), inline style, classes, box
READ = """
() => {
  const SEL = %(sel)s, ROOT = %(root)s, KIND = %(kind)s, REST = %(rest)s;
  const el = document.querySelector(SEL);
  const root = ROOT ? document.querySelector(ROOT) : el;
  if (!el) return {v: 0, st: '', cl: '', rcl: root ? root.className : '', box: null, exists: 0};
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  let v;
  if (KIND === 'slide') {
    const W = innerWidth, H = innerHeight;
    const vis = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
    v = (cs.display === 'none') ? 0 : vis / Math.max(1, r.width * r.height);
  } else {
    v = (cs.display === 'none' || cs.visibility === 'hidden') ? 0 : parseFloat(cs.opacity) / REST;
  }
  return {v, st: el.getAttribute('style') || '', cl: el.className, rcl: root ? root.className : '', exists: 1,
          box: [r.left, r.top, r.width, r.height], tf: cs.transform, org: el.style.transformOrigin || ''};
}
"""

# a canonical serialisation (attributes sorted, `style` declarations sorted, ids dropped: they differ between page loads / attribute
# order depends on when Popper first wrote it) + the box of the element
SNAP = """
() => {
  const SEL = %(sel)s, ROOT = %(root)s;
  const el = document.querySelector(ROOT || SEL);
  if (!el) return null;
  const SKIP = /^(id|for|aria-labelledby|aria-controls|aria-describedby)$/;
  const canon = (n) => {
    if (n.nodeType === 3) return n.textContent;
    if (n.nodeType !== 1) return '';
    const attrs = [...n.attributes].filter((a) => !SKIP.test(a.name)).map((a) => {
      let v = a.value;
      if (a.name === 'style') v = v.split(';').map((d) => d.trim()).filter(Boolean).sort().join('; ');
      return a.name + '="' + v + '"';
    }).sort();
    return '<' + n.tagName.toLowerCase() + (attrs.length ? ' ' + attrs.join(' ') : '') + '>' + [...n.childNodes].map(canon).join('') + '</' + n.tagName.toLowerCase() + '>';
  };
  const t = document.querySelector(SEL), r = t ? t.getBoundingClientRect() : null;
  return {html: canon(el), box: r ? [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10) : null};
}
"""

BODY_CLICK = '() => document.body.click()'


def click(tid):
    return f"() => document.querySelector('[data-testid={tid}]').click()"


def q(s):
    return json.dumps(s)


# name -> selectors and how to open / close it
COMPONENTS = {
    'popover': dict(sel='.ov-pop-main', root=None, kind='fade', open=click('ov-popover-anchor'), close=BODY_CLICK, instant_off=True),
    'tooltip': dict(sel='.ov-tip', root=None, kind='fade', open=click('ov-tooltip-show'), close=click('ov-tooltip-hide'), instant_off=True),
    'dropdown': dict(sel='.ov-dd', root=None, kind='fade', open=click('ov-dropdown-anchor'), close=click('ov-dropdown-anchor'), instant_off=True),
    'select': dict(sel='.ov-select-menu', root=None, kind='fade', open="() => document.querySelector('[data-testid=ov-select] input').click()", close=BODY_CLICK, instant_off=True),
    'multiselect': dict(sel='.ov-multiselect-menu', root=None, kind='fade',
                        open="() => document.querySelector('[data-testid=ov-multiselect] button[aria-label=open]').click()", close=BODY_CLICK, instant_off=True),
    'modal': dict(sel='.ov-modal-box', root="[data-testid=ov-modal]", kind='fade', open=click('ov-modal-open'), close=click('ov-modal-close'), instant_off=False,
                  orig_class='atmr-modal-enter-active'),
    'drawer': dict(sel='.ov-drawer-content', root="[data-testid=ov-drawer]", kind='slide', open=click('ov-drawer-open'), close=click('ov-drawer-close'), instant_off=False,
                   orig_class='atmr-drawer--entering'),
}
# the overlay (backdrop) of Modal / Drawer: an Overlay with its own fade
OVERLAYS = {
    'modal-overlay': dict(sel='.ov-modal-overlay', root=None, kind='fade', open=click('ov-modal-open'), close=click('ov-modal-close'), instant_off=False, rest=0.5),
    'drawer-overlay': dict(sel='.ov-drawer-overlay', root=None, kind='fade', open=click('ov-drawer-open'), close=click('ov-drawer-close'), instant_off=False, rest=0.5),
}


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


def reader(spec):
    return READ % {'sel': q(spec['sel']), 'root': q(spec['root']), 'kind': q(spec['kind']), 'rest': spec.get('rest', 1)}


def snap(page, spec):
    return page.evaluate(SNAP % {'sel': q(spec['sel']), 'root': q(spec['root'])})


def run(page, spec, action, ms):
    return page.evaluate(SAMPLER, {'trigger': spec[action], 'read': reader(spec), 'ms': ms})


def analyse(samples, start, target):
    """samples = [(t_ms, {v...})]"""
    vs = [s['v'] for _, s in samples]
    lo, hi = min(start, target) + TOL, max(start, target) - TOL
    inter = [v for v in vs if lo < v < hi]
    change = next((t for t, s in samples if abs(s['v'] - start) > TOL), None)
    not_yet = [t for t, s in samples if abs(s['v'] - target) > TOL]
    settled = not_yet[-1] if not_yet else 0
    mono = all(y >= x - 1e-3 for x, y in zip(vs, vs[1:])) if target > start else all(y <= x + 1e-3 for x, y in zip(vs, vs[1:]))
    return {'first': vs[0], 'final': vs[-1], 'inter': len(inter), 'change': change, 'dur': (settled - change) if change is not None else 0, 'mono': mono}


def fmt(a):
    return f"first={a['first']:.2f} final={a['final']:.2f} inter={a['inter']} dur={a['dur']:.0f}ms mono={a['mono']}"


def instant(a, target):
    return abs(a['first'] - target) <= TOL and abs(a['final'] - target) <= TOL and a['inter'] == 0


def progressive(a, target):
    return abs(a['first'] - target) > TOL and abs(a['final'] - target) <= TOL and a['inter'] >= 3 and a['dur'] > 100 and a['mono']


EXT_INLINE = re.compile(r'(^|;)\s*(opacity|scale|translate|transform-origin)\s*:')


def has_ext_inline(samples):
    return any(EXT_INLINE.search(s['st']) for _, s in samples)


def new_page(browser, url, **ctx_args):
    ctx = browser.new_context(viewport={'width': 1280, 'height': 1000}, locale='ru-RU', **ctx_args)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:300]))
    page.goto(url, wait_until='load')
    page.wait_for_selector('[data-testid=sec-overlays]', timeout=20000)
    page.evaluate("() => document.querySelector('[data-testid=sec-overlays]').scrollIntoView()")  # everything in the viewport: Popper does not flip / hide
    page.wait_for_timeout(700)
    return ctx, page, errors


def exercise(page, rep, mode, name, spec, results):
    """open + close one component, check its timeline, take the settled snapshots"""
    page.evaluate(BODY_CLICK)
    page.wait_for_timeout(300)
    tag = f'{mode}: {name}'
    orig_cls = spec.get('orig_class')

    # ---- open --------------------------------------------------------------------------------------------------------
    s = run(page, spec, 'open', 1000)
    a = analyse(s, 0, 1)
    if mode == 'off':
        if spec['instant_off']:
            rep.check(f'{tag}: opens at once (nothing animates)', instant(a, 1), fmt(a))
        rep.check(f'{tag}: no inline opacity / scale / translate is ever written', not has_ext_inline(s))
        if orig_cls:
            seen = any(orig_cls in (x['cl'] + ' ' + x['rcl']) for _, x in s)
            rep.check(f'{tag}: the ORIGINAL class transition runs ({orig_cls})', seen)
    else:
        rep.check(f'{tag}: opens progressively (>100 ms, monotonic)', progressive(a, 1), fmt(a))
        rep.check(f'{tag}: the animation is written inline (opacity / scale / translate)', has_ext_inline(s))
        if orig_cls:
            seen = any(orig_cls in (x['cl'] + ' ' + x['rcl']) for _, x in s)
            rep.check(f'{tag}: the original class transition is not used ({orig_cls})', not seen)
    page.wait_for_timeout(SETTLE)
    st = page.evaluate(reader(spec))
    rep.check(f'{tag}: settled open, no inline animation values left', st['exists'] and not EXT_INLINE.search(st['st']) and abs(st['v'] - 1) <= TOL, st['st'][:80])
    results[(name, 'open')] = snap(page, spec)

    # ---- close -------------------------------------------------------------------------------------------------------
    s = run(page, spec, 'close', 900)
    a = analyse(s, 1, 0)
    if mode == 'off':
        if spec['instant_off']:
            rep.check(f'{tag}: closes at once', instant(a, 0), fmt(a))
        rep.check(f'{tag}: no inline opacity / scale / translate on close', not has_ext_inline(s))
    else:
        rep.check(f'{tag}: closes progressively (>100 ms, monotonic)', progressive(a, 0), fmt(a))
    page.wait_for_timeout(SETTLE - 400)
    results[(name, 'closed')] = snap(page, spec)


def toggle(page, tid):
    page.evaluate(f"() => document.querySelector('[data-testid={tid}] input').click()")
    page.wait_for_timeout(200)


def check_full(page, rep, mode):
    """the opt-in `fullHeight` of Drawer and Modal (independent of the motion mode): class + geometry, and nothing when it is off"""
    W, H = page.evaluate('() => [innerWidth, innerHeight]')
    box = "() => { const el = document.querySelector(%s); const r = el.getBoundingClientRect(); return {l: r.left, t: r.top, w: r.width, h: r.height, root: document.querySelector(%s).className, m: parseFloat(getComputedStyle(el).getPropertyValue('--atmr-modal-margin-top')) || 0}; }"
    for full in (False, True):
        if full:
            toggle(page, 'ov-drawer-full')
        for pos in ('right', 'top'):
            page.click(f'[data-testid=ov-drawer-pos-{pos}]')
            page.wait_for_timeout(200)
            page.evaluate(click('ov-drawer-open'))
            page.wait_for_timeout(SETTLE)
            b = page.evaluate(box % (q('.ov-drawer-content'), q('[data-testid=ov-drawer]')))
            tag = f'{mode}: Drawer {pos} fullHeight={str(full).lower()}'
            if pos == 'right':
                rep.check(f'{tag}: panel height', (abs(b['h'] - H) <= 1 and abs(b['t']) <= 1) if full else b['h'] < H - 100, f"h={b['h']:.0f} viewport={H}")
            else:
                rep.check(f'{tag}: panel width', abs(b['w'] - W) <= 1 if full else b['w'] < W - 100, f"w={b['w']:.0f} viewport={W}")
            rep.check(f'{tag}: rt-ext-drawer--full class {"present" if full else "absent (original classes)"}', ('rt-ext-drawer--full' in b['root']) == full and 'rt-ext' not in b['root'].replace('rt-ext-drawer--full', ''), b['root'])
            page.evaluate(click('ov-drawer-close'))
            page.wait_for_timeout(SETTLE - 300)
    toggle(page, 'ov-drawer-full')
    for full in (False, True):
        if full:
            toggle(page, 'ov-modal-full')
        page.evaluate(click('ov-modal-open'))
        page.wait_for_timeout(SETTLE)
        b = page.evaluate(box % (q('.ov-modal-box'), q('.ov-modal-box')))
        tag = f'{mode}: Modal fullHeight={str(full).lower()}'
        exp = H - 2 * b['m']
        rep.check(f'{tag}: panel height', (abs(b['h'] - exp) <= 1.5 and abs(b['t'] - b['m']) <= 1.5) if full else b['h'] < exp - 100, f"h={b['h']:.0f} top={b['t']:.0f} expected {exp:.0f} with margin {b['m']:.0f}")
        rep.check(f'{tag}: rt-ext-modal--full class {"present" if full else "absent (original classes)"}', ('rt-ext-modal--full' in b['root']) == full, b['root'])
        page.evaluate(click('ov-modal-close'))
        page.wait_for_timeout(SETTLE - 300)
    toggle(page, 'ov-modal-full')


def compare_final(rep, off, sv, label='motion on'):
    for key in sorted(off):
        a, b = off[key], sv.get(key)
        name = f'final state {key[0]} ({key[1]}): DOM and box identical with {label} and off'
        if a is None or b is None:
            rep.check(name, a is None and b is None, f'off={"present" if a else "absent"} svelte={"present" if b else "absent"}')
            continue
        same_html = a['html'] == b['html']
        same_box = a['box'] == b['box'] or (a['box'] and b['box'] and all(abs(x - y) <= 0.6 for x, y in zip(a['box'], b['box'])))
        detail = ''
        if not same_html:
            i = next((k for k, (x, y) in enumerate(zip(a['html'], b['html'])) if x != y), min(len(a['html']), len(b['html'])))
            detail = f'html differs at {i}: off=...{a["html"][max(0, i - 40):i + 60]!r} svelte=...{b["html"][max(0, i - 40):i + 60]!r}'
        elif not same_box:
            detail = f'box off={a["box"]} svelte={b["box"]}'
        rep.check(name, same_html and same_box, detail)


def check_spring(page, rep):
    """`?ov=spring`: the popup is driven by a Svelte Spring (svelte/motion) instead of a Tween: it may overshoot a little and settles, the drawer slides without overshooting"""
    spec = COMPONENTS['popover']
    read = "() => { const el = document.querySelector('.ov-pop-main'); const cs = getComputedStyle(el); return {v: +cs.opacity, sc: cs.scale === 'none' ? 1 : parseFloat(cs.scale), st: el.getAttribute('style') || ''}; }"
    page.evaluate(BODY_CLICK)
    page.wait_for_timeout(300)
    s = page.evaluate(SAMPLER, {'trigger': spec['open'], 'read': read, 'ms': 1200})
    scales = [v['sc'] for _, v in s]
    settled = next((t for t, v in s if t > 60 and v['sc'] == 1 and 'scale' not in v['st']), None)
    rep.check('spring: the popover scale starts at 0.95 and the Spring settles back to a clean element within 1 s (inline scale removed)', scales[0] < 0.97 and settled is not None and settled < 1000, f'first {scales[0]:.3f} settled at {settled} ms')
    rep.check('spring: the popover grows through intermediate scales (a real motion, > 3 frames)', sum(1 for x in scales if 0.955 < x < 0.995) >= 3, f'max scale {max(scales):.4f}')
    page.evaluate(BODY_CLICK)
    page.wait_for_timeout(700)
    spec = COMPONENTS['drawer']
    read = "() => { const el = document.querySelector('.ov-drawer-content'); if (!el) return {x: null}; const t = getComputedStyle(el).translate; return {x: t === 'none' ? 0 : parseFloat(t)}; }"
    s = page.evaluate(SAMPLER, {'trigger': spec['open'], 'read': read, 'ms': 1300})
    xs = [v['x'] for _, v in s if v['x'] is not None]
    rep.check('spring: the drawer slides in with a critically damped Spring: from 100 % to 0 and never past its edge (no negative offset)', xs[0] > 50 and min(xs) >= -0.01 and xs[-1] == 0, f'first {xs[0]:.1f} min {min(xs):.3f}')
    page.evaluate(click('ov-drawer-close'))
    page.wait_for_timeout(1200)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--headed', action='store_true')
    ap.add_argument('-v', '--verbose', action='store_true')
    args = ap.parse_args()
    rep = Report(args.verbose)
    url = args.base + '/ext'
    finals = {}
    all_errors = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not args.headed)
        try:
            ctx, page, errors = new_page(browser, url + '?ov=off')
        except Exception as e:  # noqa: BLE001
            print(f'cannot open {url}: {e}\nstart the servers first: node tools/up.mjs')
            return 2
        ctx.close()

        for mode in ('off', 'svelte', 'spring'):
            ctx, page, errors = new_page(browser, f'{url}?ov={mode}')
            rep.check(f'{mode}: the mode switch says so', page.get_attribute(f'[data-testid=ov-mode-{mode}]', 'aria-pressed') == 'true')
            results = {}
            for name, spec in {**COMPONENTS, **OVERLAYS}.items():
                exercise(page, rep, mode, name, spec, results)
            finals[mode] = results

            # ---- spring: the Spring type of the motion (ExtMotionProvider type="spring") drives the same overlays ------------------
            if mode == 'spring':
                check_spring(page, rep)
                rep.check(f'{mode}: no uncaught page errors', not errors, '; '.join(errors)[:200])
                ctx.close()
                continue

            # ---- placement: the popup grows out of its anchor corner without sliding (svelte only) ------------------------
            if mode == 'svelte':
                page.click('[data-testid=ov-placement-bottomLeft]')
                page.wait_for_timeout(200)
                spec = COMPONENTS['popover']
                s = run(page, spec, 'open', 600)
                page.wait_for_timeout(SETTLE)
                final = page.evaluate(reader(spec))
                mid = [x for _, x in s if x['box'] and 0.15 < x['v'] < 0.85]
                if mid and final['box']:
                    drift = max(max(abs(x['box'][0] - final['box'][0]), abs(x['box'][1] - final['box'][1])) for x in mid)
                    rep.check('svelte: popover (bottomLeft) grows from its top-left corner: no sliding while scaling', drift <= 1.5, f'max corner drift {drift:.2f}px over {len(mid)} frames')
                    orig = mid[0]['org']
                    rep.check('svelte: popover writes a px transform-origin (compensating Popper\'s translate)', bool(re.match(r'^-?[\d.]+px -?[\d.]+px$', orig)), orig)
                else:
                    rep.check('svelte: popover corner check', False, f'{len(mid)} mid frames')
                page.evaluate(BODY_CLICK)
                page.wait_for_timeout(500)
                # modal: the centre of the box does not drift sideways while it scales
                spec = COMPONENTS['modal']
                s = run(page, spec, 'open', 700)
                page.wait_for_timeout(SETTLE)
                final = page.evaluate(reader(spec))
                fcx = final['box'][0] + final['box'][2] / 2
                mid = [x for _, x in s if x['box'] and 0.1 < x['v'] < 0.9]
                drift = max((abs(x['box'][0] + x['box'][2] / 2 - fcx) for x in mid), default=99)
                rep.check('svelte: modal stays horizontally centred while it scales', drift <= 1.5, f'max centre drift {drift:.2f}px over {len(mid)} frames')
                page.evaluate(click('ov-modal-close'))
                page.wait_for_timeout(600)
                # drawer: slides from each of its four edges
                for pos in ('left', 'top', 'bottom', 'right'):
                    page.click(f'[data-testid=ov-drawer-pos-{pos}]')
                    page.wait_for_timeout(300)
                    spec = COMPONENTS['drawer']
                    s = run(page, spec, 'open', 900)
                    a = analyse(s, 0, 1)
                    rep.check(f'svelte: drawer {pos} slides in progressively from its edge', progressive(a, 1), fmt(a))
                    page.wait_for_timeout(SETTLE)
                    page.evaluate(click('ov-drawer-close'))
                    page.wait_for_timeout(SETTLE)
                    gone = page.evaluate("() => !document.querySelector('.ov-drawer-content')")
                    rep.check(f'svelte: drawer {pos} is unmounted after the exit', gone)

            check_full(page, rep, mode)
            page.click('[data-testid=ov-drawer-pos-right]')

            # ---- the `motion` prop beats the mode -----------------------------------------------------------------------
            ov = dict(sel='.ov-pop-off', root=None, kind='fade', open=click('ov-popover-off-anchor'), close=BODY_CLICK)
            s = run(page, ov, 'open', 700)
            rep.check(f'{mode}: Popover motion={{false}} opens at once, whatever the mode', instant(analyse(s, 0, 1), 1), fmt(analyse(s, 0, 1)))
            page.evaluate(BODY_CLICK)
            page.wait_for_timeout(500)
            ov = dict(sel='.ov-pop-on', root=None, kind='fade', open=click('ov-popover-on-anchor'), close=BODY_CLICK)
            s = run(page, ov, 'open', 1400)
            a = analyse(s, 0, 1)
            rep.check(f'{mode}: Popover motion={{{{ duration: 700 }}}} animates for ~700 ms, whatever the mode', progressive(a, 1) and 550 < a['dur'] < 800, fmt(a))
            page.evaluate(BODY_CLICK)
            page.wait_for_timeout(500)

            rep.check(f'{mode}: no uncaught page errors', not errors, '; '.join(errors)[:200])
            ctx.close()

        compare_final(rep, finals['off'], finals['svelte'])
        compare_final(rep, finals['off'], finals['spring'], 'spring')

        # ---- prefers-reduced-motion: reduce ---------------------------------------------------------------------------
        ctx, page, errors = new_page(browser, f'{url}?ov=svelte', reduced_motion='reduce')
        results = {}
        for name in ('popover', 'select', 'modal', 'drawer'):
            spec = COMPONENTS[name]
            page.evaluate(BODY_CLICK)
            page.wait_for_timeout(300)
            s = run(page, spec, 'open', 800)
            a = analyse(s, 0, 1)
            if spec['instant_off']:
                rep.check(f'reduced motion + svelte: {name} opens at once', instant(a, 1), fmt(a))
            rep.check(f'reduced motion + svelte: {name} writes no inline animation values', not has_ext_inline(s))
            if spec.get('orig_class'):
                rep.check(f'reduced motion + svelte: {name} falls back to the original class transition', any(spec['orig_class'] in (x['cl'] + ' ' + x['rcl']) for _, x in s))
            page.wait_for_timeout(SETTLE)
            run(page, spec, 'close', 500)
            page.wait_for_timeout(500)
        rep.check('reduced motion: no uncaught page errors', not errors, '; '.join(errors)[:200])
        ctx.close()
        browser.close()

    bad = rep.failed
    print(f"\n{len(rep.rows) - len(bad)}/{len(rep.rows)} checks passed")
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
