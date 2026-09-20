// What the chart module costs a CONSUMER, measured on the built package (`npm run package` first), the way an application uses it:
//   a throw-away Vite app (tools/.size-app, deleted afterwards) whose node_modules/@lct-testkit/rt-ui is a junction to this repository, so the
//   bare specifiers resolve through package.json `exports` (`.` and `./charts`), then `vite build` (JS by the default minifier, CSS by Lightning CSS).
//
//   node tools/size-charts.mjs
//
// Scenarios: a page with one Button from the main barrel (the baseline), the same + every chart component, the same + only Sparkline, only
// LineChart. Reported: raw / gzip / brotli of the JS and CSS the page loads, the difference to the baseline (= what the charts add) and the proof
// that the baseline contains no chart code and no chart CSS ("a consumer that never imports /charts pays nothing"). Exit code 1 if that proof fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(repo, 'tools', '.size-app');
const kb = (n) => (n / 1024).toFixed(1);
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

if (!fs.existsSync(path.join(repo, 'dist', 'charts', 'index.js'))) {
	console.error('dist/charts is missing: run `npm run package` first');
	process.exit(2);
}

const SCENARIOS = {
	baseline: {
		title: 'one Button (main barrel)',
		imports: "import { Button } from '@lct-testkit/rt-ui';",
		body: '<Button label="x" />'
	},
	all: {
		title: 'Button + every chart component',
		imports: "import { Button } from '@lct-testkit/rt-ui'; import { LineChart, BarChart, DonutChart, PieChart, Sparkline } from '@lct-testkit/rt-ui/charts';",
		body: '<Button label="x" /><LineChart data={[]} x="a" y="b" /><BarChart data={[]} x="a" y="b" /><DonutChart data={[]} name="a" value="b" /><PieChart data={[]} name="a" value="b" /><Sparkline data={[1, 2]} />'
	},
	line: {
		title: 'Button + LineChart',
		imports: "import { Button } from '@lct-testkit/rt-ui'; import { LineChart } from '@lct-testkit/rt-ui/charts';",
		body: '<Button label="x" /><LineChart data={[]} x="a" y="b" />'
	},
	spark: {
		title: 'Button + Sparkline',
		imports: "import { Button } from '@lct-testkit/rt-ui'; import { Sparkline } from '@lct-testkit/rt-ui/charts';",
		body: '<Button label="x" /><Sparkline data={[1, 2, 3]} />'
	}
};

// the consumer app: node_modules/@lct-testkit/rt-ui -> this repository (what `npm i file:../rt-ui` gives)
fs.rmSync(app, { recursive: true, force: true });
fs.mkdirSync(path.join(app, 'node_modules', '@lct-testkit'), { recursive: true });
fs.symlinkSync(repo, path.join(app, 'node_modules', '@lct-testkit', 'rt-ui'), 'junction');

const results = {};
try {
	for (const [id, sc] of Object.entries(SCENARIOS)) {
		const root = path.join(app, id);
		const out = path.join(os.tmpdir(), `rt-size-${id}-${process.pid}`);
		fs.mkdirSync(root, { recursive: true });
		fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><body><script type="module" src="./main.js"></script></body></html>');
		fs.writeFileSync(path.join(root, 'main.js'), "import { mount } from 'svelte'; import App from './App.svelte'; mount(App, { target: document.body });");
		fs.writeFileSync(path.join(root, 'App.svelte'), `<script>${sc.imports}</script>\n${sc.body}\n`);
		await build({
			root,
			base: './',
			configFile: false,
			logLevel: 'error',
			clearScreen: false,
			plugins: [svelte({ configFile: false, onwarn: () => {}, compilerOptions: { runes: ({ filename }) => (filename.replace(/\\/g, '/').split('/').includes('node_modules') ? undefined : true) } })],
			resolve: { dedupe: ['svelte'] },
			build: { outDir: out, emptyOutDir: true, minify: true, cssMinify: 'lightningcss', sourcemap: false, reportCompressedSize: false, assetsInlineLimit: 0, modulePreload: { polyfill: false } }
		});
		const files = [];
		(function walk(d) {
			for (const e of fs.readdirSync(d, { withFileTypes: true })) (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name)));
		})(out);
		const sum = (list) => list.reduce((a, b) => ({ raw: a.raw + b.length, gzip: a.gzip + gz(b), brotli: a.brotli + br(b) }), { raw: 0, gzip: 0, brotli: 0 });
		const read = (ext) => files.filter((f) => f.endsWith(ext)).map((f) => fs.readFileSync(f));
		const js = read('.js');
		const css = read('.css');
		results[id] = { title: sc.title, js: sum(js), css: sum(css), hasChartCode: js.some((b) => /rt-chart/.test(b.toString())), hasChartCss: css.some((b) => /rt-chart/.test(b.toString())), hasChartVars: css.some((b) => /--rt-chart-1/.test(b.toString())) };
		fs.rmSync(out, { recursive: true, force: true });
	}
} finally {
	fs.rmSync(app, { recursive: true, force: true });
}

const base = results.baseline;
console.log('scenario'.padEnd(34), 'JS raw'.padStart(9), 'gzip'.padStart(8), 'brotli'.padStart(8), '   ', 'CSS raw'.padStart(9), 'gzip'.padStart(8), 'brotli'.padStart(8));
for (const r of Object.values(results)) {
	console.log(r.title.padEnd(34), `${kb(r.js.raw)}`.padStart(9), `${kb(r.js.gzip)}`.padStart(8), `${kb(r.js.brotli)}`.padStart(8), '   ', `${kb(r.css.raw)}`.padStart(9), `${kb(r.css.gzip)}`.padStart(8), `${kb(r.css.brotli)}`.padStart(8));
}
console.log('\nwhat the charts ADD to the baseline page (KB):');
for (const [id, r] of Object.entries(results)) {
	if (id === 'baseline') continue;
	const dj = { raw: r.js.raw - base.js.raw, gzip: r.js.gzip - base.js.gzip, brotli: r.js.brotli - base.js.brotli };
	const dc = { raw: r.css.raw - base.css.raw, gzip: r.css.gzip - base.css.gzip, brotli: r.css.brotli - base.css.brotli };
	console.log(`  ${r.title.padEnd(32)} JS +${kb(dj.raw)} raw / +${kb(dj.gzip)} gzip    CSS +${kb(dc.raw)} raw / +${kb(dc.gzip)} gzip    total gzip +${kb(dj.gzip + dc.gzip)}`);
}
const shipped = fs.readFileSync(path.join(repo, 'dist', 'charts', 'charts.css'));
console.log(`\ndist/charts/charts.css alone: ${kb(shipped.length)} KB raw, ${kb(gz(shipped))} KB gzip`);

const clean = !base.hasChartCode && !base.hasChartCss && !base.hasChartVars;
console.log(`\nbaseline (never imports /charts) contains chart code: ${base.hasChartCode}, chart CSS: ${base.hasChartCss}  -> ${clean ? 'PASS: pays nothing' : 'FAIL'}`);
const all = results.all;
console.log(`charts page contains the chart CSS: ${all.hasChartCss && all.hasChartVars}  -> ${all.hasChartCss && all.hasChartVars ? 'PASS' : 'FAIL'}`);
process.exit(clean && all.hasChartCss ? 0 : 1);
