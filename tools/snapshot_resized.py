"""tools/snapshot.py with ONE harness hook: after the page is ready, dispatch a window `resize` event.

WHY: a CLOSED Select / DropdownMenu keeps the inline `style` / `data-popper-placement` of the Popper instance that was created shortly after mount.
React creates it one commit after the first render, i.e. usually before the web font has re-flowed the page, so the geometry inside that style
(`transform: translate(841px, -244px); width: 160px`) is randomly the one of the fallback-font layout or of the final layout (it depends on how fast the
font arrives: cold first load = final, later loads = mostly fallback, CPU load changes it). Closed poppers keep Popper's default scroll / resize listeners,
so a `resize` event makes them re-measure: the reference then always shows the final layout (the Svelte playground shows it too).

  python tools/snapshot_resized.py --ids tablegrid-tablegrid-filters--filters --force --jobs 1     (same arguments as tools/snapshot.py)

A permanent fix would be the same `resize` dispatch in `harness.wait_ready()` (both sides), then snapshot.py / compare.py need no wrapper.
"""
import pathlib, runpy, sys

TOOLS = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))
import harness as H

_orig = H.wait_ready


async def wait_ready(page, kind):
    await _orig(page, kind)
    await page.evaluate("() => window.dispatchEvent(new Event('resize'))")
    await page.wait_for_timeout(150)


H.wait_ready = wait_ready
sys.argv = [str(TOOLS / 'snapshot.py')] + sys.argv[1:]
runpy.run_path(str(TOOLS / 'snapshot.py'), run_name='__main__')
