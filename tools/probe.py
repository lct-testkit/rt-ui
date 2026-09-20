import sys, json
from playwright.sync_api import sync_playwright
story = sys.argv[1] if len(sys.argv) > 1 else 'components-buttons-button--main'
url = f'http://127.0.0.1:6006/gen2/react-storybook/iframe.html?id={story}&viewMode=story'
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1000, 'height': 700})
    logs, bad = [], []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text[:200]}') if m.type in ('error','warning') else None)
    pg.on('response', lambda r: bad.append((r.status, r.url)) if r.status >= 400 else None)
    pg.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)[:300]))
    pg.goto(url, wait_until='networkidle')
    pg.wait_for_timeout(1500)
    root = pg.evaluate("document.querySelector('#storybook-root')?.innerHTML.length ?? -1")
    print('root html len', root, 'body class', pg.evaluate('document.body.className'))
    print('bad responses', bad[:15])
    print('logs', logs[:10])
    pg.screenshot(path='../design/_probe.png')
    b.close()
