<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts" generics="T">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Line chart (SVG, zero dependencies): one or several series, straight or smooth (monotone: never overshoots the data) lines, an area
	// wash under them, markers, a crosshair that snaps to the nearest x and a tooltip that lists every series at that x. Categories,
	// numbers and dates on the x axis (dates get a calendar-aware time axis). Colours from the design-system palette (--rt-chart-N).
	//
	//   <LineChart data={rows} x="month" series={[{ key: 'fact', label: 'Факт', y: 'fact' }, { key: 'plan', y: 'plan', dashed: true }]} smooth area />
	//
	// Wide data: one row per x, a `series` list reads one field each. Long data: `y` + `seriesBy` group the rows. Accessors are property names or
	// functions. Accessible: the SVG is `role="img"` with an `aria-label`, a visually hidden summary + data table follow it, and the data points are
	// real focusable buttons (roving tabindex, arrows / Home / End) that show the same tooltip as the pointer. Motion is OFF unless `animate` / the
	// ExtMotionProvider turns it on (draw-in, morph on data change, glide of the crosshair; prefers-reduced-motion always wins).
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import './charts.css';
	import Axis from './Axis.svelte';
	import ChartTooltip from './ChartTooltip.svelte';
	import Grid from './Grid.svelte';
	import Legend from './Legend.svelte';
	import { describeSeries } from './internal/a11y.js';
	import { buildXY, extent, xLabelOf } from './internal/data.js';
	import { createCompactFormat, createNumberFormat, createTickDateFormat, estimateTextWidth } from './internal/format.js';
	import { useChartMotion } from './internal/motion.svelte.js';
	import { areaPath, linePath, type Pt } from './internal/path.js';
	import { clamp, fitTicks, linearScale, niceTicks, tickCountFor, timeTicks } from './internal/scale.js';
	import { useActive } from './internal/useActive.svelte.js';
	import { useElementSize } from './internal/useSize.svelte.js';
	import type { AxisTick, LegendItem, LineChartProps, TooltipModel } from './types.js';


	let {
		data,
		x,
		y,
		yLabel,
		series,
		seriesBy,
		xType = 'auto',
		height = 280,
		width,
		smooth = false,
		area = false,
		points = false,
		crosshair = true,
		tooltip = true,
		tooltipContent,
		legend,
		grid = true,
		yTicks,
		yMin,
		yMax,
		yZero,
		xFormat,
		tickFormat,
		valueFormat,
		hidden = $bindable([]),
		onSelect,
		label,
		description,
		emptyText = 'Нет данных',
		locale = 'ru-RU',
		colors,
		animate,
		class: className,
		...rest
	}: LineChartProps<T> = $props();

	const uid = $props.id();
	const motion = useChartMotion(() => animate);
	// the data usually arrives after the chart is mounted: draw it in when the empty state gives way to a chart
	let seen = false;
	let wasEmpty = false;
	$effect(() => {
		const e = empty;
		untrack(() => {
			if (seen && wasEmpty && !e) motion.replay();
			wasEmpty = e;
			seen = true;
		});
	});

	// ─── data ────────────────────────────────────────────────────────────────────────────────────────────────────
	const xy = $derived(buildXY({ data, x, series, y, seriesBy, xType: xType === 'auto' ? 'auto' : xType, colors, singleLabel: yLabel }));
	const N = $derived(xy.raw.length);
	const S = $derived(xy.series.length);
	const visible = $derived(xy.series.map((s) => !hidden.includes(s.key)));
	const empty = $derived(N === 0 || xy.series.every((s) => s.values.every((v) => v === null)));
	const fmtValue = $derived(valueFormat ?? createNumberFormat(locale));
	const fmtTick = $derived(tickFormat ?? createCompactFormat(locale));
	const dates = $derived(xy.raw.filter((v): v is Date => v instanceof Date));
	const xLabel = (i: number) => (xFormat ? xFormat(xy.raw[i], i) : xLabelOf(xy.raw[i], xy.kind, locale, dates));
	const xLabels = $derived(xy.raw.map((_, i) => xLabel(i)));
	/** what a category axis prints: dates are short ("июл."), the tooltip keeps the long form */
	const xAxisLabels = $derived(xy.raw.map((v, i) => (xFormat ? xFormat(v, i) : xLabelOf(v, xy.kind, locale, dates, true))));

	// ─── geometry ────────────────────────────────────────────────────────────────────────────────────────────────
	let plotEl = $state<HTMLElement>();
	const size = useElementSize(
		() => plotEl,
		{ width: 560, height: 280 },
		() => width
	);
	const W = $derived(Math.max(120, size.width));
	const H = $derived(Math.max(80, height));
	const TOP = 10;
	const BOTTOM = 28;
	const RIGHT = 12;

	// y domain: nice ticks over the VISIBLE series
	const yInfo = $derived.by(() => {
		const ext = extent(xy.series.flatMap((s, i) => (visible[i] ? s.values : [])));
		let lo = ext ? ext[0] : 0;
		let hi = ext ? ext[1] : 1;
		if (yZero ?? (area || xy.series.some((s) => s.area))) {
			lo = Math.min(lo, 0);
			hi = Math.max(hi, 0);
		}
		if (yMin !== undefined) lo = yMin;
		if (yMax !== undefined) hi = yMax;
		return fitTicks(lo, hi, H - TOP - BOTTOM, yTicks ?? tickCountFor(H - TOP - BOTTOM, 48), 22);
	});
	const yLabelW = $derived(Math.max(...yInfo.values.map((v) => estimateTextWidth(fmtTick(v)))));
	const LEFT = $derived(Math.max(28, Math.ceil(yLabelW) + 14));
	const plotW = $derived(Math.max(40, W - LEFT - RIGHT));
	const plotH = $derived(Math.max(40, H - TOP - BOTTOM));
	const padX = 10;

	/** x of every position, px inside the plot */
	const xPx = $derived.by(() => {
		if (N === 0) return [];
		if (xy.kind === 'category') return xy.num.map((_, i) => ((i + 0.5) * plotW) / N);
		const ext = extent(xy.num) as [number, number];
		const sc = linearScale(ext, [padX, plotW - padX]);
		return xy.num.map((v) => sc(v));
	});

	const xTicksList = $derived.by((): AxisTick[] => {
		if (N === 0) return [];
		if (xy.kind === 'category') {
			const maxW = Math.max(...xAxisLabels.map((l) => estimateTextWidth(l)));
			const every = Math.max(1, Math.ceil((maxW + 12) / (plotW / N)));
			return xAxisLabels.map((l, i) => ({ value: i, pos: xPx[i], label: l })).filter((_, i) => i % every === 0);
		}
		const [x0, x1] = extent(xy.num) as [number, number];
		if (x0 === x1) return [{ value: x0, pos: xPx[0], label: xLabel(0) }];
		const sc = linearScale([x0, x1], [padX, plotW - padX]);
		// as many ticks as fit (labels + a gap), never fewer than two inside the domain
		const room = (labelW: number) => clamp(Math.floor(plotW / (labelW + 28)), 2, 10);
		if (xy.kind === 'time') {
			let count = room(estimateTextWidth('сент. 30'));
			let t = timeTicks(x0, x1, count);
			while (t.values.length < 2 && count < 10) t = timeTicks(x0, x1, ++count);
			const f = createTickDateFormat(t.unit, locale);
			return t.values.map((v) => ({ value: v, pos: sc(v), label: xFormat ? xFormat(new Date(v), -1) : f(v) }));
		}
		const whole = xy.num.every((v) => Number.isInteger(v));
		const inside = (count: number) => niceTicks(x0, x1, count, { integer: whole }).values.filter((v) => v >= x0 - 1e-9 && v <= x1 + 1e-9);
		const label = (v: number) => (xFormat ? xFormat(v, -1) : fmtValue(v));
		let count = room(Math.max(...inside(4).map((v) => estimateTextWidth(label(v)))));
		let ticks = inside(count);
		while (ticks.length < 2 && count < 10) ticks = inside(++count);
		return ticks.map((v) => ({ value: v, pos: sc(v), label: label(v) }));
	});

	// ─── motion: everything that changes with the data goes through one array so it glides together ──────────────────
	const flat = $derived([yInfo.domain[0], yInfo.domain[1], ...visible.map((v) => (v ? 1 : 0)), ...xy.series.flatMap((s) => s.values.map((v) => (v === null ? NaN : v)))]);
	const anim = motion.follow(() => flat);
	const disp = $derived.by(() => {
		const a = anim.current;
		return {
			y0: a[0],
			y1: a[1],
			presence: a.slice(2, 2 + S),
			values: xy.series.map((_, si) => a.slice(2 + S + si * N, 2 + S + (si + 1) * N))
		};
	});
	const yScale = $derived(linearScale([disp.y0, disp.y1], [plotH, 0]));

	// emphasis: hovering / focusing a legend item dims the other series
	let hoverKey = $state<string | null>(null);
	const emph = motion.follow(() => xy.series.map((s) => (hoverKey && s.key !== hoverKey ? 0.22 : 1)));

	const shapes = $derived(
		xy.series.map((s, si) => {
			const pts: (Pt | null)[] = xPx.map((px, i) => {
				const v = disp.values[si]?.[i];
				return v === undefined || !Number.isFinite(v) ? null : [px, yScale(v)];
			});
			const wash = s.area ?? area;
			const base = clamp(yScale(0), 0, plotH);
			return {
				key: s.key,
				color: s.color,
				dashed: !!s.dashed,
				opacity: (disp.presence[si] ?? 1) * (emph.current[si] ?? 1),
				line: linePath(pts, smooth),
				area: wash ? areaPath(pts, base, smooth) : '',
				pts
			};
		})
	);

	// ─── interaction: one active position for the pointer and the keyboard ─────────────────────────────────────────
	let hitsEl = $state<HTMLElement>();
	const act = useActive({ count: () => N, hits: () => hitsEl, onSelect: (index) => onSelect?.({ index, x: xy.raw[index] }) });
	const shown = $derived(act.shown);
	const activeOn = $derived(act.active !== null);
	const tipModel = $derived.by((): TooltipModel | null => {
		if (N === 0) return null;
		const i = shown;
		return {
			index: i,
			title: xLabels[i] ?? '',
			rows: xy.series
				.map((s, si) => ({
					key: s.key,
					label: s.label,
					value: s.values[i],
					text: s.values[i] === null ? '—' : fmtValue(s.values[i] as number),
					color: s.color,
					active: hoverKey === s.key,
					on: visible[si]
				}))
				.filter((r) => r.on)
				.map(({ on: _on, ...r }) => r)
		};
	});
	const anchorY = $derived.by(() => {
		let top = plotH / 2;
		let found = false;
		xy.series.forEach((s, si) => {
			const v = s.values[shown];
			if (visible[si] && v !== null) {
				const py = yScale(v);
				if (!found || py < top) top = py;
				found = true;
			}
		});
		return top;
	});
	const glide = motion.pointer(() => [xPx[shown] ?? 0, anchorY, activeOn ? 1 : 0]);

	function nearest(px: number): number {
		let best = 0;
		let d = Infinity;
		for (let i = 0; i < xPx.length; i++) {
			const dd = Math.abs(xPx[i] - px);
			if (dd < d) {
				d = dd;
				best = i;
			}
		}
		return best;
	}
	function onPointer(e: PointerEvent) {
		if (!plotEl || empty) return;
		const r = plotEl.getBoundingClientRect();
		const px = e.clientX - r.left - LEFT;
		const py = e.clientY - r.top - TOP;
		if (px < -LEFT / 2 || px > plotW + RIGHT || py < -TOP || py > plotH + 4) act.pointer(null);
		else act.pointer(nearest(px));
	}
	function click() {
		if (act.active !== null) onSelect?.({ index: act.active, x: xy.raw[act.active] });
	}
	function toggle(key: string) {
		const on = hidden.includes(key);
		// the last visible series stays: a chart without a series says nothing
		if (!on && visible.filter(Boolean).length <= 1) return;
		hidden = on ? hidden.filter((k) => k !== key) : [...hidden, key];
	}

	// ─── legend, texts for assistive technology ─────────────────────────────────────────────────────────────────
	const legendPos = $derived(legend === false || legend === 'none' ? null : legend === 'bottom' ? 'bottom' : legend === true || legend === 'top' ? 'top' : S > 1 ? 'top' : null);
	const legendItems = $derived<LegendItem[]>(xy.series.map((s, si) => ({ key: s.key, label: s.label, color: s.color, hidden: !visible[si], marker: 'line' })));
	const title = $derived(label ?? 'График');
	const summary = $derived(
		[
			`${title}.`,
			description,
			N ? `${N} ${N === 1 ? 'точка' : 'точек'} по оси X: от «${xLabels[0]}» до «${xLabels[N - 1]}».` : '',
			...xy.series.map((s) => describeSeries(s.label, s.values, xLabels, fmtValue) + (hidden.includes(s.key) ? ' (скрыт)' : ''))
		]
			.filter(Boolean)
			.join(' ')
	);
	const clipId = $derived(`${uid}-clip`);
	/** an explicit yMin / yMax may cut the data: then the marks are clipped to the plot (a margin keeps the strokes and markers whole) */
	const bounded = $derived(yMin !== undefined || yMax !== undefined);
	const reveal = $derived(motion.intro < 1);
	const markerOn = $derived(points || N === 1);
</script>

<div class={clsx('rt-chart', 'rt-chart--line', className)} data-motion={motion.enabled ? 'on' : 'off'} {...rest}>
	{#if legendPos === 'top'}
		<Legend items={legendItems} onToggle={toggle} onHighlight={(k) => (hoverKey = k)} label="Ряды: {title}" />
	{/if}

	<!-- pointer only: the keyboard has its own layer of buttons below -->
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div class="rt-chart__plot" bind:this={plotEl} style:height="{H}px" style:width={width ? `${width}px` : undefined} style:max-width="100%" onpointermove={onPointer} onpointerdown={onPointer} onpointerleave={() => act.clear()} onclick={click}>
		{#if empty}
			<div class="rt-chart__empty" role="img" aria-label="{title}: {emptyText}">{emptyText}</div>
		{:else}
			<svg class="rt-chart__svg" role="img" aria-label={title} aria-describedby="{uid}-sum" viewBox="0 0 {W} {H}" preserveAspectRatio="xMinYMin meet" width="100%" height="100%">
				<defs>
					{#if bounded}
						<clipPath id="{uid}-plot"><rect x="-8" y="-8" width={plotW + 16} height={plotH + 16} /></clipPath>
					{/if}
					{#if reveal}
						<clipPath id={clipId}><rect x="-6" y="-6" width={(plotW + 12) * motion.intro} height={plotH + 12} /></clipPath>
					{/if}
				</defs>
				<g transform="translate({LEFT} {TOP})">
					{#if grid}
						<Grid ticks={yInfo.values.map((v) => ({ value: v, pos: yScale(v), label: '' }))} length={plotW} />
					{/if}
					<g clip-path={bounded ? `url(#${uid}-plot)` : undefined}>
					<g clip-path={reveal ? `url(#${clipId})` : undefined}>
						{#each shapes as s (s.key)}
							{#if s.area}
								<path class="rt-chart__area" d={s.area} style="--rt-c: {s.color}" opacity={s.opacity} data-series={s.key} />
							{/if}
						{/each}
						{#each shapes as s (s.key)}
							<path class={clsx('rt-chart__line', s.dashed && 'rt-chart__line--dashed')} d={s.line} style="--rt-c: {s.color}" opacity={s.opacity} data-series={s.key} />
						{/each}
						{#if markerOn}
							{#each shapes as s (s.key)}
								<g style="--rt-c: {s.color}" opacity={s.opacity} data-series={s.key}>
									{#each s.pts as p, i (i)}
										{#if p}<circle class="rt-chart__dot" cx={p[0]} cy={p[1]} r="4" />{/if}
									{/each}
								</g>
							{/each}
						{/if}
					</g>
					</g>
					<g transform="translate(0 {plotH})">
						<Axis orient="bottom" ticks={xTicksList} length={plotW} />
					</g>
					<Axis orient="left" ticks={yInfo.values.map((v) => ({ value: v, pos: yScale(v), label: fmtTick(v) }))} length={plotH} line={false} />

					{#if (crosshair || tooltip) && N > 0}
						<g class="rt-chart__cursor" opacity={glide.current[2] ?? (activeOn ? 1 : 0)} data-active={activeOn ? 'true' : 'false'}>
							{#if crosshair}
								<line class="rt-chart__crosshair" x1={Math.round(glide.current[0]) + 0.5} x2={Math.round(glide.current[0]) + 0.5} y1="0" y2={plotH} />
							{/if}
							{#each shapes as s, si (s.key)}
								{@const v = xy.series[si].values[shown]}
								{#if visible[si] && v !== null}
									<circle class="rt-chart__dot rt-chart__dot--active" style="--rt-c: {s.color}" cx={glide.current[0]} cy={yScale(disp.values[si]?.[shown] ?? v)} r="5" />
								{/if}
							{/each}
						</g>
					{/if}
				</g>
			</svg>

			<div class="rt-chart__sr">
				<p id="{uid}-sum">{summary}</p>
				{#if N <= 400}
					<table>
						<caption>{title}</caption>
						<thead>
							<tr>
								<th scope="col">{xy.kind === 'time' ? 'Дата' : 'Категория'}</th>
								{#each xy.series as s (s.key)}<th scope="col">{s.label}</th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each xLabels as l, i (i)}
								<tr>
									<th scope="row">{l}</th>
									{#each xy.series as s (s.key)}<td>{s.values[i] === null ? '—' : fmtValue(s.values[i] as number)}</td>{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

			<!-- the buttons inside own the keyboard: the arrows are handled once, on their group -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="rt-chart__hits" role="group" aria-label="Точки данных: {title}" bind:this={hitsEl} onkeydown={act.onKey}>
				{#each xLabels as l, i (i)}
					<button
						type="button"
						class="rt-chart__hit"
						tabindex={i === act.roving ? 0 : -1}
						style:left="{LEFT + (xPx[i] ?? 0)}px"
						style:top="{TOP}px"
						aria-label="{l}: {xy.series
							.filter((_, si) => visible[si])
							.map((s) => `${s.label} — ${s.values[i] === null ? 'нет данных' : fmtValue(s.values[i] as number)}`)
							.join('; ')}"
						onfocus={() => act.focusIn(i)}
						onblur={act.focusOut}
					></button>
				{/each}
			</div>

			{#if tooltip}
				<ChartTooltip model={tipModel} x={LEFT + glide.current[0]} y={TOP + glide.current[1]} width={W} height={H} opacity={glide.current[2] ?? (activeOn ? 1 : 0)} content={tooltipContent} marker="line" />
			{/if}
		{/if}
	</div>

	{#if legendPos === 'bottom'}
		<Legend class="rt-chart__legend--bottom" items={legendItems} onToggle={toggle} onHighlight={(k) => (hoverKey = k)} label="Ряды: {title}" />
	{/if}
</div>
