<script lang="ts">
	// Port of packages/ui-kit/src/components/Checkbox/CheckboxGroup/CheckboxGroup.tsx
	// The group owns the list of checked keys and hands it to its checkboxes through Svelte context.
	import clsx from 'clsx';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { noop } from '../../../utils/function.js';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import { CHECKBOX_SIZES, CHECKBOX_VARIANTS, type CheckboxSize, type CheckboxVariant } from '../constants.js';
	import { setCheckboxGroupContext } from '../context.js';

	export interface CheckboxGroupItem {
		key: string;
		value: Content;
	}

	export interface CheckboxGroupProps extends Omit<HTMLFieldsetAttributes, 'title' | 'style' | 'children'> {
		/** Задаёт вариант для компонента */
		variant?: CheckboxVariant;
		/** Размер компонента */
		size?: CheckboxSize;
		/** Заголовок группы (лейбл родительского чекбокса или legend) */
		title?: Content;
		/** Иконка неопределённого состояния */
		indeterminateIcon?: Content;
		/** Иконка выбранного состояния */
		checkIcon?: Content;
		/** Показывать родительский чекбокс «Выбрать все» */
		parentBox?: boolean;
		/** Элементы группы */
		items: CheckboxGroupItem[];
		/** Начальные выбранные элементы */
		defaultCheckedItems?: string[];
		/** Блокирует всю группу */
		disabledAll?: boolean;
		/** Заблокированные элементы */
		disabledItems?: string[];
		/** Доп. стили */
		style?: StyleValue;
		/** Вызывается при изменении выбранных элементов */
		onChange?: (value: string[]) => void;
	}

	let {
		variant = 'primary',
		size = 's',
		title = 'Выбрать все',
		indeterminateIcon,
		checkIcon,
		parentBox = true,
		items: options,
		defaultCheckedItems = [],
		disabledAll = false,
		disabledItems = [],
		class: className,
		style,
		onChange = noop,
		...restProps
	}: CheckboxGroupProps = $props();

	// svelte-ignore state_referenced_locally
	let groupValue = $state.raw<string[]>(defaultCheckedItems);

	const showLegend = $derived(Boolean(!parentBox && title));
	const showLegendWithCheckbox = $derived(Boolean(parentBox && title));

	const checked = $derived(groupValue.length === options.length);
	const indeterminate = $derived(groupValue.length > 0 && groupValue.length < options.length);
	const isEmptyEnabledBoxes = $derived(options.some((opt) => !disabledItems.includes(opt.key) && !groupValue.includes(opt.key)));
	const noChecked = $derived(groupValue.length === 0);

	function handleChange(id: string) {
		if (!id) {
			return;
		}
		const newValue = [...groupValue];
		const indexValue = groupValue.findIndex((value) => id === value);
		if (indexValue === -1) {
			newValue.push(id);
		} else {
			newValue.splice(indexValue, 1);
		}
		groupValue = newValue;
		onChange(newValue);
	}

	function setAllChecked() {
		const newValue = options.reduce<string[]>((newArray, opt) => {
			const isOptionDisabled = disabledItems.includes(opt.key);
			const isOptionChecked = groupValue.includes(opt.key);
			if (!(isOptionDisabled && !isOptionChecked)) {
				newArray.push(opt.key);
			}
			return newArray;
		}, []);
		groupValue = newValue;
		onChange(newValue);
	}

	function setAllUnchecked() {
		const newValue = options.reduce<string[]>((newArray, opt) => {
			if (disabledItems.includes(opt.key) && groupValue.includes(opt.key)) {
				newArray.push(opt.key);
			}
			return newArray;
		}, []);
		groupValue = newValue;
		onChange(newValue);
	}

	function parentBoxHandler() {
		// если нет выбранных или выбраны частично (есть пустые enabled)
		if (noChecked || (indeterminate && isEmptyEnabledBoxes)) {
			setAllChecked();
		} else {
			setAllUnchecked();
		}
	}

	setCheckboxGroupContext({
		onGroupChange: handleChange,
		get groupValue() {
			return groupValue;
		},
		get groupDisabled() {
			return disabledItems;
		},
		get disabledAll() {
			return disabledAll;
		}
	});

	const rootClass = $derived(
		clsx('atmr-checkboxGroup', `atmr-checkboxGroup--${CHECKBOX_VARIANTS[variant]}`, `atmr-checkboxGroup--size-${CHECKBOX_SIZES[size]}`, { 'atmr-checkboxGroup--with-legend': showLegendWithCheckbox }, className)
	);
</script>

<fieldset class={rootClass} style={styleToString(style)} {...restProps}>
	{#if showLegendWithCheckbox}
		<div class="atmr-checkboxGroup__title">
			<Checkbox name="parentBox" label={title} onChange={parentBoxHandler} {checked} {indeterminate} disabled={disabledAll} {size} {variant} {indeterminateIcon} {checkIcon} />
		</div>
	{/if}
	{#if showLegend}
		<div class="atmr-checkboxGroup__title">
			<legend class="atmr-checkboxGroup__legend"><Slot content={title} /></legend>
		</div>
	{/if}
	<div class="atmr-checkboxGroup__container">
		{#each options as option (option.key)}
			<Checkbox id={option.key} label={option.value} {size} {variant} {indeterminateIcon} {checkIcon} />
		{/each}
	</div>
</fieldset>
