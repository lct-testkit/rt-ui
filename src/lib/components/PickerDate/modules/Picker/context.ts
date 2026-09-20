// Port of packages/ui-kit/src/components/PickerDate/modules/Picker/PickerContext.ts (+ the values PickerContextProvider publishes).
// The context value is an object of getters, so it stays reactive when the provider (PickerDate.svelte) state changes.
import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';
import type { Content } from '../../../../internal/types.js';
import type { MotionProp } from '../../../../ext/motion.svelte.js';
import type { CalendarMode, CalendarView } from '../../constants.js';
import type { CalendarItemType } from '../../types.js';

export interface PickerContextValue {
	readonly rootAttrs: Record<string, any>;
	readonly view: CalendarView;
	readonly nameOfMonths: string[];
	readonly daysOfWeek: string[];
	readonly date: Date;
	setDate: (date: Date) => void;
	readonly today: Date;
	dateClickHandler: (date: Date) => void;
	changeView: (view: CalendarView) => void;
	readonly variant: string;
	readonly size: string;
	readonly activeDate: Date | undefined;
	readonly secondDate: Date | undefined;
	readonly renderDate: Snippet<[CalendarItemType, CalendarView]> | undefined;
	readonly calendarMode: CalendarMode;
	readonly isRange: boolean;
	readonly chevronLeft: Content;
	readonly chevronRight: Content;
	onChangeYear?: (year: number) => void;
	onChangeMonth?: (month: number) => void;
	onSelect?: (active: Date, second?: Date) => void;
	/** [ext, not in original] the `motion` prop of PickerDate (undefined = inherit the ExtMotionProvider; off by default) */
	readonly motion?: MotionProp;
}

/** What every view provider (Dates / Months / Years / Times) hands to the Calendar. */
export interface ViewContextValue {
	readonly cols: number;
	readonly items: CalendarItemType[];
	handleMouseEnter: (date: Date) => void;
	handleMouseLeave: () => void;
}

const PICKER_CONTEXT_KEY = Symbol('atmr-pickerdate-context');

export const setPickerContext = (value: PickerContextValue): PickerContextValue => setContext(PICKER_CONTEXT_KEY, value);
export const getPickerContext = (): PickerContextValue => getContext<PickerContextValue>(PICKER_CONTEXT_KEY);
