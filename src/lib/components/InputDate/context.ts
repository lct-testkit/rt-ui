// Shared state between InputDate and its custom input control (React closed over these values in `RenderInputControl`;
// Svelte passes them through the component context).
import type { Masked } from 'imask';

/** imask `MaskedDate` instances of the "active" (first / only) and the "second" (range end) field */
export interface InputDateMasks {
	active: Masked<any>;
	second: Masked<any>;
}

/** the two <input> elements rendered by the control (React `activeFieldRef` / `secondFieldRef`) */
export interface InputDateFields {
	active: HTMLInputElement | null;
	second: HTMLInputElement | null;
}

export interface InputDateContext {
	readonly isRange: boolean;
	/** replaced (not mutated) when `dateFormat` changes */
	masks: InputDateMasks;
	fields: InputDateFields;
}

export const INPUT_DATE_CONTEXT = Symbol('atmr-input-date');
