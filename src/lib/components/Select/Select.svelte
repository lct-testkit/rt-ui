<script lang="ts">
	// Port of packages/ui-kit/src/components/Select/Select.tsx  (= DropdownMenu + Input)
	//
	//   <Select label="Label" {items} placement="bottom" defaultValue="ember" onChange={(key) => ...} />
	//
	// DOM (identical to React): the root is the DropdownMenu root (`div.atmr-dropdown-menu-root`, gets the root attrs `class` / `style` / `id` / `data-*`)
	// with an `Input` inside (`div.atmr-input.atmr-select[.atmr-select--open|--readOnly|--disabled]`) and the menu (portalled to <body> by default).
	//
	// PROPS = React props (see `SelectProps`); everything that is not a Select prop goes to the Input (`class` / `style` / `id` / `data-*` to the
	// DropdownMenu root, the rest - e.g. `placeholder`, `name`, `aria-*`, `onClick` - to `Input`, exactly like React's `useFilterAttrs`).
	//   * `items` = DropdownMenu items (`{ key, value, hint, prefix, suffix, isTitle, isDivider, disabled ... }`, `prefix` / `suffix` are Snippets taking the item)
	//   * `value` (controlled, item key; `null` = uncontrolled) / `defaultValue` / `onChange(key)` (`''` when the selection is cleared)
	//   * `autocomplete` = `{ enabled?, filterOptions?, onChange? }`; NOTE (React): the default is `{ enabled: true, ... }`, i.e. a Select without the prop
	//     is an autocomplete (typeable); pass `{ enabled: false }` for a read-only field
	//   * node props (`label`, `hint`, `iconPrefix`, `chevronIcon`, `emptyText`, `checkIcon`) take a string / number / Snippet; `headerSlot` / `footerSlot` are
	//     Snippets `(hide, items)`; `dropdownMenuStyle` / `dropdownMenuListStyle` / `style` accept a CSS string or a React-like style object
	//   * `ref` (bindable) = the <input> element (React forwards the ref to the input)
	//
	// BEHAVIOUR (all of it is what React does; the component has no keyboard handling of its own):
	//   * click on the field toggles the menu (`onOpen` / `onClose`); with an enabled autocomplete a click on the field of an OPEN menu does nothing
	//   * typing (autocomplete) filters the items with `autocomplete.filterOptions` (default: case-insensitive substring of `value`) and opens the menu
	//   * click on an item selects it (`onChange(key)`), click on the selected item deselects it (`onChange('')`) unless `deselectEnabled` is false
	//   * `onClose` / `onBlur` fire when the menu is closed by an outside click or by choosing an item (DropdownMenu `onClose`)
	//   * the clear button (`clearable`) empties the selection, blurs the input and calls `onClear()` + `onChange('')`
	//   * POPPER: offset = `--atmr-select-<size>-dropdownmenu-offset`, the reference element is the input's `offsetParent`, and the instance already exists
	//     while the menu is closed (`lazy: false`, the closed menu of the React Select carries `data-popper-placement`)
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import ChevronDown16 from '../../icons/16/navigation/ChevronDown16.svelte';
	import ChevronDown from '../../icons/24/navigation/ChevronDown.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import type { UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import { noop } from '../../utils/noop.js';
	import type { StyleValue } from '../../utils/style.js';
	import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuSize } from '../DropdownMenu/constants.js';
	import type { DropdownMenuItem } from '../DropdownMenu/types.js';
	import Input, { type InputProps } from '../Input/Input.svelte';
	import {
		DEFAULT_AUTOCOMPLETE,
		defaultFilterOptions,
		INPUT_SIZES,
		INPUT_VARIANTS,
		type SelectAutocomplete,
		type SelectSize,
		type SelectVariant
	} from './constants.js';

	export interface SelectProps
		extends Omit<
			InputProps,
			| 'variant'
			| 'size'
			| 'value'
			| 'defaultValue'
			| 'disabled'
			| 'label'
			| 'showLabel'
			| 'error'
			| 'hintPrefix'
			| 'iconPrefix'
			| 'clearable'
			| 'showClearable'
			| 'required'
			| 'inputProps'
			| 'onChange'
			| 'onFocus'
			| 'onBlur'
			| 'onClear'
			| 'autocomplete'
			| 'ref'
			| 'style'
		> {
		/** Задаёт вариант компонента */
		variant?: SelectVariant;
		/** Задаёт размер поля */
		size?: SelectSize;
		/** Задаёт размер выпадающего меню */
		dropdownSize?: DropdownMenuSize;
		/** Список элементов */
		items?: DropdownMenuItem[];
		/** Ключ выбранного элемента (управляемый компонент) */
		value?: string | number | null;
		/** Ключ выбранного элемента по умолчанию */
		defaultValue?: string | number | null;
		/** Блокирует компонент */
		disabled?: boolean;
		/** Меню открыто при монтировании */
		defaultOpened?: boolean;
		/** Разрешает снять выбор повторным кликом по выбранному элементу */
		deselectEnabled?: boolean;
		/** Закрывать меню при выборе элемента */
		hideOnSelect?: boolean;
		/** Вызывается при изменении выбора (ключ элемента, `''` при снятии выбора) */
		onChange?: (key: string | number) => void;
		/** Вызывается при фокусе на поле */
		onFocus?: (event: FocusEvent) => void;
		/** Вызывается при закрытии меню */
		onBlur?: () => void;
		/** Вызывается при очистке поля кнопкой */
		onClear?: () => void;
		/** Вызывается при открытии меню */
		onOpen?: () => void;
		/** Вызывается при закрытии меню */
		onClose?: () => void;
		/** Автодополнение: `{ enabled, filterOptions, onChange }` (по умолчанию включено) */
		autocomplete?: SelectAutocomplete;
		/** Текст пустого меню */
		emptyText?: Content;
		/** Показывает кнопку очистки */
		clearable?: boolean;
		/** Включает виртуальный скролл */
		virtualScroll?: boolean;
		/** Задаёт расположение меню относительно поля */
		placement?: PlacementsType;
		/** Подсказка под полем */
		hint?: Content;
		/** Текст ошибки */
		error?: string;
		/** Лейбл */
		label?: Content;
		/** Показывать ли лейбл */
		showLabel?: boolean;
		/** Иконка-шеврон (по умолчанию ChevronDown) */
		chevronIcon?: Content;
		/** Выводить меню в Portal (по умолчанию да) */
		useInPortal?: boolean;
		/** Дополнительные классы меню */
		dropdownMenuClassName?: string;
		/** Стили меню */
		dropdownMenuStyle?: StyleValue;
		/** Ширина меню по содержимому (иначе — по ширине поля) */
		widthFitContent?: boolean;
		/** Параметры popper.js */
		usePopperProps?: UsePopperOptions;
		/** Подсвечивает выбранный элемент цветом */
		isSelectedItemColored?: boolean;
		/** Иконка выбранного элемента (true — иконка по умолчанию) */
		checkIcon?: Content;
		/** Иконка в начале поля */
		iconPrefix?: Content;
		/** Слот над списком: (hide, items) */
		headerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Слот под списком: (hide, items) */
		footerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Всегда показывать кнопку очистки */
		showClearable?: boolean;
		/** Обязательное поле */
		required?: boolean;
		/** Дополнительные атрибуты для <input> */
		inputProps?: Record<string, any>;
		/** Скрывать меню, если оно пустое */
		hideEmptyContent?: boolean;
		/** Дополнительные классы списка (только для virtualScroll) */
		dropdownMenuListClassName?: string;
		/** Стили списка (только для virtualScroll) */
		dropdownMenuListStyle?: StyleValue;
		/** Стили корневого элемента */
		style?: StyleValue;
		/** Элемент <input> (React `forwardRef`) */
		ref?: HTMLInputElement | null;
	}

	let {
		variant = INPUT_VARIANTS.primary,
		size = INPUT_SIZES.l,
		dropdownSize = 'm',
		items = [],
		value = null,
		defaultValue = null,
		disabled = false,
		defaultOpened = false,
		deselectEnabled = true,
		hideOnSelect = true,
		onChange = noop,
		onFocus = noop,
		onBlur = noop,
		onClear = noop,
		onOpen = noop,
		onClose = noop,
		autocomplete = DEFAULT_AUTOCOMPLETE,
		emptyText,
		clearable = false,
		virtualScroll = false,
		placement = 'auto',
		hint,
		error,
		label,
		showLabel = true,
		chevronIcon,
		useInPortal,
		dropdownMenuClassName,
		dropdownMenuStyle,
		widthFitContent = false,
		usePopperProps,
		isSelectedItemColored,
		checkIcon,
		iconPrefix,
		headerSlot,
		footerSlot,
		showClearable = false,
		required,
		inputProps = {},
		hideEmptyContent = false,
		dropdownMenuListClassName = '',
		dropdownMenuListStyle,
		ref = $bindable(null),
		...restProps
	}: SelectProps = $props();

	const filterOptions = $derived(autocomplete.filterOptions ?? defaultFilterOptions);
	const autocompleteEnabled = $derived(autocomplete.enabled);
	const autocompleteOnChange = $derived(autocomplete.onChange);
	const filtered = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(filtered[0]);
	const restAttrs = $derived(filtered[1]);

	const getSelectedItemByKey = (key: string | number | null | undefined): DropdownMenuItem | null =>
		items.find((item) => item.key === key) ?? null;

	let isOpen = $state(false);
	let searchText = $state<string | undefined>(undefined);
	let selection = $state.raw<DropdownMenuItem | null>(untrack(() => getSelectedItemByKey(defaultValue)));

	function onDropdownClose() {
		isOpen = false;
		searchText = undefined;
		onBlur();
		onClose();
	}

	// React: `useEffect(() => { setTimeout(() => setIsOpen(defaultOpened), 0) }, [defaultOpened])`
	$effect(() => {
		const opened = defaultOpened;
		setTimeout(() => (isOpen = opened), 0);
	});

	// React: `useEffect(() => {...}, [value, items])` - keeps the selection in sync with the controlled `value`
	$effect(() => {
		const next = value;
		items;
		untrack(() => {
			if (next !== null && next !== selection?.key) {
				selection = getSelectedItemByKey(next);
			}
		});
	});

	function handleOnChange(key: string | number) {
		searchText = undefined;
		if (key !== selection?.key) {
			if (!value) {
				selection = getSelectedItemByKey(key);
			}
			onChange(key);
		} else if (key === selection?.key) {
			if (!deselectEnabled) {
				return;
			}
			if (value) {
				onChange('');
			} else {
				selection = null;
				onChange('');
			}
		}
	}

	const filteredOptions = $derived((filterOptions && filterOptions(searchText, items)) as DropdownMenuItem[]);
	const menuItems = $derived(filteredOptions.map((option) => (option.key === selection?.key ? { ...option, isSelected: true } : option)));

	function toggleDropdownMenu(e: MouseEvent, field: 'input') {
		if (autocompleteEnabled && isOpen && field === 'input') {
			e.stopImmediatePropagation();
			return;
		}
		if (!disabled) {
			e.stopPropagation();
			if (isOpen) {
				isOpen = false;
				ref?.blur();
				onClose();
			} else {
				isOpen = true;
				onOpen();
			}
		}
	}

	function handleSearch(e: Event) {
		const text = (e.target as HTMLInputElement).value;
		searchText = text;
		isOpen = true;
		if (autocompleteOnChange) {
			autocompleteOnChange(text);
		}
	}

	// React closures see the `isOpen` of the last render: `handleClear` runs right after `handleSearch` (Input's clear button calls
	// `onChange` and then `onClear` inside one click) which has already set the menu open, but `if (!isOpen) setIsOpen(false)` then closes it again
	let renderedOpen = false;
	$effect.pre(() => {
		renderedOpen = isOpen;
	});

	function handleClear() {
		if (!renderedOpen) {
			isOpen = false;
		}
		selection = null;
		ref?.blur();
		onClear();
		onChange('');
	}

	const cssOffset = useValueCssVariable(
		() => [`--atmr-select-${size}-dropdownmenu-offset`],
		() => ref
	);

	const inputClassName = $derived(
		clsx('atmr-select', {
			'atmr-select--open': isOpen,
			'atmr-select--readOnly': !autocompleteEnabled,
			'atmr-select--disabled': disabled
		})
	);
	const mergedInputProps = $derived({ ...inputProps, ...(autocompleteEnabled ? null : { readonly: true }) });

	// React: `{ offset: parseFloat(cssOffset), trigger: inputRef.current?.offsetParent, ...usePopperProps }` (+ `lazy: false`, see the header)
	const popperProps = $derived<UsePopperOptions>({
		offset: parseFloat(cssOffset.values[0]),
		trigger: (ref?.offsetParent as HTMLElement | null | undefined) ?? undefined,
		lazy: false,
		...usePopperProps
	});
</script>

{#snippet defaultIcon()}
	<div class="atmr-select__icon-wrapper">
		{#if size === INPUT_SIZES.s}
			<ChevronDown16 />
		{:else}
			<ChevronDown size={size === INPUT_SIZES.m ? 20 : 24} />
		{/if}
	</div>
{/snippet}

<DropdownMenu
	{...rootAttrs}
	{headerSlot}
	{footerSlot}
	isOpened={isOpen}
	{placement}
	{hideOnSelect}
	items={menuItems}
	size={dropdownSize}
	onClickItem={({ key }) => handleOnChange(key)}
	onClose={onDropdownClose}
	isEmpty={!filteredOptions.length}
	{hideEmptyContent}
	{emptyText}
	{virtualScroll}
	{useInPortal}
	{dropdownMenuClassName}
	{dropdownMenuStyle}
	{widthFitContent}
	{isSelectedItemColored}
	{checkIcon}
	usePopperProps={popperProps}
	{dropdownMenuListClassName}
	{dropdownMenuListStyle}
>
	<Input
		class={inputClassName}
		onClick={(e: MouseEvent) => toggleDropdownMenu(e, 'input')}
		value={searchText !== undefined ? searchText : (selection?.value?.toString() ?? '')}
		iconSuffix={chevronIcon || defaultIcon}
		{iconPrefix}
		{disabled}
		{onFocus}
		onBlur={(e: FocusEvent) => e.preventDefault()}
		bind:ref
		{size}
		{variant}
		onChange={handleSearch}
		{clearable}
		onClear={handleClear}
		hintPrefix={hint}
		{error}
		{label}
		{showLabel}
		{showClearable}
		{required}
		fixedLabel={isOpen || !!selection}
		{...restAttrs}
		inputProps={mergedInputProps}
	/>
</DropdownMenu>
