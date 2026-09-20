// Port of packages/ui-kit/src/components/Slider/hooks.ts (useSteps, useSlider).
// (the module only exists inside the stories bundle of the React storybook)
//
// React hooks took plain option objects and re-ran on every render. Svelte components pass GETTERS instead, so the hooks
// always read the current props:
//
//   const steps = useSteps(() => ({ min, max, step }));
//   const slider = useSlider({ props: () => ({ track, dots, marks, disabled, size }), steps, getTrack: () => trackEl, ... });
//
// Like in React the mouse/touch handling is done with `window` listeners that are added on mousedown / touchstart and
// removed again on mouseup / touchend.
import { createRange } from './helpers.js';
import { clamp, getDecimals, getOffset, getPosition } from './utils.js';

export interface SliderMark {
	value: number;
	label?: string | number;
}

export interface SliderTick {
	value: number;
	/** position on the track in percent */
	position: number;
	label?: string | number;
}

export interface SliderStepsProps {
	min: number | string;
	max: number | string;
	step: number | string;
}

// ─── useSteps ────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSteps(props: () => SliderStepsProps) {
	const min = $derived(parseFloat(String(props().min)));
	const max = $derived(parseFloat(String(props().max)));
	const step = $derived(+props().step > 0 ? parseFloat(String(props().step)) : 0);
	const decimals = $derived(Math.max(getDecimals(step), getDecimals(min)));

	/** Clamps the value to [min, max] and snaps it to the step grid. */
	function roundValue(value: number | string): number {
		const parsed = parseFloat(String(value));
		if (step <= 0) return parsed;
		const clamped = clamp(parsed, min, max);
		const offset = min % step;
		const newValue = Math.round((clamped - offset) / step) * step + offset;
		return parseFloat(Math.min(newValue, max).toFixed(decimals));
	}

	return {
		get min() {
			return min;
		},
		get max() {
			return max;
		},
		get step() {
			return step;
		},
		get decimals() {
			return decimals;
		},
		roundValue
	};
}

// ─── useSlider ───────────────────────────────────────────────────────────────────────────────────────────────────

export type SliderEvent = MouseEvent | TouchEvent;

export interface UseSliderOptions {
	props: () => {
		track?: string;
		dots?: boolean;
		marks?: SliderMark[];
		disabled?: boolean;
		size?: string;
	};
	steps: ReturnType<typeof useSteps>;
	/** The element of the track (its box is the range of the values) */
	getTrack: () => HTMLElement | null | undefined;
	getActiveThumb: (e: SliderEvent) => HTMLElement | undefined;
	onSliderMove: (data: { value: number }) => void;
	onSliderStart: (data: { value: number }) => void;
	onSliderEnd: (data: { value: number }) => void;
}

export function useSlider({ props, steps, getTrack, getActiveThumb, onSliderMove, onSliderStart, onSliderEnd }: UseSliderOptions) {
	// React refs (not reactive)
	const activeThumbRef: { current: HTMLElement | undefined } = { current: undefined };
	let startOffset = 0;

	const numTicks = $derived((steps.max - steps.min) / steps.step);
	const moveListenerOptions = { passive: true, capture: true } as const;
	const isReversed = $derived(props().track === 'inverted');

	function parseMouseMove(e: SliderEvent): number {
		const { left: trackStart, width: trackLength } = (getTrack() as HTMLElement).getBoundingClientRect();
		const clickOffset = getPosition(e);

		// It is possible for left to be NaN, force to number
		let clickPos = Math.min(Math.max((clickOffset - trackStart - startOffset) / trackLength, 0), 1) || 0;
		if (isReversed) clickPos = 1 - clickPos;
		return steps.roundValue(steps.min + clickPos * (steps.max - steps.min));
	}

	function handleStop(e: SliderEvent) {
		onSliderEnd({ value: parseMouseMove(e) });
		startOffset = 0;
	}

	function handleStart(e: SliderEvent) {
		activeThumbRef.current = getActiveThumb(e);
		if (!activeThumbRef.current) return;
		activeThumbRef.current.focus();
		if (activeThumbRef.current?.contains(e.target as Node)) {
			startOffset = getOffset(e, activeThumbRef.current);
		} else {
			startOffset = 0;
			onSliderMove({ value: parseMouseMove(e) });
		}
		onSliderStart({ value: parseMouseMove(e) });
	}

	function onMouseMove(e: SliderEvent) {
		onSliderMove({ value: parseMouseMove(e) });
	}

	function onSliderMouseUp(e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		handleStop(e);
		window.removeEventListener('mousemove', onMouseMove, moveListenerOptions);
		window.removeEventListener('mouseup', onSliderMouseUp);
	}

	function onSliderMousedown(e: MouseEvent) {
		e.preventDefault();
		if (e.button === 0) {
			handleStart(e);
			window.addEventListener('mousemove', onMouseMove, moveListenerOptions);
			window.addEventListener('mouseup', onSliderMouseUp, { passive: false });
		}
	}

	function onSliderTouchend(e: TouchEvent) {
		handleStop(e);
		window.removeEventListener('touchmove', onMouseMove, moveListenerOptions);
		e.target?.removeEventListener('touchend', onSliderTouchend as EventListener);
	}

	function onSliderTouchstart(e: TouchEvent) {
		handleStart(e);
		window.addEventListener('touchmove', onMouseMove, moveListenerOptions);
		e.target?.addEventListener('touchend', onSliderTouchend as EventListener, { passive: false });
	}

	/** position of a value on the track in percent */
	function position(val: number): number {
		const percentage = ((val - steps.min) / (steps.max - steps.min)) * 100;
		return clamp(isNaN(percentage) ? 0 : percentage, 0, 100);
	}

	const parsedTicks = $derived.by((): SliderTick[] => {
		const { dots, marks } = props();
		const min = steps.min;
		const step = steps.step;
		if (!dots && !marks?.length) return [];
		return numTicks !== Infinity
			? createRange(numTicks + 1).map((t) => {
					const value = min + t * step;
					return {
						value,
						position: position(value),
						label: marks?.length ? marks.find(({ value: v }) => v === value)?.label : undefined
					};
				})
			: [];
	});

	return {
		activeThumbRef,
		get isReversed() {
			return isReversed;
		},
		get min() {
			return steps.min;
		},
		get max() {
			return steps.max;
		},
		onSliderMousedown,
		onSliderTouchstart,
		parseMouseMove,
		get step() {
			return steps.step;
		},
		position,
		get parsedTicks() {
			return parsedTicks;
		},
		get marks() {
			return props().marks;
		},
		get dots() {
			return props().dots;
		},
		get disabled() {
			return props().disabled;
		},
		roundValue: steps.roundValue,
		get size() {
			return props().size;
		}
	};
}
