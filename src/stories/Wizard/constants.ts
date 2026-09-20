// Port of design/react-src/stories-app/src/stories/Wizard/constants.ts
import type { StepItemHorizontalProps } from '$lib/components/Wizard/StepItemHorizontal/types.js';
import { STEP_TYPES } from '$lib/components/Wizard/StepItemHorizontal/types.js';

export const STEPS_EXAMPLE: StepItemHorizontalProps[] = [
	{ title: 'Этап 1', subtitle: 'Описание этапа 1', type: STEP_TYPES.number },
	{ title: 'Этап 2', subtitle: 'Описание этапа 2', type: STEP_TYPES.number },
	{ title: 'Этап 3', subtitle: 'Описание этапа 3', type: STEP_TYPES.number },
	{ title: 'Этап 4', subtitle: 'Описание этапа 4', type: STEP_TYPES.number }
];

export const DEFAULT_CURRENT_STEP = 1;
