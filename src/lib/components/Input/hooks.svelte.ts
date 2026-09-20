// Port of packages/ui-kit/src/components/Input/hooks.ts (useFocus, useValidation, useTransformation).
//
// React hooks took plain option objects and re-ran on every render. Svelte components pass GETTERS instead, so the hooks
// always read the current props:
//
//   const validation = useValidation(() => ({ validationRules, error, forceError, defaultValidatedStatus: validationOnChange }));
//   validation.error                       // reactive: `error || failedRule.error`
//   validation.validateoOnChange(value)    // only validates when the field was already validated (blur / validationOnChange) or forceError
//   validation.validateOnBlur(value)       // marks the field as validated and validates
//
// The (misspelled) React name `validateoOnChange` is kept; `validateOnChange` is an alias.
import { untrack } from 'svelte';
import { noop } from '../../utils/function.js';
import { defaultTrasformationRule, type TransformationRule } from '../../utils/input.js';

// ─── types ───────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ValidationRule {
	/** Text shown when `validate` is falsy */
	error: string;
	/** Truthy = value is valid */
	validate: (value: string) => unknown;
}

export interface InputTransformationRule extends TransformationRule {
	/** Applied to the (non-empty) value when the field loses focus (not used together with a mask) */
	onBlurTransform?: (value: string) => string;
}

/** Minimal shape of an `imask` Masked instance used by the input. */
export interface MaskInstance {
	resolve(value: string): string;
	readonly value: string;
}

// ─── useFocus ────────────────────────────────────────────────────────────────────────────────────────────────────

export interface UseFocusOptions<E = FocusEvent> {
	onBlur?: (event: E) => void;
	onFocus?: (event: E) => void;
}

export function useFocus<E = FocusEvent>(options: () => UseFocusOptions<E> = () => ({})) {
	let focused = $state(false);
	return {
		get focused() {
			return focused;
		},
		onFocus(event: E) {
			focused = true;
			(options().onFocus ?? noop)(event);
		},
		onBlur(event: E) {
			focused = false;
			(options().onBlur ?? noop)(event);
		}
	};
}

// ─── useValidation ───────────────────────────────────────────────────────────────────────────────────────────────

export interface UseValidationOptions {
	validationRules?: ValidationRule[];
	/** Error passed from outside (wins over the failed rule) */
	error?: string;
	/** Validate on every change even before the first blur */
	forceError?: boolean;
	/** Initial "validated" status (= `validationOnChange`) */
	defaultValidatedStatus?: boolean;
}

export function useValidation(options: () => UseValidationOptions) {
	let validationRule = $state.raw<ValidationRule | undefined>(undefined);
	let validatedStatus = $state(untrack(() => options().defaultValidatedStatus ?? false));

	const validate = (value: string) => {
		const rules = options().validationRules ?? [];
		validationRule = rules.find((rule) => !rule.validate(value));
	};

	const validateoOnChange = (value: string = '') => {
		if (validatedStatus || options().forceError) {
			validate(value);
		}
	};

	const validateOnBlur = (value: string = '') => {
		validatedStatus = true;
		validate(value);
	};

	return {
		/** `error || failedRule.error` */
		get error(): string | undefined {
			return options().error || (validationRule && validationRule.error) || undefined;
		},
		validateoOnChange,
		validateOnChange: validateoOnChange,
		validateOnBlur
	};
}

// ─── useTransformation ───────────────────────────────────────────────────────────────────────────────────────────

export interface UseTransformationOptions {
	transformationRule?: InputTransformationRule;
	onChange?: (event: any) => void;
	setValue?: (value: string) => void;
	/** imask instance when the field works in mask mode */
	mask?: MaskInstance | null;
}

export function useTransformation(options: () => UseTransformationOptions) {
	/** `input` event handler part: transform the typed value, write it back to the input, notify `onChange`, store it. */
	const transformOnChange = (event: Event) => {
		const { transformationRule = defaultTrasformationRule, onChange = noop, setValue = noop, mask } = options();
		const input = event.target as HTMLInputElement | HTMLTextAreaElement;
		const prevValue = input.value;
		let transformedValue: string;
		if (mask) {
			mask.resolve(prevValue);
			transformedValue = mask.value;
		} else {
			transformedValue = transformationRule.transform(prevValue);
		}
		input.value = transformedValue;
		onChange(event);
		setValue(transformedValue);
	};

	const transformOnBlur = (value: string) => {
		const { transformationRule = defaultTrasformationRule, setValue = noop, mask } = options();
		if (mask) return;
		const rule = transformationRule as InputTransformationRule;
		if (rule.onBlurTransform && value) {
			setValue(rule.onBlurTransform(value));
		}
	};

	return { transformOnChange, transformOnBlur };
}
