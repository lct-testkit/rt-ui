"""Record the reference's OWN alternative renderings of flaky states, so tools/compare.py can accept a state when ours equals any of them.

The original React Storybook is not fully deterministic: after clicks / hovers the anti-aliasing of rounded corners, shadows and icons is
sometimes painted in one of a few different ways (1-4 colour levels), depending on paint history and machine load. Instead of dropping such
states we capture the reference several times and keep every DISTINCT rendering as a variant:

  python tools/snapshot_alts.py --ids patterns-recipes-accordion--default-open --states default,tab1,hover1 --runs 8
  python tools/snapshot_alts.py --failing                 # every state that currently fails according to design/diff/status/*.json
  python tools/snapshot_alts.py --failing --runs 12 --jobs 2

Variants are written to design/reference/<id>/alts/<state>.<k>.png (+ .dom.json); the primary reference (<state>.png) is never modified.
A state passes in compare.py if it matches the primary OR any variant exactly (DOM + boxes + pixels, tolerance 0) — i.e. ours must reproduce a
rendering that the original itself produces.
"""
import argparse, asyncio, glob, hashlib, json, os, sys, time
from playwright.async_api import async_playwright
import harness as H


def sha(b):
    return hashlib.sha1(b).hexdigest()


def failing_states():
    out = {}
    for f in glob.glob(str(H.ROOT / 'design' / 'diff' / 'status' / '*.json')):
        try:
            s = json.load(open(f, encoding='utf-8'))
        except (OSError, ValueError):
            continue
        if not s.get('ok'):
            out[os.path.basename(f)[:-5]] = [k for k, v in s.get('states', {}).items() if not v]
    return out


async def one(browser, sem, sid, states, runs):
    ref_dir = H.REF_DIR / sid
    alts = ref_dir / 'alts'
    seen = {}
    for st in states:                                   # known renderings: primary + already recorded variants
        p = ref_dir / f'{st}.png'
        seen[st] = {sha(p.read_bytes())} if p.exists() else set()
        if alts.exists():
            for a in alts.glob(f'{st}.*.png'):
                seen[st].add(sha(a.read_bytes()))
    added = {st: 0 for st in states}
    for _ in range(runs):
        res = await H.capture(browser, 'ref', sid, sem, only_states=set(states))
        for st in states:
            r = res.get(st)
            if not r or 'png' not in r:
                continue
            h = sha(r['png'])
            if h in seen[st]:
                continue
            seen[st].add(h)
            alts.mkdir(parents=True, exist_ok=True)
            k = len(list(alts.glob(f'{st}.*.png'))) + 1
            (alts / f'{st}.{k}.png').write_bytes(r['png'])
            (alts / f'{st}.{k}.dom.json').write_text(json.dumps(r['canon'], ensure_ascii=False), encoding='utf-8')
            added[st] += 1
    return sid, {st: (len(seen[st]), added[st]) for st in states}


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids'); ap.add_argument('--states'); ap.add_argument('--failing', action='store_true')
    ap.add_argument('--runs', type=int, default=8); ap.add_argument('--jobs', type=int, default=2)
    a = ap.parse_args()
    plan = {}
    if a.failing:
        plan = failing_states()
    if a.ids:
        for i in a.ids.split(','):
            plan[i] = a.states.split(',') if a.states else plan.get(i) or ['default']
    plan = {k: v for k, v in plan.items() if v}
    if not plan:
        print('nothing to do'); return
    t0 = time.time(); sem = asyncio.Semaphore(a.jobs)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for fut in asyncio.as_completed([asyncio.create_task(one(browser, sem, sid, sts, a.runs)) for sid, sts in plan.items()]):
            sid, info = await fut
            print(sid, {st: f'{n} renderings (+{add} new)' for st, (n, add) in info.items()}, flush=True)
        await browser.close()
    print(f'done in {time.time() - t0:.0f}s')

if __name__ == '__main__':
    asyncio.run(main())
