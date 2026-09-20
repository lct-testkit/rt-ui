// Port of packages/ui-kit/src/components/InputDate/hooks.ts (`useInputTimeOrDate`).
//
// React hook state (`useState`) -> `$state`, effects -> `$effect`. The hook takes an object with GETTERS
// (`{ get isRange() { return isRange; }, ... }`) so that it always sees the current props.
// Event handlers read the "render snapshot" values (React closures) at the start, before they change any state, because
// React handlers saw the values of the render they were created in.
import { untrack } from 'svelte';
import dayjs from 'dayjs';
import type { ValidationRule } from '../Input/hooks.svelte.js';
import { noop } from '../../utils/function.js';
import { DATE_RANGE_SEPARATOR } from './constants.js';
import {
	formattingDateRange,
	getScopeDate,
	isPartiallyValidDateRangeFormat,
	isValidDateFormat,
	isValidDateRangeFormat,
	parseDateToString
} from './utils.js';

export interface InputTimeOrDateParams {
	disabled?: boolean;
	/** `activeDate` prop (initial value and later changes are synced into the internal state) */
	activeValue?: Date;
	/** `secondDate` prop */
	secondValue?: Date;
	isRange?: boolean;
	dateFormat: string;
	minDate?: Date;
	maxDate?: Date;
	/** `validationRules` prop, appended to the built-in rules */
	validationRules?: ValidationRule[];
	onChange?: (start?: Date, end?: Date) => void;
	onClickIconSuffix?: (e: any) => void;
	onChangeMonth?: (month: any) => void;
	onChangeYear?: (year: any) => void;
	onBlur?: () => void;
	defaultOpened?: boolean;
	/** the element the `ref` of the input points to (React: `inputRef.current`) */
	inputElement?: HTMLElement | null;
}

/** minimal event shape used by the handlers (`e.target.value`) */
type ValueEvent = { target: { value: string } };

export const useInputTimeOrDate = (params: InputTimeOrDateParams) => {
	const P = params;
	const dateFormat = () => P.dateFormat;
	const isRange = () => P.isRange ?? false;
	const onChange = (start?: Date, end?: Date) => (P.onChange ?? noop)(start, end);
	const onBlur = () => (P.onBlur ?? noop)();

	let activeDate = $state.raw<Date | undefined>(untrack(() => P.activeValue));
	let secondDate = $state.raw<Date | undefined>(untrack(() => P.secondValue));
	let isOpenCalendar = $state(false);
	let displayInputAsFocused = $state(false);
	let value = $state(
		untrack(() =>
			parseDateToString({ start: P.activeValue, end: P.secondValue }, { isRange: isRange(), dateFormat: dateFormat(), isOpenCalendar: false })
		)
	);

	// React: useEffect(() => { const id = setTimeout(() => setIsOpenCalendar(defaultOpened), 0); return () => clearTimeout(id); }, [defaultOpened])
	$effect(() => {
		const defaultOpened = P.defaultOpened ?? false;
		const id = setTimeout(() => {
			isOpenCalendar = defaultOpened;
		}, 0);
		return () => clearTimeout(id);
	});

	// validation rules of the Input (a new array on every read, like React created it on every render)
	const validationRules = $derived.by((): ValidationRule[] => {
		const minDate = P.minDate;
		const maxDate = P.maxDate;
		const extra = P.validationRules;
		const rules: ValidationRule[] = [
			{
				error: 'Укажите окончание периода',
				validate: () => {
					if (isRange()) {
						if (isOpenCalendar) {
							return true;
						}
						return !!activeDate && !!secondDate;
					}
					return true;
				}
			}
		];
		if (minDate || maxDate) {
			rules.push({
				error: 'Неверный диапазон',
				validate: () => {
					const validate = (inputValue?: Date) => {
						if (!inputValue) {
							return true;
						}
						const input = dayjs(inputValue);
						if (minDate && !maxDate) {
							return !input.isBefore(dayjs(minDate), 'day');
						}
						if (maxDate && !minDate) {
							return !input.isAfter(dayjs(maxDate), 'day');
						}
						if (minDate && maxDate) {
							return (input as any).isBetween(minDate, maxDate, 'day', '[]');
						}
						return true;
					};
					return isRange() ? validate(activeDate) && validate(secondDate) : validate(activeDate);
				}
			});
		}
		return rules.concat(extra || []);
	});

	const getValidRangeDate = (dateString: string) => {
		const [dateFrom, dateTo] = dateString.split(DATE_RANGE_SEPARATOR);
		const formattedDateFrom = dayjs(dateFrom, dateFormat()).format(dateFormat());
		const formattedDateTo = dayjs(dateTo, dateFormat()).format(dateFormat());
		return `${formattedDateFrom}${DATE_RANGE_SEPARATOR}${formattedDateTo}`;
	};

	const defaultTransformationRule = {
		transform(inputValue = '') {
			const fmt = dateFormat();
			const isValid = isRange() ? isValidDateRangeFormat(inputValue, fmt) : isValidDateFormat(inputValue, fmt);
			if (isValid) {
				return isRange() ? getValidRangeDate(inputValue) : dayjs(inputValue, fmt).format(fmt);
			}
			return inputValue;
		}
	};

	const toggleCalendar = (e: Event) => {
		if (!P.disabled) {
			e.stopPropagation();
			const open = isOpenCalendar;
			isOpenCalendar = !open;
			if (activeDate && !secondDate) {
				value = value.replace('...', '');
			}
		}
	};

	const handleClickIcon = (e: Event) => {
		P.inputElement?.focus();
		toggleCalendar(e);
		(P.onClickIconSuffix ?? noop)(e);
	};

	const handleInputClick = () => {
		if (!P.disabled) {
			isOpenCalendar = true;
			if (activeDate && !secondDate) {
				value = value.replace('...', '');
			}
		}
	};

	const hideCalendar = () => {
		if (isOpenCalendar) {
			isOpenCalendar = false;
			onBlur();
		}
	};

	const handleSelectDate = (start?: Date, end?: Date) => {
		const wasOpen = isOpenCalendar;
		activeDate = start;
		secondDate = end;
		value = parseDateToString({ start, end }, { isRange: isRange(), dateFormat: dateFormat(), isOpenCalendar: wasOpen });
		onChange(start, end);
		if (start && end) {
			isOpenCalendar = false;
			displayInputAsFocused = false;
			onBlur();
		}
		if (!isRange()) {
			isOpenCalendar = false;
			if (wasOpen) {
				onBlur();
			}
		}
	};

	// (not used by InputDate, kept from the React hook)
	const formattingInScopeValue = (e: ValueEvent) => {
		const { minDate, maxDate } = P;
		if (minDate || maxDate) {
			const fmt = dateFormat();
			if (isValidDateFormat(e.target.value, fmt)) {
				value = dayjs(getScopeDate(e.target.value, fmt, minDate, maxDate)).format(fmt);
				activeDate = dayjs(getScopeDate(e.target.value, fmt, minDate, maxDate)).toDate();
				return;
			}
			if (isValidDateRangeFormat(e.target.value, fmt)) {
				const [dateFrom, dateTo] = e.target.value.split(DATE_RANGE_SEPARATOR);
				const dateStart = getScopeDate(dateFrom, fmt, minDate, maxDate);
				const dateEnd = getScopeDate(dateTo, fmt, minDate, maxDate);
				value = formattingDateRange({ start: new Date(dateStart), end: new Date(dateEnd) }, { isRange: isRange(), dateFormat: fmt, isOpenCalendar });
				activeDate = dateStart;
				secondDate = dateEnd;
				return;
			}
			value = '';
		}
	};

	const handleChangeDate = (e: ValueEvent) => {
		const inputValue = e.target.value;
		const fmt = dateFormat();
		value = inputValue;
		if (!inputValue) {
			activeDate = undefined;
			onChange(undefined);
		}
		if (isValidDateFormat(inputValue, fmt)) {
			const valueDate = dayjs(inputValue, fmt).format();
			activeDate = new Date(valueDate);
			onChange(new Date(valueDate));
		}
	};

	const handleChangeDateRange = (e: ValueEvent) => {
		const fmt = dateFormat();
		const prevActiveDate = activeDate;
		isOpenCalendar = true;
		const inputValue = e.target.value;
		value = inputValue;
		if (!inputValue) {
			activeDate = undefined;
			secondDate = undefined;
			onChange(undefined, undefined);
		}
		if (isValidDateRangeFormat(inputValue, fmt)) {
			const [dateFrom, dateTo] = inputValue.split(DATE_RANGE_SEPARATOR);
			const valueDateFrom = dayjs(dateFrom, fmt).format();
			const valueDateTo = dayjs(dateTo, fmt).format();
			if (dayjs(dateFrom, fmt).isBefore(dayjs(dateTo, fmt), 'd')) {
				activeDate = new Date(valueDateFrom);
				secondDate = new Date(valueDateTo);
				onChange(new Date(valueDateFrom), new Date(valueDateTo));
				value = parseDateToString(
					{ start: new Date(valueDateFrom), end: new Date(valueDateTo) },
					{ isRange: isRange(), dateFormat: fmt, isOpenCalendar: true }
				);
			} else {
				activeDate = new Date(valueDateTo);
				secondDate = new Date(valueDateFrom);
				onChange(new Date(valueDateTo), new Date(valueDateFrom));
				value = parseDateToString(
					{ start: new Date(valueDateTo), end: new Date(valueDateFrom) },
					{ isRange: isRange(), dateFormat: fmt, isOpenCalendar: true }
				);
			}
		}
		const partial = isPartiallyValidDateRangeFormat(inputValue, fmt);
		if (partial.from.valid && !partial.to.valid) {
			secondDate = undefined;
			onChange(prevActiveDate, undefined);
		}
		if (!partial.from.valid && partial.to.valid) {
			const [, dateTo] = inputValue.split(DATE_RANGE_SEPARATOR);
			const valueDateTo = dayjs(dayjs(dateTo, fmt).format()).toDate();
			activeDate = valueDateTo;
			secondDate = undefined;
			onChange(valueDateTo, undefined);
		}
		if (!partial.from.valid && !partial.to.valid) {
			secondDate = undefined;
			activeDate = undefined;
			onChange(undefined, undefined);
		}
	};

	// React: useEffect(() => setDisplayInputAsFocused(isOpenCalendar), [isOpenCalendar])
	$effect(() => {
		displayInputAsFocused = isOpenCalendar;
	});

	// React: when the calendar is closed and both dates are the same object, the second date is dropped
	$effect(() => {
		if (!isOpenCalendar) {
			if (activeDate === secondDate) {
				secondDate = undefined;
			}
		}
	});

	// React: useEffect(sync value with `activeDate` / `secondDate` props, [activeValue, secondValue, isRange, dateFormat])
	$effect(() => {
		const activeValue = P.activeValue;
		const secondValue = P.secondValue;
		const range = isRange();
		const fmt = dateFormat();
		untrack(() => {
			const formattedValue = parseDateToString({ start: activeValue, end: secondValue }, { isRange: range, dateFormat: fmt, isOpenCalendar });
			if (formattedValue !== value) {
				value = formattedValue;
				if (range) {
					if (!formattedValue) {
						activeDate = undefined;
						secondDate = undefined;
					}
					if (isValidDateRangeFormat(formattedValue, fmt)) {
						const [dateFrom, dateTo] = formattedValue.split(DATE_RANGE_SEPARATOR);
						const valueDateFrom = dayjs(dateFrom, fmt).format();
						const valueDateTo = dayjs(dateTo, fmt).format();
						activeDate = new Date(valueDateFrom);
						secondDate = new Date(valueDateTo);
					}
				} else {
					if (!formattedValue) {
						activeDate = undefined;
					}
					if (isValidDateFormat(formattedValue, fmt)) {
						const valueDate = dayjs(formattedValue, fmt).format();
						activeDate = new Date(valueDate);
					}
				}
			}
		});
	});

	const handleChangeMonth = (month: any) => {
		(P.onChangeMonth ?? noop)(month);
	};
	const handleChangeYear = (year: any) => {
		(P.onChangeYear ?? noop)(year);
	};

	return {
		get isOpenCalendar() {
			return isOpenCalendar;
		},
		set isOpenCalendar(v: boolean) {
			isOpenCalendar = v;
		},
		get displayInputAsFocused() {
			return displayInputAsFocused;
		},
		set displayInputAsFocused(v: boolean) {
			displayInputAsFocused = v;
		},
		get activeDate() {
			return activeDate;
		},
		set activeDate(v: Date | undefined) {
			activeDate = v;
		},
		get secondDate() {
			return secondDate;
		},
		set secondDate(v: Date | undefined) {
			secondDate = v;
		},
		get value() {
			return value;
		},
		set value(v: string) {
			value = v;
		},
		handleClickIcon,
		handleInputClick,
		hideCalendar,
		toggleCalendar,
		handleSelectDate,
		handleChangeDate,
		handleChangeDateRange,
		handleChangeMonth,
		handleChangeYear,
		formattingInScopeValue,
		get validationRules() {
			return validationRules;
		},
		defaultTransformationRule
	};
};
