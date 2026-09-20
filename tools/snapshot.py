"""Build reference artefacts from the local Storybook mirror.

  python tools/snapshot.py                     # every story (skips ones already done)
  python tools/snapshot.py --match button      # story ids matching regex
  python tools/snapshot.py --ids a,b --force
Writes design/reference/<story-id>/{default,<state>}.png|dom.json, meta.json, layout.json
and design/reference-css/<sha>.css (every distinct <style> seen).
"""
import argparse, asyncio, hashlib, json, re, sys, time
from playwright.async_api import async_playwright
import harness as H

META_JS = """
async (id) => {
  const prev = window.__STORYBOOK_PREVIEW__;
  const s = await prev.storyStoreValue.loadStory({ storyId: id });
  const seen = new WeakSet();
  const safe = (v, d = 0) => {
    if (v == null) return v;
    if (typeof v === 'function') return '[fn] ' + v.toString().slice(0, 6000);
    if (typeof v === 'string') return v.length > 12000 ? v.slice(0, 12000) + '…' : v;
    if (typeof v !== 'object') return v;
    if (seen.has(v) || d > 7) return '[circular/deep]';
    if (v.$$typeof) return '[react element]';
    seen.add(v);
    if (Array.isArray(v)) return v.slice(0, 60).map((x) => safe(x, d + 1));
    const o = {};
    for (const k of Object.keys(v).slice(0, 80)) { try { o[k] = safe(v[k], d + 1); } catch (e) { o[k] = '[err]'; } }
    return o;
  };
  const params = { ...s.parameters };
  delete params.docs?.page;
  return {
    id: s.id, title: s.title, name: s.name, componentId: s.componentId, tags: s.tags,
    component: s.component && (s.component.displayName || s.component.name),
    initialArgs: safe(s.initialArgs), argTypes: safe(s.argTypes), parameters: safe(params),
    storyFn: s.originalStoryFn ? s.originalStoryFn.toString().slice(0, 12000) : null,
    styles: [...document.querySelectorAll('style')].map((x) => x.textContent),
  };
}
"""


async def do_story(browser, sem, sid, force):
    out = H.REF_DIR / sid
    if not force and (out / 'meta.json').exists():
        return sid, 'skip'
    res = await H.capture(browser, 'ref', sid, sem)
    out.mkdir(parents=True, exist_ok=True)
    states = {}
    for k, v in res.items():
        if k.startswith('_'): continue
        if 'error' in v or 'skipped' in v:
            states[k] = v; continue
        (out / f'{k}.png').write_bytes(v['png'])
        (out / f'{k}.dom.json').write_text(json.dumps(v['canon'], ensure_ascii=False), encoding='utf-8')
        states[k] = {'nodes': v['canon']['count']}
    d = res.get('default', {})
    body = d.get('canon', {}).get('body', '') if 'canon' in d else ''
    vp_over = {}
    for vf in [H.TOOLS / 'viewports.json', *sorted((H.TOOLS / 'viewports.d').glob('*.json'))]:
        if vf.exists(): vp_over.update(json.loads(vf.read_text(encoding='utf-8')))
    layout = {'bodyClass': body}
    if sid in vp_over: layout['viewport'] = vp_over[sid]
    (out / 'layout.json').write_text(json.dumps(layout), encoding='utf-8')

    # metadata (separate page load; Storybook store is only reachable there)
    async with sem:
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800}, locale='ru-RU', timezone_id='Europe/Moscow')
        try:
            page = await ctx.new_page()
            await page.goto(H.ref_url(sid), wait_until='load')
            await H.wait_ready(page, 'ref')
            meta = await page.evaluate(META_JS, sid)
        except Exception as e:
            meta = {'id': sid, 'metaError': f'{type(e).__name__}: {str(e)[:300]}', 'styles': []}
        finally:
            await ctx.close()
    css_dir = H.ROOT / 'design' / 'reference-css'
    css_dir.mkdir(parents=True, exist_ok=True)
    shas = []
    for css in [c for c in meta.pop('styles', []) if 'animation:none!important' not in c]:
        sha = hashlib.sha1(css.encode('utf-8')).hexdigest()[:10]
        shas.append({'sha': sha, 'len': len(css), 'head': re.sub(r'\s+', ' ', css.strip()[:80])})
        f = css_dir / f'{sha}.css'
        if not f.exists(): f.write_text(css, encoding='utf-8')
    meta['styleSheets'] = shas
    meta['states'] = states
    meta['renderError'] = res.get('_error')
    meta['consoleErrors'] = res.get('_logs')
    (out / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
    return sid, 'error' if res.get('_error') else 'ok'


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids'); ap.add_argument('--match'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--jobs', type=int, default=5)
    a = ap.parse_args()
    stories = H.load_index()
    ids = list(stories)
    if a.ids: ids = [i for i in a.ids.split(',') if i in stories]
    if a.match: ids = [i for i in ids if re.search(a.match, i)]
    print(f'{len(ids)} stories'); t0 = time.time()
    sem = asyncio.Semaphore(a.jobs)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        tasks = [asyncio.create_task(do_story(browser, sem, i, a.force)) for i in ids]
        done = 0; counts = {}
        for fut in asyncio.as_completed(tasks):
            sid, st = await fut
            done += 1; counts[st] = counts.get(st, 0) + 1
            if st in ('error',) or done % 20 == 0:
                print(f'[{done}/{len(ids)}] {st:5} {sid}  ({time.time()-t0:.0f}s)', flush=True)
        await browser.close()
    print('done', counts, f'{time.time()-t0:.0f}s')

if __name__ == '__main__':
    asyncio.run(main())
