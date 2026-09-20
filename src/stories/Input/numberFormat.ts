// Story helper for `components-input--input-amount`.
//
// The React story builds its amount input from the third party lib `react-number-format@4.9.4` (`NumberFormat` used as the
// `inputControl` of `Input`). This is a straight port of the numeric mode of that class (no `format` pattern mode, no
// custom numerals) to a framework free TypeScript class: same algorithm, same method names, same caret handling.
// `NumberFormatInput.svelte` wires it to a real <input>.
//
// (design/react-vendor/react-number-format/dist/react-number-format.es.js — MIT, Sudhanshu Yadav)

export interface NumberFormatValues {
	formattedValue: string;
	value: string;
	floatValue: number | undefined;
}

export interface NumberFormatProps {
	value?: string | number | null;
	defaultValue?: string | number | null;
	thousandSeparator?: string | boolean;
	decimalSeparator?: string;
	allowedDecimalSeparators?: string[];
	thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan';
	decimalScale?: number;
	fixedDecimalScale?: boolean;
	prefix?: string;
	suffix?: string;
	allowNegative?: boolean;
	allowEmptyFormatting?: boolean;
	allowLeadingZeros?: boolean;
	isNumericString?: boolean;
	onValueChange?: (values: NumberFormatValues, info: { event: Event | null; source: 'event' | 'prop' }) => void;
	isAllowed?: (values: NumberFormatValues) => boolean;
	onChange?: (e: Event) => void;
	onKeyDown?: (e: KeyboardEvent) => void;
	onMouseUp?: (e: MouseEvent) => void;
	onFocus?: (e: FocusEvent) => void;
	onBlur?: (e: FocusEvent) => void;
}

export interface NumberFormatState {
	value: string;
	numAsString: string;
	mounted: boolean;
}

// ─── helpers (verbatim ports) ──────────────────────────────────────────────────────────────────────────────────────

const noop = () => {};

const isNil = (val: unknown): val is null | undefined => val === null || val === undefined;

const escapeRegExp = (str: string) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

function getThousandsGroupRegex(thousandsGroupStyle?: string) {
	switch (thousandsGroupStyle) {
		case 'lakh':
			return /(\d+?)(?=(\d\d)+(\d)(?!\d))(\.\d+)?/g;
		case 'wan':
			return /(\d)(?=(\d{4})+(?!\d))/g;
		case 'thousand':
		default:
			return /(\d)(?=(\d{3})+(?!\d))/g;
	}
}

function applyThousandSeparator(str: string, thousandSeparator: string, thousandsGroupStyle?: string) {
	const thousandsGroupRegex = getThousandsGroupRegex(thousandsGroupStyle);
	let index = str.search(/[1-9]/);
	index = index === -1 ? str.length : index;
	return str.substring(0, index) + str.substring(index, str.length).replace(thousandsGroupRegex, '$1' + thousandSeparator);
}

/** splits a float number into beforeDecimal, afterDecimal and negation */
function splitDecimal(numStr: string, allowNegative = true) {
	const hasNagation = numStr[0] === '-';
	const addNegation = hasNagation && allowNegative;
	numStr = numStr.replace('-', '');

	const parts = numStr.split('.');
	const beforeDecimal = parts[0];
	const afterDecimal = parts[1] || '';

	return { beforeDecimal, afterDecimal, hasNagation, addNegation };
}

function fixLeadingZero(numStr: string) {
	if (!numStr) return numStr;
	const isNegative = numStr[0] === '-';
	if (isNegative) numStr = numStr.substring(1, numStr.length);
	const parts = numStr.split('.');
	const beforeDecimal = parts[0].replace(/^0+/, '') || '0';
	const afterDecimal = parts[1] || '';

	return `${isNegative ? '-' : ''}${beforeDecimal}${afterDecimal ? `.${afterDecimal}` : ''}`;
}

/** limit decimal numbers to given scale */
function limitToScale(numStr: string, scale: number, fixedDecimalScale?: boolean) {
	let str = '';
	const filler = fixedDecimalScale ? '0' : '';
	for (let i = 0; i <= scale - 1; i++) {
		str += numStr[i] || filler;
	}
	return str;
}

const repeat = (str: string, count: number) => Array(count + 1).join(str);

function toNumericString(num: number | string) {
	num += '';

	const sign = num[0] === '-' ? '-' : '';
	if (sign) num = num.substring(1);

	const ref = num.split(/[eE]/g);
	let coefficient = ref[0];
	const exponent = Number(ref[1]);

	if (!exponent) return sign + coefficient;

	coefficient = coefficient.replace('.', '');

	const decimalIndex = 1 + exponent;
	const coffiecientLn = coefficient.length;

	if (decimalIndex < 0) {
		coefficient = '0.' + repeat('0', Math.abs(decimalIndex)) + coefficient;
	} else if (decimalIndex >= coffiecientLn) {
		coefficient = coefficient + repeat('0', decimalIndex - coffiecientLn);
	} else {
		coefficient = (coefficient.substring(0, decimalIndex) || '0') + '.' + coefficient.substring(decimalIndex);
	}

	return sign + coefficient;
}

function roundToPrecision(numStr: string, scale: number, fixedDecimalScale?: boolean) {
	if (['', '-'].indexOf(numStr) !== -1) return numStr;

	const shoudHaveDecimalSeparator = numStr.indexOf('.') !== -1 && scale;
	const { beforeDecimal, afterDecimal, hasNagation } = splitDecimal(numStr);
	const floatValue = parseFloat(`0.${afterDecimal || '0'}`);
	const floatValueStr = afterDecimal.length <= scale ? `0.${afterDecimal}` : floatValue.toFixed(scale);
	const roundedDecimalParts = floatValueStr.split('.');
	const intPart = beforeDecimal
		.split('')
		.reverse()
		.reduce((roundedStr, current, idx) => {
			if (roundedStr.length > idx) {
				return (Number(roundedStr[0]) + Number(current)).toString() + roundedStr.substring(1, roundedStr.length);
			}
			return current + roundedStr;
		}, roundedDecimalParts[0]);

	const decimalPart = limitToScale(roundedDecimalParts[1] || '', Math.min(scale, afterDecimal.length), fixedDecimalScale);
	const negation = hasNagation ? '-' : '';
	const decimalSeparator = shoudHaveDecimalSeparator ? '.' : '';
	return `${negation}${intPart}${decimalSeparator}${decimalPart}`;
}

/** set the caret position in an input field */
function setCaretPosition(el: HTMLInputElement, caretPos: number) {
	el.value = el.value;
	if (el.selectionStart || el.selectionStart === 0) {
		el.focus();
		el.setSelectionRange(caretPos, caretPos);
		return true;
	}
	el.focus();
	return false;
}

/** index range (start - end) of `prevValue` that changed to become `newValue` (consecutive characters only) */
function findChangedIndex(prevValue: string, newValue: string) {
	let i = 0;
	let j = 0;
	const prevLength = prevValue.length;
	const newLength = newValue.length;
	while (prevValue[i] === newValue[i] && i < prevLength) i++;

	while (prevValue[prevLength - 1 - j] === newValue[newLength - 1 - j] && newLength - j > i && prevLength - j > i) {
		j++;
	}

	return { start: i, end: prevLength - j };
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const getCurrentCaretPosition = (el: HTMLInputElement) => Math.max(el.selectionStart ?? 0, el.selectionEnd ?? 0);

/** `inputMode` is only added when the format is a pattern or the platform is not an iPhone / iPod */
export function addInputMode() {
	return typeof navigator !== 'undefined' && !(navigator.platform && /iPhone|iPod/.test(navigator.platform));
}

// ─── NumberFormat ──────────────────────────────────────────────────────────────────────────────────────────────────

export class NumberFormatCore {
	state: NumberFormatState;
	selectionBeforeInput = { selectionStart: 0, selectionEnd: 0 };
	focusedElm: HTMLInputElement | null | undefined = undefined;
	focusTimeout: ReturnType<typeof setTimeout> | undefined;
	caretPositionTimeout: ReturnType<typeof setTimeout> | undefined;

	/** `getProps` always returns the current props; `notify` is called after every state change (React `setState`). */
	constructor(
		private getProps: () => NumberFormatProps,
		private notify: () => void
	) {
		const formattedValue = this.formatValueProp(getProps().defaultValue);
		this.state = { value: formattedValue, numAsString: this.removeFormatting(formattedValue), mounted: false };
	}

	private get props(): Required<
		Pick<NumberFormatProps, 'prefix' | 'suffix' | 'allowNegative' | 'allowLeadingZeros' | 'isNumericString' | 'thousandsGroupStyle' | 'fixedDecimalScale'>
	> &
		NumberFormatProps {
		return {
			decimalSeparator: '.',
			thousandsGroupStyle: 'thousand',
			fixedDecimalScale: false,
			prefix: '',
			suffix: '',
			allowNegative: true,
			allowEmptyFormatting: false,
			allowLeadingZeros: false,
			isNumericString: false,
			onValueChange: noop,
			onChange: noop,
			onKeyDown: noop,
			onMouseUp: noop,
			onFocus: noop,
			onBlur: noop,
			isAllowed: () => true,
			...this.getProps()
		} as any;
	}

	private setState(partial: Partial<NumberFormatState>) {
		this.state = { ...this.state, ...partial };
		this.notify();
	}

	componentDidMount() {
		this.setState({ mounted: true });
	}

	componentWillUnmount() {
		clearTimeout(this.focusTimeout);
		clearTimeout(this.caretPositionTimeout);
	}

	/** React `componentDidUpdate` (runs after every re-render with new props) */
	updateValueIfRequired() {
		const props = this.props;
		const { state, focusedElm } = this;
		const stateValue = state.value;
		const lastNumStr = state.numAsString ?? '';

		this.validateProps();

		const lastValueWithNewFormat = this.formatNumString(lastNumStr);

		const formattedValue = isNil(props.value) ? lastValueWithNewFormat : this.formatValueProp();
		const numAsString = this.removeFormatting(formattedValue);

		const floatValue = parseFloat(numAsString);
		const lastFloatValue = parseFloat(lastNumStr);

		if (
			// while typing set state only when float value changes
			((!isNaN(floatValue) || !isNaN(lastFloatValue)) && floatValue !== lastFloatValue) ||
			// can also set state when float value is same and the format props changes
			lastValueWithNewFormat !== stateValue ||
			// set state always when not in focus and formatted value is changed
			(focusedElm === null && formattedValue !== stateValue)
		) {
			this.updateValue({ formattedValue, numAsString, input: focusedElm, source: 'prop', event: null });
		}
	}

	// ── misc ──

	getFloatString(num = '') {
		const { decimalScale } = this.props;
		const { decimalSeparator = '.' } = this.getSeparators();
		const numRegex = this.getNumberRegex(true);

		// remove negation for regex check
		const hasNegation = num[0] === '-';
		if (hasNegation) num = num.replace('-', '');

		// if decimal scale is zero remove decimal and number after decimalSeparator
		if (decimalSeparator && decimalScale === 0) {
			num = num.split(decimalSeparator)[0];
		}

		num = (num.match(numRegex) || []).join('').replace(decimalSeparator, '.');

		// remove extra decimals
		const firstDecimalIndex = num.indexOf('.');

		if (firstDecimalIndex !== -1) {
			num = `${num.substring(0, firstDecimalIndex)}.${num.substring(firstDecimalIndex + 1, num.length).replace(new RegExp(escapeRegExp(decimalSeparator), 'g'), '')}`;
		}

		// add negation back
		if (hasNegation) num = '-' + num;

		return num;
	}

	// returned regex assumes decimalSeparator is as per prop
	getNumberRegex(g?: boolean, ignoreDecimalSeparator?: boolean) {
		const { decimalScale } = this.props;
		const { decimalSeparator } = this.getSeparators();
		return new RegExp(
			'[0-9]' + (decimalSeparator && decimalScale !== 0 && !ignoreDecimalSeparator ? '|' + escapeRegExp(decimalSeparator) : ''),
			g ? 'g' : undefined
		);
	}

	getSeparators() {
		const { decimalSeparator } = this.props;
		let { thousandSeparator, allowedDecimalSeparators } = this.props;

		if (thousandSeparator === true) {
			thousandSeparator = ',';
		}
		if (!allowedDecimalSeparators) {
			allowedDecimalSeparators = [decimalSeparator as string, '.'];
		}

		return { decimalSeparator, thousandSeparator: thousandSeparator as string | false | undefined, allowedDecimalSeparators };
	}

	getValueObject(formattedValue: string, numAsString: string): NumberFormatValues {
		const floatValue = parseFloat(numAsString);
		return { formattedValue, value: numAsString, floatValue: isNaN(floatValue) ? undefined : floatValue };
	}

	validateProps() {
		const { decimalSeparator, thousandSeparator } = this.getSeparators();
		if (decimalSeparator === thousandSeparator) {
			throw new Error("Decimal separator can't be same as thousand separator.");
		}
	}

	// ── caret ──

	setPatchedCaretPosition(el: HTMLInputElement, caretPos: number, currentValue: string) {
		/* setting caret position within timeout of 0ms is required for mobile chrome, otherwise browser resets the caret
		   position after we set it. It is also set without timeout so that in a normal browser there is no flickering */
		setCaretPosition(el, caretPos);
		this.caretPositionTimeout = setTimeout(() => {
			if (el.value === currentValue) setCaretPosition(el, caretPos);
		}, 0);
	}

	/** keeps the caret within the typing area so people can't type in between prefix or suffix */
	correctCaretPosition(value: string, caretPos: number, _direction?: 'left' | 'right') {
		const { prefix, suffix } = this.props;

		// if value is empty return 0
		if (value === '') return 0;

		// caret position should be between 0 and value length
		caretPos = clamp(caretPos, 0, value.length);

		// in case of format as number limit between prefix and suffix
		const hasNegation = value[0] === '-';
		return clamp(caretPos, prefix.length + (hasNegation ? 1 : 0), value.length - suffix.length);
	}

	getCaretPosition(inputValue: string, formattedValue: string, caretPos: number) {
		const numRegex = this.getNumberRegex(true);
		const inputNumber = (inputValue.match(numRegex) || []).join('');
		const formattedNumber = (formattedValue.match(numRegex) || []).join('');
		let j = 0;
		let i: number;

		for (i = 0; i < caretPos; i++) {
			const currentInputChar = inputValue[i] || '';
			const currentFormatChar = formattedValue[j] || '';
			// no need to increase new cursor position if formatted value does not have those characters
			// case inputValue = 1a23 and formattedValue =  123
			if (!currentInputChar.match(numRegex) && currentInputChar !== currentFormatChar) {
				continue;
			}

			// When we are striping out leading zeros maintain the new cursor position
			// Case inputValue = 00023 and formattedValue = 23;
			if (currentInputChar === '0' && currentFormatChar.match(numRegex) && currentFormatChar !== '0' && inputNumber.length !== formattedNumber.length) {
				continue;
			}

			// we are not using currentFormatChar because j can change here
			while (currentInputChar !== formattedValue[j] && j < formattedValue.length) {
				j++;
			}
			j++;
		}

		// correct caret position if its outside of editable area
		j = this.correctCaretPosition(formattedValue, j);

		return j;
	}

	// ── remove formatting ──

	removePrefixAndSuffix(val: string) {
		const { prefix, suffix } = this.props;

		// remove prefix and suffix
		if (val) {
			const isNegative = val[0] === '-';

			// remove negation sign
			if (isNegative) val = val.substring(1, val.length);

			// remove prefix
			val = prefix && val.indexOf(prefix) === 0 ? val.substring(prefix.length, val.length) : val;

			// remove suffix
			const suffixLastIndex = val.lastIndexOf(suffix);
			val = suffix && suffixLastIndex !== -1 && suffixLastIndex === val.length - suffix.length ? val.substring(0, suffixLastIndex) : val;

			// add negation sign back
			if (isNegative) val = '-' + val;
		}

		return val;
	}

	removeFormatting(val: string) {
		if (!val) return val;

		val = this.removePrefixAndSuffix(val);
		val = this.getFloatString(val);
		return val;
	}

	// ── format ──

	/** @param numStr numeric string / float string (always with `.` as the decimal separator) */
	formatAsNumber(numStr: string) {
		const { decimalScale, fixedDecimalScale, prefix, suffix, allowNegative, thousandsGroupStyle } = this.props;
		const { thousandSeparator, decimalSeparator } = this.getSeparators();

		const hasDecimalSeparator = numStr.indexOf('.') !== -1 || (decimalScale && fixedDecimalScale);
		const split = splitDecimal(numStr, allowNegative);
		let { beforeDecimal, afterDecimal } = split;
		const { addNegation } = split;

		// apply decimal precision if its defined
		if (decimalScale !== undefined) {
			afterDecimal = limitToScale(afterDecimal, decimalScale, fixedDecimalScale);
		}

		if (thousandSeparator) {
			beforeDecimal = applyThousandSeparator(beforeDecimal, thousandSeparator, thousandsGroupStyle);
		}

		// add prefix and suffix
		if (prefix) beforeDecimal = prefix + beforeDecimal;
		if (suffix) afterDecimal = afterDecimal + suffix;

		// restore negation sign
		if (addNegation) beforeDecimal = '-' + beforeDecimal;

		numStr = beforeDecimal + ((hasDecimalSeparator && decimalSeparator) || '') + afterDecimal;

		return numStr;
	}

	formatNumString(numStr = '') {
		const { allowEmptyFormatting } = this.props;
		let formattedValue = numStr;

		if (numStr === '' && !allowEmptyFormatting) {
			formattedValue = '';
		} else if (numStr === '-') {
			formattedValue = '-';
		} else {
			formattedValue = this.formatAsNumber(formattedValue);
		}

		return formattedValue;
	}

	formatValueProp(defaultValue?: string | number | null) {
		const { decimalScale, fixedDecimalScale, allowEmptyFormatting } = this.props;
		let { value, isNumericString } = this.props;

		// if value is undefined or null, use defaultValue instead
		value = isNil(value) ? defaultValue : value;

		const isNonNumericFalsy = !value && value !== 0;

		if (isNonNumericFalsy && allowEmptyFormatting) {
			value = '';
		}

		// if value is not defined return empty string
		if (isNonNumericFalsy && !allowEmptyFormatting) return '';

		if (typeof value === 'number') {
			value = toNumericString(value);
			isNumericString = true;
		}

		// change infinity value to empty string
		if (value === 'Infinity' && isNumericString) {
			value = '';
		}

		// round the number based on decimalScale, format only if non formatted value is provided
		if (isNumericString && typeof decimalScale === 'number') {
			value = roundToPrecision(value as string, decimalScale, fixedDecimalScale);
		}

		return isNumericString ? this.formatNumString(value as string) : this.formatInput(value as string);
	}

	formatNegation(value = '') {
		const { allowNegative } = this.props;
		const negationRegex = new RegExp('(-)');
		const doubleNegationRegex = new RegExp('(-)(.)*(-)');

		// Check number has '-' value
		const hasNegation = negationRegex.test(value);

		// Check number has 2 or more '-' values
		const removeNegation = doubleNegationRegex.test(value);

		// remove negation
		value = value.replace(/-/g, '');

		if (hasNegation && !removeNegation && allowNegative) {
			value = '-' + value;
		}

		return value;
	}

	formatInput(value = '') {
		// format negation only if we are formatting as number
		value = this.removePrefixAndSuffix(value);
		value = this.formatNegation(value);

		// remove formatting from number
		value = this.removeFormatting(value);

		return this.formatNumString(value);
	}

	isCharacterAFormat(caretPos: number, value: string) {
		const { prefix, suffix, decimalScale, fixedDecimalScale } = this.props;
		const { decimalSeparator } = this.getSeparators();

		// check in number format
		return caretPos < prefix.length || caretPos >= value.length - suffix.length || !!(decimalScale && fixedDecimalScale && value[caretPos] === decimalSeparator);
	}

	/**
	 * checks if any formatting got removed by the delete or backspace and resets the value
	 * (also works as fallback if the android chrome keyDown handler does not work)
	 */
	correctInputValue(caretPos: number, lastValue: string, value: string) {
		const { allowNegative, prefix, suffix, decimalScale } = this.props;
		const { allowedDecimalSeparators, decimalSeparator } = this.getSeparators();
		const lastNumStr = this.state.numAsString || '';
		const { selectionStart, selectionEnd } = this.selectionBeforeInput;
		const { start, end } = findChangedIndex(lastValue, value);

		/** Check for any allowed decimal separator is added in the numeric format and replace it with decimal separator */
		if (start === end && (allowedDecimalSeparators as string[]).indexOf(value[selectionStart]) !== -1) {
			const separator = decimalScale === 0 ? '' : decimalSeparator;
			return value.substr(0, selectionStart) + separator + value.substr(selectionStart + 1, value.length);
		}

		const leftBound = prefix.length;
		const rightBound = lastValue.length - suffix.length;

		if (
			// don't do anything if something got added
			value.length > lastValue.length ||
			// or if the new value is an empty string
			!value.length ||
			// or if nothing has changed, in which case start will be same as end
			start === end ||
			// or in case if whole input is selected and new value is typed
			(selectionStart === 0 && selectionEnd === lastValue.length) ||
			// or in case if the whole content is replaced by browser, example (autocomplete)
			(start === 0 && end === lastValue.length) ||
			// or if characters between prefix and suffix is selected.
			(selectionStart === leftBound && selectionEnd === rightBound)
		) {
			return value;
		}

		// check whether the deleted portion has a character that is part of a format
		const deletedValues = lastValue.substr(start, end - start);
		const formatGotDeleted = !![...deletedValues].find((_deletedVal, idx) => this.isCharacterAFormat(idx + start, lastValue));

		// if it has, only remove characters that are not part of the format
		if (formatGotDeleted) {
			const deletedValuePortion = lastValue.substr(start);
			const recordIndexOfFormatCharacters: Record<number, string> = {};
			const resolvedPortion: string[] = [];
			[...deletedValuePortion].forEach((currentPortion, idx) => {
				if (this.isCharacterAFormat(idx + start, lastValue)) {
					recordIndexOfFormatCharacters[idx] = currentPortion;
				} else if (idx > deletedValues.length - 1) {
					resolvedPortion.push(currentPortion);
				}
			});

			Object.keys(recordIndexOfFormatCharacters).forEach((idx) => {
				if (resolvedPortion.length > Number(idx)) {
					resolvedPortion.splice(Number(idx), 0, recordIndexOfFormatCharacters[Number(idx)]);
				} else {
					resolvedPortion.push(recordIndexOfFormatCharacters[Number(idx)]);
				}
			});

			value = lastValue.substr(0, start) + resolvedPortion.join('');
		}

		// for numbers check if beforeDecimal got deleted and there is nothing after decimal,
		// clear all numbers in such case while keeping the - sign
		const numericString = this.removeFormatting(value);
		const { beforeDecimal, afterDecimal, addNegation } = splitDecimal(numericString, allowNegative);

		// clear only if something got deleted
		const isBeforeDecimalPoint = caretPos < value.indexOf(decimalSeparator as string) + 1;
		if (numericString.length < lastNumStr.length && isBeforeDecimalPoint && beforeDecimal === '' && !parseFloat(afterDecimal)) {
			return addNegation ? '-' : '';
		}

		return value;
	}

	/** Update value and caret position */
	updateValue(params: {
		formattedValue: string;
		numAsString?: string;
		inputValue?: string;
		input?: HTMLInputElement | null;
		setCaretPosition?: boolean;
		source: 'event' | 'prop';
		event: Event | null;
		caretPos?: number;
	}) {
		const { formattedValue, input, setCaretPosition: shouldSetCaret = true, source, event } = params;
		let { numAsString, caretPos } = params;
		const { onValueChange } = this.props;
		const lastValue = this.state.value;

		if (input) {
			// calculate caret position if not defined
			if (caretPos === undefined && shouldSetCaret) {
				const inputValue = params.inputValue || input.value;

				const currentCaretPosition = getCurrentCaretPosition(input);

				/* set the value imperatively: also required as, if the new caret position is beyond the previous value,
				   the caret position will not be set correctly */
				input.value = formattedValue;

				// get the caret position
				caretPos = this.getCaretPosition(inputValue, formattedValue, currentCaretPosition);
			}

			/* set the value imperatively, as the caret position is set imperatively as well: keeps value and caret in sync */
			input.value = formattedValue;

			// set caret position, and value imperatively when element is provided
			if (shouldSetCaret) {
				this.setPatchedCaretPosition(input, caretPos as number, formattedValue);
			}
		}

		// calculate numeric string if not passed
		if (numAsString === undefined) {
			numAsString = this.removeFormatting(formattedValue);
		}

		// update state if value is changed
		if (formattedValue !== lastValue) {
			this.setState({ value: formattedValue, numAsString });

			// trigger onValueChange synchronously, so the parent is updated along with the number format
			onValueChange?.(this.getValueObject(formattedValue, numAsString), { event, source });
		}
	}

	// ── input events ──

	onChange = (e: Event) => {
		const el = e.target as HTMLInputElement;
		let inputValue = el.value;
		const { state, props } = this;
		const { isAllowed } = props;
		const lastValue = state.value || '';
		const currentCaretPosition = getCurrentCaretPosition(el);

		inputValue = this.correctInputValue(currentCaretPosition, lastValue, inputValue);

		let formattedValue = this.formatInput(inputValue) || '';
		const numAsString = this.removeFormatting(formattedValue);

		const valueObj = this.getValueObject(formattedValue, numAsString);
		const isChangeAllowed = (isAllowed as NonNullable<typeof isAllowed>)(valueObj);

		if (!isChangeAllowed) {
			formattedValue = lastValue;
		}

		this.updateValue({ formattedValue, numAsString, inputValue, input: el, event: e, source: 'event' });

		if (isChangeAllowed) {
			props.onChange?.(e);
		}
	};

	onBlur = (e: FocusEvent) => {
		const { props, state } = this;
		const { onBlur, allowLeadingZeros } = props;
		let { numAsString } = state;
		const lastValue = state.value;
		this.focusedElm = null;

		clearTimeout(this.focusTimeout);
		clearTimeout(this.caretPositionTimeout);

		// if the numAsString is not a valid number reset it to empty
		if (isNaN(parseFloat(numAsString))) {
			numAsString = '';
		}

		if (!allowLeadingZeros) {
			numAsString = fixLeadingZero(numAsString);
		}

		const formattedValue = this.formatNumString(numAsString);

		// change the state
		if (formattedValue !== lastValue) {
			this.updateValue({ formattedValue, numAsString, input: e.target as HTMLInputElement, setCaretPosition: false, event: e, source: 'event' });
			onBlur?.(e);
			return;
		}
		onBlur?.(e);
	};

	onKeyDown = (e: KeyboardEvent) => {
		const el = e.target as HTMLInputElement;
		const { key } = e;
		const { selectionStart, selectionEnd } = el;
		const value = el.value ?? '';
		let expectedCaretPosition: number | undefined;
		const { decimalScale, fixedDecimalScale, prefix, suffix, onKeyDown } = this.props;
		const ignoreDecimalSeparator = decimalScale !== undefined && fixedDecimalScale;
		const numRegex = this.getNumberRegex(false, ignoreDecimalSeparator);
		const negativeRegex = new RegExp('-');

		this.selectionBeforeInput = { selectionStart: selectionStart as number, selectionEnd: selectionEnd as number };

		// Handle backspace and delete against non numerical/decimal characters or arrow keys
		if (key === 'ArrowLeft' || key === 'Backspace') {
			expectedCaretPosition = (selectionStart as number) - 1;
		} else if (key === 'ArrowRight') {
			expectedCaretPosition = (selectionStart as number) + 1;
		} else if (key === 'Delete') {
			expectedCaretPosition = selectionStart as number;
		}

		// if expectedCaretPosition is not set it means we don't want to handle keyDown, also if multiple characters are selected don't handle
		if (expectedCaretPosition === undefined || selectionStart !== selectionEnd) {
			onKeyDown?.(e);
			return;
		}

		let newCaretPosition = expectedCaretPosition;
		const leftBound = prefix.length;
		const rightBound = value.length - suffix.length;

		if (key === 'ArrowLeft' || key === 'ArrowRight') {
			const direction = key === 'ArrowLeft' ? 'left' : 'right';
			newCaretPosition = this.correctCaretPosition(value, expectedCaretPosition, direction);
		} else if (key === 'Delete' && !numRegex.test(value[expectedCaretPosition]) && !negativeRegex.test(value[expectedCaretPosition])) {
			while (!numRegex.test(value[newCaretPosition]) && newCaretPosition < rightBound) {
				newCaretPosition++;
			}
		} else if (key === 'Backspace' && !numRegex.test(value[expectedCaretPosition])) {
			/* NOTE: special case when backspace is pressed on a negative value while the cursor position is after the
			   prefix. It can't be handled in onChange because there is no information about the key */
			if ((selectionStart as number) <= leftBound + 1 && value[0] === '-') {
				const newValue = value.substring(1);
				this.updateValue({ formattedValue: newValue, caretPos: newCaretPosition, input: el, event: e, source: 'event' });
			} else if (!negativeRegex.test(value[expectedCaretPosition])) {
				while (!numRegex.test(value[newCaretPosition - 1]) && newCaretPosition > leftBound) {
					newCaretPosition--;
				}
				newCaretPosition = this.correctCaretPosition(value, newCaretPosition, 'left');
			}
		}

		if (newCaretPosition !== expectedCaretPosition || expectedCaretPosition < leftBound || expectedCaretPosition > rightBound) {
			e.preventDefault();
			this.setPatchedCaretPosition(el, newCaretPosition, value);
		}

		onKeyDown?.(e);
	};

	/** required to handle the caret position when clicking anywhere within the input */
	onMouseUp = (e: MouseEvent) => {
		const el = e.target as HTMLInputElement;
		const { selectionStart, selectionEnd } = el;
		const value = el.value ?? '';

		if (selectionStart === selectionEnd) {
			const caretPosition = this.correctCaretPosition(value, selectionStart as number);
			if (caretPosition !== selectionStart) {
				this.setPatchedCaretPosition(el, caretPosition, value);
			}
		}

		this.props.onMouseUp?.(e);
	};

	onFocus = (e: FocusEvent) => {
		const el = e.target as HTMLInputElement;
		this.focusedElm = el;
		this.focusTimeout = setTimeout(() => {
			const { selectionStart, selectionEnd } = el;
			const value = el.value ?? '';

			const caretPosition = this.correctCaretPosition(value, selectionStart as number);

			// setPatchedCaretPosition only when everything is not selected on focus (while tabbing into the field)
			if (caretPosition !== selectionStart && !(selectionStart === 0 && selectionEnd === value.length)) {
				this.setPatchedCaretPosition(el, caretPosition, value);
			}

			this.props.onFocus?.(e);
		}, 0);
	};
}
