<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts" generics="T">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Bar chart (SVG, zero dependencies): vertical or horizontal bars, grouped or stacked, one or several series. Thin bars with a rounded
	// data end and a square baseline, a 2 px gap between touching bars and stacked segments (real geometry: it needs no knowledge of the
	// background), a value axis with "nice" ticks, optional value labels (only where they fit), a tooltip per category and the same keyboard
	// model as the line chart. A funnel is a horizontal single-series chart whose bars take their colour from `color` (see `chartRamp`).
	//
	//   <BarChart data={stages} x="stage" series={[{ key: 'won', label: 'Выиграно', y: 'won' }, { key: 'lost', y: 'lost' }]} stacked />
	//   <BarChart data={funnel} x="stage" y="count" horizontal color={(_, i) => ramp[i]} valueLabels axis={false} />
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import './charts.css';
	import Axis from './Axis.svelte';
	import ChartTooltip from './ChartTooltip.svelte';
	import Grid from './Grid.svelte';
	import Legend from './Legend.svelte';
	import { describeSeries } from './internal/a11y.js';
	import { buildXY, getter, xLabelOf } from './internal/data.js';
	import { createCompactFormat, createNumberFormat, estimateTextWidth, truncateText, wrapText } from './internal/format.js';
	import { useChartMotion } from './internal/motion.svelte.js';
	import { barPath, type BarEdge } from './internal/path.js';
	import { clamp, fitTicks, linearScale, tickCountFor } from './internal/scale.js';
	import { useActive } from './internal/useActive.svelte.js';
	import { useElementSize } from './internal/useSize.svelte.js';
	import type { AxisTick, BarChartProps, LegendItem, TooltipModel } from './types.js';


	let {
		data,
		x,
		y,
		yLabel,
		series,
		seriesBy,
		horizontal = false,
		stacked = false,
		color,
		height = 280,
		width,
		maxBarSize = 24,
		grid = true,
		axis = true,
		legend,
		tooltip = true,
		tooltipContent,
		valueLabels = false,
		valueLabel,
		yTicks,
		yMin,
		yMax,
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
	}: BarChartProps<T> = $props();

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
	const GAP = 2;
	const RADIUS = 4;

	// ─── data ────────────────────────────────────────────────────────────────────────────────────────────────────
	const xy = $derived(buildXY({ data, x, series, y, seriesBy, xType: 'category', colors, singleLabel: yLabel }));
	const N = $derived(xy.raw.length);
	const S = $derived(xy.series.length);
	const visible = $derived(xy.series.map((s) => !hidden.includes(s.key)));
	const nVisible = $derived(Math.max(1, visible.filter(Boolean).length));
	const empty = $derived(N === 0 || xy.series.every((s) => s.values.every((v) => v === null)));
	const fmtValue = $derived(valueFormat ?? createNumberFormat(locale));
	const fmtTick = $derived(tickFormat ?? createCompactFormat(locale));
	const dates = $derived(xy.raw.filter((v): v is Date => v instanceof Date));
	const cats = $derived(xy.raw.map((v, i) => (xFormat ? xFormat(v, i) : xLabelOf(v, 'category', locale, dates))));
	/** what the category axis prints: the same, but dates are short ("июл.") */
	const catsAxis = $derived(xy.raw.map((v, i) => (xFormat ? xFormat(v, i) : xLabelOf(v, 'category', locale, dates, true))));
	/** per-bar colours of a single series */
	const barColors = $derived.by(() => {
		const cf = color ? getter(color) : undefined;
		return cf && !seriesBy ? data.map((d, i) => cf(d, i)) : undefined;
	});
	const colorOf = (si: number, i: number) => (S === 1 && barColors ? (barColors[i] ?? xy.series[si].color) : xy.series[si].color);

	// ─── value domain ────────────────────────────────────────────────────────────────────────────────────────────
	let plotEl = $state<HTMLElement>();
	const size = useElementSize(
		() => plotEl,
		{ width: 560, height: 280 },
		() => width
	);
	const W = $derived(Math.max(120, size.width));
	const H = $derived(Math.max(80, height));

	const info = $derived.by(() => {
		let lo = 0;
		let hi = 0;
		for (let i = 0; i < N; i++) {
			let pos = 0;
			let neg = 0;
			xy.series.forEach((s, si) => {
				if (!visible[si]) return;
				const v = s.values[i] ?? 0;
				if (stacked) v >= 0 ? (pos += v) : (neg += v);
				else {
					pos = Math.max(pos, v);
					neg = Math.min(neg, v);
				}
			});
			hi = Math.max(hi, pos);
			lo = Math.min(lo, neg);
		}
		if (yMin !== undefined) lo = yMin;
		if (yMax !== undefined) hi = yMax;
		return horizontal
			? fitTicks(lo, hi, W - 120, yTicks ?? tickCountFor(W - 120, 80), 56)
			: fitTicks(lo, hi, H - 40, yTicks ?? tickCountFor(H - 40, 48), 22);
	});
	const valueLabelW = $derived(Math.max(...info.values.map((v) => estimateTextWidth(fmtTick(v)))));

	// ─── layout ──────────────────────────────────────────────────────────────────────────────────────────────────
	const maxCatW = $derived(Math.max(0, ...catsAxis.map((c) => estimateTextWidth(c))));
	const LEFT0 = $derived(horizontal ? Math.min(W * 0.42, Math.ceil(maxCatW) + 14) : axis ? Math.max(28, Math.ceil(valueLabelW) + 14) : 8);
	const RIGHT = $derived(horizontal && valueLabels ? 64 : 12);
	const TOP = $derived(!horizontal && valueLabels ? 24 : 10);
	const plotW0 = $derived(Math.max(40, W - LEFT0 - RIGHT));
	/** category labels under vertical bars: wrapped to two lines when that fits, else rotated (a narrow chart), else thinned out (a crowd) */
	const ROT = -35;
	const labelMode = $derived.by((): 'wrap' | 'rotate' | 'thin' => {
		if (horizontal) return 'wrap';
		const band = plotW0 / Math.max(1, N);
		const fits = catsAxis.every((c) => wrapText(c, band - 8, 2).every((l) => !l.endsWith('…') && estimateTextWidth(l) <= band - 4));
		return fits ? 'wrap' : band >= 24 ? 'rotate' : 'thin';
	});
	/** horizontal bars: the height of one category band (decides whether its label may take two lines) */
	const hBand = $derived((H - 10 - (axis ? 26 : 6)) / Math.max(1, N));
	const catLines = $derived.by(() => {
		if (horizontal) return catsAxis.map((c) => (hBand >= 30 ? wrapText(c, LEFT0 - 14, 2) : [truncateText(c, LEFT0 - 14)]));
		const band = plotW0 / Math.max(1, N);
		if (labelMode === 'wrap') return catsAxis.map((c) => wrapText(c, band - 8, 2));
		return catsAxis.map((c) => [truncateText(c, 150)]);
	});
	const thin = $derived.by(() => {
		if (labelMode !== 'thin') return 1;
		const maxW = Math.max(0, ...catsAxis.map((c) => estimateTextWidth(c)));
		return Math.max(1, Math.ceil((maxW + 12) / (plotW0 / Math.max(1, N))));
	});
	const rotated = $derived(labelMode === 'rotate');
	const catRows = $derived(labelMode === 'wrap' ? Math.max(1, ...catLines.map((l) => l.length)) : 1);
	const rotatedH = $derived(rotated ? Math.ceil(Math.max(0, ...catLines.map((l) => estimateTextWidth(l[0] ?? ''))) * Math.sin((-ROT * Math.PI) / 180) + 12) : 0);
	// a rotated label ends at its tick and reaches to the left of it: the first one must not leave the chart
	const overhang = $derived(rotated ? Math.max(0, Math.ceil(estimateTextWidth(catLines[0]?.[0] ?? '') * Math.cos((-ROT * Math.PI) / 180)) - (LEFT0 + plotW0 / Math.max(1, N) / 2) + 4) : 0);
	const LEFT = $derived(LEFT0 + overhang);
	const plotW = $derived(Math.max(40, W - LEFT - RIGHT));
	const BOTTOM = $derived(horizontal ? (axis ? 26 : 6) : rotated ? 14 + rotatedH : 14 + 14 * catRows + 6);
	const plotH = $derived(Math.max(40, H - TOP - BOTTOM));
	const bandSize = $derived((horizontal ? plotH : plotW) / Math.max(1, N));

	// ─── motion: the values, the domain and the visibility of the series glide together ──────────────────────────────
	const flat = $derived([info.domain[0], info.domain[1], ...visible.map((v) => (v ? 1 : 0)), ...xy.series.flatMap((s) => s.values.map((v) => v ?? 0))]);
	const anim = motion.follow(() => flat);
	const disp = $derived.by(() => {
		const a = anim.current;
		return {
			d0: a[0],
			d1: a[1],
			presence: a.slice(2, 2 + S),
			values: xy.series.map((_, si) => a.slice(2 + S + si * N, 2 + S + (si + 1) * N))
		};
	});
	const vScale = $derived(horizontal ? linearScale([disp.d0, disp.d1], [0, plotW]) : linearScale([disp.d0, disp.d1], [plotH, 0]));

	// emphasis: the active category stays, the others recede; hovering a legend item dims the other series
	let hoverKey = $state<string | null>(null);
	let hitsEl = $state<HTMLElement>();
	const act = useActive({ count: () => N, hits: () => hitsEl, onSelect: (index) => onSelect?.({ index, x: xy.raw[index] }) });
	const catDim = motion.follow(() => cats.map((_, i) => (act.active !== null && act.active !== i ? 0.5 : 1)));
	const serDim = motion.follow(() => xy.series.map((s) => (hoverKey && s.key !== hoverKey ? 0.22 : 1)));

	// ─── bars ────────────────────────────────────────────────────────────────────────────────────────────────────
	interface Bar {
		key: string;
		si: number;
		i: number;
		d: string;
		color: string;
		opacity: number;
	}
	interface Label {
		x: number;
		y: number;
		text: string;
		anchor: 'start' | 'middle' | 'end';
		inside: boolean;
		opacity: number;
	}
	const layout = $derived.by(() => {
		const bars: Bar[] = [];
		const labels: Label[] = [];
		const anchors: { x: number; y: number }[] = [];
		const unit = stacked ? Math.min(maxBarSize, bandSize * 0.6) : Math.min(maxBarSize, Math.max(2, (bandSize * 0.8 - GAP * (nVisible - 1)) / nVisible));
		const zero = vScale(0);
		const labelIntro = clamp((motion.intro - 0.6) / 0.4, 0, 1);
		for (let i = 0; i < N; i++) {
			// staggered draw-in: bars grow from the baseline one after another
			const t = clamp(motion.intro * 1.4 - 0.4 * (i / Math.max(1, N - 1)), 0, 1);
			const center = (i + 0.5) * bandSize;
			let tip = zero; // where the outermost end of the category is (tooltip anchor)
			let lastPos = -1;
			let lastNeg = -1;
			if (stacked) {
				xy.series.forEach((s, si) => {
					const v = s.values[i] ?? 0;
					if (visible[si] && v > 0) lastPos = si;
					if (visible[si] && v < 0) lastNeg = si;
				});
			}
			let cursor = 0;
			if (!stacked) {
				let total = 0;
				for (let si = 0; si < S; si++) total += (unit + GAP) * (disp.presence[si] ?? 0);
				total = Math.max(0, total - GAP);
				cursor = center - total / 2;
			}
			let posAcc = 0;
			let negAcc = 0;
			xy.series.forEach((s, si) => {
				const p = disp.presence[si] ?? 0;
				const raw = (disp.values[si]?.[i] ?? 0) * t;
				const v = stacked ? raw * p : raw;
				let a = 0;
				let b = v;
				let thick = unit * (stacked ? 1 : p);
				let start = center - unit / 2;
				if (stacked) {
					if (v >= 0) {
						a = posAcc;
						b = posAcc + v;
						posAcc = b;
					} else {
						a = negAcc;
						b = negAcc + v;
						negAcc = b;
					}
				} else {
					start = cursor;
					cursor += (unit + GAP) * p;
				}
				if (thick <= 0.01 || Math.abs(v) < 1e-9) return;
				const sa = vScale(a);
				const sb = vScale(b);
				const inset = stacked && a !== 0 ? GAP : 0;
				const positive = v >= 0;
				const edge: BarEdge = stacked ? ((positive ? lastPos : lastNeg) === si ? (horizontal ? (positive ? 'right' : 'left') : positive ? 'top' : 'bottom') : 'none') : horizontal ? (positive ? 'right' : 'left') : positive ? 'top' : 'bottom';
				let d: string;
				let bx: number;
				let by: number;
				if (horizontal) {
					const x0 = positive ? sa + inset : sb;
					const x1 = positive ? sb : sa - inset;
					bx = Math.min(x0, x1);
					by = start;
					d = barPath(bx, by, Math.abs(x1 - x0), thick, RADIUS, edge);
				} else {
					const y0 = positive ? sb : sa + inset;
					const y1 = positive ? sa - inset : sb;
					bx = start;
					by = Math.min(y0, y1);
					d = barPath(bx, by, thick, Math.abs(y1 - y0), RADIUS, edge);
				}
				if (!d) return;
				bars.push({ key: s.key, si, i, d, color: colorOf(si, i), opacity: (catDim.current[i] ?? 1) * (serDim.current[si] ?? 1) });
				if (visible[si] && v > 0) tip = horizontal ? Math.max(tip, sb) : Math.min(tip, sb);
				if (visible[si] && v < 0 && tip === zero) tip = sb;
				// value labels: grouped = at the end of every bar; stacked = the total at the end of the stack (added below)
				if (valueLabels && !stacked && visible[si] && p > 0.5) {
					const full = s.values[i] ?? 0;
					const text = valueLabel ? valueLabel(full, { index: i, key: s.key }) : fmtValue(full);
					const w = estimateTextWidth(text);
					if (horizontal) {
						const endX = positive ? bx + Math.abs(sb - sa) : bx;
						const room = plotW + RIGHT - 6 - endX - 6;
						const barLen = Math.abs(sb - sa);
						if (room >= w || positive === false) labels.push({ x: endX + (positive ? 6 : -6), y: by + thick / 2 + 4, text, anchor: positive ? 'start' : 'end', inside: false, opacity: labelIntro });
						else if (barLen >= w + 14) labels.push({ x: endX - 8, y: by + thick / 2 + 4, text, anchor: 'end', inside: true, opacity: labelIntro });
					} else if (w <= Math.max(bandSize - 4, thick + 12)) {
						labels.push({ x: bx + thick / 2, y: positive ? by - 6 : by + Math.abs(sb - sa) + 14, text, anchor: 'middle', inside: false, opacity: labelIntro });
					}
				}
			});
			if (valueLabels && stacked) {
				const total = xy.series.reduce((acc, s, si) => acc + (visible[si] ? (s.values[i] ?? 0) : 0), 0);
				const text = valueLabel ? valueLabel(total, { index: i, key: 'total' }) : fmtValue(total);
				const end = vScale(Math.max(0, posAcc) > 0 ? posAcc : negAcc);
				if (horizontal) labels.push({ x: end + 6, y: center + 4, text, anchor: 'start', inside: false, opacity: labelIntro });
				else labels.push({ x: center, y: end - 6, text, anchor: 'middle', inside: false, opacity: labelIntro });
			}
			anchors.push(horizontal ? { x: tip, y: center } : { x: center, y: tip });
		}
		return { bars, labels, anchors };
	});

	// ─── ticks ───────────────────────────────────────────────────────────────────────────────────────────────────
	const valueTicks = $derived<AxisTick[]>(info.values.map((v) => ({ value: v, pos: vScale(v), label: fmtTick(v) })));
	const catTicks = $derived<AxisTick[]>(
		catsAxis
			.map((c, i): AxisTick => ({ value: i, pos: (i + 0.5) * bandSize, label: c, lines: catLines[i] }))
			.filter((_, i) => i % thin === 0)
	);

	// ─── interaction ─────────────────────────────────────────────────────────────────────────────────────────────
	const shown = $derived(act.shown);
	const activeOn = $derived(act.active !== null);
	const glide = motion.pointer(() => [layout.anchors[shown]?.x ?? 0, layout.anchors[shown]?.y ?? 0, activeOn ? 1 : 0]);
	const tipModel = $derived.by((): TooltipModel | null => {
		if (N === 0) return null;
		const i = shown;
		const rows = xy.series
			.map((s, si) => ({
				key: s.key,
				label: s.label,
				value: s.values[i],
				text: s.values[i] === null ? '—' : fmtValue(s.values[i] as number),
				color: colorOf(si, i),
				active: hoverKey === s.key,
				on: visible[si]
			}))
			.filter((r) => r.on)
			.map(({ on: _on, ...r }) => r);
		if (stacked && rows.length > 1) {
			const total = rows.reduce((acc, r) => acc + (r.value ?? 0), 0);
			rows.push({ key: '__total', label: 'Всего', value: total, text: fmtValue(total), color: 'transparent', active: false });
		}
		return { index: i, title: cats[i] ?? '', rows };
	});
	function onPointer(e: PointerEvent) {
		if (!plotEl || empty) return;
		const r = plotEl.getBoundingClientRect();
		const px = e.clientX - r.left - LEFT;
		const py = e.clientY - r.top - TOP;
		const inside = px >= 0 && px <= plotW && py >= -TOP && py <= plotH + (horizontal ? 0 : BOTTOM - 8);
		if (!inside && !(horizontal && px >= -LEFT && px <= plotW + RIGHT && py >= 0 && py <= plotH)) return act.pointer(null);
		act.pointer(clamp(Math.floor((horizontal ? py : px) / bandSize), 0, N - 1));
	}
	function click() {
		if (act.active !== null) onSelect?.({ index: act.active, x: xy.raw[act.active] });
	}
	function toggle(key: string) {
		const on = hidden.includes(key);
		if (!on && visible.filter(Boolean).length <= 1) return;
		hidden = on ? hidden.filter((k) => k !== key) : [...hidden, key];
	}

	// ─── legend and texts for assistive technology ──────────────────────────────────────────────────────────────
	const showLegendItems = $derived(!(S === 1 && barColors));
	const legendPos = $derived(!showLegendItems || legend === false || legend === 'none' ? null : legend === 'bottom' ? 'bottom' : legend === true || legend === 'top' ? 'top' : S > 1 ? 'top' : null);
	const legendItems = $derived<LegendItem[]>(xy.series.map((s, si) => ({ key: s.key, label: s.label, color: s.color, hidden: !visible[si], marker: 'rect' })));
	const title = $derived(label ?? 'Столбчатая диаграмма');
	const summary = $derived(
		[
			`${title}.`,
			description,
			`${N} ${N === 1 ? 'категория' : 'категорий'}${stacked ? ', столбцы составные' : ''}.`,
			...xy.series.map((s) => describeSeries(S === 1 ? (label ?? s.label) : s.label, s.values, cats, fmtValue) + (hidden.includes(s.key) ? ' (скрыт)' : ''))
		]
			.filter(Boolean)
			.join(' ')
	);
	const zeroLine = $derived(Math.round(vScale(0)) + 0.5);
</script>

<div class={clsx('rt-chart', 'rt-chart--bar', horizontal && 'rt-chart--horizontal', className)} data-motion={motion.enabled ? 'on' : 'off'} {...rest}>
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
					{#if yMin !== undefined || yMax !== undefined}
						<!-- an explicit yMin / yMax may cut the data: the bars are clipped to the plot -->
						<clipPath id="{uid}-plot"><rect x="-1" y="-2" width={plotW + 2} height={plotH + 4} /></clipPath>
					{/if}
				</defs>
				<g transform="translate({LEFT} {TOP})">
					{#if axis && grid}
						<Grid ticks={valueTicks} orient={horizontal ? 'vertical' : 'horizontal'} length={horizontal ? plotH : plotW} />
					{/if}
					{#if horizontal}
						<line class="rt-chart__axis-line" x1={Math.round(vScale(0)) + 0.5} x2={Math.round(vScale(0)) + 0.5} y1="0" y2={plotH} />
						{#if axis}<g transform="translate(0 {plotH})"><Axis orient="bottom" ticks={valueTicks} length={plotW} line={false} /></g>{/if}
						<Axis orient="left" ticks={catTicks.map((t) => ({ ...t, pos: t.pos }))} length={plotH} line={false} />
					{:else}
						<line class="rt-chart__axis-line" x1="0" x2={plotW} y1={zeroLine} y2={zeroLine} />
						{#if axis}<Axis orient="left" ticks={valueTicks} length={plotH} line={false} />{/if}
						<g transform="translate(0 {plotH})"><Axis orient="bottom" ticks={catTicks} length={plotW} line={false} rotate={rotated ? ROT : 0} /></g>
					{/if}

					<g clip-path={yMin !== undefined || yMax !== undefined ? `url(#${uid}-plot)` : undefined}>
						{#each layout.bars as b (b.key + ':' + b.i)}
							<path class="rt-chart__bar" d={b.d} style="--rt-c: {b.color}" opacity={b.opacity} data-series={b.key} data-index={b.i} />
						{/each}
					</g>
					{#each layout.labels as l, li (li)}
						<text class={clsx('rt-chart__bar-label', l.inside && 'rt-chart__bar-label--inside')} x={l.x} y={l.y} text-anchor={l.anchor} opacity={l.opacity}>{l.text}</text>
					{/each}
				</g>
			</svg>

			<div class="rt-chart__sr">
				<p id="{uid}-sum">{summary}</p>
				{#if N <= 400}
					<table>
						<caption>{title}</caption>
						<thead>
							<tr>
								<th scope="col">Категория</th>
								{#each xy.series as s (s.key)}<th scope="col">{s.label}</th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each cats as c, i (i)}
								<tr>
									<th scope="row">{c}</th>
									{#each xy.series as s (s.key)}<td>{s.values[i] === null ? '—' : fmtValue(s.values[i] as number)}</td>{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

			<!-- the buttons inside own the keyboard: the arrows are handled once, on their group -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="rt-chart__hits" role="group" aria-label="Данные: {title}" bind:this={hitsEl} onkeydown={act.onKey}>
				{#each cats as c, i (i)}
					<button
						type="button"
						class="rt-chart__hit"
						tabindex={i === act.roving ? 0 : -1}
						style:left="{LEFT + (layout.anchors[i]?.x ?? 0)}px"
						style:top="{TOP + (layout.anchors[i]?.y ?? 0)}px"
						aria-label="{c}: {xy.series
							.filter((_, si) => visible[si])
							.map((s) => `${S === 1 ? '' : s.label + ' — '}${s.values[i] === null ? 'нет данных' : fmtValue(s.values[i] as number)}`)
							.join('; ')}"
						onfocus={() => act.focusIn(i)}
						onblur={act.focusOut}
					></button>
				{/each}
			</div>

			{#if tooltip}
				<ChartTooltip
					model={tipModel}
					x={LEFT + glide.current[0]}
					y={TOP + glide.current[1]}
					width={W}
					height={H}
					opacity={glide.current[2] ?? (activeOn ? 1 : 0)}
					content={tooltipContent}
					marker="dot"
				/>
			{/if}
		{/if}
	</div>

	{#if legendPos === 'bottom'}
		<Legend class="rt-chart__legend--bottom" items={legendItems} onToggle={toggle} onHighlight={(k) => (hoverKey = k)} label="Ряды: {title}" />
	{/if}
</div>
