"""Pull the raw <style> sheets out of the mirrored Storybook page and write them into the library.

Sheet layout in the reference page (verified on components-buttons-button--main):
  0-3   themes (Theme_root_rtk_{default,purple}_{dark,light})
  4     #storybook-root layout          -> playground only
  5     all ui-kit component styles
  6     tablegrid   7 tree   8 side-menu
  9     story-only  (.description)
  10    Nunito Sans (storybook chrome)  -> dropped
  11    storybook preview css           -> playground only
  12    Rostelecom Basis @font-face
  13-14 storybook chrome                -> playground only
"""
import re, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB = ROOT / 'src/lib/styles'
PLAY = ROOT / 'src/routes'
URL = 'http://127.0.0.1:6006/gen2/react-storybook/iframe.html?id=components-buttons-button--main&viewMode=story'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(URL, wait_until='networkidle')
    pg.wait_for_timeout(800)
    sheets = pg.evaluate("() => [...document.querySelectorAll('style')].map(s => s.textContent)")
    b.close()

(LIB / 'themes').mkdir(parents=True, exist_ok=True)
(LIB / 'fonts').mkdir(parents=True, exist_ok=True)
PLAY.mkdir(parents=True, exist_ok=True)

def w(path, text):
    path.write_text(text, encoding='utf-8')
    print(f'{path.relative_to(ROOT)}  {len(text)/1024:.0f} KB')

for i in range(4):
    name = re.match(r'\s*\.Theme_root_(\w+)', sheets[i]).group(1)  # rtk_default_dark ...
    w(LIB / 'themes' / f'{name}.css', sheets[i])

w(LIB / 'components.css', sheets[5])
w(LIB / 'tablegrid.css', sheets[6])
w(LIB / 'tree.css', sheets[7])
w(LIB / 'side-menu.css', sheets[8])

# fonts: keep woff2 + woff only (eot/ttf are legacy fallbacks), point at ./fonts/
fonts = sheets[12]
fonts = re.sub(r",\s*url\('[^']*\.(?:eot|ttf)[^']*'\)\s*format\('[^']*'\)", '', fonts)
w(LIB / 'fonts.css', fonts)

w(PLAY / 'sb.css', '\n'.join(sheets[i] for i in (4, 11, 13)))
w(ROOT / 'design/_story-only-9.css', sheets[9])
