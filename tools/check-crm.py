"""Behavioural check of the example app /examples/crm (Playwright, headless Chromium), in every theme given (default: light + purple-dark):

  * the whole scenario: sorting (3 states, text and numbers), search, Select / Multiselect / InputDate filters, "Сбросить", row selection + ActionBar,
    export toast, delete through the confirm Modal, the card in a Drawer (Tabs, status change), side-menu stub, user menu, theme switch, motion switch;
  * menus: the Select lists (filter bar and Drawer) open BELOW their field with the field's width, inside the window, without jumping, and close on an
    outside click; in a short window (1300x600) the Drawer menu may flip to the top only because there is no room below;
  * layout at 1280x720 / 1440x900 / 1920x1080 with 50 rows per page: header, title, tabs and filters are never clipped, only the table scrolls
    (sticky header, footer with Pagination reachable), no page scrollbars, no second scroller (Chromium is started WITH scrollbars);
  * no console errors.

  python tools/check-crm.py [--base http://127.0.0.1:5180] [--themes rtk_default_light rtk_purple_dark] [--shots DIR]

Needs the playground dev server (node tools/up.mjs). Exit code 0 = all checks passed.
"""
import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OPTION = '[role=option], .atmr-dropdown-menu__list li'
TOAST = '[class*=toast]'


def run(pw, base, theme, shots):
    results = []

    def ok(name, cond, extra=''):
        results.append(bool(cond))
        print(f"  {'PASS' if cond else 'FAIL'}  {name} {extra}")

    def shot(pg, name):
        if shots:
            pg.screenshot(path=str(shots / f'{theme}-{name}.png'))

    browser = pw.chromium.launch()
    pg = browser.new_page(viewport={'width': 1600, 'height': 940})
    logs = []
    pg.on('console', lambda m: logs.append(m.text[:200]) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)[:200]))
    pg.goto(f'{base}/examples/crm?theme={theme}', wait_until='networkidle')
    pg.wait_for_function('document.fonts.status === "loaded"')
    pg.wait_for_timeout(600)
    print(f'[{theme}]')

    names = lambda: pg.eval_on_selector_all('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="name"]', 'els => els.map(e => e.textContent.trim())')
    header = lambda title: pg.locator('.atmr-tablegrid__cell--header').filter(has_text=title).first.locator('.atmr-tablegrid__sorting__button')
    n0 = names()
    ok('first page = 10 rows', len(n0) == 10, n0[:1])

    # --- sorting: asc -> desc -> default
    header('Организация').click(); pg.wait_for_timeout(250)
    n1 = names(); ok('sort asc', n1 == sorted(n1, key=str.lower) and n1 != n0)
    header('Организация').click(); pg.wait_for_timeout(250)
    n2 = names(); ok('sort desc', n2 == sorted(n2, key=str.lower, reverse=True))
    header('Организация').click(); pg.wait_for_timeout(250)
    ok('sort reset', names() == n0)
    header('Сумма').click(); pg.wait_for_timeout(250)
    amounts = pg.eval_on_selector_all('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="amountText"]', 'els => els.map(e => parseInt(e.textContent.replace(/\\D/g, "")))')
    ok('sort by amount (numeric)', amounts == sorted(amounts), amounts[:3])
    header('Сумма').click(); header('Сумма').click(); pg.wait_for_timeout(200)

    # --- search
    pg.locator('[data-testid=filters] input').first.fill('Казан'); pg.wait_for_timeout(300)
    n3 = names(); ok('search', n3 and all('Казан' in x for x in n3), n3)
    shot(pg, 'search')
    pg.click('[data-testid=reset]'); pg.wait_for_timeout(300)
    ok('"Сбросить"', len(names()) == 10)

    # --- Select (status): the menu opens BELOW the field
    status_field = pg.locator('[data-testid=filters] .atmr-input').nth(1)
    menu_below(pg, status_field, ok, 'filter Select')
    shot(pg, 'select-open')
    closes_on_outside_click(pg, status_field, '.orgs__head-title', ok, 'filter Select')
    pg.locator(OPTION).filter(has_text='Договор').first.click(); pg.wait_for_timeout(300)
    badges = pg.eval_on_selector_all('.atmr-tablegrid .atmr-badge', 'els => els.map(e => e.textContent.trim())')
    ok('status filter', badges and all(x == 'Договор' for x in badges), badges[:2])
    pg.click('[data-testid=reset]'); pg.wait_for_timeout(300)

    # --- Multiselect (cities)
    pg.locator('[data-testid=filters] input').nth(2).click(); pg.wait_for_timeout(250)
    pg.locator(OPTION).filter(has_text='Казань').first.click(); pg.wait_for_timeout(150)
    pg.locator(OPTION).filter(has_text='Самара').first.click(); pg.wait_for_timeout(250)
    shot(pg, 'multiselect')
    pg.keyboard.press('Escape'); pg.mouse.click(800, 130); pg.wait_for_timeout(250)
    cities = set(pg.eval_on_selector_all('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="city"]', 'els => els.map(e => e.textContent.trim())'))
    ok('multiselect filter', cities and cities <= {'Казань', 'Самара'}, cities)
    pg.click('[data-testid=reset]'); pg.wait_for_timeout(300)

    # --- InputDate (range picker opens)
    pg.locator('[data-testid=filters] input').nth(3).click(); pg.wait_for_timeout(350)
    ok('date picker opens', pg.locator('.atmr-picker-date, .atmr-calendar, [class*=picker-date]').count() >= 1)
    shot(pg, 'date')
    pg.keyboard.press('Escape'); pg.mouse.click(800, 130); pg.wait_for_timeout(200)

    # --- selection + ActionBar
    boxes = pg.locator('.atmr-tablegrid__checktree__container .atmr-checkbox')
    boxes.nth(0).click(); boxes.nth(1).click(); pg.wait_for_timeout(250)
    bar = pg.locator('.atmr-tablegrid__actionbar')
    ok('ActionBar shows "2 выбрано"', bar.count() == 1 and '2' in bar.inner_text(), bar.inner_text().replace('\n', ' ') if bar.count() else '')
    ok('checkbox does not open the card', pg.locator('.atmr-drawer').count() == 0)
    shot(pg, 'actionbar')
    bar.get_by_text('Экспорт', exact=True).click(); pg.wait_for_timeout(400)
    ok('export toast', pg.locator(TOAST).filter(has_text='Экспорт готов').count() >= 1)

    # --- confirm Modal: cancel, then delete
    bar.get_by_text('Удалить', exact=True).click(); pg.wait_for_timeout(500)
    ok('confirm Modal opens', pg.locator('.atmr-modal').count() == 1)
    shot(pg, 'modal')
    pg.click('[data-testid=cancel-delete]'); pg.wait_for_timeout(500)
    ok('Modal closes (Отмена)', pg.locator('.atmr-modal').count() == 0)
    boxes = pg.locator('.atmr-tablegrid__checktree__container .atmr-checkbox')
    boxes.nth(0).click(); boxes.nth(1).click(); pg.wait_for_timeout(250)
    pg.locator('.atmr-tablegrid__actionbar').get_by_text('Удалить', exact=True).click(); pg.wait_for_timeout(400)
    pg.click('[data-testid=confirm-delete]'); pg.wait_for_timeout(600)
    ok('2 organizations deleted (34 -> 32)', pg.locator('text=/из 32/').count() >= 1)
    ok('"Удалено" toast', pg.locator(TOAST).filter(has_text='Удалено').count() >= 1)
    ok('ActionBar is gone', pg.locator('.atmr-tablegrid__actionbar').count() == 0)

    # --- Drawer with the card
    pg.locator('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="name"]').nth(2).click(); pg.wait_for_timeout(600)
    ok('row click opens the Drawer', pg.locator('.atmr-drawer').count() == 1)
    shot(pg, 'drawer')
    drawer = pg.locator('.atmr-drawer')
    drawer.get_by_text('Контакты', exact=True).first.click(); pg.wait_for_timeout(250)
    ok('Drawer Tabs switch', drawer.get_by_text('Проректор по цифровизации').count() >= 1)
    drawer.get_by_text('Данные', exact=True).first.click(); pg.wait_for_timeout(250)
    m, fr = menu_below(pg, drawer.locator('.atmr-input').first, ok, 'Drawer Select')
    closes_on_outside_click(pg, drawer.locator('.atmr-input').first, '.atmr-drawer .card__title', ok, 'Drawer Select')
    ok('Drawer Select: the menu has the width of the field', abs(m['w'] - fr['width']) <= 2, f"(menu {m['w']:.0f}px, field {fr['width']:.0f}px)")
    shot(pg, 'drawer-select-open')
    pg.locator(OPTION).filter(has_text='Пауза').first.click(); pg.wait_for_timeout(400)
    ok('status change -> toast', pg.locator(TOAST).filter(has_text='Статус обновлён').count() >= 1)
    pg.click('[data-testid=card-close]'); pg.wait_for_timeout(600)
    ok('Drawer closes', pg.locator('.atmr-drawer').count() == 0)

    # --- side menu + user menu
    pg.locator('.atmr-side-menu__item').filter(has_text='Контакты').click(); pg.wait_for_timeout(300)
    ok('side-menu stub -> toast', pg.locator(TOAST).filter(has_text='Не входит в демо').count() >= 1)
    pg.locator('[data-testid=user-menu]').click(); pg.wait_for_timeout(350)
    ok('user menu opens', pg.locator(OPTION).filter(has_text='Выйти').count() >= 1)
    shot(pg, 'user-menu')
    pg.mouse.click(400, 92); pg.wait_for_timeout(250)  # outside click closes the menu (title area, no row under it)

    # --- theme + motion switches
    other = 'rtk_purple_dark' if theme != 'rtk_purple_dark' else 'rtk_default_light'
    label = {'rtk_purple_dark': 'Purple · тёмная', 'rtk_default_light': 'Rostelecom · светлая'}[other]
    try:
        pg.locator('.crm__demo-theme input').click(timeout=4000)
    except Exception:
        if shots:
            pg.screenshot(path=str(shots / f'{theme}-FAIL-theme.png'))
        raise
    pg.wait_for_timeout(250)
    pg.locator(OPTION).filter(has_text=label).first.click(); pg.wait_for_timeout(500)
    ok('theme switch changes the body class', f'Theme_root_{other}' in pg.evaluate('document.body.className'))
    ok('motion is off by default', pg.evaluate('!document.querySelector(".rt-ext-modal, [class*=rt-ext]")'))
    pg.locator('[data-testid=motion-switch]').click(); pg.wait_for_timeout(300)
    pg.locator('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="name"]').nth(0).click(); pg.wait_for_timeout(900)
    ok('Drawer opens with motion on', pg.locator('.atmr-drawer').count() == 1)
    pg.click('[data-testid=card-close]'); pg.wait_for_timeout(900)

    for line in logs:
        print('  console error:', line)
    ok('no console errors', not logs)
    browser.close()
    return results


# ------------------------------------------------------------------------------------------------- menus below their fields
MENU_RECT = """() => {
  const vis = [...document.querySelectorAll('.atmr-dropdown-menu, .atmr-picker-date')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
  const m = vis[vis.length - 1]; if (!m) return null; const b = m.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight };
}"""


# samples the menu position on every animation frame for 600 ms (into window.__frames): a menu that appears in the wrong place and then jumps flickers
SAMPLE = """() => {
  window.__frames = [];
  const vis = () => [...document.querySelectorAll('.atmr-dropdown-menu')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }).pop();
  const t0 = performance.now();
  const f = () => { const m = vis(); if (m) { const b = m.getBoundingClientRect(); window.__frames.push([Math.round(b.x), Math.round(b.y), Math.round(b.width)]); } if (performance.now() - t0 < 600) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}"""


MENU_OPEN = """() => [...document.querySelectorAll('.atmr-dropdown-menu')].some((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; })"""


def closes_on_outside_click(pg, field, outside, ok, name):
    """the open menu closes on a click outside; it is re-opened for the caller. (Escape does NOT close a Select menu: like the original, DropdownMenu has no keyboard handling.)"""
    pg.locator(outside).first.click(); pg.wait_for_timeout(350)
    ok(f'{name}: closes on an outside click', not pg.evaluate(MENU_OPEN))
    field.locator('input').first.click(); pg.wait_for_timeout(450)


def menu_below(pg, field, ok, name):
    """open the menu of `field` (locator of the .atmr-input wrapper) and check: below the field, inside the window, no jump while it appears"""
    fr = field.bounding_box()
    pg.evaluate(SAMPLE)                                       # start sampling ...
    field.locator('input').first.click()                      # ... and open the menu
    pg.wait_for_timeout(700)
    frames = pg.evaluate('window.__frames')
    jump = max((abs(f[1] - frames[-1][1]) + abs(f[0] - frames[-1][0]) for f in frames), default=999) if frames else 999
    ok(f'{name}: menu does not jump while it appears', frames and jump <= 2, f'({len(frames)} frames, first at y={frames[0][1] if frames else None}, settled at y={frames[-1][1] if frames else None})')
    m = pg.evaluate(MENU_RECT)
    below = m and m['y'] >= fr['y'] + fr['height'] - 2
    inside = m and m['x'] >= 0 and m['y'] >= 0 and m['x'] + m['w'] <= m['vw'] + 1 and m['y'] + m['h'] <= m['vh'] + 1
    ok(f'{name}: menu opens below the field', below, m and f"(field bottom y={fr['y'] + fr['height']:.0f}, menu top y={m['y']:.0f})")
    ok(f'{name}: menu is inside the window', inside)
    return m, fr


# ------------------------------------------------------------------------------------------------- layout at 3 window sizes
LAYOUT_INFO = """() => {
  const r = (s) => { const e = document.querySelector(s); return e && e.getBoundingClientRect(); };
  const grid = document.querySelector('.atmr-tablegrid');
  const de = document.documentElement;
  const c = document.querySelector('.crm__content');
  return { tabs: r('.atmr-tabs-group'), title: r('.orgs__head'), filters: r('.orgs__filters'), footer: r('.atmr-tablegrid__footer-area'), top: r('.atmr-top-menu'),
           grid: r('.atmr-tablegrid'), gridScrolls: grid.scrollHeight > grid.clientHeight + 1, content: { sh: c.scrollHeight, ch: c.clientHeight },
           pageX: de.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1, pageY: de.scrollHeight > innerHeight + 1, vh: innerHeight };
}"""
AFTER_SCROLL = """() => {
  const g = document.querySelector('.atmr-tablegrid').getBoundingClientRect();
  const hd = document.querySelector('.atmr-tablegrid__cell--header').getBoundingClientRect();
  const rows = [...document.querySelectorAll('.atmr-tablegrid__checktree__container')]; const last = rows[rows.length - 1].getBoundingClientRect();
  return { headerVisible: hd.top >= g.top - 1 && hd.bottom <= g.bottom, lastVisible: last.bottom <= g.bottom + 1 };
}"""


def layout(pw, base, theme, shots):
    """page size 50 at 1280x720 / 1440x900 / 1920x1080: header, tabs and filters are never clipped, only the table scrolls"""
    results = []

    def ok(name, cond, extra=''):
        results.append(bool(cond))
        print(f"  {'PASS' if cond else 'FAIL'}  {name} {extra}")

    for w, h in [(1280, 720), (1440, 900), (1920, 1080)]:
        # headless Chromium hides scrollbars by default: show them, so a double / horizontal scrollbar would be visible
        browser = pw.chromium.launch(ignore_default_args=['--hide-scrollbars'])
        pg = browser.new_page(viewport={'width': w, 'height': h})
        pg.goto(f'{base}/examples/crm?theme={theme}', wait_until='networkidle')
        pg.wait_for_function('document.fonts.status === "loaded"')
        pg.wait_for_timeout(500)
        tag = f'[{theme} {w}x{h}]'
        h10 = pg.evaluate("document.querySelector('.atmr-tabs-group').getBoundingClientRect().height")
        pg.locator('.atmr-tablegrid__footer-area input').first.click(); pg.wait_for_timeout(300)  # page size Select
        pg.locator(OPTION).filter(has_text='50').first.click(); pg.wait_for_timeout(500)
        n = pg.locator('.atmr-tablegrid__checktree__container').count()
        ok(f'{tag} page size 50: all rows of the list on one page', n == 34, f'({n} rows)')
        info = pg.evaluate(LAYOUT_INFO)
        ok(f'{tag} tabs are not clipped', abs(info['tabs']['height'] - h10) < 1 and info['tabs']['top'] >= info['title']['bottom'] - 1, f"(tabs height {info['tabs']['height']:.0f}px)")
        ok(f'{tag} title, tabs and filters stay in place', info['title']['top'] >= info['top']['bottom'] - 1 and info['filters']['bottom'] <= info['grid']['top'] + 1)
        ok(f'{tag} footer with Pagination is visible', 0 <= info['footer']['top'] and info['footer']['bottom'] <= info['vh'] + 1, f"(y {info['footer']['top']:.0f}..{info['footer']['bottom']:.0f} of {info['vh']})")
        ok(f'{tag} no page scroll and no second scroller', not info['pageX'] and not info['pageY'] and info['content']['sh'] <= info['content']['ch'] + 1)
        if info['gridScrolls']:  # the table scrolls inside; sticky header and footer stay
            pg.evaluate("document.querySelector('.atmr-tablegrid').scrollTop = 1e6"); pg.wait_for_timeout(200)
            after = pg.evaluate(AFTER_SCROLL)
            ok(f'{tag} scrolled to the bottom: last row reachable, sticky header stays', after['headerVisible'] and after['lastVisible'])
            if shots:
                pg.screenshot(path=str(shots / f'{theme}-layout-{w}x{h}-bottom.png'))
            pg.evaluate("document.querySelector('.atmr-tablegrid').scrollTop = 0")
        if shots:
            pg.screenshot(path=str(shots / f'{theme}-layout-{w}x{h}.png'))
        browser.close()
    return results


def short_window(pw, base, theme, shots):
    """a short window (1300x600): the status menu of the Drawer must stay inside the window - it may flip to the TOP only because there is no room below"""
    results = []
    browser = pw.chromium.launch()
    pg = browser.new_page(viewport={'width': 1300, 'height': 600})
    pg.goto(f'{base}/examples/crm?theme={theme}', wait_until='networkidle')
    pg.wait_for_function('document.fonts.status === "loaded"')
    pg.wait_for_timeout(500)
    pg.locator('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="name"]').nth(2).click(); pg.wait_for_timeout(700)
    field = pg.locator('.atmr-drawer .atmr-input').first
    fr = field.bounding_box()
    field.locator('input').first.click(); pg.wait_for_timeout(600)
    m = pg.evaluate(MENU_RECT)
    below = m['y'] >= fr['y'] + fr['height'] - 2
    above = m['y'] + m['h'] <= fr['y'] + 2
    inside = m['x'] >= 0 and m['y'] >= 0 and m['x'] + m['w'] <= m['vw'] + 1 and m['y'] + m['h'] <= m['vh'] + 1
    room_below = fr['y'] + fr['height'] + m['h'] + 4 <= m['vh']
    good = inside and (below if room_below else above)
    print(f"  {'PASS' if good else 'FAIL'}  [{theme} 1300x600] Drawer Select in a short window: menu {'below' if below else 'above'} the field, "
          f"{'inside' if inside else 'OUTSIDE'} the window (room below: {room_below})")
    results.append(bool(good))
    if shots:
        pg.screenshot(path=str(shots / f'{theme}-short-window.png'))
    browser.close()
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--themes', nargs='*', default=['rtk_default_light', 'rtk_purple_dark'])
    ap.add_argument('--shots', default=None, help='directory for debug screenshots')
    a = ap.parse_args()
    shots = Path(a.shots) if a.shots else None
    if shots:
        shots.mkdir(parents=True, exist_ok=True)
    allres = []
    with sync_playwright() as pw:
        for t in a.themes:
            allres += run(pw, a.base, t, shots)
            allres += layout(pw, a.base, t, shots)
            allres += short_window(pw, a.base, t, shots)
    print(f'{sum(allres)}/{len(allres)} checks passed')
    sys.exit(0 if all(allres) else 1)


if __name__ == '__main__':
    main()
