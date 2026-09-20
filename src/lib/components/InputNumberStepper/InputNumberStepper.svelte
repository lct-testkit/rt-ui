<script lang="ts">
	// Port of packages/ui-kit/src/components/InputNumberStepper/InputNumberStepper.tsx
	// (the module only exists inside the React stories bundle; utilities are in ./utils.ts, constants in ./constants.ts)
	import clsx from 'clsx';
	import { tick, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import AddSmall from '../../icons/24/action/AddSmall.svelte';
	import RemoveSmall from '../../icons/24/action/RemoveSmall.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { correctCaretPosition } from '../../utils/input.js';
	import { noop } from '../../utils/function.js';
	import Typography from '../Typography/Typography.svelte';
	import {
		DEFAULT_SIZE,
		DEFAULT_STEP,
		DEFAULT_VALUE,
		DEFAULT_VARIANT,
		NUMBER_STEPPER_DISABLED,
		NUMBER_STEPPER_SIZES,
		NUMBER_STEPPER_VARIANTS
	} from './constants.js';
	import type { NumberStepperDisabled, NumberStepperSize, NumberStepperVariant } from './constants.js';
	import { checkNumStepperValLength, clamp, displayValToNumberVal, getDisplayValue, withinTheInterval } from './utils.js';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'step' | 'disabled' | 'children' | 'type'> {
		/** Значение по умолчанию (неуправляемый режим) */
		defaultValue?: number;
		/** Блокировка: обеих кнопок и поля (all), левой (left) или правой (right) кнопки */
		disabled?: NumberStepperDisabled;
		/** Текст ошибки (показывается вместо подсказки) */
		error?: Content;
		/** Текст подсказки */
		hint?: Content;
		/** Минимальное значение */
		min?: number;
		/** Максимальное значение */
		max?: number;
		/** Иконка левой кнопки (по умолчанию «минус») */
		iconPrefix?: Content;
		/** Иконка правой кнопки (по умолчанию «плюс») */
		iconSuffix?: Content;
		/** Размер */
		size?: NumberStepperSize;
		/** Вариант */
		variant?: NumberStepperVariant;
		/** Шаг изменения значения */
		step?: number;
		/** Значение (управляющее) */
		value?: number;
		/** Клик по левой кнопке */
		onClickIconPrefix?: () => void;
		/** Клик по правой кнопке */
		onClickIconSuffix?: () => void;
		/** Изменение значения (числовое значение) */
		onChange?: (value: number) => void;
		/** Ссылка на input */
		ref?: HTMLInputElement | null;
	}

	let {
		defaultValue = DEFAULT_VALUE,
		disabled,
		error,
		hint,
		min,
		max,
		iconPrefix,
		iconSuffix,
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		step = DEFAULT_STEP,
		value,
		onClickIconPrefix = noop,
		onClickIconSuffix = noop,
		onChange = noop,
		ref = $bindable(null),
		...otherProps
	}: Props = $props();

	const [rootAttrs, restAttrs] = $derived(useFilterAttrs(otherProps));

	let containerEl = $state<HTMLDivElement>();
	let focused = $state(false);
	let hintWidth = $state(0);
	// useMemo(() => getDisplayValue(clamp(defaultValue, min, max)), []) - only the initial values count
	let inputValue = $state(untrack(() => getDisplayValue(clamp(defaultValue, min, max))));

	const additionalText = $derived(error || hint);

	const isAllDisabled = $derived(disabled === NUMBER_STEPPER_DISABLED.all);
	const numericValue = $derived(displayValToNumberVal(inputValue));
	const isLeftDisabled = $derived(isAllDisabled || disabled === NUMBER_STEPPER_DISABLED.left || numericValue === min);
	const isRightDisabled = $derived(isAllDisabled || disabled === NUMBER_STEPPER_DISABLED.right || numericValue === max);

	const handleFocus = () => {
		focused = true;
	};
	const handleBlur = () => {
		focused = false;
	};

	// React re-renders a controlled input with the state value after every change event; a rejected change must not stay in the DOM
	const syncDomValue = async (input: HTMLInputElement) => {
		await tick();
		if (input.value !== inputValue) input.value = inputValue;
	};

	// TODO (React): handle typing of the minus sign
	const handleChange = (event: Event) => {
		const input = event.target as HTMLInputElement;
		const currentValue = Number(input.value.replace(/[^\d]/g, ''));
		const displayValue = getDisplayValue(currentValue);
		if (!withinTheInterval(currentValue, min, max) || !checkNumStepperValLength(displayValue)) {
			if (max && currentValue > max) {
				inputValue = getDisplayValue(max);
				correctCaretPosition(input);
				onChange(max);
			} else if (min && currentValue < min) {
				inputValue = getDisplayValue(min);
				correctCaretPosition(input);
				onChange(min);
			}
			syncDomValue(input);
			return;
		}
		inputValue = displayValue;
		correctCaretPosition(input);
		onChange(currentValue);
		syncDomValue(input);
	};

	const handleLeftClick = () => {
		onClickIconPrefix();
		const prevNumVal = displayValToNumberVal(inputValue);
		let newNumValue = prevNumVal - step;
		if (min) {
			newNumValue = clamp(newNumValue, min, prevNumVal);
		}
		const newInputValue = getDisplayValue(newNumValue);
		if (!checkNumStepperValLength(newInputValue)) {
			return;
		}
		inputValue = newInputValue;
		onChange(newNumValue);
	};

	const handleRightClick = () => {
		onClickIconSuffix();
		const prevNumVal = displayValToNumberVal(inputValue);
		let newNumValue = prevNumVal + step;
		if (max) {
			newNumValue = clamp(newNumValue, prevNumVal, max);
		}
		const newInputValue = getDisplayValue(newNumValue);
		if (!checkNumStepperValLength(newInputValue)) {
			return;
		}
		inputValue = newInputValue;
		onChange(newNumValue);
	};

	// value from props (effect on [value])
	$effect(() => {
		const v = value;
		untrack(() => {
			if (typeof v === 'number' && getDisplayValue(v) !== inputValue) {
				inputValue = getDisplayValue(clamp(v, min, max));
			}
		});
	});

	// hint width follows the container width (effect on [inputValue])
	$effect(() => {
		void inputValue;
		if (!containerEl) return;
		const { width } = containerEl.getBoundingClientRect();
		untrack(() => {
			if (hintWidth !== width) hintWidth = width;
		});
	});

	const rootClass = $derived(
		clsx(
			'atmr-number-stepper',
			`atmr-number-stepper--${NUMBER_STEPPER_VARIANTS[variant]}`,
			`atmr-number-stepper--size-${NUMBER_STEPPER_SIZES[size]}`,
			`atmr-number-stepper--size-${NUMBER_STEPPER_SIZES[size]}`,
			{
				'atmr-number-stepper--disabled': isAllDisabled,
				'atmr-number-stepper--error': error,
				'atmr-number-stepper--focused': focused
			},
			rootAttrs?.class
		)
	);
</script>

<div {...rootAttrs} class={rootClass}>
	<div class="atmr-number-stepper__inner" bind:this={containerEl}>
		<button type="button" class="atmr-number-stepper__button atmr-number-stepper__button--decrement" disabled={isLeftDisabled || isAllDisabled} onclick={handleLeftClick}>
			{#if iconPrefix}<Slot content={iconPrefix} />{:else}<RemoveSmall />{/if}
		</button>
		<input
			bind:this={ref}
			type="text"
			class="atmr-number-stepper__input"
			disabled={isAllDisabled}
			value={inputValue}
			size={inputValue?.length}
			onfocus={handleFocus}
			onblur={handleBlur}
			oninput={handleChange}
			{...restAttrs}
		/>
		<button type="button" class="atmr-number-stepper__button atmr-number-stepper__button--increment" disabled={isRightDisabled || isAllDisabled} onclick={handleRightClick}>
			{#if iconSuffix}<Slot content={iconSuffix} />{:else}<AddSmall />{/if}
		</button>
	</div>
	{#if additionalText}
		<Typography class="atmr-number-stepper__hint" as="div" variant="body-s" style={{ maxWidth: hintWidth }} children={additionalText} />
	{/if}
</div>
