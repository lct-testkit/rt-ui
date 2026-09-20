// Port of packages/ui-kit/src/components/Wizard/StepItemHorizontal/types.ts (TS enums become const objects + unions)
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Content } from '../../../internal/types.js';
import type { StyleValue } from '../../../utils/style.js';

export const STEP_STATES = {
	done: 'done',
	current: 'current',
	available: 'available',
	error: 'error',
	warning: 'warning',
	pause: 'pause'
} as const;
export type StepState = (typeof STEP_STATES)[keyof typeof STEP_STATES];

export const STEP_TYPES = {
	number: 'number',
	icon: 'icon'
} as const;
export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES];

export const STEP_TEXT_ALIGNMENT = {
	right: 'right',
	bottom: 'bottom'
} as const;
export type StepTextAlignment = (typeof STEP_TEXT_ALIGNMENT)[keyof typeof STEP_TEXT_ALIGNMENT];

/** Argument of the `icon` render prop (React: `icon({ state, type, textPlacement })`) */
export interface StepIconRenderProps {
	state: StepState;
	type: StepType;
	textPlacement: StepTextAlignment;
}

export interface StepItemHorizontalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'style'> {
	/** Заголовок этапа */
	title?: Content;
	/** Подзаголовок этапа */
	subtitle?: Content;
	/** Тип индикатора: номер или иконка */
	type?: StepType;
	/** Состояние этапа (по умолчанию вычисляется из currentStep визарда) */
	state?: StepState;
	/** Кастомная иконка (или snippet, получающий { state, type, textPlacement }) */
	icon?: Content | Snippet<[StepIconRenderProps]>;
	style?: StyleValue;
	/** Служебный атрибут: порядковый номер этапа (1-based); проставляет WizardStepsHorizontal */
	'data-step'?: number | string;
}
