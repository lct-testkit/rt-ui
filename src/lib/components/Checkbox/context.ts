// Port of packages/ui-kit/src/components/Checkbox/context.ts (React context -> Svelte context).
// The provider (CheckboxGroup) passes an object with getters so that consumers stay reactive.
import { getContext, setContext } from 'svelte';

export interface CheckboxGroupContextValue {
	onGroupChange?: (id: string) => void;
	groupValue?: string[];
	groupDisabled?: string[];
	disabledAll?: boolean;
}

const CHECKBOX_GROUP_CONTEXT_KEY = Symbol('CheckboxGroupContext');

/** `CheckboxGroupContextProvider` */
export const setCheckboxGroupContext = (value: CheckboxGroupContextValue): CheckboxGroupContextValue =>
	setContext(CHECKBOX_GROUP_CONTEXT_KEY, value);

/** `useContext(CheckboxGroupContext)` (React default value is `{}`) */
export const getCheckboxGroupContext = (): CheckboxGroupContextValue => getContext<CheckboxGroupContextValue | undefined>(CHECKBOX_GROUP_CONTEXT_KEY) ?? {};
