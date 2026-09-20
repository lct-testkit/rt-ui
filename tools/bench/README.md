# tools/bench - benchmark of rt-ui

Specification, goals and budgets: [`docs/BENCHMARK.md`](../../docs/BENCHMARK.md). This folder is the harness that produces the numbers.

## One-time setup

```bash
cd tools/bench && npm install      # react + react-dom only (the S0r hello-world); Playwright for Python and Chromium are already installed for tools/*.py
```

`vite`, `@sveltejs/vite-plugin-svelte`, `svelte` and `lightningcss` are taken from the **root** `node_modules` on purpose: the app and the library sources
must share one Svelte runtime and the same Vite (8, rolldown). `tools/bench/package.json` must not list them.

## Run (from the repo root)

```bash
npm run bench:size                 # builds every scenario + the "Button + X" builds, writes results/size.json   (~3 min, CPU only)
npm run bench:runtime              # Playwright + CDP, writes results/runtime.json                              (long: run on an IDLE machine)
npm run bench:report               # rewrites the tables between the BENCH_* markers of docs/BENCHMARK.md
```

Extra flags go after `--`: `npm run bench:runtime -- --runs 5 --throttle 0`.

| script | useful flags |
|---|---|
| `size.mjs` | `--only s1,s2` (subset; merged into the existing json), `--marginal default\|all\|Input,Select`, `--no-marginal`, `--no-barrel`, `--keep-generated` |
| `runtime.py` | `--runs 15 --warmup 3` (defaults), `--throttle 4` (second pass with CPU x4; `0` = off), `--only scenarios,table,mount,leak,coverage`, `--scenarios s1,s2`, `--rows 100,1000,10000`, `--modes all,paged,virtual`, `--big-runs 5 --big-warmup 1` (10 000-row tables), `--scroll-ms 2000`, `--leak-cycles 200`, `--leak-runs 1`, `--headed`, `--out file.json`, `--merge` |
| `report.py` | `--doc other.md`, `--size file.json`, `--runtime file.json` |

Smoke test of the scripts (seconds-minutes, numbers are meaningless): `npm run bench:runtime -- --runs 1 --warmup 0 --throttle 0 --rows 100 --leak-cycles 20 --scroll-ms 500 --out tools/bench/results/runtime.smoke.json`.

## What is where

```
size.mjs            builds all scenarios with the Vite JS API, measures raw / gzip(9) / brotli(11) of what the page loads (JS and CSS apart, fonts as a
                    separate line, every chunk listed), the modules that ended up in the bundle, and the marginal cost of ~30 components (S1 + X)
runtime.py          static server (free port) over app/dist + Chromium; every run = fresh context; medians of N runs; CDP metrics; writes runtime.json
report.py           results/*.json -> Russian tables in docs/BENCHMARK.md (budget pass / fail column against section 4 of the doc)
app/vite.config.js  scenarioConfig(name): Vite (NOT SvelteKit) + vite-plugin-svelte, alias @rt-ui / $lib -> ../../../src/lib (the library is consumed from
                    source), cssMinify: 'lightningcss', minify: oxc, fonts are not inlined
app/scenarios.mjs   scenario list (id, title, imports, css)
app/scenarios/      one folder per scenario, each an index.html + main.js (+ App.svelte)
  s0 / s0r          hello-world Svelte / React (framework price)
  s1                one Button + CSS of one theme (themes/rtk_default_light.css, base.css, components.css, fonts.css)
  s1b / s1n         S1 through the generated barrel src/lib/index.ts (tree-shaking probe); s1n = same build with the package `sideEffects` field ignored
  s2                form: Input x3, Select, Checkbox, Switch, Button x2, Modal
  s3                TableGrid + Pagination (+ its Select); URL: ?rows=100|1000|10000&mode=all|paged|virtual  (default 1000 / all); 8 columns, sorting,
                    selection with a "select all" checkbox, every 10th row expandable
  s4                `import * from src/lib/index.ts` with the namespace kept alive (nothing can be tree-shaken) - the ceiling
  s5                SideMenu + TopMenu + Breadcrumbs + Tabs
  mount             runtime-only harness page (window.bench): mount N components, popup open/close cycles for the leak test
app/shared/data.js  seeded CRM-like row generator
results/            size.json, runtime.json (generated); app/dist/ = the builds (git-ignored)
```

Each `main.js` records `performance.mark('bench-start')` before `mount()` and `bench-ready` after it; `runtime.py` reads them.

## Method notes

* JS is the single entry chunk(s) referenced by `index.html`; CSS likewise. Anything else in `assets/` is reported as "lazy". Fonts (woff2) are reported separately.
* CSS coverage: `CSS.startRuleUsageTracking` before navigation, `takeCoverageDelta` after load and after a scripted interaction. The tracker only lists used rules,
  so the denominator (all `CSSStyleRule`s) is counted in the CSSOM; the percentage is a lower bound (states the script does not trigger stay unused).
* Frame pacing: rAF frames while `scrollTop` of the table container is moved programmatically (ping-pong over the whole range, 1.5 px/ms); a frame longer than 16.7 ms
  (+1 ms jitter tolerance) counts as slow. Headless Chromium paces frames at 60 Hz.
* Heap: `HeapProfiler.collectGarbage` x3, then `Runtime.getHeapUsage` (and `performance.memory`, Chromium runs with `--enable-precise-memory-info`).
* Leak test: 10 warm-up cycles, baseline after GC, 200 cycles with a snapshot every 50, heap growth in % and the least-squares slope; the `control` case is a plain toggled
  Svelte block = the noise floor of the harness. Popover / Select popups stay in the DOM when closed (as in React), so the check is `data-show="true"`; the Modal cycle uses `transitionProps.timeout = 30` ms to keep 200 cycles fast.
* A non-virtual table of 10 000 rows is ~190 000 DOM elements (style + layout of that DOM take tens of seconds and are the browser's cost, not the library's), so the 10 000-row cases run `--big-runs` (5) times only; timeouts are 15 min per case.
* `table_visible_cells` (cells painted at their centre, `elementFromPoint`) guards against meaningless numbers (a virtual table that renders a blank body would "scroll at 60 fps"). The `virtual` mode of TableGrid renders only a window of rows (`table_rows_in_dom` ~ 30 for a 600 px table) and has no pagination footer in S3.
* CPU throttling (`Emulation.setCPUThrottlingRate`) is applied to the whole page including the load; leak and coverage run in the x1 pass only.
* Everything is served uncompressed from localhost: transfer time is not measured (sizes are in `size.json`).
