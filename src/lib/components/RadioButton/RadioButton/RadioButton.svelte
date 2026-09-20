<script lang="ts">
	// Port of packages/ui-kit/src/components/RadioButton/RadioButton/RadioButton.tsx
	// Inside a RadioGroup (Svelte context) the checked / disabled state comes from the group (`value === groupValue`).
	// Without a group `groupValue` is undefined, so a radio without `value` renders checked (same as React).
	import clsx from 'clsx';
	import { tick } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Bullet from '../../../icons/24/editor/Bullet.svelte';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { useFilterAttrs } from '../../../hooks/useFilterAttrs.js';
	import { noop } from '../../../utils/noop.js';
	import { RADIOBUTTON_SIZES, RADIOBUTTON_VARIANTS, type RadioButtonSize, type RadioButtonVariant } from '../constants.js';
	import { getRadioGroupContext } from '../context/context.js';

	export interface RadioButtonProps extends Omit<HTMLInputAttributes, 'size' | 'children' | 'onchange'> {
		/** Текст лейбла компонента */
		label?: Content;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Размер компонента */
		size?: RadioButtonSize;
		/** Задаёт вариант для компонента */
		variant?: RadioButtonVariant;
		/** Иконка выбранного состояния (по умолчанию Bullet) */
		icon?: Content;
		/** Вызывается при выборе (получает событие change) */
		onChange?: (event: Event) => void;
		/** Элемент input */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	let {
		label,
		disabled: disabledProp = false,
		value,
		size = 's',
		variant = 'primary',
		icon,
		onChange = noop,
		ref = $bindable(null),
		...restProps
	}: RadioButtonProps = $props();

	const context = getRadioGroupContext();

	const attrs = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(attrs[0]);
	const restAttrs = $derived(attrs[1]);

	const isDisabled = $derived(context.groupDisabled || disabledProp);
	const isChecked = $derived(value === context.groupValue);
	// React does not render the `value` attribute for an undefined value
	const valueAttrs = $derived(value === undefined ? {} : { value });

	function handleInputChange(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		(context.handleChange ?? noop)(input.value);
		onChange(event);
		// controlled input: restore the rendered state when the state did not follow the click
		tick().then(() => {
			input.checked = isChecked;
		});
	}

	const rootClass = $derived(
		clsx(
			'atmr-radiobutton',
			`atmr-radiobutton--${RADIOBUTTON_VARIANTS[variant]}`,
			`atmr-radiobutton--size-${RADIOBUTTON_SIZES[size]}`,
			isDisabled && 'atmr-radiobutton--disabled',
			rootAttrs.class
		)
	);
	const labelAttrs = $derived.by(() => {
		const { class: _class, ...others } = rootAttrs;
		return others;
	});
</script>

<label {...labelAttrs} class={rootClass}>
	<input class="atmr-radiobutton__input" bind:this={ref} type="radio" disabled={isDisabled} {...valueAttrs} onchange={handleInputChange} checked={isChecked} {...restAttrs} />
	<span class="atmr-radiobutton__container">
		{#if isChecked}
			{#if icon !== undefined}<Slot content={icon} />{:else}<Bullet />{/if}
		{/if}
		<div class="atmr-radiobutton__innerframe"></div>
	</span>
	{#if label}<span class="atmr-radiobutton__label"><Slot content={label} /></span>{/if}
</label>
