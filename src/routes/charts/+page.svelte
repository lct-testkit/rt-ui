<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Demo of the author's chart module (route /charts): a realistic CRM dashboard (revenue by month, deals by stage, a conversion funnel,
	// lead sources, sparklines inside a TableGrid) and, below it, every variant and state of every chart. Built from rt-ui components plus
	// `$lib/charts`; all colours come from the design-system tokens, so the theme switch (4 themes) needs no chart code. Motion is OFF by
	// default: the switch turns the author's ExtMotionProvider on (draw-in, morph of the data, hover emphasis).
	//
	// Deep links: /charts?theme=rtk_purple_dark&motion=1   (motion=0|1|tween|spring)
	import { onMount } from 'svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import { TableGrid, type TableGridColumn, type TableGridRow } from '$lib/components/TableGrid';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { BarChart, DonutChart, LineChart, PieChart, Sparkline, chartRamp, createNumberFormat } from '$lib/charts';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
	import { prefersReducedMotion } from '$lib/ext/motion.svelte.js';
	import { DEALS, FUNNEL, MANAGERS, REGIONS, REVENUE, SOURCES, SPARK, STAGES, shuffled, type ManagerRow, type MonthRow } from './data.js';

	const THEMES = [
		{ key: 'rtk_default_light', value: 'Rostelecom · светлая' },
		{ key: 'rtk_default_dark', value: 'Rostelecom · тёмная' },
		{ key: 'rtk_purple_light', value: 'Purple · светлая' },
		{ key: 'rtk_purple_dark', value: 'Purple · тёмная' }
	];
	let theme = $state('rtk_default_light');
	let motionOn = $state(false);
	let engine = $state<'tween' | 'spring'>('tween');
	const mode = $derived(motionOn ? 'svelte' : 'off');
	/** charts are re-created when the motion mode changes, so the draw-in plays again */
	const motionKey = $derived(`${motionOn}-${engine}`);

	// ─── dashboard state ─────────────────────────────────────────────────────────────────────────────────────────
	let metric = $state<'revenue' | 'deals'>('revenue');
	let revenue = $state<MonthRow[]>(REVENUE);
	let deals = $state<MonthRow[]>(DEALS);
	let refreshes = 0;
	const rows = $derived(metric === 'revenue' ? revenue : deals);
	const rub = createNumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
	const num = createNumberFormat('ru-RU');
	const money = (v: number) => (metric === 'revenue' ? rub(v) : `${num(v)} шт.`);
	function refresh() {
		refreshes++;
		revenue = shuffled(REVENUE, 100 + refreshes);
		// deals: a deterministic wobble of the fact, so a press always changes the picture
		deals = DEALS.map((r, i) => ({ ...r, fact: r.fact === null ? null : Math.max(8, Math.round(r.fact * (0.85 + ((refreshes * 7 + i * 3) % 11) / 30))) }));
	}

	/** the "empty state" card: data arrives later (the draw-in plays then) */
	let lateData = $state(false);
	/** what the last click / Enter on a chart selected (`onSelect`) */
	let selection = $state('');
	const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' });
	let stacked = $state(true);
	const stageSeries = [
		{ key: 'small', label: 'Малые', y: 'small' as const },
		{ key: 'mid', label: 'Средние', y: 'mid' as const },
		{ key: 'large', label: 'Крупные', y: 'large' as const }
	];
	const funnelColors = chartRamp(FUNNEL.length);
	const pct = (v: number) => `${Math.round((v / FUNNEL[0].count) * 100)} %`;

	// ─── managers table ──────────────────────────────────────────────────────────────────────────────────────────
	interface Row extends TableGridRow {
		id: number;
		name: string;
		deals: number;
		revenue: string;
		conversion: string;
		weeks: number[];
	}
	const tableRows: Row[] = MANAGERS.map((m: ManagerRow) => ({
		id: m.id,
		name: m.name,
		deals: m.deals,
		revenue: rub(m.revenue),
		conversion: `${m.conversion.toString().replace('.', ',')} %`,
		weeks: m.weeks
	}));
	const columns: TableGridColumn<Row>[] = [
		{ name: 'name', title: 'Менеджер', size: { width: 'minmax(180px, 2fr)' } },
		{ name: 'deals', title: 'Сделки', align: 'right', size: { width: 100 } },
		{ name: 'revenue', title: 'Выручка', align: 'right', size: { width: 150 } },
		{ name: 'conversion', title: 'Конверсия', align: 'right', size: { width: 120 } },
		{ name: 'weeks', title: 'Динамика, 12 недель', size: { width: 'minmax(180px, 1.4fr)' }, render: trendCell }
	];

	// ─── page plumbing ───────────────────────────────────────────────────────────────────────────────────────────
	let prevBody = '';
	onMount(() => {
		prevBody = document.body.className;
		const u = new URLSearchParams(location.search);
		if (u.has('theme')) theme = u.get('theme')!;
		const m = u.get('motion');
		if (m && m !== '0' && m !== 'off') {
			motionOn = true;
			if (m === 'spring') engine = 'spring';
		}
		return () => {
			document.body.className = prevBody;
		};
	});
	$effect(() => {
		// `rt-base` = the opt-in app base layer: font + text colour for the original components
		document.body.className = `Theme_root_${theme} rt-base rt-charts-demo`;
	});
</script>

<svelte:head><title>rt-ui · графики</title></svelte:head>

{#snippet trendCell(row: Row)}
	{@const up = row.weeks[row.weeks.length - 1] >= row.weeks[0]}
	<div class="trend" data-testid="trend-cell">
		<Sparkline data={row.weeks} type="area" height={32} color={up ? 'var(--atmr-success-default)' : 'var(--atmr-error-default)'} label="Выручка {row.name} по неделям" />
	</div>
{/snippet}

{#snippet kpi(title: string, value: string, delta: string, good: boolean, data: number[], slot: number, testid: string, type: 'area' | 'line' | 'bar' = 'area')}
	<div class="card kpi" data-testid={testid}>
		<Typography variant="body-s" as="span" class="muted">{title}</Typography>
		<div class="kpi__row">
			<Typography variant="heading-h2" as="span">{value}</Typography>
			<Badge size="s" variant="secondary" colorScheme={good ? 'success' : 'error'} label={delta} />
		</div>
		<Sparkline {data} {type} height={40} color="var(--rt-chart-{slot})" label={title} />
	</div>
{/snippet}

{#snippet cardHead(title: string, sub?: string)}
	<div class="card__head">
		<Typography variant="heading-h5" as="h2">{title}</Typography>
		{#if sub}<Typography variant="description-l" as="span" class="muted">{sub}</Typography>{/if}
	</div>
{/snippet}

<ExtMotionProvider {mode} type={engine}>
	<main class="page">
		<header class="head">
			<Typography variant="heading-h3" as="h1">Дашборд продаж</Typography>
			<Badge size="s" variant="primary" colorScheme="warning" label="Графики — авторский модуль, вне оригинала" data-testid="charts-badge" />
			<div class="spacer"></div>
			<div class="ctl" data-testid="motion-ctl">
				<Switch size="s" label="Анимации" checked={motionOn} onChange={(v: boolean) => (motionOn = v)} data-testid="motion-switch" />
				{#if motionOn}
					<SegmentedControl size="s" value={engine} onChange={(i: string) => (engine = i as 'tween' | 'spring')}>
						<Segment index="tween" label="Tween" data-testid="engine-tween" />
						<Segment index="spring" label="Spring" data-testid="engine-spring" />
					</SegmentedControl>
				{/if}
			</div>
			<div class="theme"><Select size="s" items={THEMES} value={theme} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k) => k && (theme = String(k))} data-testid="theme-select" /></div>
		</header>

		<Typography variant="body-s" as="p" class="note">
			Модуль <code>@lct-testkit/rt-ui/charts</code>: SVG-графики без зависимостей, цвета — только из токенов дизайн-системы (<code>--atmr-*</code>), поэтому все четыре темы работают без кода.
			Анимации выключены по умолчанию (как у остальных расширений) и подчиняются <code>ExtMotionProvider</code> и <code>prefers-reduced-motion</code>
			{#if prefersReducedMotion()}— сейчас системная настройка «уменьшить движение» включена: анимаций нет{/if}.
		</Typography>

		<Typography variant="body-s" as="p" class="note" data-testid="selection">
			{selection ? `Выбрано: ${selection}` : 'Клик по графику (или Enter на точке) вызывает onSelect — результат появится здесь.'}
		</Typography>

		{#key motionKey}
			<section class="grid" data-testid="dashboard" aria-label="Дашборд продаж">
				{@render kpi('Выручка, сентябрь', '12,4 млн ₽', '+8,2 %', true, SPARK.revenue, 1, 'kpi-revenue')}
				{@render kpi('Сделки в работе', '128', '+12', true, SPARK.deals, 2, 'kpi-deals', 'line')}
				{@render kpi('Конверсия в договор', '18,4 %', '−1,2 п.п.', false, SPARK.conversion, 4, 'kpi-conv', 'line')}
				{@render kpi('Средний чек, тыс. ₽', '96,8', '+3,1 %', true, SPARK.check, 3, 'kpi-check')}

				<div class="card span-8">
					<div class="card__head card__head--row">
						<div class="card__title">
							<Typography variant="heading-h5" as="h2">Выручка по месяцам</Typography>
							<Typography variant="description-l" as="span" class="muted">Факт 2026 к плану и к 2025 году</Typography>
						</div>
						<div class="actions">
							<SegmentedControl size="s" value={metric} onChange={(i: string) => (metric = i as 'revenue' | 'deals')}>
								<Segment index="revenue" label="Выручка" data-testid="metric-revenue" />
								<Segment index="deals" label="Договоры" data-testid="metric-deals" />
							</SegmentedControl>
							<Button size="s" variant="outline" colorScheme="neutral" label="Обновить" onclick={refresh} data-testid="refresh" />
						</div>
					</div>
					<LineChart
						data-testid="chart-revenue"
						data={rows}
						x="month"
						series={[
							{ key: 'fact', label: 'Факт 2026', y: 'fact', area: true },
							{ key: 'plan', label: 'План 2026', y: 'plan', dashed: true },
							{ key: 'prev', label: 'Факт 2025', y: 'prev' }
						]}
						smooth
						height={300}
						valueFormat={money}
						onSelect={({ x }) => (selection = `месяц: ${monthName.format(x as Date)}`)}
						label={metric === 'revenue' ? 'Выручка по месяцам: факт 2026, план 2026 и факт 2025' : 'Договоры по месяцам: факт 2026, план 2026 и факт 2025'}
						description="Факт 2026 года известен до сентября включительно."
					/>
				</div>

				<div class="card span-4">
					{@render cardHead('Источники лидов', 'Всего за девять месяцев')}
					<DonutChart data-testid="chart-sources" data={SOURCES} name="source" value="leads" size={190} label="Источники лидов" centerLabel="лидов" onSelect={({ name, value }) => (selection = `источник «${name}» — ${value}`)} />
				</div>

				<div class="card span-6">
					<div class="card__head card__head--row">
						<div class="card__title">
							<Typography variant="heading-h5" as="h2">Сделки по этапам воронки</Typography>
							<Typography variant="description-l" as="span" class="muted">По размеру сделки</Typography>
						</div>
						<Switch size="s" label="Составные столбцы" checked={stacked} onChange={(v: boolean) => (stacked = v)} data-testid="stack-switch" />
					</div>
					<BarChart data-testid="chart-stages" data={STAGES} x="stage" series={stageSeries} {stacked} height={290} label="Сделки по этапам воронки, по размеру сделки" onSelect={({ x }) => (selection = `этап «${x}»`)} />
				</div>

				<div class="card span-6">
					{@render cardHead('Конверсия воронки', 'Доля от числа лидов')}
					<BarChart
						data-testid="chart-funnel"
						data={FUNNEL}
						x="stage"
						y="count"
						yLabel="Компаний"
						horizontal
						color={(_, i) => funnelColors[i]}
						maxBarSize={30}
						valueLabels
						valueLabel={(v) => `${num(v)} · ${pct(v)}`}
						axis={false}
						grid={false}
						height={290}
						label="Воронка продаж: от лидов до договоров"
					/>
				</div>

				<div class="card span-12">
					{@render cardHead('Менеджеры', 'Выручка и динамика по неделям — спарклайны прямо в ячейках TableGrid')}
					<div class="table" data-testid="managers-table">
						<TableGrid id="managers" alignCells {columns} rows={tableRows} style={{ width: '100%' }} />
					</div>
				</div>
			</section>
		{/key}

		<Typography variant="heading-h4" as="h2" class="section-title">Варианты и состояния</Typography>

		{#key motionKey}
			<section class="grid variants" data-testid="variants" aria-label="Варианты графиков">
				<div class="card span-4" data-testid="v-line-smooth">
					{@render cardHead('Линия: сглаженная, с областью', 'smooth · area · одна серия')}
					<LineChart data={REVENUE.filter((r) => r.fact !== null)} x="month" y="fact" smooth area height={230} valueFormat={rub} label="Факт выручки 2026" />
				</div>
				<div class="card span-4" data-testid="v-line-points">
					{@render cardHead('Линия: точки, категории', 'points · легенда снизу')}
					<LineChart
						data={STAGES}
						x="stage"
						series={[
							{ key: 'small', label: 'Малые', y: 'small' },
							{ key: 'mid', label: 'Средние', y: 'mid' },
							{ key: 'large', label: 'Крупные', y: 'large' }
						]}
						points
						legend="bottom"
						height={200}
						label="Сделки по этапам, линии"
					/>
				</div>
				<div class="card span-4" data-testid="v-line-long">
					{@render cardHead('Линия: длинные данные', 'seriesBy · числовая ось x')}
					<LineChart
						data={[1, 2, 3, 4, 5, 6].flatMap((w) => [
							{ week: w, team: 'Север', score: 20 + w * 4 + (w % 2) * 3 },
							{ week: w, team: 'Юг', score: 34 + w * 2 - (w % 3) * 4 }
						])}
						x="week"
						y="score"
						seriesBy="team"
						height={200}
						xFormat={(w) => `нед. ${w}`}
						label="Баллы команд по неделям"
					/>
				</div>
				<div class="card span-4" data-testid="v-line-one">
					{@render cardHead('Линия: одна точка', 'граничный случай')}
					<LineChart data={[{ m: 'Сентябрь', v: 1630000 }]} x="m" y="v" height={170} valueFormat={rub} label="Одно значение" />
				</div>
				<div class="card span-4" data-testid="v-line-empty">
					<div class="card__head card__head--row">
						<div class="card__title">
							<Typography variant="heading-h5" as="h2">Линия: нет данных</Typography>
							<Typography variant="description-l" as="span" class="muted">пустое состояние; данные приходят позже</Typography>
						</div>
						<Button size="s" variant="outline" colorScheme="neutral" label={lateData ? 'Очистить' : 'Загрузить'} onclick={() => (lateData = !lateData)} data-testid="load-data" />
					</div>
					<LineChart data={lateData ? REVENUE.filter((r) => r.fact !== null) : []} x="month" y="fact" smooth area height={170} valueFormat={rub} label={lateData ? 'Факт выручки 2026' : 'Нет данных'} />
				</div>
				<div class="card span-4" data-testid="v-palette">
					{@render cardHead('Палитра', '--rt-chart-1 … --rt-chart-10')}
					<div class="palette rt-chart-palette" data-testid="palette-strip">
						{#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
							<div class="swatch" style="background: var(--rt-chart-{n})" title="--rt-chart-{n}"><span>{n}</span></div>
						{/each}
						<div class="swatch" style="background: var(--rt-chart-other)" title="--rt-chart-other"><span>—</span></div>
					</div>
					<Typography variant="description-l" as="p" class="muted">Ступени рампов accent / status / info / success / warning, слегка сдвинутые к цвету текста темы: тёмнее на светлом фоне, светлее на тёмном.</Typography>
				</div>
				<div class="card span-4" data-testid="v-bar-grouped">
					{@render cardHead('Столбцы: группами', 'grouped · вертикальные')}
					<BarChart data={STAGES} x="stage" series={stageSeries} height={230} label="Сделки по этапам, группами" />
				</div>
				<div class="card span-4" data-testid="v-bar-stacked">
					{@render cardHead('Столбцы: составные', 'stacked · итог в подписи')}
					<BarChart data={STAGES} x="stage" series={stageSeries} stacked valueLabels height={230} label="Сделки по этапам, составные столбцы" />
				</div>
				<div class="card span-4" data-testid="v-bar-horizontal">
					{@render cardHead('Столбцы: горизонтальные', 'horizontal · grouped')}
					<BarChart data={STAGES} x="stage" series={stageSeries} horizontal height={230} label="Сделки по этапам, горизонтально" />
				</div>
				<div class="card span-4" data-testid="v-bar-hstacked">
					{@render cardHead('Горизонтальные составные', 'horizontal · stacked · значения')}
					<BarChart data={STAGES} x="stage" series={stageSeries} horizontal stacked valueLabels height={230} label="Сделки по этапам, составные горизонтальные" />
				</div>
				<div class="card span-4" data-testid="v-custom-colors">
					{@render cardHead('Свои цвета', 'colors=[…] и --rt-chart-N')}
					<BarChart
						data={STAGES}
						x="stage"
						series={[
							{ key: 'small', label: 'Малые', y: 'small' },
							{ key: 'mid', label: 'Средние', y: 'mid' }
						]}
						colors={['var(--atmr-success-default)', 'var(--atmr-neutral-soft)']}
						stacked
						height={230}
						label="Сделки по этапам, свои цвета"
					/>
				</div>
				<div class="card span-4" data-testid="v-time-axis">
					{@render cardHead('Ось времени', 'дни · недели · месяцы выбираются сами')}
					<LineChart
						data={Array.from({ length: 60 }, (_, i) => ({ d: new Date(2026, 6, 20 + i), v: 40 + Math.round(18 * Math.sin(i / 5) + i * 0.6) }))}
						x="d"
						y="v"
						smooth
						area
						height={260}
						label="Звонки по дням"
					/>
				</div>
				<div class="card span-4" data-testid="v-donut-center">
					{@render cardHead('Кольцо: своя середина', 'center — сниппет, при наведении — доля')}
					<DonutChart data={SOURCES} name="source" value="leads" size={170} label="Источники лидов">
						{#snippet center({ total, active })}
							<span class="center-big">{active ? Math.round(active.share * 100) + ' %' : num(total)}</span>
							<span class="center-small">{active ? active.name : 'лидов'}</span>
						{/snippet}
					</DonutChart>
				</div>
				<div class="card span-4" data-testid="v-pie">
					{@render cardHead('Круговая', 'PieChart')}
					<PieChart data={REGIONS} name="region" value="deals" size={170} label="Сделки по регионам" />
				</div>
				<div class="card span-4" data-testid="v-spark">
					{@render cardHead('Спарклайны', 'line · area · bar · smooth · пустой · одна точка')}
					<div class="sparks">
						{#each [{ t: 'line', d: SPARK.revenue }, { t: 'area', d: SPARK.deals }, { t: 'bar', d: SPARK.weekly }] as s (s.t)}
							<div class="spark-row"><span>{s.t}</span><Sparkline data={s.d} type={s.t as 'line' | 'area' | 'bar'} height={32} color="var(--rt-chart-{s.t === 'line' ? 1 : s.t === 'area' ? 2 : 4})" /></div>
						{/each}
						<div class="spark-row"><span>smooth</span><Sparkline data={SPARK.check} smooth type="area" height={32} color="var(--rt-chart-3)" /></div>
						<div class="spark-row"><span>пустой</span><Sparkline data={[]} height={32} /></div>
						<div class="spark-row"><span>1 точка</span><Sparkline data={[5]} height={32} /></div>
					</div>
				</div>
			</section>
		{/key}
	</main>
</ExtMotionProvider>

<style>
	:global(body.rt-charts-demo) {
		margin: 0;
		background: var(--atmr-bg-page-filled);
		color: var(--atmr-fg-default);
		font-family: var(--atmr-font-family-body);
	}
	.page {
		box-sizing: border-box;
		max-width: 1240px;
		margin: 0 auto;
		padding: var(--atmr-spacing-6x) var(--atmr-spacing-4x) var(--atmr-spacing-16x);
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-4x);
	}
	.head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
	}
	.spacer {
		flex: 1;
	}
	.ctl {
		display: flex;
		align-items: center;
		gap: var(--atmr-spacing-3x);
	}
	.theme {
		width: 230px;
	}
	:global(.rt-charts-demo .note) {
		margin: 0;
		color: var(--atmr-fg-soft);
	}
	:global(.rt-charts-demo .muted) {
		color: var(--atmr-fg-soft);
	}
	:global(.rt-charts-demo .section-title) {
		margin: var(--atmr-spacing-6x) 0 0;
	}
	code {
		font-size: 0.9em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: var(--atmr-spacing-4x);
	}
	.card {
		grid-column: span 12;
		box-sizing: border-box;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-3x);
		padding: var(--atmr-spacing-5x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-muted);
		background: var(--atmr-bg-elevated-s);
	}
	.kpi {
		grid-column: span 3;
		gap: var(--atmr-spacing-1x);
	}
	.kpi__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--atmr-spacing-3x);
		margin-bottom: var(--atmr-spacing-2x);
	}
	.span-4 {
		grid-column: span 4;
	}
	.span-6 {
		grid-column: span 6;
	}
	.span-8 {
		grid-column: span 8;
	}
	.span-12 {
		grid-column: span 12;
	}
	.card__head {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.card__head--row {
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-3x);
	}
	.card__title {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--atmr-spacing-3x);
	}
	.table {
		min-width: 0;
	}
	/* `alignCells` puts the align class on the body cells, but the ported stylesheet only styles it on header cells: right-align the numbers here */
	.table :global(.atmr-tablegrid__cell--align-right:not(.atmr-tablegrid__cell--header)) {
		text-align: right;
	}
	.trend {
		width: 100%;
		min-width: 0;
		padding: var(--atmr-spacing-1x) 0;
	}
	.palette {
		display: grid;
		grid-template-columns: repeat(11, minmax(0, 1fr));
		gap: var(--atmr-spacing-1x);
	}
	.swatch {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 44px;
		padding-bottom: 4px;
		border-radius: var(--atmr-border-radius-xs);
		color: var(--atmr-static-white);
		font: var(--atmr-font-description-s-strong);
		text-shadow: 0 0 3px rgb(0 0 0 / 0.45);
	}
	.sparks {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-2x);
	}
	.spark-row {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr);
		align-items: center;
		gap: var(--atmr-spacing-3x);
		color: var(--atmr-fg-soft);
		font: var(--atmr-font-description-l);
	}
	.center-big {
		font: var(--atmr-font-heading-h3);
	}
	.center-small {
		max-width: 100%;
		overflow: hidden;
		color: var(--atmr-fg-soft);
		font: var(--atmr-font-description-l);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media (max-width: 1100px) {
		.kpi {
			grid-column: span 6;
		}
		.span-4,
		.span-6,
		.span-8 {
			grid-column: span 12;
		}
	}
	@media (max-width: 640px) {
		.kpi {
			grid-column: span 12;
		}
		.theme {
			width: 100%;
		}
	}
</style>
