<script lang="ts">
	// Port of packages/ui-kit/src/components/Switch/Switch.tsx
	//
	// Controlled (`checked`) / uncontrolled (`defaultChecked`) like React; touch swipe on the switch container toggles it when
	// the finger moved further than (track width / 2 - track horizontal padding) (both read from the theme CSS variables).
	import clsx from 'clsx';
	import { tick, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import { noop } from '../../utils/function.js';
	import {
		DEFAULT_TOUCH_POSITION,
		SWITCH_LABEL_POSITION,
		SWITCH_SIZES,
		SWITCH_VARIANTS,
		type SwitchLabelPosition,
		type SwitchSize,
		type SwitchVariant,
		type TouchPosition
	} from './constants.js';

	export interface SwitchProps extends Omit<HTMLInputAttributes, 'size' | 'checked' | 'children' | 'onchange'> {
		/** Контролируемое значение */
		checked?: boolean;
		/** Начальное значение (неконтролируемый режим) */
		defaultChecked?: boolean;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Текст лейбла компонента */
		label?: Content;
		/** Позиция лейбла */
		labelPosition?: SwitchLabelPosition;
		/** Размер компонента */
		size?: SwitchSize;
		/** Задаёт вариант для компонента */
		variant?: SwitchVariant;
		/** Вызывается при изменении значения */
		onChange?: (checked: boolean) => void;
		/** Элемент input */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	let {
		checked,
		defaultChecked = false,
		disabled = false,
		label,
		labelPosition = 'right',
		size = 's',
		variant = 'primary',
		onChange = noop,
		ref = $bindable(null),
		...restProps
	}: SwitchProps = $props();

	// svelte-ignore state_referenced_locally
	let isChecked = $state(defaultChecked);
	let touchPosition = $state<TouchPosition>(DEFAULT_TOUCH_POSITION);
	let rootEl = $state<HTMLLabelElement>();

	const attrs = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(attrs[0]);
	const restAttrs = $derived(attrs[1]);
	const labelAttrs = $derived.by(() => {
		const { class: _class, ...others } = rootAttrs;
		return others;
	});

	function handleChange(value: boolean) {
		onChange(value);
		if (checked === undefined) {
			isChecked = value;
		}
	}

	function handleInputChange(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		handleChange(input.checked);
		// controlled input: restore the rendered state when the state did not follow the click
		tick().then(() => {
			input.checked = isChecked;
		});
	}

	function handleTouchStart(event: TouchEvent) {
		event.stopPropagation();
		if (!disabled) {
			touchPosition = { start: event.touches[0].clientX, end: null };
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (!disabled) {
			const currentTouchPosition = event.touches[0].clientX;
			touchPosition = { ...touchPosition, end: currentTouchPosition };
		}
	}

	const css = useValueCssVariable(
		() => [`--atmr-switch-${size}-width`, `--atmr-switch-${size}-track-padding-horizontal`],
		() => rootEl
	);

	function handleTouchEnd() {
		const { start, end } = touchPosition;
		const SWITCH_DISPLACEMENT = parseFloat(css.values[0]) / 2 - parseFloat(css.values[1]);
		if (disabled || end === null || start === null) {
			return;
		}
		if (start > end && start - end > SWITCH_DISPLACEMENT) {
			handleChange(false);
		}
		if (start < end && end - start > SWITCH_DISPLACEMENT) {
			handleChange(true);
		}
		touchPosition = DEFAULT_TOUCH_POSITION;
	}

	// useEffect(handleCheckChecked, [checked]): the rendered state follows `checked` when it changes
	$effect.pre(() => {
		const controlled = checked;
		untrack(() => {
			if (controlled !== undefined && controlled !== isChecked) {
				isChecked = controlled;
			}
		});
	});

	const rootClass = $derived(
		clsx(
			'atmr-switch',
			`atmr-switch--${SWITCH_VARIANTS[variant]}`,
			`atmr-switch--size-${SWITCH_SIZES[size]}`,
			`atmr-switch--label-position-${SWITCH_LABEL_POSITION[labelPosition]}`,
			{ 'atmr-switch--disabled': !!disabled, 'atmr-switch--checked': !!isChecked },
			rootAttrs.class
		)
	);
</script>

<label {...labelAttrs} class={rootClass} bind:this={rootEl}>
	<input class="atmr-switch__input" bind:this={ref} type="checkbox" checked={isChecked} {disabled} onchange={handleInputChange} {...restAttrs} />
	<span class="atmr-switch__container" ontouchstart={handleTouchStart} ontouchmove={handleTouchMove} ontouchend={handleTouchEnd}>
		<span class="atmr-switch__track">
			<span class="atmr-switch__knob"></span>
		</span>
	</span>
	{#if label}
		<span class="atmr-switch__labelcontainer">
			<p class="atmr-switch__label"><Slot content={label} /></p>
		</span>
	{/if}
</label>
