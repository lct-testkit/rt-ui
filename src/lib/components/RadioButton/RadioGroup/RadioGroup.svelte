<script lang="ts">
	// Port of packages/ui-kit/src/components/RadioButton/RadioGroup/RadioGroup.tsx
	// The group keeps the selected value in local state (initialised from `value`, re-synced whenever `value` changes) and
	// gives it to its RadioButtons through Svelte context.
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { RadioGroupContextValue } from '../context/context.js';
	import { setRadioGroupContext } from '../context/context.js';

	export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
		/** Вызывается при выборе другого элемента */
		onChange?: (value: string) => void;
		/** Выбранное значение */
		value?: RadioGroupContextValue['groupValue'];
		/** Блокирует всю группу */
		disabledAll?: boolean;
		/** Горизонтальное расположение */
		horizontal?: boolean;
		/** Дочерние элементы компонента */
		children?: Snippet;
		/** Корневой элемент */
		ref?: HTMLDivElement | null;
	}

	let { onChange, value, disabledAll = false, children, class: className, horizontal = false, ref = $bindable(null), ...restProps }: RadioGroupProps = $props();

	// useState(value) + useEffect(() => setGroupValue(value), [value])
	let groupValue = $derived(value);

	function handleChange(val: string) {
		if (onChange && groupValue !== val) {
			onChange(val);
		}
		groupValue = val;
	}

	setRadioGroupContext({
		handleChange,
		get groupValue() {
			return groupValue;
		},
		get groupDisabled() {
			return disabledAll;
		}
	});
</script>

<div class={clsx('atmr-radiogroup', horizontal && 'atmr-radiogroup--horizontal', className)} bind:this={ref} {...restProps}>
	{@render children?.()}
</div>
