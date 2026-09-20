<script lang="ts">
	// Port of packages/ui-kit/src/components/Slider/components/SliderTrack.tsx
	// (the module only exists inside the stories bundle of the React storybook)
	//
	// The track (backdrop + filled part + optional dots with their labels). `ref` (forwardRef) is a bindable prop that
	// holds the track element: its box is the range of the values.
	import clsx from 'clsx';
	import { getSliderContext } from '../context.js';
	import { convertToUnit } from '../helpers.js';

	interface Props {
		/** start of the filled part in percent */
		start: number;
		/** end of the filled part in percent */
		stop: number;
		ref?: HTMLDivElement | null | undefined;
	}

	let { start, stop, ref = $bindable() }: Props = $props();

	const ctx = getSliderContext();

	const trackFillWidth = $derived(stop - start);
	// React style keys `insetInlineStart` / `insetInlineEnd`
	const startDir = $derived(`inset-inline-${ctx.isReversed ? 'end' : 'start'}`);
	const trackFillStyle = $derived(`${startDir}: ${start}%; width: ${trackFillWidth}%;`);

	const showDots = $derived(!!ctx.dots || !!ctx.marks?.length);

	const computedTicks = $derived(
		!ctx.dots && !ctx.marks?.length
			? []
			: ctx.parsedTicks.map((tick) => {
					const directionValue =
						tick.value !== ctx.min && tick.value !== ctx.max
							? ctx.isReversed
								? `calc(${convertToUnit(tick.position, '%')} - var(--atmr-dot-size))`
								: convertToUnit(tick.position, '%')
							: undefined;
					return {
						tick,
						className: clsx([
							'atmr-slider__track-dot',
							{
								'atmr-slider__track-dot--filled': tick.position >= start && tick.position <= stop,
								'atmr-slider__track-dot--first': ctx.isReversed ? tick.value === ctx.max : tick.value === ctx.min,
								'atmr-slider__track-dot--last': ctx.isReversed ? tick.value === ctx.min : tick.value === ctx.max
							}
						]),
						style: directionValue ? `${startDir}: ${directionValue};` : undefined
					};
				})
	);
</script>

<div class="atmr-slider__track" bind:this={ref}>
	<div class="atmr-slider__track-backdrop"></div>
	<div class="atmr-slider__track-fill" style={trackFillStyle}></div>
	{#if showDots}
		<div class={clsx(['atmr-slider__track-dots', { 'atmr-show-dots': ctx.dots }])} role="list" aria-label="Slider marks">
			{#each computedTicks as { tick, className, style } (tick.value)}
				<div class={className} {style} data-testid="slider-dot" role="listitem" aria-label={`Mark at ${tick.value}`}>
					{#if tick.label}
						<div class="atmr-slider__track-dot-label" aria-hidden="true">{tick.label}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
