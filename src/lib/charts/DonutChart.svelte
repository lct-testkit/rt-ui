<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts" generics="T">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Donut chart (SVG, zero dependencies): parts of a whole as ring segments, a legend with values and shares that hides / shows a segment
	// on click, a centre snippet (by default the total, or the segment under the pointer) and a tooltip. `PieChart` is this component with
	// `innerRadius = 0`. Segments are separated by a real gap, the active segment steps out, the others recede. Use it for a whole with about
	// six parts at most: for comparing close values a bar chart reads better.
	//
	//   <DonutChart data={sources} name="source" value="leads" label="Источники лидов" />
	//   <DonutChart {data} name="source" value="leads">{#snippet center({ totalText, active })}…{/snippet}</DonutChart>
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import './charts.css';
	import ChartTooltip from './ChartTooltip.svelte';
	import Legend from './Legend.svelte';
	import { getter, toNum } from './internal/data.js';
	import { createNumberFormat, createPercentFormat } from './internal/format.js';
	import { useChartMotion } from './internal/motion.svelte.js';
	import { arcPath, polar } from './internal/path.js';
	import { clamp } from './internal/scale.js';
	import { chartColor } from './internal/palette.js';
	import { useActive } from './internal/useActive.svelte.js';
	import type { DonutCenter, DonutChartProps, DonutSlice, LegendItem, TooltipModel } from './types.js';

	let {
		data,
		name,
		value,
		color,
		innerRadius = 0.62,
		size = 220,
		gap = 2,
		startAngle = 0,
		legend = true,
		tooltip,
		tooltipContent,
		center,
		centerLabel = 'Всего',
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
		style,
		...rest
	}: DonutChartProps<T> = $props();

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
	const TAU = Math.PI * 2;
	const POP = 6;

	// ─── data ────────────────────────────────────────────────────────────────────────────────────────────────────
	const slicesAll = $derived.by(() => {
		const nf = getter(name);
		const vf = getter(value);
		const cf = color ? getter(color) : undefined;
		const seen = new Map<string, number>();
		return data.map((d, i) => {
			const nm = String(nf(d, i) ?? '');
			const n = (seen.get(nm) ?? 0) + 1;
			seen.set(nm, n);
			return {
				key: n > 1 ? `${nm}#${n}` : nm,
				name: nm,
				value: Math.max(0, toNum(vf(d, i)) ?? 0),
				color: cf?.(d, i) ?? colors?.[i] ?? chartColor(i),
				index: i
			};
		});
	});
	const S = $derived(slicesAll.length);
	const visible = $derived(slicesAll.map((s) => !hidden.includes(s.key)));
	const fmtValue = $derived(valueFormat ?? createNumberFormat(locale));
	const fmtShare = $derived(createPercentFormat(locale, 0));
	const totalAll = $derived(slicesAll.reduce((a, s) => a + s.value, 0));
	const empty = $derived(S === 0 || totalAll <= 0);

	// ─── motion: values and visibility glide, the ring sweeps in ─────────────────────────────────────────────────
	const flat = $derived([...visible.map((v) => (v ? 1 : 0)), ...slicesAll.map((s) => s.value)]);
	const anim = motion.follow(() => flat);
	let hoverKey = $state<string | null>(null);
	let hitsEl = $state<HTMLElement>();
	const visibleCount = $derived(visible.filter(Boolean).length);
	// the keyboard walks over the visible segments only
	const visIndex = $derived(slicesAll.map((_, i) => i).filter((i) => visible[i]));
	const act = useActive({ count: () => visIndex.length, hits: () => hitsEl, onSelect: (k) => pick(visIndex[k]) });
	const activeIdx = $derived(act.active === null ? null : (visIndex[act.active] ?? null));
	const pop = motion.follow(() => slicesAll.map((_, i) => (activeIdx === i || (hoverKey !== null && slicesAll[i].key === hoverKey) ? POP : 0)));
	const dim = motion.follow(() =>
		slicesAll.map((s, i) => {
			if (hoverKey !== null) return s.key === hoverKey ? 1 : 0.35;
			return activeIdx !== null && activeIdx !== i ? 0.55 : 1;
		})
	);

	// ─── geometry ────────────────────────────────────────────────────────────────────────────────────────────────
	const R = $derived(size / 2 - POP - 1);
	const r0 = $derived(R * clamp(innerRadius, 0, 0.95));
	const c = $derived(size / 2);
	const a0 = $derived((startAngle * Math.PI) / 180);
	const arcs = $derived.by(() => {
		const a = anim.current;
		const pres = a.slice(0, S);
		const vals = a.slice(S, 2 * S).map((v, i) => v * (pres[i] ?? 0));
		const sum = vals.reduce((x, y) => x + y, 0);
		const sweep = TAU * motion.intro;
		let acc = 0;
		// only segments that have size get a gap: a lone one is a whole ring
		const multiple = slicesAll.filter((s, i) => visible[i] && s.value > 0).length > 1;
		return slicesAll.map((s, i) => {
			const span = sum > 0 ? (vals[i] / sum) * sweep : 0;
			const from = a0 + acc;
			acc += span;
			// the gap is a real angular gap at the middle of the ring (none for a lone segment)
			const pad = multiple && span > 0 ? Math.min(span / 2 - 0.001, gap / Math.max(1, (R + r0) / 2) / 2) : 0;
			const lo = from + Math.max(0, pad);
			const hi = from + span - Math.max(0, pad);
			const grow = pop.current[i] ?? 0;
			const mid = (from + from + span) / 2;
			return {
				...s,
				d: span > 0.0005 && hi > lo ? arcPath(c, c, Math.max(0, r0), R + grow, lo, hi) : '',
				from,
				to: from + span,
				mid,
				share: totalAll > 0 && visible[i] ? s.value / visibleTotal : 0,
				opacity: dim.current[i] ?? 1
			};
		});
	});
	const visibleTotal = $derived(slicesAll.reduce((acc, s, i) => acc + (visible[i] ? s.value : 0), 0));

	// ─── interaction ─────────────────────────────────────────────────────────────────────────────────────────────
	let plotEl = $state<HTMLElement>();
	const shownIdx = $derived(activeIdx ?? visIndex[act.shown] ?? 0);
	const glide = motion.pointer(() => {
		const arc = arcs[shownIdx];
		if (!arc) return [c, c, 0];
		const [x, y] = polar(c, c, (R + r0) / 2, arc.mid);
		return [x, y, activeIdx !== null ? 1 : 0];
	});
	const tipModel = $derived.by((): TooltipModel | null => {
		const s = slicesAll[shownIdx];
		if (!s) return null;
		const share = visibleTotal > 0 ? s.value / visibleTotal : 0;
		return { index: shownIdx, title: '', rows: [{ key: s.key, label: s.name, value: s.value, text: fmtValue(s.value), color: s.color, share, shareText: fmtShare(share) }] };
	});
	const activeSlice = $derived.by((): DonutSlice | null => {
		if (activeIdx === null) return null;
		const s = slicesAll[activeIdx];
		return s ? { key: s.key, name: s.name, value: s.value, share: visibleTotal > 0 ? s.value / visibleTotal : 0, color: s.color, index: s.index } : null;
	});
	const centerModel = $derived<DonutCenter>({ total: visibleTotal, totalText: fmtValue(visibleTotal), active: activeSlice });

	function onPointer(e: PointerEvent) {
		if (!plotEl || empty) return;
		const r = plotEl.getBoundingClientRect();
		const dx = e.clientX - r.left - c;
		const dy = e.clientY - r.top - c;
		const dist = Math.hypot(dx, dy);
		if (dist < r0 - 4 || dist > R + POP + 4) return act.pointer(null);
		let ang = Math.atan2(dx, -dy) - a0; // 0 at the top, clockwise
		ang = ((ang % TAU) + TAU) % TAU;
		const hit = arcs.findIndex((a) => a.to > a.from && ang >= a.from - a0 && ang < a.to - a0);
		if (hit < 0) return act.pointer(null);
		act.pointer(Math.max(0, visIndex.indexOf(hit)));
	}
	function pick(i: number | undefined) {
		if (i === undefined) return;
		const s = slicesAll[i];
		onSelect?.({ index: i, name: s.name, value: s.value });
	}
	function toggle(key: string) {
		const on = hidden.includes(key);
		if (!on && visibleCount <= 1) return;
		hidden = on ? hidden.filter((k) => k !== key) : [...hidden, key];
	}

	const legendItems = $derived<LegendItem[]>(
		slicesAll.map((s, i) => ({
			key: s.key,
			label: s.name,
			color: s.color,
			hidden: !visible[i],
			marker: 'dot',
			value: fmtValue(s.value),
			secondary: visible[i] && visibleTotal > 0 ? fmtShare(s.value / visibleTotal) : '—'
		}))
	);
	const title = $derived(label ?? (innerRadius > 0 ? 'Кольцевая диаграмма' : 'Круговая диаграмма'));
	const summary = $derived(
		[
			`${title}.`,
			description,
			`Всего: ${fmtValue(visibleTotal)}.`,
			slicesAll.map((s, i) => `${s.name} — ${fmtValue(s.value)}${visible[i] && visibleTotal > 0 ? ` (${fmtShare(s.value / visibleTotal)})` : ' (скрыто)'}`).join('; ') + '.'
		]
			.filter(Boolean)
			.join(' ')
	);
	const showCenter = $derived(!!center || innerRadius > 0);
	// the default centre already shows the segment under the pointer, so a ring does not need a tooltip on top of it; a pie has no hole, a custom
	// centre may say anything: both get the tooltip unless `tooltip` says otherwise
	const showTip = $derived(tooltip ?? (innerRadius <= 0 || !!center));
</script>

<div class={clsx('rt-chart', 'rt-chart--donut', innerRadius <= 0 && 'rt-chart--pie', className)} style="--rt-chart-size: {size}px; {style ?? ''}" data-motion={motion.enabled ? 'on' : 'off'} {...rest}>
	<!-- pointer only: the keyboard has its own layer of buttons below -->
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div class="rt-chart__plot" bind:this={plotEl} style:height="{size}px" onpointermove={onPointer} onpointerdown={onPointer} onpointerleave={() => act.clear()} onclick={() => pick(activeIdx ?? undefined)}>
		{#if empty}
			<div class="rt-chart__empty" role="img" aria-label="{title}: {emptyText}" style="border-radius: 50%">{emptyText}</div>
		{:else}
			<svg class="rt-chart__svg" role="img" aria-label={title} aria-describedby="{uid}-sum" viewBox="0 0 {size} {size}" width="100%" height="100%">
				{#each arcs as a (a.key)}
					{#if a.d}
						<path class="rt-chart__slice" d={a.d} style="--rt-c: {a.color}" opacity={a.opacity} data-series={a.key} data-index={a.index} />
					{/if}
				{/each}
			</svg>

			{#if showCenter}
				<div class="rt-chart__center">
					{#if center}
						{@render center(centerModel)}
					{:else if activeSlice}
						<span class="rt-chart__center-value">{fmtValue(activeSlice.value)}</span>
						<span class="rt-chart__center-label">{activeSlice.name} · {fmtShare(activeSlice.share)}</span>
					{:else}
						<span class="rt-chart__center-value">{centerModel.totalText}</span>
						<span class="rt-chart__center-label">{centerLabel}</span>
					{/if}
				</div>
			{/if}

			<div class="rt-chart__sr">
				<p id="{uid}-sum">{summary}</p>
				<table>
					<caption>{title}</caption>
					<thead><tr><th scope="col">Часть</th><th scope="col">Значение</th><th scope="col">Доля</th></tr></thead>
					<tbody>
						{#each slicesAll as s, i (s.key)}
							<tr><th scope="row">{s.name}</th><td>{fmtValue(s.value)}</td><td>{visible[i] && visibleTotal > 0 ? fmtShare(s.value / visibleTotal) : '—'}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- the buttons inside own the keyboard: the arrows are handled once, on their group -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class="rt-chart__hits" role="group" aria-label="Данные: {title}" bind:this={hitsEl} onkeydown={act.onKey}>
				{#each visIndex as si, k (si)}
					{@const a = arcs[si]}
					{@const pt = polar(c, c, (R + r0) / 2, a.mid)}
					<button
						type="button"
						class="rt-chart__hit"
						tabindex={k === act.roving ? 0 : -1}
						style:left="{pt[0]}px"
						style:top="{pt[1]}px"
						aria-label="{slicesAll[si].name}: {fmtValue(slicesAll[si].value)}, {fmtShare(visibleTotal > 0 ? slicesAll[si].value / visibleTotal : 0)}"
						onfocus={() => act.focusIn(k)}
						onblur={act.focusOut}
					></button>
				{/each}
			</div>

			{#if showTip}
				<ChartTooltip model={tipModel} x={glide.current[0]} y={glide.current[1]} width={size} height={size} opacity={glide.current[2] ?? (activeIdx !== null ? 1 : 0)} content={tooltipContent} marker="dot" offset={10} />
			{/if}
		{/if}
	</div>

	{#if legend !== false && legend !== 'none' && !empty}
		<Legend layout="column" items={legendItems} onToggle={toggle} onHighlight={(k) => (hoverKey = k)} label="Части: {title}" />
	{/if}
</div>
