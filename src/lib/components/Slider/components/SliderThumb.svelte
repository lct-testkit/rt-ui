<script lang="ts">
	// Port of packages/ui-kit/src/components/Slider/components/SliderThumb.tsx
	// (the module only exists inside the stories bundle of the React storybook)
	//
	// One draggable thumb (role="slider") with its tooltip. `ref` (forwardRef) is a bindable prop that holds the element.
	import { getSliderContext } from '../context.js';
	import { convertToUnit, keyValues } from '../helpers.js';

	interface Props {
		/** lower limit of this thumb (the min of the slider or the value of the previous thumb) */
		min: number;
		/** upper limit of this thumb (the max of the slider or the value of the next thumb) */
		max: number;
		value: number;
		/** position on the track in percent */
		position: number;
		setValue: (value: number) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
		subLabel?: (value: number) => string | number;
		/** [ext, not in original] number shown in the tooltip while the thumb is animating (default: `value`) */
		display?: number;
		ref?: HTMLDivElement | null | undefined;
	}

	let { min, max, value, position, setValue, onFocus, onBlur, subLabel, display, ref = $bindable() }: Props = $props();

	const ctx = getSliderContext();

	const multipliers = () => (ctx.step ? [1, 2, 3] : [1, 5, 10]);

	const { pageup, pagedown, end, home, left, right, down, up } = keyValues;
	const relevantKeys: string[] = [pageup, pagedown, end, home, left, right, down, up];

	function parseKeydown(e: KeyboardEvent, current: number): number | undefined {
		let _value = current;
		if (!relevantKeys.includes(e.key)) return;
		e.preventDefault();
		const _step = ctx.step || 0.1;
		const steps = (max - min) / _step;
		if (([left, right, down, up] as string[]).includes(e.key)) {
			const increase: string[] = ctx.isReversed ? [left, up] : [right, up];
			const direction = increase.includes(e.key) ? 1 : -1;
			const multiplier = e.shiftKey ? 2 : e.ctrlKey ? 1 : 0;
			_value = _value + direction * _step * multipliers()[multiplier];
		} else if (e.key === home) {
			_value = min;
		} else if (e.key === end) {
			_value = max;
		} else {
			const direction = e.key === pagedown ? 1 : -1;
			_value = current - direction * _step * (steps > 100 ? steps / 10 : 10);
		}
		return Math.max(min, Math.min(max, _value));
	}

	function onKeydown(e: KeyboardEvent) {
		const newValue = parseKeydown(e, value);
		if (newValue !== null && newValue !== undefined) {
			setValue(ctx.roundValue(newValue));
		}
	}

	const positionPercentage = $derived(convertToUnit(ctx.isReversed ? 100 - position : position, '%'));
</script>

<div
	class="atmr-slider__thumb"
	bind:this={ref}
	style={`--atmr-slider-thumb-position: ${positionPercentage};`}
	role="slider"
	tabindex={ctx.disabled ? -1 : 0}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	aria-valuetext={`${value}${subLabel ? ` ${subLabel(value)}` : ''}`}
	aria-disabled={ctx.disabled}
	onkeydown={(e) => (!ctx.disabled ? onKeydown(e) : undefined)}
	onfocus={onFocus}
	onblur={onBlur}
	onclick={(e) => e.stopPropagation()}
>
	<div class="atmr-slider__thumb-backdrop"></div>
	<div class="atmr-slider__tooltip">
		<div class="atmr-slider__tooltip-content">{display ?? value}</div>
	</div>
</div>
