<script lang="ts">
	// Port of packages/ui-kit/src/components/TextArea/TextArea.tsx
	//
	// Differences to React that come from the platform (behaviour is the same):
	//  * `ref` (forwardRef) is a bindable prop that holds the <textarea> element: <TextArea bind:ref={el} />
	//  * native textarea attributes are passed with their DOM names (`maxlength`, `name`, `autocomplete` ...) and DOM event
	//    handlers of the inner <textarea> in lower case (`onkeydown`); the component callbacks keep the React names
	//    (onChange, onFocus, onBlur, onClear)
	//  * `onChange(event)` receives the native `input` event (event.target.value is the typed value)
	//  * `label` / `hintPrefix` / `hintSuffix` / `clearIcon` accept a snippet, a string or a number
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import AttentionMonochrome from '../../icons/24/alert/AttentionMonochrome.svelte';
	import CloseSmall from '../../icons/24/navigation/CloseSmall.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { noop, preventDefaultFn } from '../../utils/function.js';
	import { resolveOnChange } from '../../utils/input.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { INPUT_ICON_SIZE_MAP, INPUT_SIZES, INPUT_VARIANTS, type InputSize, type InputVariant } from '../Input/constants.js';
	import { useValidation, type ValidationRule } from '../Input/hooks.svelte.js';
	import TextAreaAutoSize, { type TextAreaAutoHeight } from './components/TextAreaAutoSize.svelte';

	export type { TextAreaAutoHeight };
	export type TextAreaResize = 'none' | 'both' | 'horizontal' | 'vertical';

	export interface TextAreaProps
		extends Omit<
			HTMLTextareaAttributes,
			'value' | 'children' | 'style' | 'placeholder' | 'disabled' | 'readonly' | 'required' | 'rows' | 'onfocus' | 'onblur'
		> {
		/** Автоматическая высота: `{ enabled: true, maxRows: 7 }` (не работает вместе с `resize`) */
		autoHeight?: TextAreaAutoHeight;
		/** Задает вариант */
		variant?: InputVariant;
		/** Размер */
		size?: InputSize;
		/** Лейбл */
		label?: Content;
		/** Показывать ли лейбл */
		showLabel?: boolean;
		/** Плейсхолдер */
		placeholder?: string;
		/** Значение (управляемое) */
		value?: string;
		/** Значение по умолчанию */
		defaultValue?: string;
		/** Текст ошибки */
		error?: string;
		/** Подсказка (слева под полем) */
		hintPrefix?: Content;
		/** Подсказка справа под полем */
		hintSuffix?: Content;
		/** Блокирует поле */
		disabled?: boolean;
		/** Только для чтения */
		readOnly?: boolean;
		/** Количество строк */
		rows?: number;
		/** Изменение значения; получает нативное событие input */
		onChange?: (event: any) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
		/** Правила валидации */
		validationRules?: ValidationRule[];
		/** Проверять значение при каждом изменении, даже до первого blur */
		forceError?: boolean;
		/** Валидировать при каждом изменении */
		validationOnChange?: boolean;
		/** Показывает кнопку очистки */
		clearable?: boolean;
		/** Всегда показывать кнопку очистки */
		showClearable?: boolean;
		/** Обязательное поле */
		required?: boolean;
		/** Иконка кнопки очистки */
		clearIcon?: Content;
		/** Очистка значения кнопкой */
		onClear?: (event: MouseEvent) => void;
		/** Изменение размера пользователем */
		resize?: TextAreaResize;
		/** Элемент <textarea> */
		ref?: HTMLTextAreaElement | null;
		style?: StyleValue;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
	}

	const AUTOHEIGHT_DEFAULT: TextAreaAutoHeight = { enabled: false };

	let {
		autoHeight = AUTOHEIGHT_DEFAULT,
		variant = INPUT_VARIANTS.primary,
		size = INPUT_SIZES.m,
		label: labelProp,
		showLabel = true,
		placeholder,
		value: valueProp,
		defaultValue,
		error: errorProp,
		hintPrefix,
		hintSuffix,
		disabled = false,
		readOnly = false,
		rows = 3,
		onChange = noop,
		onFocus = noop,
		onBlur = noop,
		validationRules = [],
		forceError,
		validationOnChange = false,
		clearable = false,
		showClearable = false,
		required,
		clearIcon,
		onClear = noop,
		resize = 'none',
		ref = $bindable(null),
		...restProps
	}: TextAreaProps = $props();

	const validation = useValidation(() => ({
		validationRules,
		error: errorProp == null ? undefined : errorProp.toString(),
		forceError,
		defaultValidatedStatus: validationOnChange
	}));
	const resolvedError = $derived(disabled || readOnly ? undefined : validation.error);

	// class / style / id / data-* go to the root element, everything else to the <textarea>
	const filtered = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(filtered[0]);
	const restAttrs = $derived(filtered[1]);

	const label = $derived(showLabel ? labelProp : null);

	let value = $state<string | undefined>(untrack(() => defaultValue));

	// keep the internal value in sync with the `value` prop
	$effect(() => {
		if (valueProp !== undefined && valueProp !== value) {
			value = valueProp;
		}
	});

	function handleBlur(event: FocusEvent) {
		validation.validateOnBlur((event.target as HTMLTextAreaElement).value);
		onBlur(event);
	}

	function handleChange(event: Event) {
		onChange(event);
		const newValue = (event.target as HTMLTextAreaElement).value;
		validation.validateoOnChange(newValue);
		value = newValue;
	}

	function handleClear(e: MouseEvent) {
		if (disabled) return;
		e.stopPropagation();
		value = '';
		resolveOnChange(ref as HTMLTextAreaElement, e, onChange);
		onClear(e);
	}

	const isAutoHeightRequested = $derived(!!autoHeight.enabled);
	const isResizable = $derived(resize !== 'none');
	const useAutoHeight = $derived(isAutoHeightRequested && !isResizable);
	const hasClear = $derived(!!(value && !disabled && !readOnly && clearable));

	// React keeps the `defaultValue` (= the text content) of a controlled <textarea> equal to its value
	$effect(() => {
		const el = ref;
		const current = value;
		if (el && current != null && el.defaultValue !== current) {
			el.defaultValue = current;
		}
	});

	// a textarea that stopped being resizable forgets the size chosen with the resize handle
	$effect(() => {
		const el = ref;
		if (!el || isResizable) return;
		el.style.removeProperty('width');
		el.style.removeProperty('height');
	});

	const rootClassName = $derived(
		clsx(
			'atmr-input',
			`atmr-input--${INPUT_VARIANTS[variant]}`,
			`atmr-input--size-${INPUT_SIZES[size]}`,
			{
				'atmr-input--has-placeholder': !!placeholder,
				'atmr-input--has-value': !!value,
				'atmr-input--with-hint': !!(hintPrefix || hintSuffix || resolvedError),
				'atmr-input--only-hint-suffix': !!hintSuffix && !hintPrefix && !resolvedError,
				'atmr-input--error': !!resolvedError,
				'atmr-input--disabled': !!disabled,
				'atmr-input--readOnly': !!readOnly,
				'atmr-input--textarea': true,
				'atmr-input--textarea-hide-label': !label,
				'atmr-input--hide-label': !label,
				'atmr-input--auto-size': useAutoHeight,
				'atmr-input--resize': isResizable,
				'atmr-input--resize-vertical': isResizable && resize === 'vertical',
				'atmr-input--resize-horizontal': isResizable && resize === 'horizontal',
				'atmr-input--clearable': !!clearable,
				'atmr-input--icon-suffix': hasClear || !!resolvedError,
				'atmr-input--show-clearable': showClearable,
				'atmr-input--required': required
			},
			rootAttrs.class
		)
	);

	// DOM handlers passed through `restProps` run first (React: onInput before onChange), then the internal ones
	const textareaAttrs = $derived.by(() => {
		const { oninput, onfocus, onblur, ...others } = restAttrs;
		return {
			disabled,
			readonly: readOnly,
			onblur: (event: FocusEvent) => {
				onblur?.(event);
				handleBlur(event);
			},
			oninput: (event: Event) => {
				oninput?.(event);
				handleChange(event);
			},
			onfocus: (event: FocusEvent) => {
				onfocus?.(event);
				onFocus(event);
			},
			placeholder,
			rows,
			value,
			...others
		};
	});
</script>

<div {...rootAttrs} style={styleToString(rootAttrs.style)} class={rootClassName} data-testid="textarea">
	<div class="atmr-input__container" data-replicated-value={useAutoHeight ? (value ?? '') : undefined}>
		{#if label}
			<div class="atmr-input__label"><span><Slot content={label} /></span></div>
		{/if}
		{#if !useAutoHeight}
			<textarea bind:this={ref} {...textareaAttrs} {required} class="atmr-input__field atmr-scroll-bar"></textarea>
		{:else}
			<TextAreaAutoSize bind:ref {...textareaAttrs} {autoHeight} class="atmr-input__field" />
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
					data-testid="textarea__suffix__clear"
				>
					{#if clearIcon === undefined}<CloseSmall size={INPUT_ICON_SIZE_MAP[size] ?? undefined} />{:else}<Slot content={clearIcon} />{/if}
				</button>
			{/if}
			{#if resolvedError}
				<span class="atmr-input__suffix atmr-input__suffix--error" data-testid="textarea__suffix__error">
					<AttentionMonochrome size={INPUT_ICON_SIZE_MAP[size]} fill="var(--atmr-error-soft)" secondaryColor="var(--atmr-error-on-error)" />
				</span>
			{/if}
		</div>
	</div>
	{#if hintPrefix || hintSuffix || resolvedError}
		<div class="atmr-input__hint">
			<div class="atmr-input__hint-prefix"><Slot content={resolvedError || hintPrefix} /></div>
			{#if hintSuffix}
				<div class="atmr-input__hint-suffix"><Slot content={hintSuffix} /></div>
			{/if}
		</div>
	{/if}
</div>
