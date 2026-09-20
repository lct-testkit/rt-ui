// Server-side rendering check of the chart module (called by tools/check-charts.py, also runnable by hand: `node tools/check-charts-ssr.mjs`).
// Loads src/lib/charts through Vite's SSR loader, renders every component with `svelte/server` and asserts that the HTML is not empty:
// the SVG is there with real geometry (a default size is used before the first measurement), nothing is NaN, the accessible name and the
// visually hidden summary are in the markup, empty data gives the empty state, and the module does not touch window / document at import.
// Prints one `PASS name` / `FAIL name  detail` line per check, exit code 1 on any FAIL.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = (name, cond, detail = '') => {
	if (!cond) failed++;
	console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + detail}`);
};

// nothing in the module may need a browser at import time
for (const g of ['window', 'document', 'ResizeObserver', 'matchMedia']) delete globalThis[g];

const vite = await createServer({
	root,
	configFile: false,
	logLevel: 'error',
	appType: 'custom',
	server: { middlewareMode: true, hmr: false, watch: null },
	optimizeDeps: { noDiscovery: true, include: [] },
	plugins: [
		svelte({
			configFile: false,
			onwarn: () => {},
			compilerOptions: { runes: ({ filename }) => (filename.replace(/\\/g, '/').split('/').includes('node_modules') ? undefined : true) }
		})
	],
	resolve: { alias: [{ find: '$lib', replacement: path.join(root, 'src/lib') }] }
});

try {
	const { render } = await vite.ssrLoadModule('svelte/server');
	const charts = await vite.ssrLoadModule('/src/lib/charts/index.ts');
	const provider = (await vite.ssrLoadModule('/src/lib/ext/ExtMotionProvider.svelte')).default;
	const html = (C, props) => render(C, { props }).body;

	const rows = [
		{ month: new Date(2026, 0, 1), fact: 10, plan: 12 },
		{ month: new Date(2026, 1, 1), fact: 14, plan: 13 },
		{ month: new Date(2026, 2, 1), fact: null, plan: 15 }
	];
	const cats = [
		{ s: 'Новый', a: 4, b: 2 },
		{ s: 'Договор', a: 7, b: 3 }
	];

	const line = html(charts.LineChart, { data: rows, x: 'month', series: [{ key: 'f', label: 'Факт', y: 'fact' }, { key: 'p', label: 'План', y: 'plan' }], label: 'Выручка' });
	ok('LineChart SSR: svg + role=img + aria-label', /<svg[^>]*role="img"[^>]*aria-label="Выручка"/.test(line), line.slice(0, 200));
	ok('LineChart SSR: real geometry (paths, 560x280 default viewBox)', /viewBox="0 0 560 280"/.test(line) && (line.match(/class="rt-chart__line/g) ?? []).length === 2 && /d="M[\d.]+,[\d.]+/.test(line));
	ok('LineChart SSR: no NaN / undefined', !/NaN|undefined/.test(line), (line.match(/.{30}(NaN|undefined).{30}/) ?? [''])[0]);
	ok('LineChart SSR: hidden summary + data table + keyboard buttons', /rt-chart__sr/.test(line) && /<table/.test(line) && (line.match(/rt-chart__hit"/g) ?? []).length === 3);
	ok('LineChart SSR: ticks and legend', /rt-chart__tick--y/.test(line) && /rt-chart__legend/.test(line));

	const bar = html(charts.BarChart, { data: cats, x: 's', series: [{ key: 'a', label: 'A', y: 'a' }, { key: 'b', label: 'B', y: 'b' }], stacked: true, label: 'Этапы' });
	ok('BarChart SSR: bars drawn', (bar.match(/class="rt-chart__bar"/g) ?? []).length === 4 && !/NaN|undefined/.test(bar));
	const hbar = html(charts.BarChart, { data: cats, x: 's', y: 'a', horizontal: true, valueLabels: true, label: 'Воронка' });
	ok('BarChart SSR: horizontal + value labels', (hbar.match(/class="rt-chart__bar"/g) ?? []).length === 2 && /rt-chart__bar-label/.test(hbar) && !/NaN|undefined/.test(hbar));

	const donut = html(charts.DonutChart, { data: cats, name: 's', value: 'a', label: 'Доли' });
	ok('DonutChart SSR: slices, centre total, legend', (donut.match(/class="rt-chart__slice"/g) ?? []).length === 2 && /rt-chart__center-value/.test(donut) && /rt-chart__legend/.test(donut) && !/NaN|undefined/.test(donut));
	const lone = html(charts.DonutChart, { data: [{ n: 'A', v: 10 }, { n: 'B', v: 0 }, { n: 'C', v: -5 }], name: 'n', value: 'v' });
	const loneD = (lone.match(/class="rt-chart__slice" d="([^"]+)"/) ?? [])[1] ?? '';
	ok('DonutChart SSR: a lone positive segment is a whole ring (no gap, no radial seam; zero / negative rows are not drawn)', (lone.match(/class="rt-chart__slice"/g) ?? []).length === 1 && (loneD.match(/A/g) ?? []).length === 4 && !/L/.test(loneD), loneD.slice(0, 120));
	// edge cases that must never produce NaN / undefined geometry
	const neg = [
		{ k: 'A', a: 12, b: -8 },
		{ k: 'B', a: -4, b: 10 },
		{ k: 'C', a: 0, b: 0 }
	];
	const two = [{ key: 'a', y: 'a' }, { key: 'b', y: 'b' }];
	const edge = {
		'bars: negatives, grouped': html(charts.BarChart, { data: neg, x: 'k', series: two }),
		'bars: negatives, stacked + labels': html(charts.BarChart, { data: neg, x: 'k', series: two, stacked: true, valueLabels: true }),
		'bars: negatives, horizontal stacked': html(charts.BarChart, { data: neg, x: 'k', series: two, stacked: true, horizontal: true }),
		'bars: all zeros': html(charts.BarChart, { data: [{ k: 'A', v: 0 }, { k: 'B', v: 0 }], x: 'k', y: 'v' }),
		'line: null gaps': html(charts.LineChart, { data: [{ x: 1, y: 3 }, { x: 2, y: null }, { x: 3, y: 5 }, { x: 4, y: null }, { x: 5, y: null }, { x: 6, y: 2 }], x: 'x', y: 'y', points: true }),
		'line: a flat series': html(charts.LineChart, { data: [1, 2, 3].map((i) => ({ i, v: 7 })), x: 'i', y: 'v', area: true }),
		'line: 300 dated points': html(charts.LineChart, { data: Array.from({ length: 300 }, (_, i) => ({ t: new Date(2025, 0, 1 + i), v: i % 17 })), x: 't', y: 'v', smooth: true }),
		'sparkline: constant / negative / one point': [html(charts.Sparkline, { data: [5, 5, 5] }), html(charts.Sparkline, { data: [-3, -1, -4], type: 'bar' }), html(charts.Sparkline, { data: [1] })].join('\n'),
		'donut: every value zero is the empty state': html(charts.DonutChart, { data: [{ n: 'A', v: 0 }], name: 'n', value: 'v' })
	};
	for (const [name, out] of Object.entries(edge)) {
		ok(`edge SSR: ${name}: no NaN / undefined / Infinity`, !/NaN|undefined|Infinity/.test(out), (out.match(/.{40}(NaN|undefined|Infinity).{40}/) ?? [''])[0]);
	}
	ok('edge SSR: all zeros / all-zero donut give the empty state or bars of no height, never a crash', /rt-chart__empty/.test(edge['donut: every value zero is the empty state']));
	// dates as categories: short on the axis, long in the table / tooltip / aria
	const monthly = html(charts.BarChart, { data: [0, 1, 2].map((m) => ({ d: new Date(2026, m, 1), v: 10 + m })), x: 'd', y: 'v', label: 'По месяцам' });
	ok('BarChart SSR: Date categories are short on the axis ("янв.") and long in the data table ("Январь 2026")', />янв\.</.test(monthly) && /<th scope="row">Январь 2026<\/th>/.test(monthly), (monthly.match(/rt-chart__tick--x[^>]*>[^<]*/g) ?? []).join(' | ').slice(0, 200));
	ok('LineChart SSR: an explicit yMax clips the marks to the plot (clipPath + clip-path), a default chart has none', /clipPath id="[^"]+-plot"/.test(html(charts.LineChart, { data: rows, x: 'month', y: 'fact', yMax: 5 })) && !/clipPath/.test(html(charts.LineChart, { data: rows, x: 'month', y: 'fact' })));
	const pie = html(charts.PieChart, { data: cats, name: 's', value: 'a' });
	ok('PieChart SSR: slices, no centre', (pie.match(/class="rt-chart__slice"/g) ?? []).length === 2 && !/rt-chart__center-value/.test(pie));

	const spark = html(charts.Sparkline, { data: [1, 3, 2, 5], type: 'area', label: 'Тренд' });
	ok('Sparkline SSR: svg + line + area + summary in aria-label', /<svg[^>]*aria-label="Тренд: 4 значения/.test(spark) && /rt-chart__line/.test(spark) && /rt-chart__area/.test(spark) && !/NaN|undefined/.test(spark));

	ok('Empty data SSR: empty state, no svg geometry', /rt-chart__empty/.test(html(charts.LineChart, { data: [], x: 'm', y: 'v' })) && /rt-chart__empty/.test(html(charts.BarChart, { data: [], x: 'm', y: 'v' })) && /rt-chart__empty/.test(html(charts.DonutChart, { data: [], name: 'n', value: 'v' })));
	ok('Single point SSR: a dot is drawn', /rt-chart__dot/.test(html(charts.LineChart, { data: [{ m: 'A', v: 5 }], x: 'm', y: 'v' })));

	// a provider that switches motion ON must not empty the server output (the draw-in starts on the client)
	const inProvider = render(provider, { props: { mode: 'svelte', children: () => {} } }).body;
	ok('ExtMotionProvider SSR renders', typeof inProvider === 'string');
	const { default: Wrap } = await vite.ssrLoadModule('/tools/ssr-wrap.svelte').catch(() => ({ default: null }));
	if (Wrap) {
		const wrapped = render(Wrap, { props: { data: rows } }).body;
		ok('LineChart SSR inside ExtMotionProvider(mode=svelte): drawn, not clipped away', /class="rt-chart__line/.test(wrapped) && !/clipPath/.test(wrapped));
		// the same convention as the ext components: own prop > provider `overrides.chart` > provider mode > off (prefers-reduced-motion is checked in the browser)
		const motionOf = (props) => (render(Wrap, { props: { data: rows, ...props } }).body.match(/data-motion="(on|off)"/) ?? [])[1];
		ok('motion convention: provider mode=svelte turns the chart on', motionOf({}) === 'on');
		ok('motion convention: provider mode=off leaves it off', motionOf({ mode: 'off' }) === 'off');
		ok('motion convention: overrides.chart="off" wins over the provider mode', motionOf({ overrides: { chart: 'off' } }) === 'off');
		ok('motion convention: the own `animate` prop wins over overrides.chart', motionOf({ overrides: { chart: 'off' }, animate: true }) === 'on');
		ok('motion convention: `animate={false}` wins over the provider mode', motionOf({ animate: false }) === 'off');
		ok('motion convention: `animate` alone (mode=off provider) turns the chart on', motionOf({ mode: 'off', animate: true }) === 'on');
	}
	ok('motion convention: no provider = off (the default)', /data-motion="off"/.test(html(charts.LineChart, { data: rows, x: 'month', y: 'fact' })));

	// the entry module itself: helpers work without a DOM
	ok('helpers: chartColor / chartRamp / niceTicks / formatters', charts.chartColor(0) === 'var(--rt-chart-1)' && charts.chartColor(10) === 'var(--rt-chart-1)' && charts.chartRamp(3).length === 3 && charts.niceTicks(0, 97, 5).values.join() === '0,20,40,60,80,100' && charts.createCompactFormat('ru-RU')(1250000).includes('млн'));
} finally {
	await vite.close();
}
process.exit(failed ? 1 : 0);
