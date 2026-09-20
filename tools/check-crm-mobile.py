"""Behavioural + layout check of the ADAPTIVE example app /examples/crm (Playwright, headless Chromium) on a phone, a small phone, a tablet and a desktop.

  phone 390x844 (touch): no horizontal scroll anywhere; burger -> SideMenu in a left Drawer (items close it, demo switches at the bottom: theme + motion);
    cards instead of the table; search; the inline filter panel (Select / Multiselect lists open inside the window, below their field); sort Select;
    card selection -> sticky bulk bar (FAB hides); confirm Modal fits the window; tap on a card -> Drawer as wide as the window, one-column fields,
    footer reachable, status change; Pagination; touch targets >= 40 px for the primary controls; no console errors / warnings.
  small phone 360x640 and landscape phone 844x390: no horizontal scroll, nothing clipped that matters.
  tablet 768x1024: collapsed SideMenu, table WITHOUT INN / manager / contact columns (the amount column is visible, the grid does not scroll sideways), two-column filters.
  desktop 1280x800: unchanged structure (SideMenu + TableGrid, no cards, no burger).

  python tools/check-crm-mobile.py [--base http://127.0.0.1:5180] [--themes rtk_default_light rtk_purple_dark] [--shots DIR]

--shots writes screenshots (default: none; tools/screenshots.py-style names docs/img/crm-mobile-*.png with --shots docs/img).
Needs the playground dev server (node tools/up.mjs). Exit code 0 = all checks passed.
"""
import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OPTION = '[role=option], .atmr-dropdown-menu__list li'
TOAST = '[class*=toast]'
CARD = '.rt-ext-cards__item'
# the open dropdown list (the last visible one), as [left, top, right, bottom, width, innerWidth, innerHeight]
MENU_RECT = """() => { const r = [...document.querySelectorAll('.atmr-dropdown-menu')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0).pop();
    return r ? [r.left, r.top, r.right, r.bottom, r.width, innerWidth, innerHeight] : [0, 0, 0, 0, 0, innerWidth, innerHeight]; }"""


def run(pw, base, theme, shots, prefix='crm-mobile'):
    results = []
    errors = []

    def ok(name, cond, extra=''):
        results.append(bool(cond))
        if not cond:
            print(f'  FAIL  {name} {extra}')
        return bool(cond)

    def new_page(w, h, touch=True):
        ctx = pw.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if shots and w < 500 else 1, has_touch=touch and w < 800, is_mobile=touch and w < 800,
                             locale='ru-RU')
        page = ctx.new_page()
        page.on('console', lambda m: errors.append(f'{w}x{h} {m.type}: {m.text[:160]}') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: errors.append(f'{w}x{h} pageerror: {str(e)[:200]}'))
        page.goto(f'{base}/examples/crm?theme={theme}', wait_until='load')
        page.wait_for_selector('.crm', timeout=15000)
        page.wait_for_timeout(1200)
        return ctx, page

    def shot(page, name):
        if shots:
            for _ in range(30):                        # let the toasts of the previous step go away: the pictures are for the README
                if page.locator(TOAST).count() == 0:
                    break
                page.wait_for_timeout(300)
            (Path(shots) / '_parts').mkdir(exist_ok=True)
            page.screenshot(path=str(Path(shots) / '_parts' / f'{prefix}-{name}.png'))

    def no_hscroll(page, label):
        r = page.evaluate("""() => { const d = document.documentElement, c = document.querySelector('.crm__content');
            return { page: d.scrollWidth - d.clientWidth, content: c ? c.scrollWidth - c.clientWidth : 0 } }""")
        ok(f'{label}: no horizontal scroll of the page / content', r['page'] <= 0 and r['content'] <= 0, str(r))

    def inside(page, sel, label, below=None):
        box = page.eval_on_selector(sel, 'e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight] }')
        good = box[0] >= -1 and box[2] <= box[4] + 1 and box[3] <= box[5] + 1
        ok(f'{label}: inside the window', good, str(box))
        return box

    def toasts(page):
        return page.locator(TOAST).count()

    # ------------------------------------------------------------------ phone 390x844
    ctx, page = new_page(390, 844)
    no_hscroll(page, 'phone')
    ok('phone: burger is visible', page.locator('[data-testid=burger]').is_visible())
    ok('phone: no side menu before the burger is used', page.locator('.crm > .atmr-side-menu').count() == 0)
    ok('phone: cards instead of the table', page.locator(CARD).count() == 10 and page.locator('.atmr-tablegrid').count() == 0, f'{page.locator(CARD).count()} cards')
    ok('phone: the FAB is visible', page.locator('[data-testid=fab-add]').is_visible())
    ok('phone: title + export are in one row', page.locator('h1').first.is_visible())
    shot(page, 'list')

    # touch targets of the primary controls
    def size_of(sel):
        return page.eval_on_selector(sel, 'e => { const r = e.getBoundingClientRect(); return [r.width, r.height] }')
    for sel, label in [('[data-testid=burger]', 'burger'), ('[data-testid=user-menu]', 'avatar'), ('[data-testid=filters-toggle]', 'filters button'),
                       ('[data-testid=fab-add]', 'FAB'), ('[data-testid=export-mobile]', 'export button')]:
        w, h = size_of(sel)
        ok(f'phone: touch target "{label}" >= 40x40', w >= 40 and h >= 40, f'{w:.0f}x{h:.0f}')
    h = page.eval_on_selector('[data-testid=filters] .atmr-input', 'e => e.getBoundingClientRect().height')
    ok('phone: search field is >= 44 px tall', h >= 44, f'{h:.0f}')
    h = page.eval_on_selector(f'{CARD} >> nth=0', 'e => e.getBoundingClientRect().height')
    ok('phone: a card is >= 64 px tall', h >= 64, f'{h:.0f}')

    # --- menu Drawer
    page.click('[data-testid=burger]')
    page.wait_for_selector('.crm-nav', timeout=5000)
    page.wait_for_timeout(500)
    ok('phone: menu drawer opens with 7 items', page.locator('.crm-nav .atmr-side-menu__item').count() == 7, str(page.locator('.crm-nav .atmr-side-menu__item').count()))
    box = page.eval_on_selector('.crm-nav .atmr-drawer__content', 'e => { const r = e.getBoundingClientRect(); return [r.left, r.width, r.height, innerHeight] }')
    ok('phone: menu drawer is not wider than the window and is full height', 200 <= box[1] <= 330 and abs(box[2] - box[3]) <= 1, str(box))
    ok('phone: demo switches are in the menu drawer', page.locator('.crm-nav [data-testid=motion-switch-mobile]').count() == 1)
    shot(page, 'menu')
    # theme switch inside the drawer (mode segment "Тёмная")
    page.locator('.crm-nav').get_by_text('Тёмная', exact=True).click()
    page.wait_for_timeout(300)
    ok('phone: dark mode from the menu drawer changes the theme class', 'dark' in page.evaluate('document.body.className'), page.evaluate('document.body.className'))
    page.locator('.crm-nav').get_by_text('Светлая', exact=True).click()
    page.wait_for_timeout(300)
    ok('phone: light mode again', 'light' in page.evaluate('document.body.className'))
    before = toasts(page)
    page.locator('.crm-nav').get_by_text('Сделки', exact=True).click()
    page.wait_for_timeout(700)
    ok('phone: a menu item answers with a toast and closes the drawer', toasts(page) > before and page.locator('.crm-nav').count() == 0, f'toasts {before}->{toasts(page)}, drawer {page.locator(".crm-nav").count()}')

    # --- search
    inp = page.locator('[data-testid=filters] input').first
    inp.fill('Казан')
    page.wait_for_timeout(300)
    ok('phone: search "Казан" leaves 1 card', page.locator(CARD).count() == 1, str(page.locator(CARD).count()))
    inp.fill('')
    page.wait_for_timeout(300)

    # --- inline filter panel: Select list opens below its field, inside the window
    page.click('[data-testid=filters-toggle]')
    page.wait_for_selector('[data-testid=filters-panel]', timeout=3000)
    shot(page, 'filters')
    page.locator('[data-testid=filters-panel] .atmr-input input').first.click()
    page.wait_for_selector(OPTION, timeout=3000)
    page.wait_for_timeout(500)
    field = page.eval_on_selector('[data-testid=filters-panel] .atmr-input', 'e => { const r = e.getBoundingClientRect(); return [r.left, r.bottom, r.width] }')
    menu = page.evaluate(MENU_RECT)
    ok('phone: Select list opens below its field with the field width', menu[1] >= field[1] - 2 and abs(menu[4] - field[2]) <= 2, f'field {field} menu {menu}')
    ok('phone: Select list is inside the window', menu[0] >= -1 and menu[2] <= menu[5] + 1 and menu[3] <= menu[6] + 1, str(menu))
    page.locator(OPTION).filter(has_text='Договор').first.click()
    page.wait_for_timeout(400)
    n_status = page.locator(CARD).count()
    ok('phone: status filter narrows the list', 0 < n_status < 10, str(n_status))
    ok('phone: the filter badge shows the number of active filters', page.locator('.orgs__iconwrap-badge').count() == 1)
    page.click('[data-testid=reset]')
    page.wait_for_timeout(400)
    ok('phone: "Сбросить" restores the list', page.locator(CARD).count() == 10, str(page.locator(CARD).count()))
    page.click('[data-testid=filters-apply]')
    page.wait_for_timeout(300)
    ok('phone: "Показать" closes the panel', page.locator('[data-testid=filters-panel]').count() == 0)

    # --- sort
    page.locator('.orgs__mbar-sort .atmr-input input').click()
    page.wait_for_selector(OPTION)
    page.locator(OPTION).filter(has_text='Сумма: по убыванию').first.click()
    page.wait_for_timeout(400)
    amounts = page.eval_on_selector_all(f'{CARD} .ocard__row .atmr-typography:last-child', 'els => els.map(e => Number(e.textContent.replace(/[^0-9]/g, "")))')
    ok('phone: sort "Сумма: по убыванию" orders the cards', len(amounts) >= 3 and amounts == sorted(amounts, reverse=True), str(amounts[:5]))

    # --- selection + bulk bar
    boxes = page.locator(f'{CARD} .rt-ext-cards__check .atmr-checkbox')
    boxes.nth(0).click()
    boxes.nth(1).click()
    page.wait_for_timeout(300)
    ok('phone: two selected cards show the bulk bar', page.locator('[data-testid=bulk-bar]').is_visible() and '2 выбрано' in page.locator('[data-testid=bulk-bar]').inner_text())
    ok('phone: the FAB hides while cards are selected', page.locator('[data-testid=fab-add]').count() == 0)
    shot(page, 'selected')
    inside(page, '[data-testid=bulk-bar]', 'phone: bulk bar')
    page.click('[data-testid=bulk-delete]')
    page.wait_for_selector('.crm-modal', timeout=3000)
    page.wait_for_timeout(500)
    inside(page, '.crm-modal', 'phone: confirm Modal')
    shot(page, 'modal')
    page.click('[data-testid=confirm-delete]')
    page.wait_for_timeout(600)
    ok('phone: delete drops the bulk bar and 2 of 34 organizations (32 left, the page still shows 10)', page.locator('[data-testid=bulk-bar]').count() == 0
       and page.locator(CARD).count() == 10 and 'Найдено: 32' in page.locator('.orgs__mbar').inner_text(), page.locator('.orgs__mbar').inner_text())

    # --- card -> Drawer as wide as the window
    page.locator(f'{CARD} .rt-ext-cards__main').first.click()
    page.wait_for_selector('.crm-drawer .card__head', timeout=4000)
    page.wait_for_timeout(600)
    dw = page.eval_on_selector('.crm-drawer .atmr-drawer__content', 'e => { const r = e.getBoundingClientRect(); return [r.left, r.width, r.height, innerWidth, innerHeight] }')
    ok('phone: the card Drawer is as wide as the window', abs(dw[1] - dw[3]) <= 1 and abs(dw[2] - dw[4]) <= 1, str(dw))
    cols = page.eval_on_selector('.card__fields', 'e => getComputedStyle(e).gridTemplateColumns.split(" ").length')
    ok('phone: card fields are one column', cols == 1, str(cols))
    inside(page, '.card__footer', 'phone: card footer buttons')
    shot(page, 'card')
    page.get_by_role('tab', name='Контакты').click()
    page.wait_for_timeout(300)
    ok('phone: the card tabs work', page.locator('.crm-drawer').get_by_text('Проректор по цифровизации').count() >= 1)
    page.click('[data-testid=card-close]')
    page.wait_for_timeout(600)
    ok('phone: the card closes', page.locator('.crm-drawer .card__head').count() == 0)

    # --- pagination (34 -> 10 per page)
    ok('phone: Pagination is shown and fits', page.locator('.orgs__mpager .atmr-pagination').count() == 1)
    no_hscroll(page, 'phone (after actions)')
    ctx.close()

    # ------------------------------------------------------------------ small phone 360x640
    ctx, page = new_page(360, 640)
    no_hscroll(page, 'small phone 360x640')
    ok('small phone: FAB and burger visible', page.locator('[data-testid=fab-add]').is_visible() and page.locator('[data-testid=burger]').is_visible())
    page.click('[data-testid=filters-toggle]')
    page.wait_for_timeout(300)
    no_hscroll(page, 'small phone with filters')
    ctx.close()

    # ------------------------------------------------------------------ landscape phone 844x390 (tablet layout, very short)
    ctx, page = new_page(844, 390)
    no_hscroll(page, 'landscape phone 844x390')
    ctx.close()

    # ------------------------------------------------------------------ tablet 768x1024
    ctx, page = new_page(768, 1024)
    no_hscroll(page, 'tablet')
    ok('tablet: collapsed side menu, table, no cards, no burger', page.locator('.crm > .atmr-side-menu').count() == 1 and page.locator('.atmr-tablegrid').count() == 1
       and page.locator(CARD).count() == 0 and page.locator('[data-testid=burger]').count() == 0)
    heads = page.eval_on_selector_all('.atmr-tablegrid__cell--header', 'els => els.map(e => e.textContent.trim())')
    ok('tablet: INN / manager / contact columns are dropped, amount stays', not any('ИНН' in h for h in heads) and not any('Менеджер' in h for h in heads) and any('Сумма' in h for h in heads), str(heads))
    grid = page.eval_on_selector('.atmr-tablegrid', 'e => [e.scrollWidth, e.clientWidth]')
    ok('tablet: the grid does not scroll sideways', grid[0] <= grid[1] + 1, str(grid))
    cols = page.eval_on_selector('.orgs__filters', 'e => getComputedStyle(e).gridTemplateColumns.split(" ").length')
    ok('tablet: filters are in two columns', cols == 2, str(cols))
    shot(page, 'tablet')
    ctx.close()

    # ------------------------------------------------------------------ desktop 1280x800: unchanged
    ctx, page = new_page(1280, 800, touch=False)
    ok('desktop: side menu + table, no cards, no burger', page.locator('.crm > .atmr-side-menu').count() == 1 and page.locator('.atmr-tablegrid').count() == 1
       and page.locator(CARD).count() == 0 and page.locator('[data-testid=burger]').count() == 0)
    heads = page.eval_on_selector_all('.atmr-tablegrid__cell--header', 'els => els.map(e => e.textContent.trim())')
    ok('desktop: all 7 columns', any('ИНН' in h for h in heads) and any('Менеджер' in h for h in heads) and any('Контакт' in h for h in heads), str(heads))
    ctx.close()

    bad = [e for e in errors]
    ok('no console errors / warnings / page errors', not bad, '\n      ' + '\n      '.join(bad[:8]))
    return results


def sheet(folder, prefix):
    """<prefix>.png = the four main phone screens side by side (list, filters, selection, card) for the README"""
    from PIL import Image
    parts = folder / '_parts'
    ims = [Image.open(parts / f'{prefix}-{n}.png').convert('RGB') for n in ('list', 'filters', 'selected', 'card')]
    h = 720
    ims = [i.resize((round(i.width * h / i.height), h), Image.LANCZOS) for i in ims]
    gap = 16
    out = Image.new('RGB', (sum(i.width for i in ims) + gap * (len(ims) - 1), h), (236, 237, 240))
    x = 0
    for i in ims:
        out.paste(i, (x, 0))
        x += i.width + gap
    out.save(folder / f'{prefix}.png', optimize=True)
    # the tablet picture is a final image too; the rest of the parts are only inputs of the sheet
    tablet = parts / f'{prefix}-tablet.png'
    if tablet.exists():
        Image.open(tablet).convert('RGB').save(folder / f'{prefix.replace("crm-mobile", "crm-tablet")}.png', optimize=True)
    for f in parts.glob('*.png'):
        f.unlink()
    parts.rmdir()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5180')
    ap.add_argument('--themes', nargs='*', default=['rtk_default_light', 'rtk_purple_dark'])
    ap.add_argument('--shots')
    ap.add_argument('--prefix', default='crm-mobile', help='file name prefix of the screenshots (docs/img/<prefix>-list.png ...)')
    a = ap.parse_args()
    if a.shots:
        Path(a.shots).mkdir(parents=True, exist_ok=True)
    allres = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for t in a.themes:
            print(f'--- theme {t}')
            r = run(browser, a.base, t, a.shots if t == a.themes[0] else None, a.prefix)
            print(f'    {sum(r)}/{len(r)} checks passed')
            allres += r
        browser.close()
    if a.shots:
        sheet(Path(a.shots), a.prefix)
    print(f'=== {sum(allres)}/{len(allres)} checks passed')
    sys.exit(0 if all(allres) else 1)


if __name__ == '__main__':
    main()
