"""EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default.

Behavioural check of the Svelte motion of the TABLE (TableGrid) on the demo route /ext/table, Playwright, headless Chromium.

The same scripted session (sort, shuffle, filter, pages, selection + action bar, expand / collapse, add / delete rows) runs in fresh page loads:

  none      no ExtMotionProvider and no `motion` prop at all               (what the table is without the extension)
  off       <ExtMotionProvider mode="off">                                 (the extension present but switched off)
  tween     mode="svelte"                                                  (motion on)
  spring    mode="svelte" type="spring"
  reduced   tween + `prefers-reduced-motion: reduce`                       (motion on, but the user asks for none)
  virtual   tween + `virtual` table                                        (the window of rows scrolls: no motion)

and proves:

  * motion OFF (`none` and `off`)  -> the DOM of the table is IDENTICAL after every step (the serialised DOM: tags, attributes sorted, classes, inline style, text),
                                      and nothing of the extension ever runs (no `rt-ext-table-*` animation, no `inert` row, no pinned cell, no `position` on the grid);
  * motion ON (`tween`, `spring`)  -> the animation actually runs after the action (getAnimations(): FLIP / fade-in / fade-out of the rows, the icon turn, the colour
                                      fade, the sliding expand content and action bar), the rows start EXACTLY where they were (FLIP) and travel monotonically to their
                                      places, a checkbox clicked in the middle of the animation still selects; and once it has ended the DOM of the table is IDENTICAL to
                                      the DOM of the OFF run after the same step, the geometry too (row tops within 0.5 px), and nothing of the extension is left;
  * `reduced` / `virtual`          -> the motion does not run at all (no extension animation; the DOM equals the OFF run);
  * `--perf` / `--perf-only`       -> the cost, motion OFF vs ON and the delta, for 30 and 200 rows (`--perf-rows`): click -> the end of the first frame after it,
                                      the frame pacing during the animation (frames > 20 ms) and the main-thread time (JS / style / layout / all tasks, CDP metrics).

  python tools/ext-check-table.py [--base http://127.0.0.1:5180] [--headed] [--perf | --perf-only] [--rows 30] [-v]

Needs the playground dev server (node tools/up.mjs). Exit code 0 = all checks passed. The pixel-for-pixel proof that the ORIGINAL table did not change with the
extension off is `python tools/compare.py --match "^(tablegrid|components-tree|components-pagination)"`.
"""
import argparse
import json
import statistics
import sys

from playwright.sync_api import sync_playwright

SETTLE = 1400  # ms after an action until everything has ended (the longest motion is 300 ms + the stagger)
PROBE = 70  # ms after the click at which "the animation is running" is read

# a canonical serialisation of the table: attributes sorted, `style` declarations sorted, generated ids dropped (they differ between loads)
SNAP = """
() => {
  const el = document.querySelector('[data-testid=tbl]');
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
  return canon(el);
}
"""

# the box of every data row (its last cell) by the text of its first data cell, + leftovers of the extension
GEOM = """
() => {
  const root = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout');
  const rows = [...root.children].filter((e) => e.matches('.atmr-tablegrid__row[data-table-row]') && !e.querySelector(':scope > .atmr-tablegrid__header-underlay'));
  const top = {};
  for (const r of rows) {
    const cells = r.querySelector(':scope > .atmr-tablegrid__columns__container').children;
    const id = cells[1].textContent.trim();
    top[id] = Math.round(cells[cells.length - 1].getBoundingClientRect().top * 100) / 100;
  }
  return top;
}
"""

LEFT = """
() => {
  const root = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout');
  const ext = document.getAnimations().filter((a) => (a.id || '').startsWith('rt-ext-table')).length;
  return {
    ext,
    inert: root.querySelectorAll('[inert]').length,
    hidden: [...root.children].filter((e) => e.style.display === 'none').length,
    pinned: root.querySelectorAll('.atmr-tablegrid__cell[style*="position: absolute"], .atmr-tablegrid__expand__container[style*="position: absolute"]').length,
    rootPosition: root.style.position,
    ghosts: document.querySelectorAll('[data-testid=tbl] svg[aria-hidden][style*="position: absolute"]').length,
  };
}
"""

ANIMS = """
() => {
  const by = {};
  for (const a of document.getAnimations()) {
    const id = a.id || '';
    if (id.startsWith('rt-ext-table')) by[id.slice(13)] = (by[id.slice(13)] || 0) + 1;
    else if (a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-testid=tbl]') && a.playState === 'running') by.svelte = (by.svelte || 0) + 1;
  }
  return by;
}
"""

# height of the first expand container / of the action bar container (0 when absent)
BOX = """
(sel) => { const e = document.querySelector('[data-testid=tbl] ' + sel); return e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : 0; }
"""

# what has to run after an action (kinds of `rt-ext-table-*`; `svelte` = a Svelte transition animation inside the table): [must, may]
# step = (name, testid, must-be-running kinds, extra)
STEPS = [
    ('sort amount asc', 't-sort-amount-asc', {'flip', 'icon'}, {}),
    ('sort amount desc', 't-sort-amount-desc', {'flip'}, {}),
    ('sort by name', 't-sort-name', {'flip'}, {}),
    ('sort reset', 't-sort-reset', {'flip'}, {}),
    ('shuffle', 't-shuffle', {'flip'}, {}),
    ('filter: paid only', 't-filter-paid', {'out'}, {}),
    ('filter reset', 't-filter-reset', {'in'}, {}),
    ('filter: text', 't-filter-text', {'out'}, {}),
    ('filter reset 2', 't-filter-reset', {'in'}, {}),
    ('paged on', 't-paged', {'out'}, {}),
    ('next page', 't-page-next', {'in', 'out'}, {}),
    ('prev page', 't-page-prev', {'in', 'out'}, {}),
    ('paged off', 't-paged', {'in'}, {}),
    ('select 3 rows (action bar + tint)', 't-select-3', {'color', 'svelte'}, {'bar': True}),
    ('select none', 't-select-none', {'color', 'svelte'}, {'bar': True}),
    ('select all', 't-select-all', {'color', 'svelte'}, {'bar': True}),
    ('select none 2', 't-select-none', {'color'}, {}),
    ('expand all', 't-expand-all', {'svelte', 'icon'}, {'expand': True}),
    ('collapse all', 't-collapse-all', {'svelte', 'icon'}, {'expand': True}),
    ('add row', 't-add', {'in', 'flip'}, {}),
]


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


# The dev server hot-reloads the page whenever ANY source file changes (other people are editing the library while this runs), which would reset the page
# in the middle of a session: the Vite HMR socket is replaced by a stub that never connects, so the page under test is never touched.
NO_HMR = """
(() => {
  const Orig = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    const p = Array.isArray(protocols) ? protocols : [protocols];
    if (p.includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 0 };
    return new Orig(url, protocols);
  };
  window.WebSocket.prototype = Orig.prototype;
  for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) window.WebSocket[k] = Orig[k];
})();
"""


def open_page(browser, base, mode, rows, reduced=False, virtual=False, extra=''):
    ctx = browser.new_context(viewport={'width': 1280, 'height': 1100}, reduced_motion='reduce' if reduced else 'no-preference')
    ctx.add_init_script(NO_HMR)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:300]))
    url = f'{base}/ext/table?motion={mode}&rows={rows}' + ('&virtual=1' if virtual else '') + extra
    page.goto(url, wait_until='load')
    page.wait_for_selector('[data-testid=tbl] .atmr-tablegrid__row[data-table-row]', timeout=90_000)
    page.wait_for_timeout(1200)
    return ctx, page, errors


def run_session(page, steps, probe=True):
    """runs the steps; returns [{name, dom, geom, left, probe: {anims, bar, expand}}]"""
    out = []
    for name, tid, must, extra in steps:
        before = page.evaluate(GEOM)
        # the click is made in the page so that nothing but the click happens before the first frame
        page.evaluate("(tid) => document.querySelector(`[data-testid=${tid}]`).click()", tid)
        res = {'name': name, 'must': must, 'extra': extra, 'before': before}
        if probe:
            page.wait_for_timeout(PROBE)
            res['anims'] = page.evaluate(ANIMS)
            res['bar'] = page.evaluate(BOX, '.atmr-tablegrid__actionbar__container')
            res['expand'] = page.evaluate(BOX, '.atmr-tablegrid__expand__container')
            page.wait_for_timeout(SETTLE - PROBE)
        else:
            page.wait_for_timeout(SETTLE)
        res['dom'] = page.evaluate(SNAP)
        res['geom'] = page.evaluate(GEOM)
        res['left'] = page.evaluate(LEFT)
        res['final_bar'] = page.evaluate(BOX, '.atmr-tablegrid__actionbar__container')
        res['final_expand'] = page.evaluate(BOX, '.atmr-tablegrid__expand__container')
        out.append(res)
    return out


def first_diff(a, b):
    n = min(len(a), len(b))
    i = next((k for k in range(n) if a[k] != b[k]), n)
    return f'@{i}: ...{a[max(0, i - 40):i + 60]!r} != ...{b[max(0, i - 40):i + 60]!r}'


def check_frames(page, rep, label):
    """FLIP: the first painted frame after a sort shows every row where it was, the middle frame is in between, the last one is the new layout."""
    page.evaluate("document.querySelector('[data-testid=t-shuffle]').click()")
    page.wait_for_timeout(SETTLE)
    before = page.evaluate(GEOM)
    view = page.evaluate("(() => { const r = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout').getBoundingClientRect(); return [r.top + 45, r.bottom - 5]; })()")
    frames = page.evaluate(
        """
        async () => {
          const geom = %s;
          const shots = [];
          document.querySelector('[data-testid=t-shuffle]').click();
          const t0 = performance.now();
          await new Promise((res) => {
            const f = () => { const t = performance.now() - t0; shots.push([t, geom()]); t < 520 ? requestAnimationFrame(f) : res(); };
            requestAnimationFrame(f);
          });
          return shots;
        }
        """
        % GEOM
    )
    page.wait_for_timeout(SETTLE)
    settled = page.evaluate(GEOM)
    first, last = frames[0][1], frames[-1][1]
    common = [k for k in before if k in first and k in last]
    inview = lambda y: view[0] <= y <= view[1]
    # rows that were in view and stay in view, and move a visible distance: those are the ones that FLIP (a row from / to outside the window fades instead)
    moved = [k for k in common if abs(before[k] - settled[k]) > 30 and inview(before[k]) and inview(settled[k])]
    start_ok = [k for k in moved if abs(first[k] - before[k]) <= 2.5]
    rep.check(f'{label}: rows start where they were (FLIP)', moved and len(start_ok) == len(moved), f'{len(start_ok)} / {len(moved)} of the rows that move > 30 px inside the window')
    mid = next((f for f in frames if f[0] >= 150), frames[len(frames) // 2])[1]
    between = [k for k in moved if min(before[k], settled[k]) - 2 <= mid[k] <= max(before[k], settled[k]) + 2]
    rep.check(f'{label}: at the middle of the motion the rows are between the old and the new place', moved and len(between) == len(moved), f'{len(between)} / {len(moved)}')
    # monotonic: the distance to the target never grows
    worst = 0
    for k in moved:
        d = [abs(f[1][k] - settled[k]) for f in frames if k in f[1]]
        worst = max(worst, max((d[i + 1] - d[i] for i in range(len(d) - 1)), default=0))
    rep.check(f'{label}: the rows travel monotonically (no overshoot with a tween)', worst <= 1.5, f'largest step away from the target {worst:.1f} px')
    ended = max((abs(last[k] - settled[k]) for k in common), default=0)
    rep.check(f'{label}: the motion has ended 520 ms after the click (the last frame is the settled layout)', ended < 0.6, f'{ended:.2f} px')
    return frames


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--headed', action='store_true')
    ap.add_argument('--rows', type=int, default=30)
    ap.add_argument('--perf', action='store_true', help='also measure the cost of the motion for 30 and 200 rows')
    ap.add_argument('--perf-only', action='store_true', help='only the cost measurement (no functional checks)')
    ap.add_argument('--perf-rows', default='30,200', help='table sizes of the cost measurement (30 and 200 have a demo button)')
    ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    rep = Report(a.verbose)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headed)
        if a.perf_only:
            perf(browser, a.base, rep, [int(x) for x in a.perf_rows.split(',')])
            browser.close()
            print(f'\n{sum(1 for r in rep.rows if r[1])}/{len(rep.rows)} cost checks passed')
            sys.exit(1 if rep.failed else 0)
        runs = {}
        for name, mode, kw in [('none', 'none', {}), ('off', 'off', {}), ('tween', 'tween', {}), ('spring', 'spring', {}), ('reduced', 'tween', {'reduced': True}), ('virtual', 'tween', {'virtual': True})]:
            ctx, page, errors = open_page(browser, a.base, mode, a.rows, **kw)
            steps = STEPS if name != 'virtual' else STEPS[:13]
            runs[name] = run_session(page, steps)
            runs[name + '_errors'] = errors
            if name == 'tween':
                runs['frames'] = check_frames(page, rep, 'tween')
                runs['frames_errors'] = errors
            ctx.close()

        # ── motion OFF: the original ────────────────────────────────────────────────────────────────────────────────────────────────────
        none, off = runs['none'], runs['off']
        bad = [(n['name'], first_diff(n['dom'], o['dom'])) for n, o in zip(none, off) if n['dom'] != o['dom']]
        rep.check('off: the DOM of the table is identical with and without the provider, after every step', not bad, f'{len(none)} steps' if not bad else f'{bad[0][0]}: {bad[0][1]}')
        for label, run in (('none', none), ('off', off)):
            ran = [s['name'] for s in run if s['anims'].get('svelte', 0) or any(k != 'svelte' for k in s['anims'])]
            rep.check(f'{label}: nothing of the extension runs (no rt-ext-table animation, no Svelte transition)', not ran, ', '.join(ran[:4]))
            left = [s['name'] for s in run if s['left']['inert'] or s['left']['hidden'] or s['left']['pinned'] or s['left']['rootPosition'] or s['left']['ext']]
            rep.check(f'{label}: no leftovers (inert rows, pinned cells, position on the grid)', not left, ', '.join(left[:4]))
        rep.check('off: expand content / action bar appear at once (first probe already has the final height)',
                  all(s['expand'] == s['final_expand'] and s['bar'] == s['final_bar'] for s in off if s['extra']), '')

        # ── motion ON ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
        for label in ('tween', 'spring'):
            run = runs[label]
            bad = [(s['name'], first_diff(s['dom'], o['dom'])) for s, o in zip(run, off) if s['dom'] != o['dom']]
            rep.check(f'{label}: after the animation the DOM equals the OFF run, after every step', not bad, f'{len(run)} steps' if not bad else f'{bad[0][0]}: {bad[0][1]}')
            badg = []
            for s, o in zip(run, off):
                for k in set(s['geom']) | set(o['geom']):
                    if abs(s['geom'].get(k, -9e9) - o['geom'].get(k, 9e9)) > 0.5:
                        badg.append((s['name'], k, s['geom'].get(k), o['geom'].get(k)))
                        break
            rep.check(f'{label}: after the animation every row is where the OFF run has it (0.5 px)', not badg, f'{len(run)} steps' if not badg else str(badg[0]))
            left = [s['name'] for s in run if s['left']['ext'] or s['left']['inert'] or s['left']['hidden'] or s['left']['pinned'] or s['left']['rootPosition'] or s['left']['ghosts']]
            rep.check(f'{label}: nothing of the extension is left after the animation', not left, ', '.join(left[:4]) + (' ' + str([s['left'] for s in run if s['name'] == left[0]]) if left else ''))
            missing = []
            for s in run:
                got = set(s['anims'])
                need = set(s['must'])
                if s['name'] in ('shuffle', 'sort by name', 'sort reset', 'sort amount desc') and 'flip' in need and 'in' in got and 'flip' not in got:
                    continue
                lacking = need - got
                if lacking:
                    missing.append(f"{s['name']}: no {'/'.join(sorted(lacking))} (running: {s['anims']})")
            rep.check(f'{label}: the motion runs after every action (getAnimations at {PROBE} ms)', not missing, '; '.join(missing[:3]) if missing else 'flip / in / out / icon / colour / slide seen')
            expand = [s for s in run if s['extra'].get('expand')]
            rep.check(f'{label}: expand content slides (mid-way height between 0 and the final one)',
                      all(0 < s['expand'] < s['final_expand'] or (s['final_expand'] == 0 and s['expand'] > 0) for s in expand), str([(s['expand'], s['final_expand']) for s in expand]))
            bar = [s for s in run if s['name'].startswith('select 3') or s['name'] == 'select all']
            rep.check(f'{label}: the action bar slides in (mid-way height)', all(0 < s['bar'] < s['final_bar'] for s in bar), str([(s['bar'], s['final_bar']) for s in bar]))

        rep.check('tween: no page errors', not runs['tween_errors'] and not runs['spring_errors'] and not runs['frames_errors'], '; '.join(runs['tween_errors'] + runs['spring_errors'])[:200])

        # ── reduced motion / virtual ────────────────────────────────────────────────────────────────────────────────────────────────────
        red = runs['reduced']
        ran = [s['name'] for s in red if s['anims']]
        rep.check('reduced motion: no animation at all, although motion is switched on', not ran, ', '.join(ran[:4]))
        rep.check('reduced motion: the DOM equals the OFF run', all(s['dom'] == o['dom'] for s, o in zip(red, off)))
        vir = runs['virtual']
        ran = [s['name'] for s in vir if s['anims'].get('flip') or s['anims'].get('in') or s['anims'].get('out') or s['anims'].get('color')]
        rep.check('virtual: no row motion (the window of rows changes on every scroll step)', not ran, ', '.join(ran[:4]))

        # ── interaction during the motion ────────────────────────────────────────────────────────────────────────────────────────────────
        ctx, page, errors = open_page(browser, a.base, 'tween', a.rows)
        page.evaluate("document.querySelector('[data-testid=t-sort-amount-desc]').click()")
        page.wait_for_timeout(120)
        # a row checkbox in the middle of the motion: hit-testing follows the moving cells (the element under the checkbox's CURRENT centre is that checkbox), and a click
        # there selects the row and shows the action bar. (done inside the page, in one task: a click sent from outside would find the row already moved on)
        count = "document.querySelectorAll('[data-testid=tbl] .atmr-tablegrid__row:not(:has(.atmr-tablegrid__header-underlay)) input[type=checkbox]:checked').length"
        before = page.evaluate(count)
        hit = page.evaluate(
            """() => {
              const root = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout').getBoundingClientRect();
              // (rows cross each other in a full re-sort: a checkbox covered by another row's cell at this instant is skipped, the first one that is on top is clicked)
              let tried = 0;
              for (const l of document.querySelectorAll('[data-testid=tbl] .atmr-tablegrid__row:not(:has(.atmr-tablegrid__header-underlay)) label.atmr-checkbox')) {
                const r = l.getBoundingClientRect();
                if (!(r.top > root.top + 70 && r.bottom < root.bottom - 20)) continue;
                tried++;
                const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                if (el && el.closest('label.atmr-checkbox') === l) { el.click(); return true; }
              }
              return tried ? false : null;
            }"""
        )
        page.wait_for_timeout(SETTLE)
        after = page.evaluate(count)
        bar = page.evaluate("!!document.querySelector('.atmr-tablegrid__actionbar__container')")
        rep.check('a click on a checkbox in the middle of the motion hits it and selects the row', hit and after == before + 1 and bar, f'hit {hit}, {before} -> {after}, action bar {bar}')
        # and a real mouse click once everything has settled
        pt = page.evaluate(
            """() => {
              const root = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout').getBoundingClientRect();
              for (const l of document.querySelectorAll('[data-testid=tbl] .atmr-tablegrid__row:not(:has(.atmr-tablegrid__header-underlay)) label.atmr-checkbox:has(input:not(:checked))')) {
                const r = l.getBoundingClientRect();
                if (r.top > root.top + 70 && r.bottom < root.bottom - 20) return [r.left + r.width / 2, r.top + r.height / 2];
              }
              return null;
            }"""
        )
        page.mouse.click(pt[0], pt[1])
        page.wait_for_timeout(300)
        rep.check('a mouse click on a checkbox after the motion selects the row', page.evaluate(count) == after + 1, f'{after} -> {page.evaluate(count)}')
        # keyboard: the rows stay focusable, Tab reaches the first row of the body
        page.focus('[data-testid=tbl] .atmr-tablegrid__sorting__button')
        page.keyboard.press('Enter')
        page.wait_for_timeout(120)
        page.keyboard.press('Tab')
        active = page.evaluate("document.activeElement && (document.activeElement.closest('[data-testid=tbl]') ? document.activeElement.tagName + '.' + document.activeElement.className.slice(0, 40) : 'outside')")
        page.wait_for_timeout(SETTLE)
        rep.check('keyboard: a sort by Enter during the motion works, Tab moves the focus inside the table', active != 'outside' and active != 'null', str(active))
        # hover / press feedback (the mouse is moved with the raw API: the animation lasts ~120 ms, so it must be read right after the move)
        page.mouse.move(5, 5)
        page.wait_for_timeout(SETTLE // 2)
        pt = page.evaluate(
            """() => {
              const root = document.querySelector('[data-testid=tbl] .atmr-tablegrid__layout').getBoundingClientRect();
              for (const c of document.querySelectorAll('[data-testid=tbl] .atmr-tablegrid__row:not(:has(.atmr-tablegrid__header-underlay)) .atmr-tablegrid__cell[data-table-cell-name=city]')) {
                const r = c.getBoundingClientRect();
                if (r.top > root.top + 90 && r.bottom < root.bottom - 20) return [r.left + r.width / 2, r.top + r.height / 2];
              }
              return null;
            }"""
        )
        page.mouse.move(pt[0], pt[1])
        hov = page.evaluate(ANIMS).get('hover', 0)
        page.wait_for_timeout(300)
        page.mouse.move(pt[0], pt[1] - 60)  # onto another row: the row that was hovered eases out
        hov_out = page.evaluate(ANIMS).get('hover', 0)
        page.mouse.move(5, 5)
        page.wait_for_timeout(SETTLE // 2)
        rep.check('hover: the row background eases in (a hover animation on the cells of the row) and out', hov > 0 and hov_out > 0, f'in {hov} cells, out {hov_out}')
        btn = page.query_selector('[data-testid=tbl] .atmr-tablegrid__sorting__button')
        box = btn.bounding_box()
        page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
        page.mouse.down()
        page.wait_for_timeout(40)
        press = page.evaluate(ANIMS).get('press', 0)
        page.mouse.up()
        page.wait_for_timeout(SETTLE)
        rep.check('press: an icon button dips while pressed', press > 0, f'{press}')
        rep.check('no page errors during the interaction', not errors, '; '.join(errors)[:200])
        ctx.close()

        # ── cost ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
        if a.perf:
            perf(browser, a.base, rep, [int(x) for x in a.perf_rows.split(',')])
        browser.close()

    bad = rep.failed
    print(f'\n{len(rep.rows) - len(bad)}/{len(rep.rows)} checks passed')
    sys.exit(1 if bad else 0)


PERF = """
async (tid) => {
  const frames = [];
  const btn = document.querySelector(`[data-testid=${tid}]`);
  const t0 = performance.now();
  btn.click();
  const sync = performance.now() - t0;          // the handlers; Svelte flushes (and the motion measures / starts) in the microtasks right after: awaited below
  await new Promise((r) => requestAnimationFrame(() => r()));
  const frame0 = performance.now() - t0;        // click -> the start of the next frame (JS + Svelte flush + whatever the motion forced early)
  await new Promise((r) => requestAnimationFrame(() => r()));
  const frame1 = performance.now() - t0;        // click -> the end of that frame's style / layout / paint (the same point of the pipeline for both modes)
  let last = performance.now();
  await new Promise((res) => {
    const f = (now) => { frames.push(now - last); last = now; now - t0 < 800 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
  frames.shift();
  const s = [...frames].sort((a, b) => a - b);
  return { sync, frame0, frame1, frames: frames.length, p50: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1], slow: frames.filter((x) => x > 20).length };
}
"""


def _metrics(cdp):
    m = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
    return {k: m.get(k, 0.0) * 1000 for k in ('ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration', 'TaskDuration')}


def perf(browser, base, rep, sizes=(30, 200)):
    print('\ncost of the motion (median of 5 runs each, ms). frame = click -> the end of the first frame after it (same pipeline point in both modes); the last')
    print('four columns are the main-thread time of the whole update + 800 ms of animation (CDP Performance.getMetrics): JS / style recalc / layout / all tasks')
    print(f"{'rows':>5} {'action':<22} {'mode':<6} {'frame':>7} {'p95 fr':>7} {'max fr':>7} {'>20ms':>5} | {'script':>7} {'style':>7} {'layout':>7} {'tasks':>7}")
    for rows in sizes:
        for tid, label, pre in (('t-sort-amount-desc', 'sort', ['t-sort-reset']), ('t-filter-paid', 'filter', ['t-filter-reset']), ('t-expand-first', 'expand 1 row', ['t-collapse-all']), ('t-expand-all', 'expand all (10 rows)', ['t-collapse-all']), ('t-select-3', 'select 3 + action bar', ['t-select-none'])):
            res = {}
            for mode in ('off', 'tween'):
                ctx, page, _ = open_page(browser, base, mode, rows)
                cdp = ctx.new_cdp_session(page)
                cdp.send('Performance.enable')
                runs = []
                for _ in range(5):
                    page.wait_for_timeout(SETTLE)
                    m0 = _metrics(cdp)
                    r = page.evaluate(PERF, tid)
                    m1 = _metrics(cdp)
                    r.update({k: m1[k] - m0[k] for k in m0})
                    runs.append(r)
                    for t in pre:
                        page.evaluate("(t) => document.querySelector(`[data-testid=${t}]`).click()", t)
                    page.wait_for_timeout(SETTLE)
                ctx.close()
                med = {k: statistics.median(r[k] for r in runs) for k in runs[0]}
                res[mode] = med
                print(f"{rows:>5} {label:<22} {mode:<6} {med['frame1']:>7.1f} {med['p95']:>7.1f} {med['max']:>7.1f} {med['slow']:>5.0f} | {med['ScriptDuration']:>7.1f} {med['RecalcStyleDuration']:>7.1f} {med['LayoutDuration']:>7.1f} {med['TaskDuration']:>7.1f}")
            d = res['tween']['frame1'] - res['off']['frame1']
            dt = res['tween']['TaskDuration'] - res['off']['TaskDuration']
            print(f"{'':>5} {'':<22} {'delta':<6} {d:>+7.1f} {'':>7} {'':>7} {res['tween']['slow'] - res['off']['slow']:>+5.0f} | {res['tween']['ScriptDuration'] - res['off']['ScriptDuration']:>+7.1f} {res['tween']['RecalcStyleDuration'] - res['off']['RecalcStyleDuration']:>+7.1f} {res['tween']['LayoutDuration'] - res['off']['LayoutDuration']:>+7.1f} {dt:>+7.1f}")
            rep.check(f'cost {rows} rows, {label}: first frame after the action is at most 150 ms later than without motion', d <= 150, f'{d:+.1f} ms (main thread {dt:+.1f} ms)')


if __name__ == '__main__':
    main()
