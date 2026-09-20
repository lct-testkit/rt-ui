<script lang="ts">
	// Port of packages/ui-kit/src/components/Input/Input.tsx
	//
	// Differences to React that come from the platform (behaviour is the same):
	//  * `ref` (forwardRef) is a bindable prop that holds the <input> element: <Input bind:ref={el} />
	//  * native input attributes are passed with their DOM names (`maxlength`, `autocomplete`, `inputmode` ...) and event
	//    handlers of the inner <input> in lower case (`onkeydown`); the component callbacks keep the React names
	//    (onChange, onClick, onFocus, onBlur, onClear, onClickIconPrefix, onClickIconSuffix)
	//  * `inputControl` is a Svelte component that receives every input attribute (type, value, class, placeholder, oninput,
	//    ...) as props and must bind its <input> element to the bindable `ref` prop
	//  * `iconPrefix` / `iconSuffix` / `clearIcon` / `hintPrefix` / `hintSuffix` / `label` accept a snippet, a string or a number
	//  * `onChange(event)` receives the native `input` event (event.target.value is the transformed value)
	import clsx from 'clsx';
	import IMask from 'imask';
	import { untrack, type Component } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../../icons/Icon.svelte';
	import CloseSmall from '../../icons/24/navigation/CloseSmall.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { noop, preventDefaultFn } from '../../utils/function.js';
	import { defaultTrasformationRule, resolveOnChange } from '../../utils/input.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { INPUT_ICON_SIZE_MAP, INPUT_SIZES, INPUT_VARIANTS, type InputSize, type InputVariant } from './constants.js';
	import {
		useFocus,
		useTransformation,
		useValidation,
		type InputTransformationRule,
		type MaskInstance,
		type ValidationRule
	} from './hooks.svelte.js';

	export interface InputProps
		extends Omit<HTMLInputAttributes, 'size' | 'value' | 'children' | 'style' | 'placeholder' | 'disabled' | 'readonly' | 'required'> {
		/** Задает вариант инпута */
		variant?: InputVariant;
		/** Лейбл */
		label?: Content;
		/** Показывать ли лейбл */
		showLabel?: boolean;
		/** Плейсхолдер */
		placeholder?: string;
		/** Блокирует поле */
		disabled?: boolean;
		/** Только для чтения */
		readOnly?: boolean;
		/** Размер */
		size?: InputSize;
		/** Клик по компоненту */
		onClick?: (event: MouseEvent) => void;
		/** Подсказка (слева под полем) */
		hintPrefix?: Content;
		/** Текст ошибки */
		error?: string;
		/** Проверять значение при каждом изменении, даже до первого blur */
		forceError?: boolean;
		/** Значение (управляемое) */
		value?: string;
		/** Значение по умолчанию */
		defaultValue?: string;
		/** Показывает кнопку очистки */
		clearable?: boolean;
		/** Подсказка справа под полем */
		hintSuffix?: Content;
		/** Иконка в начале */
		iconPrefix?: Content;
		/** Иконка в конце */
		iconSuffix?: Content;
		/** Иконка кнопки очистки */
		clearIcon?: Content;
		/** Клик по иконке в начале */
		onClickIconPrefix?: (event: MouseEvent) => void;
		/** Клик по иконке в конце (иконка становится кнопкой) */
		onClickIconSuffix?: (event: MouseEvent) => void;
		/** Правила валидации */
		validationRules?: ValidationRule[];
		/** Правила трансформации значения */
		transformationRule?: InputTransformationRule;
		onBlur?: (event: FocusEvent) => void;
		onFocus?: (event: FocusEvent) => void;
		/** Изменение значения; получает нативное событие input */
		onChange?: (event: any) => void;
		/** Очистка значения кнопкой */
		onClear?: (event: MouseEvent) => void;
		/** Компонент, заменяющий <input> */
		inputControl?: Component<any>;
		/** Всегда показывать кнопку очистки */
		showClearable?: boolean;
		/** Валидировать при каждом изменении */
		validationOnChange?: boolean;
		/** Обязательное поле */
		required?: boolean;
		/** Дополнительные атрибуты для <input> */
		inputProps?: Record<string, any>;
		/** Маска (imask): строка или объект опций imask */
		mask?: string | Record<string, any>;
		/** Лейбл всегда сверху */
		fixedLabel?: boolean;
		/** Показывать шаблон маски как placeholder */
		maskPlaceholder?: boolean;
		/** Элемент <input> */
		ref?: HTMLInputElement | null;
		style?: StyleValue;
	}

	let {
		variant = INPUT_VARIANTS.primary,
		label: labelProp,
		showLabel = true,
		placeholder,
		disabled = false,
		readOnly = false,
		size = INPUT_SIZES.l,
		onClick = noop,
		hintPrefix = false,
		error: errorProp,
		forceError,
		value: inputValue,
		defaultValue,
		clearable = false,
		hintSuffix,
		iconPrefix,
		iconSuffix,
		clearIcon,
		onClickIconPrefix = noop,
		onClickIconSuffix,
		validationRules = [],
		transformationRule = defaultTrasformationRule,
		onBlur: onPropsBlur = noop,
		onFocus: onPropFocus = noop,
		onChange = noop,
		onClear = noop,
		inputControl: InputControl,
		showClearable = false,
		validationOnChange = false,
		required,
		inputProps = {},
		mask,
		fixedLabel,
		maskPlaceholder = false,
		ref = $bindable(null),
		...restProps
	}: InputProps = $props();

	// class / style / id / data-* go to the root element, everything else to the <input>
	const filtered = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(filtered[0]);
	const restAttrs = $derived(filtered[1]);

	const label = $derived(showLabel ? labelProp : null);
	const isMaskMode = $derived(!!mask);
	const maskInstance = $derived.by((): MaskInstance | null =>
		isMaskMode && mask ? (IMask.createMask(typeof mask === 'string' ? { mask } : (mask as any)) as unknown as MaskInstance) : null
	);

	let value = $state<string | undefined>(untrack(() => transformationRule.transform(defaultValue)));

	const focus = useFocus(() => ({ onBlur: onPropsBlur, onFocus: onPropFocus }));
	const validation = useValidation(() => ({
		validationRules,
		error: errorProp == null ? undefined : errorProp.toString(),
		forceError,
		defaultValidatedStatus: validationOnChange
	}));
	const resolvedError = $derived(disabled || readOnly ? undefined : validation.error);

	const transformation = useTransformation(() => ({
		transformationRule,
		onChange,
		setValue: (v: string) => (value = v),
		mask: isMaskMode ? maskInstance : null
	}));

	// mask mode: start from an empty (resolved) value
	$effect(() => {
		if (isMaskMode) {
			const m = untrack(() => maskInstance);
			value = m?.resolve('');
		}
	});

	// keep the internal value in sync with the `value` prop
	$effect(() => {
		const nextInput = inputValue;
		const rule = transformationRule;
		const maskMode = isMaskMode;
		untrack(() => {
			if (maskMode) {
				const nextValue = nextInput ?? '';
				if (nextValue !== value) {
					maskInstance?.resolve(nextValue);
					value = maskInstance?.value ?? nextValue;
				}
				return;
			}
			const formattedValue = rule.transform(nextInput);
			if (nextInput !== undefined && formattedValue !== value) {
				value = formattedValue;
			}
		});
	});

	// (re)validate the current value after every change of the inputs of the validation
	$effect(() => {
		if (value) {
			validation.validateoOnChange(value);
		}
	});

	function handleChange(event: Event) {
		validation.validateoOnChange((event.target as HTMLInputElement).value);
		transformation.transformOnChange(event);
	}

	function handleBlur(event: FocusEvent) {
		validation.validateOnBlur(value);
		transformation.transformOnBlur(value as string);
		focus.onBlur(event);
	}

	function handleClear(e: MouseEvent) {
		if (disabled) return;
		e.stopPropagation();
		value = '';
		resolveOnChange(ref as HTMLInputElement, e, onChange);
		onClear(e);
	}

	function handleClick(e: MouseEvent) {
		ref?.focus();
		onClick(e);
	}

	const iconSize = $derived(INPUT_ICON_SIZE_MAP[size] ?? undefined);
	const hasClear = $derived(!!(value && !disabled && !readOnly && clearable));
	const maskPattern = $derived(typeof mask === 'string' ? mask : (mask?.mask as string | undefined));

	const rootClassName = $derived(
		clsx(
			'atmr-input',
			`atmr-input--${INPUT_VARIANTS[variant]}`,
			`atmr-input--size-${INPUT_SIZES[size]}`,
			{
				'atmr-input--has-placeholder': !!placeholder || maskPlaceholder,
				'atmr-input--has-value': !!value,
				'atmr-input--has-label': !!label,
				'atmr-input--fixed-label': fixedLabel,
				'atmr-input--hide-label': !showLabel || !label,
				'atmr-input--with-hint': !!(hintPrefix || hintSuffix || resolvedError),
				'atmr-input--only-hint-suffix': !!hintSuffix && !hintPrefix && !resolvedError,
				'atmr-input--error': !!resolvedError,
				'atmr-input--disabled': !!disabled,
				'atmr-input--readOnly': !!readOnly,
				'atmr-input--clearable': !!clearable,
				'atmr-input--icon-suffix': hasClear || !!resolvedError || !!iconSuffix,
				'atmr-input--has-icon-suffix-prop': !!iconSuffix,
				'atmr-input--icon-prefix': !!iconPrefix,
				'atmr-input--show-clearable': showClearable,
				'atmr-input--required': required
			},
			rootAttrs.class
		)
	);

	const inputAttrs = $derived({
		type: 'text',
		value,
		class: 'atmr-input__field',
		placeholder: maskPlaceholder ? maskPattern : placeholder,
		disabled,
		readonly: readOnly,
		oninput: handleChange,
		'data-testid': 'input__field',
		required,
		...restAttrs,
		...inputProps
	});
</script>

<div {...rootAttrs} style={styleToString(rootAttrs.style)} class={rootClassName} data-testid="input" onclick={(e) => { handleClick(e); }}>
	<div class="atmr-input__container" onclick={handleClick} onfocusout={handleBlur} onfocusin={focus.onFocus}>
		{#if label}
			<div class="atmr-input__label"><span><Slot content={label} /></span></div>
		{/if}
		{#if InputControl}
			<InputControl bind:ref {...inputAttrs} />
		{:else}
			<input bind:this={ref} {...inputAttrs} />
		{/if}
		{#if maskPlaceholder && value && value.length > 0}
			<div class="atmr-input__field atmr-input__mask-placeholder">
				<span style="opacity: 0">{value}</span>
				<span>{(maskPattern as string).replace('{', '').replace('}', '').slice(value.length)}</span>
			</div>
		{/if}
		{#if iconPrefix}
			<div class="atmr-input__prefix" onclick={onClickIconPrefix}><Slot content={iconPrefix} /></div>
		{/if}
		<div class="atmr-input__suffix-container">
			{#if hasClear}
				<button
					type="button"
					class="atmr-input__suffix clear"
					onclick={handleClear}
					onmousedown={preventDefaultFn}
					ontouchstart={preventDefaultFn}
					aria-label="Clear"
					data-testid="input__suffix__clear"
				>
					{#if clearIcon === undefined}<CloseSmall size={iconSize} />{:else}<Slot content={clearIcon} />{/if}
				</button>
			{/if}
			{#if resolvedError}
				<span class="atmr-input__suffix atmr-input__suffix--error" data-testid="input__suffix__error">
					<Icon size={iconSize} fill="var(--atmr-error-soft)" {...{ secondaryColor: 'var(--atmr-error-on-error)' }}>
						<path
							d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
							fill="var(--atmr-error-soft)"
						/>
						<path
							d="M11.2977 13.5312H12.6977L12.9217 10.602V7.19995H11.0737V10.602L11.2977 13.5312ZM11.0737 17H12.9217V15.068H11.0737V17Z"
							fill="var(--atmr-error-on-error)"
						/>
					</Icon>
				</span>
			{/if}
			{#if iconSuffix}
				{#if onClickIconSuffix}
					<button
						type="button"
						class="atmr-input__suffix"
						onclick={onClickIconSuffix}
						onmousedown={preventDefaultFn}
						ontouchstart={preventDefaultFn}
						aria-label="Input-right-icon"
						data-testid="input__suffix"
					>
						<Slot content={iconSuffix} />
					</button>
				{:else}
					<div class="atmr-input__suffix" aria-label="atmr-Input-right-icon" data-testid="input__suffix"><Slot content={iconSuffix} /></div>
				{/if}
			{/if}
		</div>
	</div>
	{#if hintPrefix || hintSuffix || resolvedError}
		<div class="atmr-input__hint" onclick={(e) => e.stopPropagation()}>
			<div class="atmr-input__hint-prefix"><Slot content={resolvedError || hintPrefix} /></div>
			{#if hintSuffix}
				<div class="atmr-input__hint-suffix"><Slot content={hintSuffix} /></div>
			{/if}
		</div>
	{/if}
</div>
