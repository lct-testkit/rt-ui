// Port of packages/ui-kit/src/utils/input.ts (DOM helpers for text inputs).
// React used SyntheticEvents; here native DOM events are used. Handlers are `(event: Event) => void` where the
// event target is the input element (`event.target` / `event.currentTarget`).

export type InputElement = HTMLInputElement | HTMLTextAreaElement;

/** Set the caret / selection of an input (focuses it first). `endPos` defaults to `pos`. */
export const setCaretPosition = (input: InputElement, pos: number, endPos?: number): void => {
	const end = endPos || pos;
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(pos, end);
	}
};

/** Current caret position of an input (focuses it first); `0` when nothing is selected. */
export const getCaretPosition = (input: InputElement): number => {
	input.focus();
	if (input.selectionStart) {
		return input.selectionStart;
	}
	return 0;
};

/** Keep the caret where it was after a programmatic change of the value (e.g. a mask that inserts a char). */
export const correctCaretPosition = (input: InputElement): void => {
	let currentCaretPosition = getCaretPosition(input);
	const prevVal = input.value;
	setTimeout(() => {
		if (prevVal.length < input.value.length) {
			currentCaretPosition += 1;
		}
		if (prevVal.length > input.value.length) {
			currentCaretPosition -= 1;
		}
		setCaretPosition(input, currentCaretPosition);
	}, 0);
};

export interface TransformationRule {
	/** Transform the raw input value before it is shown / stored. */
	transform: (inputValue?: string) => string;
}

/** Identity transformation used as the default `transformationRule` of inputs. */
export const defaultTrasformationRule: TransformationRule = {
	transform(inputValue = '') {
		return inputValue;
	}
};

/**
 * Call `onChange` with an event whose `target` is the input.
 * For a `click` (the "clear" icon) a copy of the input with `value = ''` is passed as `target` / `currentTarget`,
 * exactly like the React version did, so consumers can read `event.target.value`.
 */
export function resolveOnChange<E extends InputElement = HTMLInputElement>(
	target: E,
	e: Event,
	onChange?: (event: any) => void
): void {
	if (!onChange) {
		return;
	}
	if (e.type === 'click') {
		// click clear icon
		const currentTarget = target.cloneNode(true) as E;
		currentTarget.value = '';
		// native Event.target/currentTarget are read-only getters: wrap the event instead of mutating it
		const event = new Proxy(e, {
			get(orig, prop) {
				if (prop === 'target' || prop === 'currentTarget') return currentTarget;
				const value = Reflect.get(orig, prop, orig);
				return typeof value === 'function' ? value.bind(orig) : value;
			}
		});
		onChange(event);
		return;
	}
	onChange(e);
}
