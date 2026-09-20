// Port of packages/ui-kit/src/components/Wizard/constants.ts
import { STEP_STATES, STEP_TYPES } from './StepItemHorizontal/types.js';

export const DEFAULT_ACTIVE_STEP_NUMBER = 0;
export const DEFAULT_STEP_TYPE = STEP_TYPES.number;
export const DEFAULT_STEP_STATE = STEP_STATES.available;

export const WIZARD_VARIANT = { primary: 'primary' } as const;
export type WizardVariant = (typeof WIZARD_VARIANT)[keyof typeof WIZARD_VARIANT];

export const WIZARD_SIZES = { m: 'm' } as const;
export type WizardSize = (typeof WIZARD_SIZES)[keyof typeof WIZARD_SIZES];
