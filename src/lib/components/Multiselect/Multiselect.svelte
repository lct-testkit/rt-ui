<script lang="ts">
	// Port of packages/ui-kit/src/components/Multiselect/Multiselect.tsx (+ useMultiselect.tsx, constants.ts, SelectedOptionsContainer)
	//
	//   <Multiselect label="Label" {items} size="m" autocomplete={{ enabled: true }} onChange={(options) => ...} />
	//
	// DOM (identical to React): the root is the DropdownMenu root (`div.atmr-dropdown-menu-root`, gets the root attrs `class` / `style` / `id` / `data-*`)
	// with the field inside (`div.atmr-dropdown.atmr-input.atmr-input--multiselect ...` > `div.atmr-input__container` > label, prefix, tags row, suffixes)
	// and the menu (DropdownMenu, portalled to <body> by default). Unlike Select there is no <input> wrapper: the tags row hosts a TagInput.
	//
	// PROPS = React props. `items` = DropdownMenu items (`{ key, value, ... }`); `value` (controlled; an array of items, or a single key) /
	// `defaultValue` (array of items) / `onChange(selectedItems)`; `autocomplete` = `{ enabled?, filterOptions?, onChange?, clearSearchOnSelect? }`
	// (NOTE React: without the prop the hook falls back to `{ enabled: false, clearSearchOnSelect: true }`; a partial object such as `{ enabled: true }`
	// therefore has NO `clearSearchOnSelect`, i.e. the search text is not cleared on select); `hintPrefix` / `hintSuffix` / `error` (footer);
	// `autoHeight` (tags wrap instead of scrolling), `clearable` + `clearAll` (clear button), `hideInvalidTags`, `separator`, `defaultOpened`, `onOpen` / `onClose` /
	// `onFocus` / `onBlur` / `onClear`; node props (`label`, `iconPrefix`, `chevronIcon`, `clearIcon`, `checkIcon`, `emptyText`) take a string / number / Snippet;
	// `headerSlot` / `footerSlot` are Snippets `(hide, items)`; `dropdownMenuStyle` / `dropdownMenuListStyle` / `style` accept a CSS string or a React-like object.
	// `ref` (bindable) = the `div.atmr-input__container` element (React forwards the ref there).
	//
	// BEHAVIOUR (all React): click on the field opens the menu and focuses the tags input (a click on an open menu closes it unless autocomplete is enabled);
	// the chevron button toggles; a click on an item toggles it (`onChange(items)`); typing (autocomplete) filters `items`; Enter / a separator in the typed
	// text selects the typed value (or adds an "invalid" error tag when it is unknown); a tag's close button removes it; outside click closes the menu.
	// The internal `options` list keeps every item ever passed (JSON round trip, exactly like React - the tags/`onChange` items therefore lose function
	// fields such as `prefix` / `suffix`, and so does the filtered menu while typing).
	//
	// POPPER: offset = `--atmr-multiselect-<size>-dropdownmenu-offset`, the reference element is the field container, the instance exists while the
	// menu is closed (`lazy: false`, the closed React menu carries `data-popper-placement`).
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import AttentionMonochrome from '../../icons/24/alert/AttentionMonochrome.svelte';
	import ChevronDown from '../../icons/24/navigation/ChevronDown.svelte';
	import CloseSmall from '../../icons/24/navigation/CloseSmall.svelte';
	import CheckLarge16 from '../../icons/16/navigation/CheckLarge16.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import type { UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import { noop, preventDefaultFn } from '../../utils/function.js';
	import type { StyleValue } from '../../utils/style.js';
	import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
	import { DEFAULT_DROPDOWN_MENU_SIZE, type DropdownMenuSize } from '../DropdownMenu/constants.js';
	import type { DropdownMenuItem } from '../DropdownMenu/types.js';
	import { TAG_SIZES, TAG_VARIANTS } from '../Tag/constants.js';
	import SelectedOptionsContainer from './SelectedOptionsContainer/SelectedOptionsContainer.svelte';
	import {
		DEFAULT_AUTOCOMPLETE,
		defaultFilterOptions,
		ICON_CLOSE_SIZE_MAP,
		INPUT_SIZES,
		INPUT_VARIANTS,
		type MultiselectAutocomplete,
		type MultiselectSize,
		type MultiselectVariant
	} from './constants.js';

	export interface MultiselectProps
		extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children' | 'onfocus' | 'onblur' | 'onchange'> {
		/** Задаёт вариант компонента */
		variant?: MultiselectVariant;
		/** Задаёт размер поля */
		size?: MultiselectSize;
		/** Задаёт размер выпадающего меню */
		dropdownSize?: DropdownMenuSize;
		/** Лейбл */
		label?: Content;
		/** Показывать ли лейбл */
		showLabel?: boolean;
		/** Плейсхолдер */
		placeholder?: string;
		/** Блокирует компонент */
		disabled?: boolean;
		/** Подсказка под полем (слева) */
		hintPrefix?: Content;
		/** Подсказка под полем (справа) */
		hintSuffix?: Content;
		/** Текст ошибки */
		error?: string;
		/** Список элементов */
		items?: DropdownMenuItem[];
		/** Выбранные элементы (управляемый компонент): массив элементов или ключ */
		value?: DropdownMenuItem[] | string | number;
		/** Выбранные элементы по умолчанию */
		defaultValue?: DropdownMenuItem[];
		/** Меню открыто при монтировании */
		defaultOpened?: boolean;
		/** Иконка-шеврон (по умолчанию ChevronDown) */
		chevronIcon?: Content;
		/** Иконка выбранного элемента (по умолчанию CheckLarge16) */
		checkIcon?: Content | boolean;
		/** Иконка кнопки очистки */
		clearIcon?: Content;
		/** Иконка в начале поля */
		iconPrefix?: Content;
		/** Дополнительные классы меню */
		dropdownMenuClassName?: string;
		/** Стили меню */
		dropdownMenuStyle?: StyleValue;
		/** Дополнительные классы списка (только для virtualScroll) */
		dropdownMenuListClassName?: string;
		/** Стили списка (только для virtualScroll) */
		dropdownMenuListStyle?: StyleValue;
		/** Вызывается при изменении выбора (выбранные элементы) */
		onChange?: (options: DropdownMenuItem[]) => void;
		/** Вызывается при фокусе на поле */
		onFocus?: () => void;
		/** Вызывается при потере фокуса / закрытии меню */
		onBlur?: () => void;
		/** Вызывается при открытии меню */
		onOpen?: () => void;
		/** Вызывается при закрытии меню */
		onClose?: () => void;
		/** Вызывается при очистке поля кнопкой */
		onClear?: (event: MouseEvent) => void;
		/** Автодополнение: `{ enabled, filterOptions, onChange, clearSearchOnSelect }` */
		autocomplete?: MultiselectAutocomplete;
		/** Текст пустого меню */
		emptyText?: Content;
		/** Показывает кнопку очистки */
		clearable?: boolean;
		/** Кнопка очистки сбрасывает и выбранные значения */
		clearAll?: boolean;
		/** Включает виртуальный скролл */
		virtualScroll?: boolean;
		/** Задаёт расположение меню относительно поля */
		placement?: PlacementsType;
		/** Выводить меню в Portal (по умолчанию да) */
		useInPortal?: boolean;
		/** Скрывать выбранные элементы в меню */
		hideSelectedItems?: boolean;
		/** Слот над списком: (hide, items) */
		headerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Слот под списком: (hide, items) */
		footerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Параметры popper.js */
		usePopperProps?: UsePopperOptions;
		/** Подсвечивает выбранный элемент цветом */
		isSelectedItemColored?: boolean;
		/** Закрывать меню при выборе элемента */
		hideOnSelect?: boolean;
		/** Обязательное поле */
		required?: boolean;
		/** Принимается для совместимости с Input (React: попадает в restProps и не используется) */
		fixedLabel?: boolean;
		/** Скрывать меню, если оно пустое */
		hideEmptyContent?: boolean;
		/** Ширина меню по содержимому (иначе — по ширине поля) */
		widthFitContent?: boolean;
		/** Теги занимают несколько строк (иначе — горизонтальный скролл) */
		autoHeight?: boolean;
		/** Не добавлять неизвестные значения как теги с ошибкой */
		hideInvalidTags?: boolean;
		/** Разделитель значений при вводе / вставке */
		separator?: string;
		/** Стили корневого элемента */
		style?: StyleValue;
		/** Контейнер поля `div.atmr-input__container` (React `forwardRef`) */
		ref?: HTMLDivElement | null;
	}

	let {
		variant = INPUT_VARIANTS.primary,
		size = INPUT_SIZES.s,
		label: labelProp,
		placeholder,
		disabled = false,
		hintPrefix,
		hintSuffix,
		error,
		items = [],
		value,
		defaultValue = [],
		defaultOpened = false,
		dropdownSize = DEFAULT_DROPDOWN_MENU_SIZE,
		widthFitContent = false,
		chevronIcon,
		checkIcon,
		clearIcon,
		dropdownMenuClassName,
		dropdownMenuStyle,
		onChange = noop,
		onFocus = noop,
		onBlur = noop,
		onOpen = noop,
		onClose = noop,
		onClear = noop,
		autocomplete,
		emptyText,
		clearable = false,
		clearAll = false,
		virtualScroll = false,
		placement = 'bottom',
		showLabel = true,
		useInPortal,
		hideSelectedItems,
		headerSlot,
		footerSlot,
		usePopperProps,
		isSelectedItemColored,
		iconPrefix,
		hideOnSelect = false,
		required,
		fixedLabel: _fixedLabel,
		hideEmptyContent = false,
		dropdownMenuListClassName = '',
		dropdownMenuListStyle,
		autoHeight = false,
		hideInvalidTags = false,
		separator = ',',
		ref = $bindable(null),
		...restProps
	}: MultiselectProps = $props();

	const label = $derived(showLabel ? labelProp : '');
	const rootAttrs = $derived(useFilterAttrs(restProps)[0]);

	// ---- useMultiselect ----
	const ac = $derived(autocomplete ?? DEFAULT_AUTOCOMPLETE);
	const filterOptions = $derived(ac.filterOptions ?? defaultFilterOptions);
	const autocompleteEnabled = $derived(ac.enabled);
	const autocompleteOnChange = $derived(ac.onChange);
	const clearSearchOnSelect = $derived(ac.clearSearchOnSelect);

	let inputAutocompleteRef = $state<HTMLInputElement | null>(null);

	type Key = string | number;
	const initialKeys = (): Key[] => {
		if (Array.isArray(defaultValue)) {
			return defaultValue.length ? defaultValue.map((opt) => opt.key) : [];
		}
		return [defaultValue];
	};

	let searchValue = $state('');
	let options = $state.raw<DropdownMenuItem[]>(untrack(() => items));
	let selectedKeys = $state.raw<Key[]>(untrack(initialKeys));
	let invalidOptions = $state.raw<DropdownMenuItem[]>([]);
	let dropdownItems = $state.raw<DropdownMenuItem[]>(untrack(() => items));
	let isMultiselectOpen = $state(false);
	let multiselectIsFocus = $state(false);

	function clearSearch() {
		if (clearSearchOnSelect) {
			searchValue = '';
			if (autocompleteOnChange) {
				autocompleteOnChange('');
			}
		}
	}

	// React: `useEffect(() => { setTimeout(() => setIsMultiselectOpen(defaultOpened), 0) }, [defaultOpened])`
	$effect(() => {
		const opened = defaultOpened;
		setTimeout(() => (isMultiselectOpen = opened), 0);
	});

	function getSelectedOptions(opt: DropdownMenuItem[], keys: Key[]): DropdownMenuItem[] {
		const o: DropdownMenuItem[] = [];
		const uniqueKeys = keys.filter((key, index, array) => array.indexOf(key) === index);
		opt.forEach((item) => {
			if (uniqueKeys.includes(item.key)) {
				o[uniqueKeys.indexOf(item.key)] = item;
			}
		});
		// React keeps the holes of the sparse array (never rendered); they are dropped here
		return o.filter((i) => i !== undefined);
	}

	// React: `useEffect(..., [JSON.stringify(optionsProp)])`
	const itemsKey = $derived(JSON.stringify(items));
	$effect(() => {
		itemsKey;
		untrack(() => {
			const uniqueOpt = new Set<string>();
			options.forEach((item) => uniqueOpt.add(JSON.stringify(item)));
			items.forEach((item) => uniqueOpt.add(JSON.stringify(item)));
			options = Array.from(uniqueOpt).map((item) => JSON.parse(item));
			dropdownItems = items;
		});
	});

	// React: `useEffect(..., [JSON.stringify(inputValue)])` (runs on mount too: `value` undefined -> `[]`)
	const valueKey = $derived(JSON.stringify(value === undefined ? [] : value));
	$effect(() => {
		valueKey;
		untrack(() => {
			const inputValue = value === undefined ? [] : value;
			selectedKeys = Array.isArray(inputValue) ? inputValue.map((opt) => opt.key) : [inputValue];
		});
	});

	function handleChangeSelectedKeys(keys: Key[]) {
		selectedKeys = keys;
		onChange(getSelectedOptions(options, keys));
	}

	function removeOption(tag: Key) {
		invalidOptions = invalidOptions.filter((o) => o.key !== tag);
		const tmpSelectedKeysOptions = [...selectedKeys].filter((opt) => opt !== tag);
		multiselectIsFocus = false;
		onBlur();
		handleChangeSelectedKeys(tmpSelectedKeysOptions);
	}

	function clickOnMultiselect(e: MouseEvent) {
		e.preventDefault();
		if (!disabled) {
			if (isMultiselectOpen) {
				if (!autocompleteEnabled) {
					isMultiselectOpen = false;
					multiselectIsFocus = false;
					onBlur();
					return;
				}
			}
			isMultiselectOpen = true;
			multiselectIsFocus = true;
			onFocus();
			onOpen();
			if (inputAutocompleteRef?.focus) {
				inputAutocompleteRef.focus();
			}
		}
	}

	function clickOnSchevron(e: MouseEvent) {
		if (!disabled) {
			e.stopPropagation();
			if (isMultiselectOpen) {
				isMultiselectOpen = false;
				multiselectIsFocus = false;
				onClose();
			} else {
				isMultiselectOpen = true;
				multiselectIsFocus = true;
				onOpen();
			}
		}
	}

	function onClickClearButton(e: MouseEvent) {
		if (disabled) return;
		e.stopPropagation();
		searchValue = '';
		if (autocompleteOnChange) {
			autocompleteOnChange('');
		}
		dropdownItems = items;
		if (clearAll) {
			invalidOptions = [];
			handleChangeSelectedKeys([]);
		}
		onClear(e);
	}

	function onCloseDropDownMenu() {
		isMultiselectOpen = false;
		multiselectIsFocus = false;
		clearSearch();
		dropdownItems = items;
		onBlur();
		onClose();
	}

	function onSelect(valueProp: Key) {
		let val: Key = valueProp;
		const filteredItems = options.filter((item) => item.key.toString().includes(String(val)) || String(item.value || '').includes(String(val)));
		if (filteredItems.length === 1) {
			val = filteredItems[0].key;
		}
		if (hideInvalidTags && (filteredItems.length === 0 || filteredItems.length > 1)) {
			return;
		}
		clearSearch();
		let key: Key = val;
		options.forEach((o) => {
			if (o.value === val) {
				key = o.key;
			}
		});
		const optionsKeys = options.map((o) => o.key);
		if (selectedKeys.includes(key)) {
			handleChangeSelectedKeys([...selectedKeys].filter((opt) => opt !== key));
		} else if (optionsKeys.includes(key)) {
			handleChangeSelectedKeys([...selectedKeys, key]);
		} else {
			invalidOptions = [...invalidOptions, { value: String(key), key: `${key}-${invalidOptions.length}`, error: true }];
		}
	}

	function onChangeHandler(e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value;
		searchValue = val;
		isMultiselectOpen = true;
		if (autocompleteOnChange) {
			autocompleteOnChange(val);
		}
		if (autocompleteEnabled && filterOptions) {
			dropdownItems = filterOptions(val, options);
		}
		if (val.includes(separator)) {
			if (val === separator) {
				clearSearch();
			} else {
				const formattedValues = val
					.split(separator)
					.filter((v) => v)
					.map((v) => v.trim());
				if (formattedValues.length > 1) {
					const invalidValues: DropdownMenuItem[] = [];
					const keys = formattedValues
						.map((v) => {
							let key: Key = v;
							const optionsValues = options.map((o) => o.value);
							if (optionsValues.includes(v)) {
								key = options[optionsValues.indexOf(v)].key;
							} else {
								invalidValues.push({ value: String(key), key: `${key}-${invalidOptions.length}`, error: true });
								return null;
							}
							if (selectedKeys.includes(key)) {
								return null;
							}
							return key;
						})
						.filter((k): k is Key => k !== null);
					handleChangeSelectedKeys([...selectedKeys, ...keys]);
					invalidOptions = [...invalidOptions, ...invalidValues];
				} else {
					onSelect(formattedValues[0]);
				}
				clearSearch();
			}
		}
		// React controlled input: the DOM value is restored to the state after the handler
		Promise.resolve().then(() => {
			if (input.value !== searchValue) input.value = searchValue;
		});
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && searchValue) {
			onSelect(searchValue);
			clearSearch();
			dropdownItems = items;
		}
	}

	const selectedOptions = $derived(getSelectedOptions(options, selectedKeys));
	const tagsOptions = $derived([...selectedOptions, ...invalidOptions]);
	const isAutoHeight = $derived(autoHeight && !!tagsOptions.length);
	const showAutocompleteInput = $derived(
		(autocomplete?.enabled && tagsOptions.length === 0) || (autocomplete?.enabled && tagsOptions.length > 0 && isMultiselectOpen) || !!placeholder
	);
	const dropdownItemsWithSelected = $derived(dropdownItems.map((i) => ({ ...i, isSelected: selectedKeys.includes(i.key) })));

	// ---- Multiselect ----
	const canClearSearch = $derived(!!autocomplete?.enabled && searchValue.length > 0);
	const canClearSelections = $derived(clearAll && tagsOptions.length > 0);
	const isClearable = $derived(clearable && (canClearSearch || canClearSelections));
	const isOpen = $derived(isMultiselectOpen && !(hideSelectedItems && items.length === 0));

	const cssOffset = useValueCssVariable(
		() => [`--atmr-multiselect-${size}-dropdownmenu-offset`],
		() => ref
	);

	const rootClassName = $derived(clsx('atmr-dropdown', `atmr-dropdown--size-${dropdownSize}`, { 'atmr-dropdown--open': isOpen }));
	const rootFieldClassName = $derived(
		clsx(
			'atmr-input',
			'atmr-dropdown__trigger',
			`atmr-input--${INPUT_VARIANTS[variant]}`,
			`atmr-input--size-${INPUT_SIZES[size]}`,
			{
				'atmr-input--disabled': disabled,
				'atmr-input--error': !!error,
				'atmr-input--focus': multiselectIsFocus,
				'atmr-input--icon-suffix': true,
				'atmr-input--has-icon-suffix-prop': true,
				'atmr-input--icon-prefix': !!iconPrefix,
				'atmr-input--multiselect': true,
				'atmr-input--autoheight': isAutoHeight,
				'atmr-input--has-value': !!tagsOptions.length || searchValue || placeholder,
				'atmr-input--hide-label': !label,
				'atmr-input--autocomplete': autocomplete?.enabled,
				'atmr-input--clearable': !!clearable,
				'atmr-input--with-hint': !!(hintPrefix || hintSuffix || error),
				'atmr-input--only-hint-suffix': !!hintSuffix && !hintPrefix && !error,
				'atmr-input--required': required,
				'atmr-input--has-placeholder': isOpen || placeholder
			}
		)
	);
	const tagSize = $derived(size === INPUT_SIZES.s ? TAG_SIZES.xs : TAG_SIZES.s);
	const iconCloseSize = $derived(ICON_CLOSE_SIZE_MAP[size] ?? undefined);
	const showField = $derived(!!tagsOptions.length || !!placeholder || !!autocomplete?.enabled);

	const inputProps = $derived({
		placeholder: tagsOptions.length === 0 ? placeholder : '',
		oninput: onChangeHandler,
		value: searchValue,
		onkeyup: handleKeyPress,
		readonly: !autocomplete?.enabled,
		disabled
	});

	// React: `{ trigger: inputRef.current, offset: parseFloat(cssOffset), ...usePopperProps }` (+ `lazy: false`, see the header)
	const popperProps = $derived<UsePopperOptions>({
		trigger: ref ?? undefined,
		offset: parseFloat(cssOffset.values[0]),
		lazy: false,
		...usePopperProps
	});
</script>

{#snippet defaultCheckIcon()}<CheckLarge16 />{/snippet}

<DropdownMenu
	{...rootAttrs}
	{headerSlot}
	{footerSlot}
	{placement}
	size={dropdownSize}
	isOpened={isOpen}
	items={dropdownItemsWithSelected}
	checkIcon={checkIcon === undefined ? defaultCheckIcon : checkIcon}
	{dropdownMenuClassName}
	{dropdownMenuStyle}
	{hideOnSelect}
	{virtualScroll}
	onClose={onCloseDropDownMenu}
	onClickItem={({ key }) => onSelect(key)}
	{isSelectedItemColored}
	{emptyText}
	{hideEmptyContent}
	isEmpty={!dropdownItemsWithSelected.length}
	{useInPortal}
	{widthFitContent}
	{hideSelectedItems}
	usePopperProps={popperProps}
	{dropdownMenuListClassName}
	{dropdownMenuListStyle}
>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class={clsx(rootClassName, rootFieldClassName)} onclick={clickOnMultiselect}>
		<div class="atmr-input__container" bind:this={ref}>
			{#if label}
				<div class="atmr-input__label"><span><Slot content={label} /></span></div>
			{/if}
			{#if iconPrefix}
				<div class="atmr-input__prefix"><Slot content={iconPrefix} /></div>
			{/if}
			{#if showField}
				<SelectedOptionsContainer
					autoHeight={isAutoHeight}
					items={tagsOptions}
					{disabled}
					class="atmr-input__field"
					size={tagSize}
					inputSize={INPUT_SIZES[size]}
					variant={TAG_VARIANTS[variant]}
					onRemove={removeOption}
					inputVisible={showAutocompleteInput}
					bind:inputRef={inputAutocompleteRef}
					{inputProps}
					updateKey={[searchValue, isMultiselectOpen, multiselectIsFocus]}
				/>
			{/if}
			<div class="atmr-input__suffix-container">
				{#if isClearable}
					<button
						type="button"
						class="atmr-input__suffix clear"
						onclick={onClickClearButton}
						onmousedown={preventDefaultFn}
						ontouchstart={preventDefaultFn}
						aria-label="Clear"
					>
						{#if clearIcon === undefined}<CloseSmall size={iconCloseSize} />{:else}<Slot content={clearIcon} />{/if}
					</button>
				{/if}
				{#if error}
					<span class="atmr-input__suffix atmr-input__suffix--error" data-testid="input__suffix__error">
						<AttentionMonochrome size={iconCloseSize} fill="var(--atmr-error-soft)" secondaryColor="var(--atmr-error-on-error)" />
					</span>
				{/if}
				{#if chevronIcon}
					<button type="button" {disabled} class="atmr-input__suffix" onclick={clickOnSchevron}><Slot content={chevronIcon} /></button>
				{:else}
					<button type="button" class="atmr-input__suffix atmr-dropdown__trigger-icon" onclick={clickOnSchevron} {disabled} aria-label="open">
						<ChevronDown />
					</button>
				{/if}
			</div>
		</div>
		{#if hintPrefix || hintSuffix || error}
			<div class="atmr-input__hint">
				<div class="atmr-input__hint-prefix">{#if error}{error}{:else}<Slot content={hintPrefix} />{/if}</div>
				{#if hintSuffix}
					<div class="atmr-input__hint-suffix"><Slot content={hintSuffix} /></div>
				{/if}
			</div>
		{/if}
	</div>
</DropdownMenu>
