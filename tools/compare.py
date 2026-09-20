"""Compare our Svelte playground against the reference artefacts.

  python tools/compare.py --match components-buttons-button          # regex on story ids
  python tools/compare.py --ids components-badge--main --states default
  python tools/compare.py --match badge --brief                        # one line per story

Needs the playground dev server (npm run dev -> :5180). Per story/state it checks
  1. canonical DOM (tags, attrs, classes, text)          -> "dom"
  2. element boxes (getBoundingClientRect, >0.6px)       -> "box"
  3. pixels of the screenshot (exact by default)         -> "px"  (+ AA tier: <=12 edge pixels off by <=40 levels count as "AA-only"; --exact disables)
Artefacts for failures go to design/diff/<story>/<state>.{ours,diff}.png (compare with design/reference/<story>/<state>.png).
"""
import argparse, asyncio, contextlib, fnmatch, io, json, pathlib, re, sys, time
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
import harness as H

DIFF_DIR = H.ROOT / 'design' / 'diff'
BOX_TOL = 0.6
# Anti-aliasing tier (in --theme runs the limits are 48 px / 64 levels, see compare_story): DOM and boxes identical, and the only pixel differences are a handful of edge pixels that differ by a few colour levels
# (rounded-corner rasterisation is not bit-exact between two pages even in the same Chrome). Reported as "AA", never as an exact match.
AA_MAX_PX, AA_MAX_DELTA, AA_MIN_EDGE, AA_TINY = 12, 40, 24, 8   # AA_TINY: a difference of <= 8 levels is accepted anywhere (soft shadows, low-contrast borders)


THEME_MODE = False   # set by --theme


def _popper_style(v):
    """--theme only: the stored/live reference is re-themed AFTER the app measured its poppers, ours is themed from the first paint, so the
    position/width numbers popper.js wrote into `style` can differ by the theme's metrics (the pixels of the shown state still have to match)."""
    v = (v or '').replace(' ', '')
    return re.sub(r'transform:translate\([^)]*\);?|width:[\d.]+px;?', '', v) if 'position:absolute' in v else v


def label(n):
    cls = (n.get('a', {}).get('class') or '').split(' ')[0]
    return n['t'] + ('.' + cls if cls else '')


def norm_top(tree):
    """Top-level <body> nodes: the story root stays first, every other node (portals, toast host) is compared order-independently —
    React creates portals in different commits, so their insertion order is an implementation detail with no visual effect
    (stacking differences still show up in the pixel diff)."""
    idx = next((i for i, n in enumerate(tree) if isinstance(n, dict) and 'id' in n.get('a', {})), None)
    root = [tree[idx]] if idx is not None else []
    rest = [n for i, n in enumerate(tree) if i != idx]
    key = lambda n: json.dumps([n['t'], n.get('a', {}).get('class', ''), n['c'][0] if n.get('c') and isinstance(n['c'][0], str) else ''], sort_keys=True) if isinstance(n, dict) else str(n)
    return root + sorted(rest, key=key)


def diff_tree(a, b, path, out, boxes_a, boxes_b, boxout):
    """a = reference node/list, b = ours"""
    if isinstance(a, str) or isinstance(b, str):
        if a != b: out.append((path, 'text', a if isinstance(a, str) else label(a), b if isinstance(b, str) else label(b)))
        return
    if a['t'] != b['t']:
        out.append((path, 'tag', a['t'], b['t'])); return
    p = f"{path}>{label(a)}"
    aa, ba = a.get('a', {}), b.get('a', {})
    for k in sorted(set(aa) | set(ba)):
        if aa.get(k) != ba.get(k):
            if THEME_MODE and k == 'style' and _popper_style(aa.get(k)) == _popper_style(ba.get(k)):
                continue
            out.append((f'{p}@{k}', 'attr', aa.get(k), ba.get(k)))
    ca, cb = a.get('c', []), b.get('c', [])
    if len(ca) != len(cb):
        out.append((p, 'children', f'{len(ca)}: ' + ', '.join(label(x) if not isinstance(x, str) else repr(x[:20]) for x in ca[:6]),
                    f'{len(cb)}: ' + ', '.join(label(x) if not isinstance(x, str) else repr(x[:20]) for x in cb[:6])))
    ba_, bb_ = boxes_a[a['i']], boxes_b[b['i']]
    if ba_ != bb_ and (ba_ is None or bb_ is None or any(abs(x - y) > BOX_TOL for x, y in zip(ba_, bb_))):
        boxout.append((p, ba_, bb_))
    for i in range(min(len(ca), len(cb))):
        diff_tree(ca[i], cb[i], f'{p}[{i}]', out, boxes_a, boxes_b, boxout)


def diff_pixels(ref_png, our_png, tol=0):
    ra = Image.open(io.BytesIO(ref_png)).convert('RGB'); rb = Image.open(io.BytesIO(our_png)).convert('RGB')
    note = ''
    if ra.size != rb.size:
        note = f'size {ra.size} vs {rb.size}'
        w, h = min(ra.width, rb.width), min(ra.height, rb.height)
        ra, rb = ra.crop((0, 0, w, h)), rb.crop((0, 0, w, h))
    a, b = np.asarray(ra), np.asarray(rb)
    mask = (np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2) > tol) if tol else np.any(a != b, axis=2)
    n = int(mask.sum())
    box = None
    if n:
        ys, xs = np.where(mask); box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    return n, box, note, mask, rb


def aa_only(ref_png, our_png, mask, max_px=AA_MAX_PX, max_delta=AA_MAX_DELTA):
    """True when every differing pixel is a small-delta pixel on an edge (contrast with a neighbour >= AA_MIN_EDGE) and there are few of them."""
    n = int(mask.sum())
    if not n or n > max_px:
        return False, 0
    a = np.asarray(Image.open(io.BytesIO(ref_png)).convert('RGB')).astype(np.int16)
    b = np.asarray(Image.open(io.BytesIO(our_png)).convert('RGB')).astype(np.int16)
    if a.shape != b.shape:
        return False, 0
    delta = np.abs(a - b).max(axis=2)
    ys, xs = np.where(mask)
    if int(delta[mask].max()) > max_delta:
        return False, int(delta[mask].max())
    h, w = a.shape[:2]
    for y, x in zip(ys, xs):
        if delta[y, x] <= AA_TINY:
            continue
        y0, y1, x0, x1 = max(0, y - 1), min(h, y + 2), max(0, x - 1), min(w, x + 2)
        edge = max(np.abs(img[y0:y1, x0:x1] - img[y, x]).max() for img in (a, b))
        if edge < AA_MIN_EDGE:
            return False, int(delta[mask].max())
    return True, int(delta[mask].max())


def save_diff(sid, state, our_png, mask, base, root=None):
    d = (root or DIFF_DIR) / sid; d.mkdir(parents=True, exist_ok=True)
    (d / f'{state}.ours.png').write_bytes(our_png)
    img = np.asarray(base).copy()
    img[mask] = (255, 0, 60)
    Image.fromarray(img).save(d / f'{state}.diff.png')


def evaluate(rd, ref_png_bytes, ours, tol):
    """DOM + boxes + pixels of one state against one reference rendering."""
    dom, box = [], []
    rt, ot = norm_top(rd['tree']), norm_top(ours['canon']['tree'])
    for x, y in zip(rt + [''] * max(0, len(ot) - len(rt)), ot + [''] * max(0, len(rt) - len(ot))):
        if x == '' or y == '': dom.append(('root', 'children', 'missing' if x == '' else 'present', 'missing' if y == '' else 'present')); continue
        diff_tree(x, y, '', dom, rd['boxes'], ours['canon']['boxes'], box)
    if rd.get('body') != ours['canon'].get('body'):
        dom.append(('body@class', 'attr', rd.get('body'), ours['canon'].get('body')))
    n, bbox, note, mask, base = diff_pixels(ref_png_bytes, ours['png'], tol)
    ok = not dom and not box and n == 0 and not note
    return ok, dom, box, n, bbox, note, mask, base


def load_alts(ref_dir, state):
    """Recorded alternative renderings of the reference: design/reference/<id>/alts/<state>.<k>.png + .dom.json"""
    out, d = [], ref_dir / 'alts'
    if d.exists():
        for png in sorted(d.glob(f'{state}.*.png')):
            dom = png.with_suffix('.dom.json')
            if dom.exists():
                out.append((png.stem.rsplit('.', 1)[-1], png.read_bytes(), json.loads(dom.read_text(encoding='utf-8'))))
    return out


async def compare_story(browser, sem, sid, states_filter, theme, tol=0, aa_tier=True, story_sem=None):
    ref_dir = H.REF_DIR / sid
    out_root = DIFF_DIR / f'theme-{theme}' if theme else DIFF_DIR   # theme sweeps must not overwrite the default-theme results / gallery status
    if not (ref_dir / 'meta.json').exists():
        return sid, {'_status': 'NOREF'}
    only = set(states_filter) if states_filter else None
    # a story holds one slot for BOTH captures, so results stream in story by story instead of after all "ours" captures of the whole run
    async with (story_sem or contextlib.nullcontext()):
        res = await H.capture(browser, 'ours', sid, sem, theme, only)
        # --theme: the stored reference is light-only, so capture the reference live and re-themed the same way
        ref_live = await H.capture(browser, 'ref', sid, sem, theme, only) if theme else None
    report = {}
    for state, ours in res.items():
        if state.startswith('_'): continue
        if states_filter and not any(fnmatch.fnmatchcase(state, pat) for pat in states_filter): continue
        if ref_live is not None:
            rl = ref_live.get(state)
            if not rl or 'canon' not in rl:
                report[state] = {'ok': True, 'note': 'no reference for this state (skipped there)'}; continue
            ref_png_bytes, rd = rl['png'], rl['canon']
        else:
            ref_png, ref_dom = ref_dir / f'{state}.png', ref_dir / f'{state}.dom.json'
            if not ref_dom.exists():
                report[state] = {'ok': True, 'note': 'no reference for this state (skipped there)'}; continue
            ref_png_bytes, rd = ref_png.read_bytes(), json.loads(ref_dom.read_text(encoding='utf-8'))
        if 'error' in ours or 'skipped' in ours:
            report[state] = {'ok': False, 'error': ours.get('error') or 'skipped on our side but present in reference'}; continue
        ok, dom, box, n, bbox, note, mask, base = evaluate(rd, ref_png_bytes, ours, tol)
        if not ok and ref_live is None:
            # the reference itself is not always deterministic (anti-aliasing / paint history flips between a few renderings):
            # a state also passes if ours is identical to one of the reference's OWN recorded variants (tools/snapshot_alts.py)
            for alt_name, alt_png, alt_dom in load_alts(ref_dir, state):
                r = evaluate(alt_dom, alt_png, ours, tol)
                if r[0]:
                    ok, dom, box, n, bbox, note = True, [], [], 0, None, f'matches reference variant {alt_name}'
                    break
        aa = 0
        if not ok and aa_tier and not dom and not box and not note and n:
            # --theme: the reference is re-themed after load (class swap = full repaint), so rounded corners / icon circles of saturated colours
            # come out with more anti-aliasing noise than in the stored light reference; a wrong token would still change many pixels or big deltas
            is_aa, dmax = aa_only(ref_png_bytes, ours['png'], mask, *((48, 64) if theme else (AA_MAX_PX, AA_MAX_DELTA)))
            if is_aa:
                aa = n
                ok, note = True, f'AA-only: {n} px, max delta {dmax}'
        if not ok or aa: save_diff(sid, state, ours['png'], mask, base, out_root)
        report[state] = {'ok': ok, 'dom': dom[:25], 'domN': len(dom), 'box': box[:12], 'boxN': len(box), 'px': n, 'pxBox': bbox, 'note': note, 'aa': aa}
    report['_logs'] = res.get('_logs')
    # last result per story, read by the /gallery page (one file per story -> parallel runs never collide)
    try:
        st = {k: v['ok'] for k, v in report.items() if not k.startswith('_')}
        sd = out_root / 'status'; sd.mkdir(parents=True, exist_ok=True)
        aa_states = {k: v['aa'] for k, v in report.items() if not k.startswith('_') and v.get('aa')}
        (sd / f'{sid}.json').write_text(json.dumps({'ok': all(st.values()) and bool(st), 'time': time.time(), 'states': st,
            'failing': [k for k, v in st.items() if not v], 'aa': aa_states}), encoding='utf-8')
    except Exception:
        pass
    return sid, report


def show(sid, rep, brief):
    if rep.get('_status') == 'NOREF':
        print(f'NOREF  {sid}  (run tools/snapshot.py --ids {sid})'); return True
    bad = {k: v for k, v in rep.items() if not k.startswith('_') and not v['ok']}
    ok = not bad
    states = [k for k in rep if not k.startswith('_')]
    aa = [k for k in states if rep[k].get('aa')]
    print(f"{'PASS' if ok else 'FAIL'}   {sid}  ({len(states)-len(bad)}/{len(states)} states)" + (f"  [AA-only: {', '.join(aa)}]" if aa and ok else ''))
    if ok or brief: return ok
    for st, v in bad.items():
        if 'error' in v: print(f"   [{st}] ERROR {v['error']}"); continue
        print(f"   [{st}] dom={v['domN']} box={v['boxN']} px={v['px']} {v['pxBox'] or ''} {v['note']}")
        for path, kind, a, b in v['dom'][:10]:
            print(f"      dom {kind:8} {path}\n           ref: {a!r}\n           our: {b!r}")
        for path, a, b in v['box'][:5]:
            print(f"      box {path}\n           ref: {a}  our: {b}")
    if rep.get('_logs'): print('   console:', rep['_logs'][:3])
    print(f"   images: design/reference/{sid}/<state>.png  design/diff/{sid}/<state>.ours.png|diff.png")
    return ok


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids'); ap.add_argument('--match'); ap.add_argument('--states'); ap.add_argument('--theme')
    ap.add_argument('--tol', type=int, help='per-channel pixel tolerance (default 0; 3 with --theme because the reference is re-themed at runtime)'); ap.add_argument('--report'); ap.add_argument('--brief', action='store_true'); ap.add_argument('--jobs', type=int, default=4)
    ap.add_argument('--exact', action='store_true', help=f'disable the anti-aliasing tier (<= {AA_MAX_PX} edge pixels, delta <= {AA_MAX_DELTA})')
    a = ap.parse_args()
    global THEME_MODE
    THEME_MODE = bool(a.theme)
    # vite's import.meta.glob does not notice NEW story files by itself; /api/stories nudges the route only when new ones appeared
    try:
        import urllib.request
        if json.load(urllib.request.urlopen(H.OURS_BASE + '/api/stories', timeout=20)).get('nudged'): time.sleep(2.5)
    except Exception as e:
        print('warn: /api/stories not reachable (is the dev server up? node tools/up.mjs):', e)
    ids = [i for i in H.load_index() if (H.REF_DIR / i / 'meta.json').exists()]
    if a.ids: ids = [i for i in a.ids.split(',')]
    if a.match: ids = [i for i in ids if re.search(a.match, i)]
    sf = a.states.split(',') if a.states else None
    sys.stdout.reconfigure(line_buffering=True)
    sem = asyncio.Semaphore(a.jobs); t0 = time.time(); allok = True; full = {}
    story_sem = asyncio.Semaphore(a.jobs) if a.theme else None
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        tol = a.tol if a.tol is not None else (3 if a.theme else 0)
        tasks = [asyncio.create_task(compare_story(browser, sem, i, sf, a.theme, tol, not a.exact, story_sem)) for i in ids]
        for fut in asyncio.as_completed(tasks):
            sid, rep = await fut
            full[sid] = rep
            allok &= show(sid, rep, a.brief)
        await browser.close()
    if a.report:   # optional machine-readable output (parallel runs must not share one file)
        pathlib.Path(a.report).parent.mkdir(parents=True, exist_ok=True)
        pathlib.Path(a.report).write_text(json.dumps(full, ensure_ascii=False, indent=1, default=str), encoding='utf-8')
    npass = sum(1 for r in full.values() if all(v['ok'] for k, v in r.items() if not k.startswith('_')) and r.get('_status') != 'NOREF')
    print(f'--- {npass}/{len(ids)} stories pass  ({time.time()-t0:.0f}s)')
    sys.exit(0 if allok else 1)

if __name__ == '__main__':
    asyncio.run(main())
