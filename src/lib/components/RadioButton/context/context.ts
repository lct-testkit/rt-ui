// Port of packages/ui-kit/src/components/RadioButton/context/context.ts (React context -> Svelte context).
import { getContext, setContext } from 'svelte';

export interface RadioGroupContextValue {
	handleChange?: (value: string) => void;
	groupValue?: string | number | readonly string[] | null;
	groupDisabled?: boolean;
}

const RADIO_GROUP_CONTEXT_KEY = Symbol('RadioGroupContext');

/** `RadioGroupContextProvider` */
export const setRadioGroupContext = (value: RadioGroupContextValue): RadioGroupContextValue => setContext(RADIO_GROUP_CONTEXT_KEY, value);

/** `useContext(RadioGroupContext)` (React default value is `{}`) */
export const getRadioGroupContext = (): RadioGroupContextValue => getContext<RadioGroupContextValue | undefined>(RADIO_GROUP_CONTEXT_KEY) ?? {};
