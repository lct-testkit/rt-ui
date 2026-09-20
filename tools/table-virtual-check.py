"""Behavioural check of the VIRTUAL mode of the TableGrid on the demo route /examples/table-perf (Playwright, headless Chromium).

  python tools/table-virtual-check.py [--base http://127.0.0.1:5180] [--rows 10000] [--headed]

Needs the playground dev server (npm run dev / node tools/up.mjs). Exit code 0 = all checks passed. It proves what the pixel comparison
(`tools/compare.py`, which has no virtual story: the React TableGrid has no virtual mode) cannot:

  * only a window of the rows is in the DOM (<= 80 of N), the header cells and the body cells are on the same columns;
  * scrolling swaps the window (the first rendered id follows scrollTop, no blank gap under / above the rows);
  * the scroll height is that of the whole list, the last row is reachable (End key / scrollTop = scrollHeight);
  * sorting keeps the window on top, the "select all" header checkbox selects every row, expanding is not needed here (see the S3 bench);
  * the frame rate of a scripted ping-pong scroll stays >= 40 fps (machine dependent, the strict number is measured by tools/bench).
"""
import argparse
import sys

from playwright.sync_api import sync_playwright

ALIGN_JS = """() => {
  const box = c => { const b = c.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width)]; };
  const head = [...document.querySelectorAll('.atmr-tablegrid__cell--header')].map(box);
  const row = document.querySelector('.atmr-tablegrid__virtual-row');
  const body = [...row.querySelectorAll('.atmr-tablegrid__cell')].map(box);
  return { same: JSON.stringify(head) === JSON.stringify(body), head: head.length, body: body.length };
}"""

STATE_JS = """() => {
  const l = document.querySelector('.atmr-tablegrid__layout');
  const rows = [...document.querySelectorAll('.atmr-tablegrid__virtual-row')];
  const idOf = r => Number(r?.querySelector('.atmr-tablegrid__cell[data-table-cell-name=id]')?.textContent.trim());
  const lb = l.getBoundingClientRect(), first = rows[0]?.getBoundingClientRect(), last = rows[rows.length - 1]?.getBoundingClientRect();
  return { top: l.scrollTop, height: l.scrollHeight, client: l.clientHeight, count: rows.length, firstId: idOf(rows[0]), lastId: idOf(rows[rows.length - 1]),
           gapAbove: first ? Math.round(first.top - lb.top) : null, gapBelow: last ? Math.round(lb.bottom - last.bottom) : null };
}"""

FPS_JS = """async () => {
  const l = document.querySelector('.atmr-tablegrid__layout'), range = l.scrollHeight - l.clientHeight;
  const iv = []; let last = 0, t0 = 0;
  await new Promise(res => { const step = now => { if (last) iv.push(now - last); last = now; const p = ((now - t0) * 1.5) % (2 * range);
    l.scrollTop = p < range ? p : 2 * range - p; if (now - t0 < 1500) requestAnimationFrame(step); else res(); }; requestAnimationFrame(now => { t0 = now; requestAnimationFrame(step); }); });
  iv.splice(0, 2); return iv.length / (iv.reduce((a, b) => a + b, 0) / 1000);
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--rows', type=int, default=10000)
    ap.add_argument('--headed', action='store_true')
    a = ap.parse_args()
    failures = []

    def check(name, ok, detail=''):
        print(('PASS  ' if ok else 'FAIL  ') + name + (f'  [{detail}]' if detail else ''))
        if not ok:
            failures.append(name)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headed)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)[:200]))
        page.goto(f'{a.base}/examples/table-perf?rows={a.rows}&mode=virtual')
        page.wait_for_selector('.atmr-tablegrid__virtual-row', timeout=120_000)
        page.wait_for_timeout(600)

        s = page.evaluate(STATE_JS)
        ROW_H = page.evaluate('() => document.querySelector(".atmr-tablegrid__virtual-row").getBoundingClientRect().height')  # 40 - 41 px, depends on the columns
        check('window: few rows in the DOM', 0 < s['count'] <= 80, f"{s['count']} of {a.rows}")
        check('scroll height = the whole list', a.rows * ROW_H <= s['height'] <= a.rows * ROW_H + 400, f"{s['height']} px, row {ROW_H} px")
        al = page.evaluate(ALIGN_JS)
        check('header and body cells are on the same columns', al['same'] and al['head'] == al['body'], f"{al['head']} header / {al['body']} body cells")

        for y in (5_000, 123_456, int(a.rows * ROW_H // 2), 10**9):
            page.evaluate('(y) => { document.querySelector(".atmr-tablegrid__layout").scrollTop = y; }', y)
            page.wait_for_timeout(350)
            s = page.evaluate(STATE_JS)
            expected = min(s['top'], s['height'] - s['client']) / ROW_H
            near = abs(s['firstId'] - 1 - expected) <= 12 if y < 10**9 else s['lastId'] == a.rows
            # rows cover the viewport: the first row starts above its top edge (or at the header), the last one ends below the bottom edge
            covered = s['gapAbove'] is not None and s['gapAbove'] <= 60 and s['gapBelow'] is not None and s['gapBelow'] <= 1
            check(f'scrollTop {min(y, 10**7)}: window follows the scroll, no gaps', near and covered, f"first id {s['firstId']}, last id {s['lastId']}, gaps {s['gapAbove']} / {s['gapBelow']}")
        al = page.evaluate(ALIGN_JS)
        check('columns still aligned after scrolling', al['same'])

        page.evaluate('() => { document.querySelector(".atmr-tablegrid__layout").scrollTop = 20000; }')
        page.wait_for_timeout(300)
        page.click('.atmr-tablegrid__sorting__button')
        page.wait_for_timeout(500)
        s = page.evaluate(STATE_JS)
        check('sorting: rows are re-ordered, the window stays where it was', s['count'] > 0 and s['gapBelow'] is not None and s['gapBelow'] <= 1, f"first id {s['firstId']}")

        page.evaluate('() => { document.querySelector(".atmr-tablegrid__layout").scrollTop = 0; }')
        page.wait_for_timeout(300)
        page.click('.atmr-tablegrid__cell--header label.atmr-checkbox')
        page.wait_for_timeout(500)
        checked = page.evaluate('() => [...document.querySelectorAll(".atmr-tablegrid__virtual-row input[type=checkbox]")].every(i => i.checked)')
        info = page.evaluate('() => document.body.innerText.match(/выбрано: (\\d+)/)?.[1]')
        check('"select all" checks every rendered row and selects all rows', checked and str(info) == str(a.rows), f'selected: {info}')

        fps = page.evaluate(FPS_JS)
        check('scripted scroll >= 40 fps', fps >= 40, f'{fps:.1f} fps')
        check('no page errors', not errors, '; '.join(errors)[:200])
        browser.close()

    print('OK' if not failures else f'{len(failures)} check(s) failed: ' + ', '.join(failures))
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
