"""Regenerates EVERY image of README.md / docs/*.md into docs/img/ (PNG, optimised with Pillow, width <= 1400 px, total < 4 MB).

  python tools/screenshots.py                      # all images
  python tools/screenshots.py --only crm,themes    # groups: crm | components | themes | pages   (or exact file names: crm-light,comp-buttons)
  python tools/screenshots.py --list               # what would be produced

Sources (all from OUR Svelte app; the reference data - design/reference, _mirror - is never written):
  crm         the example app /examples/crm: light, purple-dark, the card in a Drawer, a confirm Modal, the filter bar, the 4 themes
  components  curated shots of OUR stories in showcase mode (`/story/<id>?theme=<t>&base=1` = the Rostelecom font + text colour) with interaction
              steps where the state matters (Select / Multiselect / DatePicker / Popover / Modal / Drawer / toasts) + a contact sheet
  themes      the same button variants in the four themes
  pages       /gallery (light, table mode in purple-dark) and /ext

The images are reproducible: a fixed clock (2026-09-18) and a seeded Math.random in every page, the CRM data is generated deterministically.
The servers come from `node tools/up.mjs` (started automatically when they are not running). File names are stable, lowercase-kebab.
Needs: pip install playwright pillow; playwright install chromium.
"""
import argparse
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'img'
BASE = 'http://127.0.0.1:5180'
MAX_W = 1400
LIGHT, DARK, PLIGHT, PDARK = 'rtk_default_light', 'rtk_default_dark', 'rtk_purple_light', 'rtk_purple_dark'
OPTION = '[role=option], .atmr-dropdown-menu__list li'

# ------------------------------------------------------------------------------------------------- image helpers


def optimise(img: Image.Image, colors=256) -> Image.Image:
    """UI screenshots have few colours: an adaptive palette without dithering is visually lossless and ~3x smaller."""
    img = img.convert('RGB')
    return img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def save(img: Image.Image, name: str) -> Path:
    if img.width > MAX_W:
        img = img.resize((MAX_W, round(img.height * MAX_W / img.width)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.png'
    optimise(img).save(path, format='PNG', optimize=True)
    print(f'  {path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size // 1024} KB')
    return path


def from_png(data: bytes) -> Image.Image:
    return Image.open(io.BytesIO(data)).convert('RGB')


def font(size: int) -> ImageFont.FreeTypeFont:
    for f in ('segoeui.ttf', 'Segoe UI.ttf', 'arial.ttf', 'DejaVuSans.ttf', 'Helvetica.ttc'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def trim(img: Image.Image, margin=24) -> Image.Image:
    """crop the uniform background (the colour of the top-left pixel) around the content, keep `margin` px"""
    bg = Image.new('RGB', img.size, img.getpixel((0, 0)))
    box = ImageChops.difference(img, bg).convert('L').point(lambda p: 255 if p > 6 else 0).getbbox()
    if not box:
        return img
    l, t, r, b = box
    return img.crop((max(0, l - margin), max(0, t - margin), min(img.width, r + margin), min(img.height, b + margin)))


def label(img: Image.Image, text: str, fg=(90, 96, 110), bg=(255, 255, 255)) -> Image.Image:
    """caption strip below an image"""
    f = font(max(14, img.width // 40))
    h = f.size + 14
    out = Image.new('RGB', (img.width, img.height + h), bg)
    out.paste(img, (0, 0))
    ImageDraw.Draw(out).text((10, img.height + 6), text, fill=fg, font=f)
    return out


def grid(images, cols, gap=24, bg=(248, 249, 250), pad=24) -> Image.Image:
    """contact sheet: images of any size, `cols` per row, every cell as wide as the widest image of its column"""
    rows = [images[i:i + cols] for i in range(0, len(images), cols)]
    col_w = [max((r[c].width for r in rows if c < len(r)), default=0) for c in range(cols)]
    row_h = [max(i.height for i in r) for r in rows]
    w = pad * 2 + sum(col_w) + gap * (cols - 1)
    h = pad * 2 + sum(row_h) + gap * (len(rows) - 1)
    sheet = Image.new('RGB', (w, h), bg)
    y = pad
    for r, rh in zip(rows, row_h):
        x = pad
        for c, im in enumerate(r):
            sheet.paste(im, (x, y))
            x += col_w[c] + gap
        y += rh + gap
    return sheet


# ------------------------------------------------------------------------------------------------- browser helpers

UNION = """(sels) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of sels) for (const e of document.querySelectorAll(s)) {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0, vw: innerWidth, vh: innerHeight };
}"""
NO_CARET = '*,*::before,*::after{caret-color:transparent!important}'
# reproducible images: a fixed "today" (the calendar highlights it) and a seeded Math.random (some stories shuffle their rows) - as in tools/harness.py
INIT = """(() => {
  const FIXED = Date.UTC(2026, 8, 18, 9, 0, 0), RD = Date;
  class FD extends RD { constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); } static now() { return FIXED; } }
  window.Date = FD;
  let s = 123456789;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
})();"""


class Shooter:
    def __init__(self, pw):
        self.pw = pw
        self.browser = pw.chromium.launch()

    def page(self, w, h, scale=1):
        ctx = self.browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=scale, locale='ru-RU', timezone_id='Europe/Moscow')
        ctx.add_init_script(INIT)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: print('  ! page error:', str(e)[:160]))
        return pg

    def ready(self, pg, extra=350):
        pg.wait_for_function('document.fonts.status === "loaded"')
        pg.add_style_tag(content=NO_CARET)
        pg.wait_for_timeout(extra)

    def story(self, sid, theme=LIGHT, vp=(640, 360), scale=2):
        """open one story in showcase mode (`base=1`: Rostelecom font instead of the forced Times New Roman of the original preview)"""
        pg = self.page(*vp, scale=scale)
        pg.goto(f'{BASE}/story/{sid}?theme={theme}&base=1', wait_until='networkidle')
        pg.wait_for_function('window.__rtReady === true')
        self.ready(pg)
        return pg

    @staticmethod
    def steps(pg, steps):
        for st in steps or []:
            op, *a = st
            if op == 'click':
                pg.locator(a[0]).nth(a[1] if len(a) > 1 else 0).click()
            elif op == 'text':  # click a text inside a container
                pg.locator(a[0]).get_by_text(a[1], exact=True).first.click()
            elif op == 'hovertext':
                pg.locator(a[0]).get_by_text(a[1], exact=True).first.hover()
            elif op == 'hover':
                pg.locator(a[0]).first.hover()
            elif op == 'type':
                pg.locator(a[0]).first.fill(a[1])
            elif op == 'press':
                pg.keyboard.press(a[0])
            elif op == 'wait':
                pg.wait_for_timeout(a[0])
            elif op == 'js':
                pg.evaluate(a[0])
            elif op == 'move':
                pg.mouse.move(*a)
            else:
                raise ValueError(op)
            pg.wait_for_timeout(120)

    @staticmethod
    def grab(pg, clip=None, pad=16):
        """screenshot of the union of the `clip` selectors (+ pad), or of the whole viewport"""
        if not clip:
            return from_png(pg.screenshot())
        r = pg.evaluate(UNION, clip)
        if not r:
            raise RuntimeError(f'nothing visible for {clip}')
        x0, y0 = max(0, r['x'] - pad), max(0, r['y'] - pad)
        x1, y1 = min(r['vw'], r['x'] + r['w'] + pad), min(r['vh'], r['y'] + r['h'] + pad)
        return from_png(pg.screenshot(clip={'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0}))

    def shot(self, spec):
        """one story -> one image; `spec` is a dict, see COMPONENTS"""
        pg = self.story(spec['story'], spec.get('theme', LIGHT), spec.get('vp', (640, 360)), spec.get('scale', 2))
        self.steps(pg, spec.get('steps'))
        img = self.grab(pg, spec.get('clip', ['#storybook-root']), spec.get('pad', 16))
        pg.context.close()
        return img

    def close(self):
        self.browser.close()


# ------------------------------------------------------------------------------------------------- what to photograph
ROOT_SEL = ['#storybook-root']
FAILED = []

# Design Tokens stories render nothing (in the reference as well: "until a theme resolves"), so the token palette is drawn from the live CSS variables
# of the theme, injected into a blank story page.
TOKENS_JS = r"""() => {
  const fam = [['accent', 'Акцент'], ['neutral', 'Нейтральные'], ['success', 'Успех'], ['warning', 'Предупреждение'], ['error', 'Ошибка'], ['info', 'Информация']];
  const shades = [10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const cs = getComputedStyle(document.body);
  const root = document.querySelector('#storybook-root');
  root.style.cssText = 'margin:0;height:auto;padding:0';
  root.innerHTML = `<div style="font:13px var(--atmr-font-family-body);padding:20px 24px;background:var(--atmr-bg-page);color:var(--atmr-fg-default)">
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">Токены цвета · ${document.body.className.match(/Theme_root_(\w+)/)[1]}</div>` +
    fam.map(([f, t]) => `<div style="display:flex;align-items:center;margin-bottom:8px"><div style="width:130px;color:var(--atmr-fg-muted)">${t}</div>` +
      shades.map((n) => `<div style="width:64px;margin-right:4px"><div style="height:44px;border-radius:6px;background:var(--atmr-${f}-${n});box-shadow:inset 0 0 0 1px var(--atmr-border-muted)"></div><div style="font-size:11px;color:var(--atmr-fg-muted);margin-top:3px;text-align:center">${n}</div></div>`).join('') +
      '</div>').join('') + '</div>';
}"""
# name -> (caption, spec | list of specs stacked vertically)
#   spec: story, theme, vp (viewport, the story content starts ~116px from the top), scale (device pixel ratio), steps, clip (selectors -> crop; None = viewport), pad
COMPONENTS = {
    'comp-buttons': ('Кнопки: варианты и размеры', [
        dict(story='components-buttons-button--variant', vp=(560, 230), trim=True, pad=22),
        dict(story='components-buttons-button--size', vp=(560, 230), trim=True, pad=22),
    ]),
    'comp-forms': ('Поля ввода, чекбоксы, переключатели', [
        dict(story='components-input--main', vp=(480, 260), trim=True, pad=20),
        dict(story='components-checkboxes-checkboxgroup--main', vp=(480, 260), trim=True, pad=20),
        dict(story='components-switch--main', vp=(480, 230), trim=True, pad=20),
        dict(story='components-segmentedcontrol-segmentedcontrol--main', vp=(480, 240), trim=True, pad=20),
    ]),
    'comp-select-open': ('Select: раскрытый список', dict(
        story='components-select--main', vp=(360, 440), trim=True, steps=[('click', '#storybook-root .atmr-input'), ('wait', 500)], clip=ROOT_SEL + ['.atmr-dropdown-menu'], pad=20)),
    'comp-multiselect': ('Multiselect: выбор чипами', dict(
        story='components-multiselect--auto-height', vp=(360, 480), trim=True,
        steps=[('click', '#storybook-root .atmr-input'), ('wait', 400), ('text', '.atmr-dropdown-menu', 'Polymer'), ('text', '.atmr-dropdown-menu', 'Mithril'),
               ('text', '.atmr-dropdown-menu', 'Sodium'), ('wait', 400)],
        clip=ROOT_SEL + ['.atmr-dropdown-menu'], pad=20)),
    'comp-datepicker': ('InputDate: период в календаре', dict(
        story='components-inputdate-isrange--main', vp=(420, 520), trim=True,
        steps=[('click', '.atmr-input'), ('wait', 500), ('text', '.atmr-popover', '10'), ('hovertext', '.atmr-popover', '18'), ('wait', 300)],
        clip=ROOT_SEL + ['.atmr-popover'], pad=20)),
    'comp-tabs': ('Tabs', dict(story='components-tabs-tabs--main', vp=(780, 260), pad=20, trim=True)),
    'comp-popover': ('Popover', dict(
        story='components-popover--main', vp=(520, 440), trim=True, steps=[('click', '[data-testid=click]'), ('wait', 500)], clip=ROOT_SEL + ['.atmr-popover'], pad=24)),
    'comp-modal': ('Modal: форма', dict(
        story='patterns-recipes-modal-recipes--modal-with-form', vp=(660, 540), steps=[('click', '#storybook-root button'), ('wait', 700)], clip=None)),
    'comp-drawer': ('Drawer: профиль', dict(
        story='patterns-recipes-drawer-recipes--profile', vp=(760, 560), steps=[('click', '#storybook-root button'), ('wait', 700)], clip=None)),
    'comp-toasts': ('Уведомления (toast)', dict(
        story='components-notification-toast-notification--color-scheme', vp=(1000, 500), trim=True,
        steps=[('click', '#storybook-root button', 0), ('click', '#storybook-root button', 1), ('click', '#storybook-root button', 2), ('wait', 700)], clip=None)),
    'comp-shell': ('SideMenu + TopMenu', dict(
        story='patterns-recipes-sidemenu-sidewithtopmenu--side-with-top-menu-story', vp=(900, 380), clip=None)),
    'comp-tablegrid': ('TableGrid', dict(story='tablegrid-tablegrid--table-grid', vp=(1240, 440), clip=ROOT_SEL, pad=20)),
    'comp-tablegrid-filters': ('TableGrid: фильтры в шапке', dict(
        story='tablegrid-tablegrid-filters--filters', vp=(1240, 560), steps=[('click', '.atmr-tablegrid__filter__button'), ('wait', 500)],
        clip=ROOT_SEL + ['.atmr-popover'], pad=20)),
    'comp-tablegrid-sticky': ('TableGrid: закреплённые шапка и подвал', dict(
        story='tablegrid-tablegrid-stickyheaderandfooter--sticky-header-and-footer', vp=(1240, 900), clip=ROOT_SEL, pad=20)),
    'comp-tokens-colors': ('Дизайн-токены: цвета', dict(story='components-buttons-button--variant', vp=(1000, 480), steps=[('js', TOKENS_JS)], clip=['#storybook-root > div'], pad=0)),
}
SHEET = ['comp-buttons', 'comp-forms', 'comp-select-open', 'comp-multiselect', 'comp-datepicker', 'comp-tabs', 'comp-popover', 'comp-modal', 'comp-drawer',
         'comp-toasts', 'comp-shell', 'comp-tablegrid']


def make_components(sh: Shooter, names):
    made = {}
    for name, (caption, spec) in COMPONENTS.items():
        if names is not None and name not in names:  # None = all
            continue
        try:
            made[name] = make_component(sh, name, spec)
        except Exception as e:  # keep going: one broken story must not lose the other images
            FAILED.append(name)
            print(f'  !! {name}: {str(e).splitlines()[0][:200]}')
    return made


def make_component(sh: Shooter, name, spec):
    if isinstance(spec, list):  # several stories -> one image (stacked, background of the first)
        imgs = [trim(sh.shot(s), 16) if s.get('trim') else sh.shot(s) for s in spec]
        w = max(i.width for i in imgs)
        img = Image.new('RGB', (w, sum(i.height for i in imgs)), imgs[0].getpixel((2, 2)))
        y = 0
        for i in imgs:
            img.paste(i, ((w - i.width) // 2, y))
            y += i.height
    else:
        img = sh.shot(spec)
        if spec.get('trim'):
            img = trim(img)
    save(img, name)
    return img


SHEET_CROP = {'comp-shell': 0.62, 'comp-tablegrid': 0.62}  # wide shots: the left part is enough for a thumbnail


def make_sheet(made, sh: Shooter):
    """contact sheet of the curated component shots (thumbnails with captions)"""
    thumbs = []
    for name in SHEET:
        img = made.get(name)
        if img is None:
            p = OUT / f'{name}.png'
            if not p.exists():
                continue
            img = Image.open(p).convert('RGB')
        if name in SHEET_CROP:
            img = img.crop((0, 0, int(img.width * SHEET_CROP[name]), img.height))
        s = min(1.0, 420 / img.width, 300 / img.height)
        t = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
        card = Image.new('RGB', (420, 300 + 30), (255, 255, 255))
        card.paste(t, ((420 - t.width) // 2, (300 - t.height) // 2))
        ImageDraw.Draw(card).rectangle([0, 0, 419, 299], outline=(226, 228, 233))
        ImageDraw.Draw(card).text((6, 306), COMPONENTS[name][0], fill=(70, 76, 90), font=font(16))
        thumbs.append(card)
    save(grid(thumbs, 3, gap=20, pad=20), 'components-sheet')


# ------------------------------------------------------------------------------------------------- themes
def make_themes(sh: Shooter):
    """the same button variants in the four themes: 2x2 (default | purple) x (light | dark)"""
    order = [LIGHT, DARK, PLIGHT, PDARK]
    names = {LIGHT: 'Rostelecom · светлая', DARK: 'Rostelecom · тёмная', PLIGHT: 'Purple · светлая', PDARK: 'Purple · тёмная'}
    cells = []
    for t in order:
        # the story keeps a 100px gap above its content: crop to the content (+ 26px) and paint the caption in the free corner
        img = sh.shot(dict(story='components-buttons-button--variant', theme=t, vp=(600, 240), scale=1, clip=ROOT_SEL, pad=26))
        ImageDraw.Draw(img).text((12, 6), names[t], fill=(150, 156, 170) if 'dark' in t else (120, 126, 140), font=font(13))
        cells.append(img)
    save(grid(cells, 2, gap=0, pad=0), 'themes-buttons')


# ------------------------------------------------------------------------------------------------- example app (CRM)
CHECKS = '.atmr-tablegrid__checktree__container .atmr-checkbox'


def crm_page(sh: Shooter, theme, w=1500, h=920, motion=False):
    pg = sh.page(w, h)
    pg.goto(f'{BASE}/examples/crm?theme={theme}' + ('&motion=1' if motion else ''), wait_until='networkidle')
    sh.ready(pg, 900)
    return pg


def make_crm(sh: Shooter, names):
    want = lambda n: not names or n in names
    if want('crm-light'):  # two rows selected: the ActionBar shows up
        pg = crm_page(sh, LIGHT)
        pg.locator(CHECKS).nth(0).click(); pg.locator(CHECKS).nth(1).click(); pg.mouse.move(700, 60); pg.wait_for_timeout(300)
        save(from_png(pg.screenshot()), 'crm-light')
        pg.context.close()
    if want('crm-purple-dark'):  # sorted by amount, descending
        pg = crm_page(sh, PDARK)
        hdr = pg.locator('.atmr-tablegrid__cell--header').filter(has_text='Сумма').first.locator('.atmr-tablegrid__sorting__button')
        hdr.click(); hdr.click(); pg.mouse.move(700, 60); pg.wait_for_timeout(300)
        save(from_png(pg.screenshot()), 'crm-purple-dark')
        pg.context.close()
    if want('crm-drawer'):  # card of an organization in a full-height Drawer
        pg = crm_page(sh, LIGHT)
        pg.locator('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)[data-table-cell-name="name"]').nth(2).click(); pg.wait_for_timeout(900)
        save(from_png(pg.screenshot()), 'crm-drawer')
        pg.context.close()
    if want('crm-modal'):  # confirm Modal (purple-dark)
        pg = crm_page(sh, PDARK)
        pg.locator(CHECKS).nth(1).click(); pg.locator(CHECKS).nth(2).click(); pg.wait_for_timeout(300)
        pg.locator('.atmr-tablegrid__actionbar').get_by_text('Удалить', exact=True).click(); pg.wait_for_timeout(800)
        save(from_png(pg.screenshot()), 'crm-modal')
        pg.context.close()
    if want('crm-filters'):  # Multiselect with chips + Select open
        pg = crm_page(sh, LIGHT)
        pg.locator('[data-testid=filters] input').nth(2).click(); pg.wait_for_timeout(300)
        for city in ('Казань', 'Самара'):
            pg.locator(OPTION).filter(has_text=city).first.click(); pg.wait_for_timeout(200)
        pg.wait_for_timeout(400)
        clip = {'x': 256, 'y': 190, 'width': 1244, 'height': 400}
        save(from_png(pg.screenshot(clip=clip)), 'crm-filters')
        pg.context.close()
    if want('crm-themes'):  # the same screen in the four themes: 2x2 thumbnails
        thumbs = []
        for t in (LIGHT, DARK, PLIGHT, PDARK):
            pg = crm_page(sh, t, 1500, 920)
            img = from_png(pg.screenshot())
            thumbs.append(img.resize((690, round(920 * 690 / 1500)), Image.LANCZOS))
            pg.context.close()
        save(grid(thumbs, 2, gap=6, pad=0, bg=(200, 204, 214)), 'crm-themes')


# ------------------------------------------------------------------------------------------------- gallery + ext
def make_pages(sh: Shooter, names):
    want = lambda n: not names or n in names
    if want('gallery-tablegrid-light'):
        pg = sh.page(1400, 900)
        pg.goto(f'{BASE}/gallery?q=tablegrid&theme={LIGHT}&view=both&cols=1&zoom=1&filter=pass', wait_until='networkidle')
        sh.ready(pg, 2500)
        save(from_png(pg.screenshot()), 'gallery-tablegrid-light')
        pg.context.close()
    if want('gallery-table-purple-dark'):
        pg = sh.page(1400, 900)
        pg.goto(f'{BASE}/gallery?mode=table&theme={PDARK}', wait_until='networkidle')
        sh.ready(pg, 2000)
        save(from_png(pg.screenshot()), 'gallery-table-purple-dark')
        pg.context.close()
    if want('ext-page'):
        pg = sh.page(1280, 900)
        pg.goto(f'{BASE}/ext?theme={LIGHT}', wait_until='networkidle')
        sh.ready(pg, 1200)
        full = from_png(pg.screenshot(full_page=True))
        save(full.crop((0, 0, full.width, min(full.height, 1500))), 'ext-page')  # the top of the long demo page
        pg.context.close()


# ------------------------------------------------------------------------------------------------- main
GROUPS = {
    'crm': ['crm-light', 'crm-purple-dark', 'crm-drawer', 'crm-modal', 'crm-filters', 'crm-themes'],
    'components': list(COMPONENTS) + ['components-sheet'],
    'themes': ['themes-buttons'],
    'pages': ['gallery-tablegrid-light', 'gallery-table-purple-dark', 'ext-page'],
}


def ensure_servers():
    subprocess.run(['node', 'tools/up.mjs'], cwd=ROOT, check=False, shell=sys.platform == 'win32')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--only', default='', help='comma separated groups or file names (without .png)')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--no-servers', action='store_true', help='do not run node tools/up.mjs')
    a = ap.parse_args()
    if a.list:
        for g, files in GROUPS.items():
            print(g + ':', ', '.join(files))
        return
    picked = {x for x in a.only.split(',') if x}
    names = set()
    for x in picked:
        names |= set(GROUPS.get(x, [x]))
    if not a.no_servers:
        ensure_servers()
    with sync_playwright() as pw:
        sh = Shooter(pw)
        try:
            do = lambda group: not names or bool(names & set(GROUPS[group]))
            if do('crm'):
                print('crm:'); make_crm(sh, names)
            made = {}
            if do('components'):
                print('components:')
                made = make_components(sh, {n for n in names if n in COMPONENTS} if names else None)
                if not names or 'components-sheet' in names:
                    make_sheet(made, sh)
            if do('themes'):
                print('themes:'); make_themes(sh)
            if do('pages'):
                print('pages:'); make_pages(sh, names)
        finally:
            sh.close()
    total = sum(p.stat().st_size for p in OUT.glob('*.png'))
    print(f'docs/img: {len(list(OUT.glob("*.png")))} files, {total / 1024 / 1024:.2f} MB')
    if FAILED:
        print('FAILED:', ', '.join(FAILED))
        sys.exit(1)


if __name__ == '__main__':
    main()
