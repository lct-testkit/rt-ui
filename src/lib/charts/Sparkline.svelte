<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts" generics="T = number">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Sparkline: a tiny inline chart without axes, made to sit inside a TableGrid cell, a card or a line of text. A line, an area or bars, a marker
	// on the last value, the width of its container (or a fixed one). It is an image for assistive technology (`role="img"`, the summary of the values
	// is its `aria-label`). Same motion convention as the other charts: off unless `animate` / the ExtMotionProvider turns it on.
	//
	//   <Sparkline data={[3, 5, 4, 8, 7, 9]} />                                  numbers
	//   <Sparkline data={weeks} y="revenue" type="area" color="var(--atmr-success-default)" />
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import './charts.css';
	import { describeSeries } from './internal/a11y.js';
	import { getter, toNum } from './internal/data.js';
	import { createNumberFormat } from './internal/format.js';
	import { useChartMotion } from './internal/motion.svelte.js';
	import { areaPath, barPath, linePath, type Pt } from './internal/path.js';
	import { clamp, linearScale } from './internal/scale.js';
	import { useElementSize } from './internal/useSize.svelte.js';
	import type { SparklineProps } from './types.js';

	let {
		data,
		y,
		type = 'line',
		width,
		height = 28,
		color = 'var(--rt-chart-1)',
		smooth = false,
		endDot,
		min,
		max,
		label = 'Динамика',
		locale = 'ru-RU',
		valueFormat,
		animate,
		class: className,
		style,
		...rest
	}: SparklineProps<T> = $props();

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
	let box = $state<HTMLElement>();
	const size = useElementSize(
		() => box,
		{ width: 96, height: 28 },
		() => width
	);
	const W = $derived(Math.max(16, size.width));
	const PAD_X = 5;
	const PAD_Y = 4;

	const values = $derived.by(() => {
		const f = (y ? getter(y as never) : (d: unknown) => d) as (d: T, i: number) => unknown;
		return data.map((d, i) => toNum(f(d, i)));
	});
	const finite = $derived(values.filter((v): v is number => v !== null));
	const empty = $derived(finite.length === 0);
	const domain = $derived.by((): [number, number] => {
		let lo = min ?? Math.min(...finite);
		let hi = max ?? Math.max(...finite);
		if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
		if (type === 'bar' && min === undefined) lo = Math.min(0, lo);
		if (lo === hi) {
			lo -= 1;
			hi += 1;
		}
		return [lo, hi];
	});

	// motion: the values and the domain glide together
	const flat = $derived([domain[0], domain[1], ...values.map((v) => (v === null ? NaN : v))]);
	const anim = motion.follow(() => flat);
	const disp = $derived({ d0: anim.current[0], d1: anim.current[1], values: anim.current.slice(2) });

	const n = $derived(values.length);
	const xAt = (i: number) => (n <= 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (n - 1));
	const sy = $derived(linearScale([disp.d0, disp.d1], [height - PAD_Y, PAD_Y]));
	const pts = $derived<(Pt | null)[]>(disp.values.map((v, i) => (Number.isFinite(v) ? [xAt(i), sy(v)] : null)));
	const line = $derived(type === 'bar' ? '' : linePath(pts, smooth));
	const wash = $derived(type === 'area' ? areaPath(pts, height - PAD_Y, smooth) : '');
	const last = $derived.by((): Pt | null => {
		for (let i = pts.length - 1; i >= 0; i--) {
			const p = pts[i];
			if (p) return p;
		}
		return null;
	});
	const dot = $derived(endDot ?? type !== 'bar');
	const bars = $derived.by(() => {
		if (type !== 'bar') return [];
		const slot = (W - 2 * PAD_X + 2) / Math.max(1, n);
		const bw = Math.max(1, Math.min(10, slot - 2));
		const zero = sy(clamp(0, disp.d0, disp.d1));
		return disp.values
			.map((v, i) => {
				if (!Number.isFinite(v)) return '';
				const t = clamp(motion.intro * 1.4 - 0.4 * (i / Math.max(1, n - 1)), 0, 1);
				const top = zero + (sy(v) - zero) * t;
				const x0 = PAD_X - 1 + i * slot + (slot - bw) / 2;
				return barPath(x0, Math.min(top, zero), bw, Math.max(1, Math.abs(zero - top)), 2, v >= 0 ? 'top' : 'bottom');
			})
			.filter(Boolean);
	});

	const fmt = $derived(valueFormat ?? createNumberFormat(locale));
	const summary = $derived(
		empty
			? `${label}: нет данных`
			: describeSeries(
					label,
					values,
					values.map((_, i) => String(i + 1)),
					fmt
				)
	);
	const clipId = $derived(`${uid}-clip`);
	const reveal = $derived(motion.intro < 1 && type !== 'bar');
</script>

<div class={clsx('rt-chart', 'rt-chart--spark', className)} style="--rt-c: {color}; {style ?? ''}" data-motion={motion.enabled ? 'on' : 'off'} {...rest}>
	<div class="rt-chart__plot" bind:this={box} style:height="{height}px" style:width={width ? `${width}px` : undefined}>
		<svg class="rt-chart__svg" role="img" aria-label={summary} viewBox="0 0 {W} {height}" preserveAspectRatio="xMinYMin meet" width="100%" height="100%">
			{#if empty}
				<line class="rt-chart__axis-line" x1={PAD_X} x2={W - PAD_X} y1={height / 2} y2={height / 2} />
			{:else}
				{#if reveal}
					<defs><clipPath id={clipId}><rect x="0" y="0" width={W * motion.intro} height={height} /></clipPath></defs>
				{/if}
				<g clip-path={reveal ? `url(#${clipId})` : undefined}>
					{#if wash}<path class="rt-chart__area" d={wash} />{/if}
					{#if line}<path class="rt-chart__line" d={line} />{/if}
					{#each bars as d, i (i)}<path class="rt-chart__spark-bar" {d} />{/each}
					{#if dot && last}<circle class="rt-chart__dot" cx={last[0]} cy={last[1]} r="4" />{/if}
				</g>
			{/if}
		</svg>
	</div>
</div>
