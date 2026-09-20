#!/usr/bin/env node
// Bundle-size benchmark of rt-ui: builds every scenario S0..S5 (+ S1b barrel probe, + one "Button + X" build per component for the
// marginal cost) with Vite (production, JS minified by oxc, CSS by Lightning CSS) and measures what the browser downloads:
// raw / gzip(9) / brotli(11) of the JS and CSS chunks that the page loads, fonts on a separate line, plus the list of all chunks.
//
//   node tools/bench/size.mjs                       # scenarios + marginal cost of ~30 components
//   node tools/bench/size.mjs --only s1,s2          # some scenarios only (skips marginal unless --marginal is given)
//   node tools/bench/size.mjs --marginal all        # every component of the barrel (slow: ~120 builds)
//   node tools/bench/size.mjs --marginal Input,Select
//   node tools/bench/size.mjs --no-marginal         # scenarios only
//   node tools/bench/size.mjs --keep-generated      # keep app/.generated (the "Button + X" entries)
//   node tools/bench/size.mjs --no-barrel           # do not run tools/gen-barrel.mjs first (by default it regenerates src/lib/index.ts)
// Output: tools/bench/results/size.json (+ a table in the console). Builds land in tools/bench/app/dist/<scenario>/ (used by runtime.py).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import { here as appDir, repo, LIB, scenarioConfig } from './app/vite.config.js';
import { SCENARIOS, RUNTIME_ONLY } from './app/scenarios.mjs';

const benchDir = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(benchDir, 'results');
const distDir = path.join(appDir, 'dist');
const genDir = path.join(appDir, '.generated');

// ---------------------------------------------------------------- args
const args = process.argv.slice(2);
const opt = (name, def) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const only = opt('only', null)?.split(',');
const noMarginal = args.includes('--no-marginal');
const marginalArg = opt('marginal', only ? null : 'default');
const keepGenerated = args.includes('--keep-generated');

// S4 / S1b import the generated barrel: regenerate it so the benchmark always sees the current component set
if (!args.includes('--no-barrel')) {
	console.log(execFileSync(process.execPath, [path.join(repo, 'tools/gen-barrel.mjs')], { encoding: 'utf8' }).trim());
}

const DEFAULT_MARGINAL = [
	'Typography', 'Badge', 'Input', 'TextArea', 'Select', 'Multiselect', 'Checkbox', 'RadioButton', 'Switch', 'SegmentedControl', 'Slider',
	'Modal', 'Drawer', 'Popover', 'Tooltip', 'DropdownMenu', 'Accordion', 'Pagination', 'TableGrid', 'Tree', 'TabsGroup', 'Breadcrumbs',
	'SideMenu', 'TopMenu', 'InputDate', 'PickerDate', 'FileUpload', 'WizardStepsHorizontal', 'ToastNotificationsProvider'
];

// ---------------------------------------------------------------- helpers
const gzip = (b) => zlib.gzipSync(b, { level: 9 }).length;
const brotli = (b) =>
	zlib.brotliCompressSync(b, {
		params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: b.length }
	}).length;
const sizes = (buf) => ({ raw: buf.length, gzip: gzip(buf), brotli: brotli(buf) });
const sum = (list) => list.reduce((a, s) => ({ raw: a.raw + s.raw, gzip: a.gzip + s.gzip, brotli: a.brotli + s.brotli }), { raw: 0, gzip: 0, brotli: 0 });
const diff = (a, b) => ({ raw: a.raw - b.raw, gzip: a.gzip - b.gzip, brotli: a.brotli - b.brotli });
const kb = (n) => (n / 1024).toFixed(1);
const skb = (n) => (n >= 0 ? '+' : '') + kb(n);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pkgVersion = (name) => {
	try {
		return readJson(path.join(repo, 'node_modules', name, 'package.json')).version;
	} catch {
		return null;
	}
};

function* walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) yield* walk(p);
		else yield p;
	}
}

/** Measure one built scenario directory: initial chunks (referenced by index.html) vs lazy chunks, fonts. */
function analyze(outDir, output) {
	const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
	const initial = new Set([...html.matchAll(/(?:src|href)="\.\/([^"]+\.(?:js|css))"/g)].map((m) => m[1]));
	const chunks = [];
	for (const file of walk(outDir)) {
		const rel = path.relative(outDir, file).replace(/\\/g, '/');
		if (rel === 'index.html') continue;
		const buf = fs.readFileSync(file);
		const ext = path.extname(rel).slice(1);
		const type = ext === 'js' || ext === 'mjs' ? 'js' : ext === 'css' ? 'css' : /^(woff2?|ttf|otf|eot)$/.test(ext) ? 'font' : 'other';
		chunks.push({ file: rel, type, initial: initial.has(rel), ...sizes(buf) });
	}
	const of = (type, filter = () => true) => chunks.filter((c) => c.type === type && filter(c));
	const js = sum(of('js', (c) => c.initial));
	const css = sum(of('css', (c) => c.initial));
	const woff2 = of('font', (c) => c.file.endsWith('.woff2'));
	const woff = of('font', (c) => c.file.endsWith('.woff'));
	const htmlBuf = Buffer.from(html);

	// which modules ended up in the JS (rolldown reports rendered lengths per module) -> tree-shaking diagnostics
	let moduleCount = 0;
	const topModules = [];
	const libModules = { count: 0, rendered: 0 };
	const outs = Array.isArray(output) ? output.flatMap((o) => o.output) : output.output;
	for (const o of outs) {
		if (o.type !== 'chunk' || !o.modules) continue;
		for (const [id, m] of Object.entries(o.modules)) {
			const rendered = m.renderedLength ?? m.code?.length ?? 0;
			moduleCount++;
			const rel = id.replace(/\\/g, '/').replace(repo.replace(/\\/g, '/') + '/', '');
			if (rel.startsWith('src/lib/')) {
				libModules.count++;
				libModules.rendered += rendered;
			}
			topModules.push({ id: rel, rendered });
		}
	}
	topModules.sort((a, b) => b.rendered - a.rendered);

	return {
		js,
		css,
		total: sum([js, css]),
		fonts: { woff2: { files: woff2.map((f) => ({ file: f.file, raw: f.raw })), ...sum(woff2) }, woff: { files: woff.map((f) => ({ file: f.file, raw: f.raw })), ...sum(woff) } },
		html: sizes(htmlBuf),
		lazy: { js: sum(of('js', (c) => !c.initial)), css: sum(of('css', (c) => !c.initial)) },
		chunks,
		modules: { count: moduleCount, libCount: libModules.count, libRendered: libModules.rendered, top: topModules.slice(0, 15) }
	};
}

async function buildOne(id, opts = {}) {
	const cfg = scenarioConfig(id, opts);
	const t0 = performance.now();
	const output = await build(cfg);
	const buildMs = Math.round(performance.now() - t0);
	return { ...analyze(cfg.build.outDir, output), buildMs };
}

// ---------------------------------------------------------------- marginal-cost entries
function barrelMap() {
	const src = fs.readFileSync(path.join(LIB, 'index.ts'), 'utf8');
	const map = {};
	for (const m of src.matchAll(/export \{ default as (\w+) \} from '\.\/([^']+)'/g)) map[m[1]] = m[2];
	return map;
}
const MARGINAL_CSS = `import '@rt-ui/styles/themes/rtk_default_light.css';
import '@rt-ui/styles/base.css';
import '@rt-ui/styles/components.css';
import '@rt-ui/styles/fonts.css';`;

function writeMarginalEntry(name, relPath) {
	const dir = path.join(genDir, `m-${name}`);
	fs.mkdirSync(dir, { recursive: true });
	fs.copyFileSync(path.join(appDir, 'scenarios/s1/index.html'), path.join(dir, 'index.html'));
	// identical to S1 plus "keep component X alive" (imported and referenced, so nothing about X is tree-shaken)
	fs.writeFileSync(
		path.join(dir, 'main.js'),
		`${MARGINAL_CSS}
import { mount, tick } from 'svelte';
import Button from '@rt-ui/components/Button/Button/Button.svelte';
import X from '@rt-ui/${relPath}';

performance.mark('bench-start');
globalThis.__keep = [X];
mount(Button, { target: document.getElementById('app'), props: { label: 'Сохранить' } });
tick().then(() => performance.mark('bench-ready'));
`
	);
	return dir;
}

// ---------------------------------------------------------------- run
const table = [];
const results = {
	generatedAt: new Date().toISOString(),
	versions: { node: process.version, vite: pkgVersion('vite'), svelte: pkgVersion('svelte'), 'vite-plugin-svelte': pkgVersion('@sveltejs/vite-plugin-svelte'), lightningcss: pkgVersion('lightningcss') },
	settings: { jsMinifier: 'oxc (Vite 8 default)', cssMinifier: 'lightningcss', gzipLevel: 9, brotliQuality: 11, unit: 'bytes' },
	scenarios: {},
	marginal: {}
};
try {
	results.versions.react = readJson(path.join(benchDir, 'node_modules/react/package.json')).version;
} catch {}

fs.mkdirSync(resultsDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });

const list = [...SCENARIOS, ...RUNTIME_ONLY.map((s) => ({ ...s, runtimeOnly: true }))].filter((s) => !only || only.includes(s.id));
for (const s of list) {
	process.stdout.write(`build ${s.id} ... `);
	try {
		const r = await buildOne(s.id, { sideEffects: s.sideEffects, ...(s.dir ? { dir: path.join(appDir, 'scenarios', s.dir) } : {}) });
		if (!s.runtimeOnly) results.scenarios[s.id] = { title: s.title, imports: s.imports, extra: !!s.extra, ...r };
		table.push({ id: s.id, ...r, runtimeOnly: s.runtimeOnly });
		console.log(`${r.buildMs} ms, js ${kb(r.js.brotli)} KB br, css ${kb(r.css.brotli)} KB br`);
	} catch (e) {
		console.log('FAILED');
		console.error(e?.message ?? e);
		if (!s.runtimeOnly) results.scenarios[s.id] = { title: s.title, error: String(e?.message ?? e) };
	}
}

// marginal cost: every "Button + X" build against S1 (Button alone)
if (!noMarginal && marginalArg) {
	const map = barrelMap();
	const names = marginalArg === 'default' ? DEFAULT_MARGINAL : marginalArg === 'all' ? Object.keys(map) : String(marginalArg).split(',');
	const base = results.scenarios.s1?.error ? null : results.scenarios.s1 ?? (await buildOne('s1').then((r) => ({ ...r })));
	if (base) {
		results.marginal._baseline = { scenario: 's1', js: base.js, css: base.css };
		fs.rmSync(genDir, { recursive: true, force: true });
		for (const name of names) {
			if (!map[name]) {
				console.log(`marginal ${name}: not in the barrel, skipped`);
				continue;
			}
			process.stdout.write(`marginal ${name} ... `);
			try {
				const dir = writeMarginalEntry(name, map[name]);
				const r = await buildOne(name, { dir, outDir: path.join(distDir, '_marginal', name) });
				results.marginal[name] = {
					source: map[name],
					js: diff(r.js, base.js),
					css: diff(r.css, base.css),
					total: diff(r.total, base.total),
					libModules: r.modules.libCount - (base.modules?.libCount ?? 0)
				};
				console.log(`${skb(results.marginal[name].js.brotli)} KB js br, ${skb(results.marginal[name].css.brotli)} KB css br, +${results.marginal[name].libModules} lib modules`);
			} catch (e) {
				console.log('FAILED');
				console.error(e?.message ?? e);
				results.marginal[name] = { error: String(e?.message ?? e) };
			}
		}
		if (!keepGenerated) {
			fs.rmSync(genDir, { recursive: true, force: true });
			fs.rmSync(path.join(distDir, '_marginal'), { recursive: true, force: true });
		}
	}
}

// merge with a previous run when only a subset was rebuilt (keeps the other scenarios in the json)
const outPath = path.join(resultsDir, 'size.json');
if (only && fs.existsSync(outPath)) {
	try {
		const prev = readJson(outPath);
		results.scenarios = { ...prev.scenarios, ...results.scenarios };
		for (const id of Object.keys(results.scenarios)) if (!SCENARIOS.some((x) => x.id === id)) delete results.scenarios[id];
		results.marginal = { ...prev.marginal, ...results.marginal };
	} catch {}
}
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

// ---------------------------------------------------------------- console table
const pad = (s, n) => String(s).padStart(n);
console.log(`\nKB (1 KB = 1024 B)                      |        JS raw   gzip brotli |       CSS raw   gzip brotli | total br | fonts woff2 raw`);
for (const t of table.filter((t) => !t.runtimeOnly)) {
	console.log(
		`${t.id.padEnd(38)} | ${pad(kb(t.js.raw), 10)} ${pad(kb(t.js.gzip), 6)} ${pad(kb(t.js.brotli), 6)} | ${pad(kb(t.css.raw), 9)} ${pad(kb(t.css.gzip), 6)} ${pad(kb(t.css.brotli), 6)} | ${pad(kb(t.total.brotli), 8)} | ${pad(kb(t.fonts.woff2.raw), 8)}`
	);
}
const marginalRows = Object.entries(results.marginal).filter(([k, v]) => k !== '_baseline' && !v.error);
if (marginalRows.length) {
	console.log('\nMarginal cost vs S1 (Button only), brotli KB:  name: js / css / lib modules');
	for (const [k, v] of marginalRows.sort((a, b) => b[1].total.brotli - a[1].total.brotli)) {
		console.log(`  ${k.padEnd(28)} ${pad(skb(v.js.brotli), 8)} ${pad(skb(v.css.brotli), 7)}  +${v.libModules} modules`);
	}
}
console.log(`\nsaved ${path.relative(repo, outPath)}`);
