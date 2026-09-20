"""Runtime benchmark of rt-ui: Playwright (Chromium) + CDP over the PRODUCTION builds made by `node tools/bench/size.mjs`.

  python tools/bench/runtime.py                       # full run: N=15 runs after 3 warm-ups, CPU x1 and x4 passes (long!)
  python tools/bench/runtime.py --runs 1 --warmup 0 --throttle 0 --rows 100 --only scenarios,table    # smoke test
  python tools/bench/runtime.py --only leak,coverage --leak-cycles 200

Sections (--only, comma separated):
  scenarios  page load of S0..S5: first render, DOM nodes, JS heap after GC, Script/RecalcStyle/Layout/Task durations, CSS rule count
  table      S3 with 100/1000/10000 rows x mode all/virtual/paged: initial render + scroll fps + sort / select-all / expand latency
  mount      mounting 1000 Buttons / 500 Inputs / 200 Selects: cold mount, re-mount, unmount, mount + paint
  leak       200 open/close cycles of Popover / Select / Modal: heap, DOM nodes and listeners after GC   (CPU x1 pass only)
  coverage   CSS rule usage of S2 and S3 after load and after scripted interactions                        (CPU x1 pass only)

Every metric is a median of N runs (min / max / p25 / p75 are saved too). A "run" = a fresh browser context + page load, so
nothing is cached between runs (the first visit of the app).  The static server serves the builds uncompressed from localhost.
Results -> tools/bench/results/runtime.json (env block first). Run it on an idle machine: other processes distort the numbers.
"""
import argparse
import functools
import http.server
import importlib.metadata
import json
import os
import platform
import socketserver
import statistics
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

BENCH = Path(__file__).resolve().parent
REPO = BENCH.parent.parent
DIST = BENCH / 'app' / 'dist'
RESULTS = BENCH / 'results'
VIEWPORT = {'width': 1280, 'height': 800}
FRAME_MS = 16.7          # a frame longer than this is "slow" ...
FRAME_JITTER_MS = 1.0    # ... with 1 ms tolerance for timer jitter (a dropped 60 Hz frame is >= 33 ms anyway)
DOUBLE_RAF = "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
SCENARIO_IDS = ['s0', 's0r', 's1', 's1b', 's1n', 's2', 's3', 's4', 's5']
MOUNT_CASES = [('button', 1000), ('input', 500), ('select', 200)]
LEAK_KINDS = ['control', 'popover', 'select', 'modal']  # 'control' = a plain toggled block: the noise floor of the harness


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ------------------------------------------------------------------------------------------------ static server
class _Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript',
                      '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml',
                      '': 'application/octet-stream'}

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def start_server():
    class Srv(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    srv = Srv(('127.0.0.1', 0), functools.partial(_Handler, directory=str(DIST)))  # port 0 = a free port
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


# ------------------------------------------------------------------------------------------------ statistics
def stat(values):
    v = sorted(x for x in values if x is not None)
    if not v:
        return None
    q = statistics.quantiles(v, n=4, method='inclusive') if len(v) >= 2 else [v[0]] * 3
    return {'median': round(statistics.median(v), 3), 'min': round(v[0], 3), 'max': round(v[-1], 3),
            'p25': round(q[0], 3), 'p75': round(q[2], 3), 'n': len(v)}


def aggregate(runs):
    """[{metric: value}, ...] -> {metric: stat}"""
    keys = []
    for r in runs:
        for k in r:
            if k not in keys:
                keys.append(k)
    out = {}
    for k in keys:
        vals = [r.get(k) for r in runs if isinstance(r.get(k), (int, float))]
        if vals:
            out[k] = stat(vals)
    return out


# ------------------------------------------------------------------------------------------------ machine info
def cpu_name():
    try:
        if sys.platform == 'win32':
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'HARDWARE\DESCRIPTION\System\CentralProcessor\0') as k:
                return winreg.QueryValueEx(k, 'ProcessorNameString')[0].strip()
        if sys.platform == 'darwin':
            return subprocess.check_output(['sysctl', '-n', 'machdep.cpu.brand_string'], text=True).strip()
        for line in open('/proc/cpuinfo', encoding='utf-8'):
            if line.lower().startswith('model name'):
                return line.split(':', 1)[1].strip()
    except Exception:
        pass
    return platform.processor() or 'unknown'


def ram_gb():
    try:
        if sys.platform == 'win32':
            import ctypes

            class MS(ctypes.Structure):
                _fields_ = [('dwLength', ctypes.c_ulong), ('dwMemoryLoad', ctypes.c_ulong), ('ullTotalPhys', ctypes.c_ulonglong),
                            ('ullAvailPhys', ctypes.c_ulonglong), ('ullTotalPageFile', ctypes.c_ulonglong),
                            ('ullAvailPageFile', ctypes.c_ulonglong), ('ullTotalVirtual', ctypes.c_ulonglong),
                            ('ullAvailVirtual', ctypes.c_ulonglong), ('sullAvailExtendedVirtual', ctypes.c_ulonglong)]
            s = MS()
            s.dwLength = ctypes.sizeof(MS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(s))
            return round(s.ullTotalPhys / 2 ** 30, 1)
        if sys.platform == 'darwin':
            return round(int(subprocess.check_output(['sysctl', '-n', 'hw.memsize'], text=True)) / 2 ** 30, 1)
        for line in open('/proc/meminfo', encoding='utf-8'):
            if line.startswith('MemTotal'):
                return round(int(line.split()[1]) / 2 ** 20, 1)
    except Exception:
        pass
    return None


def pkg_version(name):
    try:
        return json.loads((REPO / 'node_modules' / name / 'package.json').read_text(encoding='utf-8'))['version']
    except Exception:
        return None


def node_version():
    try:
        return subprocess.check_output(['node', '-v'], text=True, shell=(sys.platform == 'win32')).strip()
    except Exception:
        return None


def env_info(browser, settings):
    react = None
    try:
        react = json.loads((BENCH / 'node_modules' / 'react' / 'package.json').read_text(encoding='utf-8'))['version']
    except Exception:
        pass
    return {
        'date': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'cpu': cpu_name(), 'threads': os.cpu_count(), 'ram_gb': ram_gb(),
        'os': f'{platform.system()} {platform.release()} ({platform.version()})',
        'chromium': browser.version, 'playwright': importlib.metadata.version('playwright'), 'python': platform.python_version(),
        'node': node_version(), 'vite': pkg_version('vite'), 'svelte': pkg_version('svelte'), 'react': react,
        'viewport': f'{VIEWPORT["width"]}x{VIEWPORT["height"]}', 'headless': settings['headless'],
        'note': 'production builds (Vite 8 / rolldown, oxc, Lightning CSS), served uncompressed from localhost; fresh context per run',
    }


# ------------------------------------------------------------------------------------------------ browser helpers
class Run:
    """One fresh context + page + CDP session."""

    def __init__(self, browser, cpu=1, timeout=120_000):
        self.ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
        self.ctx.set_default_timeout(timeout)
        self.page = self.ctx.new_page()
        self.cdp = self.ctx.new_cdp_session(self.page)
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)[:300]))
        self.cdp.send('Performance.enable')
        if cpu and cpu > 1:
            self.cdp.send('Emulation.setCPUThrottlingRate', {'rate': cpu})

    def goto(self, url, ready=True):
        self.page.goto(url, wait_until='load')
        if ready:
            self.page.wait_for_function("performance.getEntriesByName('bench-ready').length > 0")
            self.page.evaluate(DOUBLE_RAF)

    def gc(self):
        try:
            self.cdp.send('HeapProfiler.enable')
        except Exception:
            pass
        for _ in range(3):
            self.cdp.send('HeapProfiler.collectGarbage')

    def heap(self):
        """after a forced GC: (Runtime.getHeapUsage used bytes, performance.memory.usedJSHeapSize)"""
        self.gc()
        used = None
        try:
            used = self.cdp.send('Runtime.getHeapUsage')['usedSize']
        except Exception:
            pass
        pm = self.page.evaluate('performance.memory ? performance.memory.usedJSHeapSize : null')
        return used, pm

    def counters(self):
        c = self.cdp.send('Memory.getDOMCounters')
        return {'dom_nodes_all': c['nodes'], 'listeners': c['jsEventListeners'], 'documents': c['documents']}

    def cdp_metrics(self):
        m = {x['name']: x['value'] for x in self.cdp.send('Performance.getMetrics')['metrics']}
        return {'script_ms': m['ScriptDuration'] * 1000, 'style_ms': m['RecalcStyleDuration'] * 1000, 'layout_ms': m['LayoutDuration'] * 1000,
                'task_ms': m['TaskDuration'] * 1000, 'style_count': m.get('RecalcStyleCount'), 'layout_count': m.get('LayoutCount')}

    def close(self):
        try:
            self.ctx.close()
        except Exception:
            pass


PAGE_METRICS_JS = """() => {
  const t = n => { const e = performance.getEntriesByName(n)[0]; return e ? e.startTime : null; };
  const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
  const nav = performance.getEntriesByType('navigation')[0];
  const count = rules => { let n = 0; for (const r of rules) { n++; if (r.cssRules) n += count(r.cssRules); } return n; };
  let cssRules = 0, sheets = 0;
  for (const s of document.styleSheets) { try { cssRules += count(s.cssRules); sheets++; } catch (e) {} }
  const start = t('bench-start'), ready = t('bench-ready');
  return { ready_ms: ready, mount_ms: ready != null && start != null ? ready - start : null, fcp_ms: fcp ? fcp.startTime : null,
           dcl_ms: nav ? nav.domContentLoadedEventEnd : null, load_ms: nav ? nav.loadEventEnd : null,
           dom_elements: document.getElementsByTagName('*').length, css_rules: cssRules, css_sheets: sheets };
}"""


def measure_load(run, url):
    """Load a scenario page and collect the first-render metrics. Returns a flat dict."""
    run.goto(url)
    out = run.page.evaluate(PAGE_METRICS_JS)
    out.update(run.cdp_metrics())
    out.update(run.counters())
    used, pm = run.heap()
    out['heap_kb'] = used / 1024 if used is not None else None
    out['perf_memory_kb'] = pm / 1024 if pm is not None else None
    return out


def cpu_calibration(browser):
    """A fixed JS loop: shows machine speed / background load, so two runs can be compared."""
    r = Run(browser)
    try:
        r.page.goto('about:blank')
        vals = r.page.evaluate("""() => { const o = []; for (let k = 0; k < 7; k++) { const t = performance.now(); let x = 0;
            for (let i = 0; i < 3e7; i++) x += Math.sqrt(i); o.push(performance.now() - t); } return o; }""")
        return round(statistics.median(vals), 1)
    finally:
        r.close()


# ------------------------------------------------------------------------------------------------ section: scenarios
def do_scenarios(browser, base, cfg, cpu):
    res = {}
    for sid in cfg['scenarios']:
        if not (DIST / sid / 'index.html').exists():
            res[sid] = {'error': 'no build: run npm run bench:size'}
            continue
        runs = []
        for i in range(cfg['warmup'] + cfg['runs']):
            r = Run(browser, cpu)
            try:
                m = measure_load(r, f'{base}/{sid}/index.html')
                if r.errors:
                    m['page_errors'] = len(r.errors)
                if i >= cfg['warmup']:
                    runs.append(m)
            except Exception as e:
                log(f'  ! {sid} run {i}: {e}')
                res.setdefault(sid, {})['error'] = str(e)[:300]
            finally:
                r.close()
        if runs:
            res[sid] = {**res.get(sid, {}), **aggregate(runs)}
        log(f'  [{cfg["cpu_label"]}] {sid}: ready {res.get(sid, {}).get("ready_ms", {}).get("median")} ms, '
            f'{res.get(sid, {}).get("dom_elements", {}).get("median")} elements')
    return res


# ------------------------------------------------------------------------------------------------ section: table
SCROLL_JS = """async ({ ms, pxPerMs }) => {
  const layout = document.querySelector('.atmr-tablegrid__layout');
  // the scrolling element: the layout itself, or (virtual mode) the VList inside it - the one with the largest scroll range
  let best = layout, bestRange = layout.scrollHeight - layout.clientHeight;
  for (const el of layout.querySelectorAll('div')) { const r = el.scrollHeight - el.clientHeight; if (r > bestRange + 1) { best = el; bestRange = r; } }
  if (bestRange < 10) return { error: 'nothing to scroll', range: bestRange };
  const iv = []; let last = 0, t0 = 0;
  await new Promise(res => {
    const step = now => {
      if (last) iv.push(now - last);
      last = now;
      const p = ((now - t0) * pxPerMs) % (2 * bestRange);
      best.scrollTop = p < bestRange ? p : 2 * bestRange - p;   // ping-pong over the whole range
      if (now - t0 < ms) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(now => { t0 = now; requestAnimationFrame(step); });
  });
  best.scrollTop = 0;
  return { iv, range: bestRange };
}"""

VISIBLE_CELLS_JS = """() => {
  // body cells (of the first 400) that are really painted at their centre: clipped / zero-height containers make elementFromPoint miss them
  const cells = document.querySelectorAll('.atmr-tablegrid__cell:not(.atmr-tablegrid__cell--header)');
  let n = 0;
  for (let i = 0; i < Math.min(cells.length, 400); i++) {
    const b = cells[i].getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) continue;
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
    const e = document.elementFromPoint(x, y);
    if (e && cells[i].contains(e)) n++;
  }
  return n;
}"""

LATENCY_JS = """async (sel) => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const el = document.querySelector(sel);
  if (!el) return null;
  const t0 = performance.now();
  el.click();
  await raf(); await raf();          // the frame that shows the result has been produced
  return performance.now() - t0;
}"""


def scroll_stats(iv):
    iv = iv[2:]  # first frames include the start-up
    if not iv:
        return {}
    total = sum(iv)
    slow = sum(1 for x in iv if x > FRAME_MS + FRAME_JITTER_MS)
    s = sorted(iv)
    return {'scroll_fps': len(iv) / (total / 1000), 'scroll_slow_frames_pct': 100 * slow / len(iv), 'scroll_frame_p95_ms': s[int(0.95 * (len(s) - 1))],
            'scroll_frame_max_ms': s[-1], 'scroll_frames': len(iv)}


def table_run(browser, base, rows, mode, cpu, cfg):
    r = Run(browser, cpu, timeout=900_000)
    try:
        m = measure_load(r, f'{base}/s3/index.html?rows={rows}&mode={mode}')
        m['table_rows_in_dom'] = r.page.evaluate("document.querySelectorAll('.atmr-tablegrid__row').length")
        # sanity: how many body cells are really visible (a virtual table that renders an empty body would otherwise "scroll at 60 fps")
        m['table_visible_cells'] = r.page.evaluate(VISIBLE_CELLS_JS)
        # scroll (fps) - 3 screens per second
        sc = r.page.evaluate(SCROLL_JS, {'ms': cfg['scroll_ms'], 'pxPerMs': 1.5})
        if 'iv' in sc:
            m.update(scroll_stats(sc['iv']))
        else:
            m['scroll_error'] = sc.get('error')
        r.page.evaluate(DOUBLE_RAF)
        m['sort_ms'] = r.page.evaluate(LATENCY_JS, '.atmr-tablegrid__sorting__button')
        m['select_all_ms'] = r.page.evaluate(LATENCY_JS, '#select-all')
        r.page.evaluate("document.getElementById('select-all')?.click()")  # tidy: deselect
        r.page.evaluate(DOUBLE_RAF)
        m['expand_ms'] = r.page.evaluate(LATENCY_JS, '.atmr-tablegrid__expand__icon:not(.atmr-tablegrid__expand__icon--placeholder)')
        if r.errors:
            m['page_errors'] = len(r.errors)
        return m
    finally:
        r.close()


def do_table(browser, base, cfg, cpu):
    res = {}
    for rows in cfg['rows']:
        big = rows >= 10000
        runs_n, warm = (cfg['big_runs'], cfg['big_warmup']) if big else (cfg['runs'], cfg['warmup'])
        for mode in cfg['modes']:
            key = f't{rows}_{mode}'
            runs = []
            for i in range(warm + runs_n):
                try:
                    m = table_run(browser, base, rows, mode, cpu, cfg)
                    if i >= warm:
                        runs.append(m)
                except Exception as e:
                    log(f'  ! {key} run {i}: {str(e)[:200]}')
                    res.setdefault(key, {})['error'] = str(e)[:300]
            if runs:
                res[key] = {**res.get(key, {}), **aggregate(runs), 'rows': rows, 'mode': mode}
            g = res.get(key, {})
            log(f'  [{cfg["cpu_label"]}] {key}: ready {g.get("ready_ms", {}).get("median")} ms, scroll {g.get("scroll_fps", {}).get("median")} fps, '
                f'sort {g.get("sort_ms", {}).get("median")} ms, select-all {g.get("select_all_ms", {}).get("median")} ms')
    return res


# ------------------------------------------------------------------------------------------------ section: mount
def do_mount(browser, base, cfg, cpu):
    res = {}
    for kind, n in MOUNT_CASES:
        key = f'{kind}_{n}'
        runs = []
        for i in range(cfg['warmup'] + cfg['runs']):
            r = Run(browser, cpu, timeout=600_000)
            try:
                r.goto(f'{base}/mount/index.html')
                m = {}
                m['mount_cold_ms'] = r.page.evaluate(f"bench.mountMany('{kind}', {n})")
                m['dom_elements'] = r.page.evaluate("document.getElementsByTagName('*').length")
                m['unmount_ms'] = r.page.evaluate('bench.unmountAll()')
                re_mount = []
                for _ in range(3):
                    re_mount.append(r.page.evaluate(f"bench.mountMany('{kind}', {n})"))
                    r.page.evaluate('bench.unmountAll()')
                m['remount_ms'] = statistics.median(re_mount)
                m['mount_painted_ms'] = r.page.evaluate(f"bench.mountManyPainted('{kind}', {n})")
                r.page.evaluate('bench.unmountAll()')
                if i >= cfg['warmup']:
                    runs.append(m)
            except Exception as e:
                log(f'  ! {key} run {i}: {str(e)[:200]}')
                res.setdefault(key, {})['error'] = str(e)[:300]
            finally:
                r.close()
        if runs:
            res[key] = {**res.get(key, {}), **aggregate(runs), 'kind': kind, 'n': n}
        g = res.get(key, {})
        log(f'  [{cfg["cpu_label"]}] mount {key}: cold {g.get("mount_cold_ms", {}).get("median")} ms, re-mount {g.get("remount_ms", {}).get("median")} ms')
    return res


# ------------------------------------------------------------------------------------------------ section: leak
def do_leak(browser, base, cfg, cpu):
    res = {}
    cycles, chunk = cfg['leak_cycles'], max(1, cfg['leak_cycles'] // 4)
    for kind in LEAK_KINDS:
        runs = []
        for i in range(cfg['leak_runs']):
            r = Run(browser, cpu, timeout=900_000)
            try:
                r.goto(f'{base}/mount/index.html')
                r.page.evaluate(f"bench.leakInit('{kind}')")
                ok = True
                for _ in range(10):  # warm-up cycles (lazy init, JIT, caches)
                    ok = r.page.evaluate(f"bench.leakCycle('{kind}')") and ok
                r.page.wait_for_timeout(300)
                series = []

                def snap(done):
                    used, pm = r.heap()
                    series.append({'cycles': done, 'heap_kb': round((used if used is not None else pm) / 1024, 1),
                                   'dom_elements': r.page.evaluate("document.getElementsByTagName('*').length"), **r.counters()})

                snap(0)
                done = 0
                while done < cycles:
                    k = min(chunk, cycles - done)
                    good = r.page.evaluate(f"async () => {{ let ok = true; for (let i = 0; i < {k}; i++) ok = (await bench.leakCycle('{kind}')) && ok; return ok; }}")
                    ok = ok and good
                    done += k
                    r.page.wait_for_timeout(300)
                    snap(done)
                r.page.evaluate('bench.leakDestroy()')
                r.page.wait_for_timeout(300)
                snap(-1)  # after unmounting the component
                first, last = series[0], series[-2]
                pts = [(x['cycles'], x['heap_kb']) for x in series[:-1]]
                mx, my = statistics.mean(c for c, _ in pts), statistics.mean(h for _, h in pts)
                slope = sum((c - mx) * (h - my) for c, h in pts) / sum((c - mx) ** 2 for c, _ in pts)  # KB per cycle (least squares)
                mid = next(x for x in series if x['cycles'] >= cycles // 2)
                m = {'heap_growth_pct': 100 * (last['heap_kb'] - first['heap_kb']) / first['heap_kb'], 'heap_start_kb': first['heap_kb'],
                     'heap_end_kb': last['heap_kb'], 'dom_elements_start': first['dom_elements'], 'dom_elements_end': last['dom_elements'],
                     'listeners_start': first['listeners'], 'listeners_end': last['listeners'], 'cycles_ok': 1 if ok else 0, 'cycles': cycles,
                     'heap_after_destroy_kb': series[-1]['heap_kb'],
                     'heap_slope_kb_per_100_cycles': slope * 100, 'heap_growth_2nd_half_pct': 100 * (last['heap_kb'] - mid['heap_kb']) / mid['heap_kb']}
                runs.append(m)
                res.setdefault(kind, {})['series'] = series  # of the last run
            except Exception as e:
                log(f'  ! leak {kind}: {str(e)[:200]}')
                res.setdefault(kind, {})['error'] = str(e)[:300]
            finally:
                r.close()
        if runs:
            res[kind] = {**res.get(kind, {}), **aggregate(runs)}
        g = res.get(kind, {})
        log(f'  [{cfg["cpu_label"]}] leak {kind}: heap {g.get("heap_growth_pct", {}).get("median")} %, listeners '
            f'{g.get("listeners_start", {}).get("median")}->{g.get("listeners_end", {}).get("median")}')
    return res


# ------------------------------------------------------------------------------------------------ section: coverage
def s2_actions(page):
    page.hover('#save')
    page.click('.atmr-input__field')
    page.keyboard.type('Ромашка')
    page.click('.atmr-select .atmr-input__container')
    page.wait_for_selector('.atmr-dropdown-menu[data-show="true"]')
    page.hover('.atmr-dropdown-menu__item >> nth=1')
    page.click('.atmr-dropdown-menu__item >> nth=1')
    page.click('.atmr-checkbox')
    page.click('.atmr-switch')
    page.click('#open-modal')
    page.wait_for_selector('.atmr-modal')
    page.wait_for_timeout(500)
    page.click('#close-modal')
    page.wait_for_timeout(500)


def s3_actions(page):
    page.click('.atmr-tablegrid__sorting__button')
    page.hover('.atmr-tablegrid__row >> nth=3')
    page.click('label:has(#select-all)')
    page.click('.atmr-tablegrid__expand__icon:not(.atmr-tablegrid__expand__icon--placeholder) >> nth=0')
    page.click('.atmr-pagination .atmr-select .atmr-input__container')
    page.wait_for_selector('.atmr-dropdown-menu[data-show="true"]')
    page.keyboard.press('Escape')
    page.click('.atmr-pagination__next button')
    page.wait_for_timeout(500)


COUNT_STYLE_RULES_JS = """() => {
  const count = rules => { let n = 0; for (const r of rules) { if (r instanceof CSSStyleRule) n++; if (r.cssRules) n += count(r.cssRules); } return n; };
  let n = 0, len = 0;
  for (const s of document.styleSheets) { try { n += count(s.cssRules); } catch (e) {} }
  return n;
}"""


def union_len(ranges):
    """total length of the union of [start, end) ranges (a used nested rule lies inside a used parent: count it once)"""
    total, cur_s, cur_e = 0, None, None
    for s, e in sorted(ranges):
        if cur_e is None or s > cur_e:
            if cur_e is not None:
                total += cur_e - cur_s
            cur_s, cur_e = s, e
        else:
            cur_e = max(cur_e, e)
    if cur_e is not None:
        total += cur_e - cur_s
    return total


def coverage_case(browser, url, actions):
    """CSS.startRuleUsageTracking BEFORE the navigation; takeCoverageDelta after load and after the scripted interactions.
    The tracker lists only rules that were used, so the denominator (all style rules) comes from the CSSOM and the sheet length."""
    r = Run(browser, 1)
    try:
        sheets = {}
        r.cdp.on('CSS.styleSheetAdded', lambda e: sheets.__setitem__(e['header']['styleSheetId'], e['header']))
        r.cdp.send('DOM.enable')
        r.cdp.send('CSS.enable')
        r.cdp.send('CSS.startRuleUsageTracking')
        r.goto(url)
        loaded = [x for x in r.cdp.send('CSS.takeCoverageDelta')['coverage'] if x['used']]
        err = None
        try:
            r.page.set_default_timeout(8000)
            actions(r.page)
        except Exception as e:  # interactions are best-effort: the coverage after load is still valid
            err = str(e).split(chr(10))[0][:200]
        r.page.evaluate(DOUBLE_RAF)
        inter = [x for x in r.cdp.send('CSS.takeCoverageDelta')['coverage'] if x['used']]
        r.cdp.send('CSS.stopRuleUsageTracking')
        total = r.page.evaluate(COUNT_STYLE_RULES_JS)
        text_len = sum(h.get('length') or 0 for h in sheets.values() if h.get('sourceURL'))
        rng = lambda rules: [(x['startOffset'], x['endOffset']) for x in rules]
        b_load, b_all = union_len(rng(loaded)), union_len(rng(loaded + inter))
        pct = lambda a, b: 100 * a / b if b else None
        return {
            'rules_total': total, 'rules_used_after_load': len(loaded), 'rules_used_after_interaction': len(loaded) + len(inter),
            'rules_used_after_load_pct': pct(len(loaded), total), 'rules_used_after_interaction_pct': pct(len(loaded) + len(inter), total),
            'bytes_total': text_len, 'bytes_used_after_load': b_load, 'bytes_used_after_interaction': b_all,
            'bytes_used_after_load_pct': pct(b_load, text_len), 'bytes_used_after_interaction_pct': pct(b_all, text_len),
            'stylesheets': [{'url': (h.get('sourceURL') or '(inline)').split('/')[-1], 'length': h.get('length')} for h in sheets.values()],
            'interaction_error': err,
        }
    finally:
        r.close()


def do_coverage(browser, base, cfg, cpu):
    res = {}
    cases = {'s2': (f'{base}/s2/index.html', s2_actions), 's3': (f'{base}/s3/index.html?rows=1000&mode=paged', s3_actions)}
    for key, (url, actions) in cases.items():
        try:
            res[key] = coverage_case(browser, url, actions)
            g = res[key]
            log(f'  [coverage] {key}: {g["rules_total"]} rules, used after load {g["rules_used_after_load_pct"]:.1f} %, '
                f'after interaction {g["rules_used_after_interaction_pct"]:.1f} %' + (f' (interaction error: {g["interaction_error"]})' if g['interaction_error'] else ''))
        except Exception as e:
            log(f'  ! coverage {key}: {str(e)[:200]}')
            res[key] = {'error': str(e)[:300]}
    return res


# ------------------------------------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--runs', type=int, default=15, help='measured runs per case (default 15)')
    ap.add_argument('--warmup', type=int, default=3, help='discarded warm-up runs per case (default 3)')
    ap.add_argument('--throttle', type=float, default=4, help='CPU throttling rate of the second pass (default 4; 0 = only the x1 pass)')
    ap.add_argument('--only', default='scenarios,table,mount,leak,coverage')
    ap.add_argument('--scenarios', default=','.join(SCENARIO_IDS), help='scenario ids of the "scenarios" section')
    ap.add_argument('--rows', default='100,1000,10000', help='table sizes')
    ap.add_argument('--modes', default='all,virtual,paged', help='table modes: all | virtual | paged')
    ap.add_argument('--big-runs', type=int, default=5, help='runs for 10000-row tables (default 5: select-all is O(n^2) there)')
    ap.add_argument('--big-warmup', type=int, default=1)
    ap.add_argument('--scroll-ms', type=int, default=2000, help='duration of the scroll test (default 2000)')
    ap.add_argument('--leak-cycles', type=int, default=200)
    ap.add_argument('--leak-runs', type=int, default=1)
    ap.add_argument('--headed', action='store_true', help='show the browser (frame pacing may then follow the monitor)')
    ap.add_argument('--out', default=str(RESULTS / 'runtime.json'))
    ap.add_argument('--merge', action='store_true', help='keep the sections of an existing --out file that this run does not repeat')
    a = ap.parse_args()

    if not (DIST / 's1' / 'index.html').exists():
        sys.exit('no builds in tools/bench/app/dist: run `npm run bench:size` first')
    only = set(a.only.split(','))
    cfg = {'runs': a.runs, 'warmup': a.warmup, 'scenarios': [s for s in a.scenarios.split(',') if s],
           'rows': [int(x) for x in a.rows.split(',') if x], 'modes': [x for x in a.modes.split(',') if x],
           'big_runs': min(a.big_runs, a.runs), 'big_warmup': min(a.big_warmup, a.warmup), 'scroll_ms': a.scroll_ms,
           'leak_cycles': a.leak_cycles, 'leak_runs': a.leak_runs}
    settings = {**{k: v for k, v in cfg.items() if k != 'scenarios'}, 'throttle': a.throttle, 'only': sorted(only), 'headless': not a.headed,
                'frame_slow_threshold_ms': FRAME_MS + FRAME_JITTER_MS}

    srv, port = start_server()
    base = f'http://127.0.0.1:{port}'
    log(f'serving {DIST} on {base}')
    RESULTS.mkdir(parents=True, exist_ok=True)
    out_path = Path(a.out)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not a.headed, args=[
            '--enable-precise-memory-info', '--js-flags=--expose-gc', '--disable-renderer-backgrounding',
            '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--no-first-run'])
        doc = {'env': env_info(browser, settings), 'settings': settings, 'passes': {}}
        if a.merge and out_path.exists():
            try:
                prev = json.loads(out_path.read_text(encoding='utf-8'))
                doc['passes'] = prev.get('passes', {})
                doc['settings_previous'] = prev.get('settings')
            except Exception:
                pass
        doc['env']['cpu_calibration_ms'] = cpu_calibration(browser)
        log(f'chromium {browser.version}, calibration {doc["env"]["cpu_calibration_ms"]} ms')
        t_start = time.time()
        passes = [1] + ([a.throttle] if a.throttle and a.throttle > 1 else [])
        for cpu in passes:
            label = f'cpu{int(cpu) if float(cpu).is_integer() else cpu}'
            cfg['cpu_label'] = label
            log(f'=== pass {label} ===')
            ps = doc['passes'].setdefault(label, {})
            ps['cpu_rate'] = cpu
            if 'scenarios' in only:
                ps['scenarios'] = do_scenarios(browser, base, cfg, cpu)
            if 'table' in only:
                ps['table'] = do_table(browser, base, cfg, cpu)
            if 'mount' in only:
                ps['mount'] = do_mount(browser, base, cfg, cpu)
            if cpu == 1 and 'leak' in only:
                ps['leak'] = do_leak(browser, base, cfg, cpu)
            if cpu == 1 and 'coverage' in only:
                ps['coverage'] = do_coverage(browser, base, cfg, cpu)
            doc['elapsed_s'] = round(time.time() - t_start)
            out_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding='utf-8')  # incremental: a long run can be interrupted
        browser.close()
    srv.shutdown()
    log(f'saved {out_path} ({doc["elapsed_s"]} s)')


if __name__ == '__main__':
    main()
