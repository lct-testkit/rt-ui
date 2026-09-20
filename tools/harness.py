"""Shared capture logic for the reference Storybook mirror and our Svelte playground.

Both sides get identical treatment: fixed clock/timezone/locale, seeded Math.random, viewport,
animation freeze after the page has settled, and the same interaction script -> comparable artefacts.
"""
import fnmatch, json, pathlib, asyncio

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools'
REF_DIR = ROOT / 'design' / 'reference'
MIRROR_BASE = 'http://127.0.0.1:6006/gen2/react-storybook'
OURS_BASE = 'http://127.0.0.1:5180'
CANON_JS = (TOOLS / 'canon.js').read_text(encoding='utf-8')
DEFAULT_VIEWPORT = (1280, 800)
MAX_FULLPAGE = 3000

INIT_SCRIPT = """
(() => {
  const FIXED = Date.UTC(2026, 2, 15, 9, 0, 0);
  const RD = Date;
  class FD extends RD {
    constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
    static now() { return FIXED; }
  }
  window.Date = FD;
  let s = 123456789;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
})();
"""

FREEZE_CSS = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}"

_IA = ("button:not([disabled]), a[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), "
       "textarea:not([disabled]), [role=button]:not([aria-disabled=true]), [role=tab], [role=switch], "
       "[role=checkbox], [role=radio], [role=combobox], [role=menuitem], [tabindex]:not([tabindex='-1'])")
INTERACTIVE = f"#storybook-root :is({_IA}) >> visible=true"

# states every story gets for free (same actions on both sides)
AUTO_STATES = [
    {'name': 'tab1', 'auto': True, 'actions': [['press', 'Tab']]},
    {'name': 'hover1', 'auto': True, 'actions': [['hover', INTERACTIVE + ' >> nth=0']]},
    {'name': 'click1', 'auto': True, 'actions': [['click', INTERACTIVE + ' >> nth=0'], ['wait', 350]]},
]


def load_index():
    idx = json.loads((ROOT / '_mirror/gen2/react-storybook/index.json').read_text(encoding='utf-8'))
    return {k: v for k, v in idx['entries'].items() if v['type'] == 'story'}


def load_layout(story_id):
    p = REF_DIR / story_id / 'layout.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def story_states(story_id):
    """auto states + optional hand-written ones from tools/interactions/<story-id>.json or <component>.json"""
    states = list(AUTO_STATES)
    d = TOOLS / 'interactions'
    for name in (story_id, story_id.split('--')[0]):
        f = d / f'{name}.json'
        if f.exists():
            states += json.loads(f.read_text(encoding='utf-8')).get('states', [])
    seen, out = set(), []
    for s in states:
        if s['name'] in seen: continue
        seen.add(s['name']); out.append(s)
    return out


def _extra_qs(story_id):
    """Stories that read Storybook `globals` (the design-token pages pick their theme file from cssVariables) need the param on BOTH sides."""
    return 'globals=cssVariables:Rostelecom+Light+Theme' if story_id.startswith('design-tokens') else ''


def ref_url(story_id):
    e = _extra_qs(story_id)
    return f'{MIRROR_BASE}/iframe.html?id={story_id}&viewMode=story' + (f'&{e}' if e else '')


def our_url(story_id, theme=None):
    qs = ([f'theme={theme}'] if theme else []) + ([_extra_qs(story_id)] if _extra_qs(story_id) else [])
    return f'{OURS_BASE}/story/{story_id}' + ('?' + '&'.join(qs) if qs else '')


async def wait_ready(page, kind):
    if kind == 'ref':
        await page.wait_for_function(
            "() => document.body.classList.contains('sb-show-main') || document.body.classList.contains('sb-show-errordisplay')",
            timeout=30000)
    else:
        await page.wait_for_function('() => window.__rtReady === true', timeout=30000)
    await page.evaluate('() => document.fonts.ready')
    await page.wait_for_timeout(450)
    await page.add_style_tag(content=FREEZE_CSS)
    await page.wait_for_timeout(60)


async def run_actions(page, actions):
    for act in actions:
        op = act[0]
        if op == 'hover': await page.hover(act[1], timeout=4000)
        elif op == 'click': await page.click(act[1], timeout=4000, no_wait_after=True)
        elif op == 'dblclick': await page.dblclick(act[1], timeout=4000)
        elif op == 'focus': await page.focus(act[1], timeout=4000)
        elif op == 'type': await page.type(act[1], act[2], delay=10)
        elif op == 'fill': await page.fill(act[1], act[2])
        elif op == 'press': await page.keyboard.press(act[1])
        elif op == 'mouse': await page.mouse.move(act[1], act[2])
        elif op == 'wait': await page.wait_for_timeout(act[1])
        elif op == 'scroll': await page.evaluate("([s,dx,dy]) => document.querySelector(s).scrollBy(dx,dy)", [act[1], act[2], act[3]])
        else: raise ValueError(f'unknown action {op}')
        await page.wait_for_timeout(40)


async def snap(page, states_dir_name='default'):
    """screenshot + canonical DOM of the current page state"""
    h = await page.evaluate('() => document.documentElement.scrollHeight')
    full = h <= MAX_FULLPAGE
    png = await page.screenshot(full_page=full)
    canon = await page.evaluate(CANON_JS)
    return {'png': png, 'canon': canon}


async def capture(browser, kind, story_id, sem, theme=None, only_states=None):
    """Load a story on one side ('ref' or 'ours') and capture default + all interaction states.
    Returns {state_name: {png, canon} | {error}} plus '_meta'."""
    layout = load_layout(story_id)
    vw, vh = layout.get('viewport', DEFAULT_VIEWPORT)
    result = {}
    async with sem:
        ctx = await browser.new_context(viewport={'width': vw, 'height': vh}, locale='ru-RU', timezone_id='Europe/Moscow', device_scale_factor=1)
        await ctx.add_init_script(INIT_SCRIPT)
        try:
            page = await ctx.new_page()
            logs = []
            page.on('pageerror', lambda e: logs.append('pageerror: ' + str(e)[:400]))
            page.on('console', lambda m: logs.append(f'{m.type}: {m.text[:300]}') if m.type == 'error' else None)
            url = ref_url(story_id) if kind == 'ref' else our_url(story_id, theme)
            fixed = [('default', [], False)] + [(s['name'], s['actions'], s.get('auto', False)) for s in story_states(story_id)]
            for name, actions, auto in fixed:
                if only_states and not any(fnmatch.fnmatchcase(name, pat) for pat in only_states):   # names or glob patterns ("*open*")
                    continue
                try:
                    await page.goto(url, wait_until='load')
                    await wait_ready(page, kind)
                    if theme and kind == 'ref':
                        # the storybook toolbar switches themes by swapping the Theme_root_* class on <body>
                        await page.evaluate("(t) => { document.body.className = document.body.className.replace(/Theme_root_\w+/, 'Theme_root_' + t); }", theme)
                        await page.wait_for_timeout(150)
                    if name == 'default':
                        err = await page.evaluate("() => document.body.classList.contains('sb-show-errordisplay') ? (document.querySelector('.sb-errordisplay pre')?.textContent||'error display').slice(0,600) : ''") if kind == 'ref' else ''
                        if err: result['_error'] = err
                    if auto and await page.locator(INTERACTIVE).count() == 0:
                        result[name] = {'skipped': 'no interactive element'}
                        continue
                    if actions: await run_actions(page, actions)
                    result[name] = await snap(page)
                except Exception as e:
                    result[name] = {'error': f'{type(e).__name__}: {str(e)[:300]}'}
            result['_logs'] = logs[:10]
        finally:
            await ctx.close()
    return result
