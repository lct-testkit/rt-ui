<script lang="ts">
	// Port of packages/ui-kit/src/components/InputDate/InputDate.tsx
	//
	//   <InputDate label="Date" isRange showTime dateFormat="DD.MM.YYYY HH:mm" calendarMode="DAYS_ONLY" onChange={(start, end) => ...} />
	//
	// Composition (like React): <Popover> (calendar) > <Input inputControl={InputDateControl}> where the control renders one (or, for
	// `isRange`, two) native <input> inside a `div.atmr-input__field`, every typed value goes through an imask date mask, and the popover
	// holds a <PickerDate>. The state machine (typed text <-> `activeDate` / `secondDate`, open / close of the calendar) lives in
	// `hooks.svelte.ts` (`useInputTimeOrDate`); the pieces of the control that React created in `RenderInputControl` (a component
	// closing over `isRange` and the masks) are in `InputDateControl.svelte` / `InputDateFields.svelte` and share the masks and the
	// two <input> elements with this component through the context.
	//
	// Differences to React that come from the platform (behaviour is the same):
	//  * `ref` (forwardRef) is a bindable prop that holds the element of the input control (`div.atmr-input__field`)
	//  * `iconSuffix` / `label` / ... are `Content` (snippet, string or number); `renderDate` is a snippet
	//  * `onClick` etc. of the root are lower case DOM handlers only where React spread them on an element; the component
	//    callbacks (`onChange`, `onBlur`, `onChangeMonth`, `onChangeYear`, `onClickIconSuffix`) keep the React names
	import clsx from 'clsx';
	import IMask from 'imask';
	import dayjs from 'dayjs';
	import { setContext, untrack } from 'svelte';
	import Calendar from '../../icons/24/communication/Calendar.svelte';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import { noop } from '../../utils/function.js';
	import type { StyleValue } from '../../utils/style.js';
	import type { Content } from '../../internal/types.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import Input, { type InputProps } from '../Input/Input.svelte';
	import { INPUT_SIZES, INPUT_VARIANTS } from '../Input/constants.js';
	import PickerDate from '../PickerDate/PickerDate.svelte';
	import { DAYS_OF_WEEK, MAX_YEAR, MIN_YEAR, type CalendarMode } from '../PickerDate/constants.js';
	import type { CalendarItemType, TimeProps } from '../PickerDate/types.js';
	import Popover from '../Popover/Popover.svelte';
	import { DEFAULT_DATE_FORMAT } from './constants.js';
	import InputDateControl from './InputDateControl.svelte';
	import { INPUT_DATE_CONTEXT, type InputDateContext, type InputDateMasks } from './context.js';
	import { useInputTimeOrDate } from './hooks.svelte.js';
	import type { Snippet } from 'svelte';
	import type { MotionProp } from '../../ext/motion.svelte.js';

	export interface InputDateProps
		extends Omit<InputProps, 'onChange' | 'onBlur' | 'value' | 'defaultValue' | 'iconSuffix' | 'ref' | 'style' | 'class' | 'mask' | 'inputControl'> {
		/** Задаёт вариант для компонента */
		variant?: InputProps['variant'];
		/** Задает размер */
		size?: InputProps['size'];
		/** Блокирует поле */
		disabled?: boolean;
		/** Добавляет выбор времени */
		showTime?: boolean;
		/** Формат даты (dayjs) */
		dateFormat?: string;
		/** Выбор периода */
		isRange?: boolean;
		/** Минимальная дата */
		minDate?: Date;
		/** Максимальная дата */
		maxDate?: Date;
		/** Заблокированные даты */
		disabledDates?: Date[];
		/** Доступные даты */
		enabledDates?: Date[];
		/** Дата, на которой пикер отобразит календарь при открытии */
		defaultShownDate?: Date;
		/** Активная дата (значение) */
		activeDate?: Date;
		/** Вторая дата (значение периода) */
		secondDate?: Date;
		/** Изменение значения */
		onChange?: (start?: Date, end?: Date) => void;
		/** Изменение месяца в календаре */
		onChangeMonth?: (month: number) => void;
		/** Изменение года в календаре */
		onChangeYear?: (year: number) => void;
		/** Закрытие календаря */
		onBlur?: () => void;
		/** Индекс первого дня недели */
		firstDayIndex?: number;
		/** Названия дней недели */
		daysOfWeek?: string[];
		/** Названия месяцев */
		months?: string[];
		/** Минимальный год */
		minYear?: number;
		/** Максимальный год */
		maxYear?: number;
		/** Правило трансформации (не используется, как и в React) */
		transformationRule?: InputProps['transformationRule'];
		/** Плейсхолдер */
		placeholder?: string;
		/** Иконка в конце (по умолчанию календарь) */
		iconSuffix?: Content;
		/** Клик по иконке в конце */
		onClickIconSuffix?: (event: MouseEvent) => void;
		/** Кастомный вывод даты */
		renderDate?: Snippet<[CalendarItemType, any]>;
		/** Конфигурация календаря */
		calendarMode?: CalendarMode;
		/** Календарь в портале */
		useInPortal?: boolean;
		/** Расположение календаря */
		placement?: PlacementsType;
		/** Смещение календаря по основной оси */
		offset?: number;
		/** Смещение календаря по поперечной оси */
		offsetCounterAxis?: number;
		/** Дополнительные классы календаря */
		popoverClassName?: string;
		/** Дополнительные классы поля */
		class?: string;
		/** Параметры выбора времени */
		timeProps?: TimeProps;
		/** Календарь открыт при монтировании */
		defaultOpened?: boolean;
		style?: StyleValue;
		/** Элемент контрола ввода (`div.atmr-input__field`) */
		ref?: HTMLElement | null;
		/**
		 * [ext, not in original] Svelte-анимация всплывающего календаря (scale + fade из угла, как у Popover) и самого календаря (смена месяца / года,
		 * выделение дня). `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let {
		variant = INPUT_VARIANTS.primary,
		size = INPUT_SIZES.m,
		disabled = false,
		showTime = false,
		dateFormat: dateFormatProp,
		isRange = false,
		minDate,
		maxDate,
		disabledDates = [],
		enabledDates = [],
		defaultShownDate,
		activeDate: activeValue,
		secondDate: secondValue,
		onChange = noop,
		onChangeMonth = noop,
		onChangeYear = noop,
		onBlur,
		firstDayIndex,
		daysOfWeek = DAYS_OF_WEEK,
		months,
		minYear = MIN_YEAR,
		maxYear = MAX_YEAR,
		transformationRule,
		placeholder = 'Выберите дату',
		iconSuffix,
		onClickIconSuffix = noop,
		renderDate,
		calendarMode,
		useInPortal = false,
		placement = 'bottom',
		offset,
		offsetCounterAxis,
		popoverClassName,
		class: className,
		timeProps,
		defaultOpened,
		ref = $bindable(null),
		motion,
		...otherProps
	}: InputDateProps = $props();

	const dateFormat = $derived(dateFormatProp ?? (showTime ? 'DD.MM.YYYY HH:mm' : DEFAULT_DATE_FORMAT));

	// element of the input control (`inputRef.current` in React)
	let inputEl = $state<HTMLElement | null>(null);
	// (`firstDayIndex` is accepted like in React, where PickerDate does not use it either)
	void firstDayIndex;
	let popoverEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		ref = inputEl;
	});

	const input = useInputTimeOrDate({
		get disabled() {
			return disabled;
		},
		get activeValue() {
			return activeValue;
		},
		get secondValue() {
			return secondValue;
		},
		get isRange() {
			return isRange;
		},
		get dateFormat() {
			return dateFormat;
		},
		get minDate() {
			return minDate;
		},
		get maxDate() {
			return maxDate;
		},
		get onChange() {
			return onChange;
		},
		get onClickIconSuffix() {
			return onClickIconSuffix;
		},
		get onChangeMonth() {
			return onChangeMonth;
		},
		get onChangeYear() {
			return onChangeYear;
		},
		get onBlur() {
			return onBlur;
		},
		get validationRules() {
			return otherProps.validationRules;
		},
		get defaultOpened() {
			return defaultOpened;
		},
		get inputElement() {
			return inputEl;
		}
	});

	const filtered = $derived(useFilterAttrs(otherProps));
	const rootAttrs = $derived(filtered[0]);
	// `validationRules` were consumed by the hook (React passed the merged rules to Input)
	const restAttrs = $derived.by(() => {
		const { validationRules: _v, ...rest } = filtered[1];
		return rest;
	});

	const css = useValueCssVariable(
		() => [`--atmr-inputdate-${size}-pickerdatetime-offset`],
		() => popoverEl
	);
	const cssOffset = $derived(css.values[0]);

	const popoverClasses = $derived(clsx('atmr-popover--inputDate', popoverClassName && popoverClassName));
	const inputClasses = $derived(clsx('atmr-popover--inputDate', className && className));

	// imask date masks of the active (first / only) and the second (range end) field
	const dateMask = $derived({
		mask: Date,
		pattern: dateFormat,
		autofix: true,
		lazy: true,
		overwrite: true,
		format: (date: Date) => dayjs(date).format(dateFormat),
		parse: (str: string, m: any) => {
			const inputDate = dayjs(str, dateFormat);
			const formatedDate = dayjs(str, dateFormat).format(dateFormat);
			if (str !== formatedDate) {
				m.resolve(formatedDate);
			}
			return inputDate;
		},
		blocks: {
			YYYY: { mask: IMask.MaskedRange, from: 1000, to: 9999 },
			MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
			MMMM: {
				mask: IMask.MaskedEnum,
				enum: Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en', { month: 'long' })),
				matchValue: (estr: string, istr: string, matchFrom: any) =>
					(IMask.MaskedEnum as any).DEFAULTS.matchValue(estr.toLowerCase(), istr.toLowerCase(), matchFrom)
			},
			DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
			HH: { mask: IMask.MaskedRange, from: 0, to: 23 },
			mm: { mask: IMask.MaskedRange, from: 0, to: 59 }
		}
	});
	const createMasks = (options: any): InputDateMasks => ({
		active: IMask.createMask(options) as any,
		second: IMask.createMask(options) as any
	});
	let masks = $state.raw<InputDateMasks>(untrack(() => createMasks(dateMask)));
	// React: useEffect(() => { activeDateMask.current = createMask(dateMask); ... }, [dateMask])
	$effect(() => {
		const options = dateMask;
		untrack(() => {
			masks = createMasks(options);
		});
	});

	// shared with the input control (`RenderInputControl` closed over these in React)
	const fields: InputDateContext['fields'] = { active: null, second: null };
	setContext<InputDateContext>(INPUT_DATE_CONTEXT, {
		get isRange() {
			return isRange;
		},
		get masks() {
			return masks;
		},
		fields
	} as InputDateContext);

	const handleFocusInput = (e: Event) => {
		if (e.target === fields.active || e.target === fields.second) {
			return;
		}
		if (isRange && masks.active.isComplete) {
			fields.second!.focus();
		} else {
			fields.active!.focus();
		}
	};

	// React: `trigger: inputRef.current?.offsetParent` (position the calendar relative to the container of the field).
	// Once the trigger is known React creates the Popper instance also for the CLOSED calendar when it is rendered in place; a portalled
	// calendar is re-mounted by React at that moment (the theme wrapper of `createPortal` changes) and gets its instance only when opened
	// (`lazy`).
	// It is known one render later than the mount: React reads `inputRef.current` on a later render, i.e. after the web font of the field
	// has been requested / has arrived. The position of a closed calendar is computed once, when the Popper instance is created, so the
	// trigger is published after the fonts are ready (otherwise the layout of shrink-to-fit parents, e.g. CalendarMode, is not final yet).
	let popperTrigger = $state.raw<Element | undefined>(undefined);
	$effect(() => {
		const el = inputEl;
		if (!el) {
			popperTrigger = undefined;
			return;
		}
		let cancelled = false;
		void el.offsetParent; // forces the layout (starts the loading of the fonts used by the field)
		Promise.resolve((document as any).fonts?.ready).then(() => {
			if (!cancelled) popperTrigger = (el.offsetParent as Element | null) ?? undefined;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#snippet renderPickerDate()}
	<PickerDate
		{variant}
		size="m"
		onSelect={input.handleSelectDate}
		onChangeMonth={input.handleChangeMonth}
		onChangeYear={input.handleChangeYear}
		activeDate={input.activeDate}
		secondDate={input.secondDate}
		{isRange}
		{minDate}
		{maxDate}
		{defaultShownDate}
		{enabledDates}
		{disabledDates}
		{daysOfWeek}
		{months}
		{minYear}
		{maxYear}
		{showTime}
		{renderDate}
		{calendarMode}
		{timeProps}
		{motion}
	/>
{/snippet}

{#snippet defaultIconSuffix()}<Calendar size={1} />{/snippet}

<Popover
	{...rootAttrs}
	class={clsx('atmr-popover__root--inputDate', rootAttrs.class)}
	popoverClassName={popoverClasses}
	isOpened={input.isOpenCalendar}
	innerChildren={renderPickerDate}
	offset={offset ?? parseFloat(cssOffset)}
	{placement}
	{offsetCounterAxis}
	{useInPortal}
	pointer={false}
	trigger="click"
	onClose={input.hideCalendar}
	{disabled}
	usePopperProps={{ trigger: popperTrigger, lazy: useInPortal }}
	{motion}
	bind:ref={popoverEl}
>
	<Input
		{...restAttrs}
		{variant}
		{size}
		iconSuffix={iconSuffix === undefined ? defaultIconSuffix : iconSuffix}
		onClickIconSuffix={input.handleClickIcon}
		onClick={(e) => {
			input.handleInputClick();
			handleFocusInput(e);
		}}
		validationRules={input.validationRules}
		value={input.value}
		inputControl={InputDateControl}
		{disabled}
		onChange={isRange ? input.handleChangeDateRange : input.handleChangeDate}
		bind:ref={inputEl as any}
		{placeholder}
		class={inputClasses}
	/>
</Popover>
