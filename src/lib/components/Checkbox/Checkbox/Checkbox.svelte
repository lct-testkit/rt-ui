<script lang="ts">
	// Port of packages/ui-kit/src/components/Checkbox/Checkbox/Checkbox.tsx
	//
	// Controlled (`checked`) / uncontrolled (`defaultChecked`) like React: the rendered state follows `checked` whenever it
	// changes, a user toggle only changes the local state when `checked` is undefined (a controlled input is restored to the
	// rendered state after the change event, like React does).
	// Inside a CheckboxGroup (Svelte context) the checked / disabled state is driven by the group through the checkbox `id`.
	import clsx from 'clsx';
	import { tick, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import RemoveSmall from '../../../icons/24/action/RemoveSmall.svelte';
	import CheckSmall from '../../../icons/24/navigation/CheckSmall.svelte';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { useFilterAttrs } from '../../../hooks/useFilterAttrs.js';
	import { CHECKBOX_SIZES, CHECKBOX_VARIANTS, type CheckboxSize, type CheckboxVariant } from '../constants.js';
	import { getCheckboxGroupContext } from '../context.js';

	export interface CheckboxProps extends Omit<HTMLInputAttributes, 'size' | 'checked' | 'children' | 'value'> {
		/** Задаёт вариант для компонента */
		variant?: CheckboxVariant;
		/** Текст лейбла компонента */
		label?: Content;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Задаёт неопределённое состояние */
		indeterminate?: boolean;
		/** Иконка неопределённого состояния */
		indeterminateIcon?: Content;
		/** Иконка выбранного состояния */
		checkIcon?: Content;
		/** Контролируемое значение */
		checked?: boolean;
		/** Начальное значение (неконтролируемый режим) */
		defaultChecked?: boolean;
		/** Размер компонента */
		size?: CheckboxSize;
		/** Вызывается при изменении значения */
		onChange?: (checked: boolean, indeterminate: boolean) => void;
		/** Элемент input */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	let {
		variant = 'primary',
		label,
		disabled = false,
		indeterminate = false,
		indeterminateIcon: indeterminateIconProp,
		checkIcon: checkIconProp,
		checked,
		defaultChecked = false,
		size = 's',
		id,
		onChange,
		class: className = '',
		ref = $bindable(null),
		...restProps
	}: CheckboxProps = $props();

	const ctx = getCheckboxGroupContext();

	// svelte-ignore state_referenced_locally
	let isChecked = $state(defaultChecked);
	const isDisabled = $derived(ctx.groupDisabled && id ? Boolean(ctx.disabledAll || ctx.groupDisabled.includes(id)) : disabled);

	const attrs = $derived(useFilterAttrs(restProps));

	// useEffect(..., [indeterminate, groupValue, groupDisabled, checked])
	$effect.pre(() => {
		void indeterminate;
		void ctx.groupDisabled;
		const groupValue = ctx.groupValue;
		const controlled = checked;
		untrack(() => {
			if (groupValue && id) {
				isChecked = groupValue.includes(id);
			} else if (controlled !== undefined && controlled !== isChecked) {
				isChecked = controlled;
			}
		});
	});

	const inputChecked = $derived(isChecked || indeterminate);

	function handleInputChange(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const checkboxChecked = input.checked;
		onChange?.(checkboxChecked, indeterminate);
		ctx.onGroupChange?.(input.id);
		if (checked === undefined) {
			isChecked = checkboxChecked;
		}
		// controlled input: restore the rendered state when the state did not follow the click
		tick().then(() => {
			input.checked = inputChecked;
		});
	}
</script>

<label
	class={clsx('atmr-checkbox', `atmr-checkbox--${CHECKBOX_VARIANTS[variant]}`, `atmr-checkbox--size-${CHECKBOX_SIZES[size]}`, isDisabled && 'atmr-checkbox--disabled', className)}
	{...attrs[0]}
>
	<input {id} type="checkbox" class="atmr-checkbox__input" bind:this={ref} onchange={handleInputChange} disabled={isDisabled} checked={inputChecked} {...attrs[1]} />
	<div class="atmr-checkbox__container">
		{#if indeterminate}
			{#if indeterminateIconProp != null}<Slot content={indeterminateIconProp} />{:else}<RemoveSmall size={size === 's' ? 24 : 20} />{/if}
		{:else if isChecked}
			{#if checkIconProp != null}<Slot content={checkIconProp} />{:else}<CheckSmall size={size === 's' ? 24 : 20} />{/if}
		{/if}
		<div class="atmr-checkbox__innerframe"></div>
	</div>
	{#if label}<span class="atmr-checkbox__label">{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}</span>{/if}
</label>
