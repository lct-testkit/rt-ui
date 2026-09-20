<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import { STEP_STATES, STEP_TYPES } from '$lib/components/Wizard/StepItemHorizontal/types.js';
	import type { StepItemHorizontalProps } from '$lib/components/Wizard/StepItemHorizontal/types.js';
	import { STEPS_EXAMPLE } from './constants.js';

	let current = $state(0);

	const steps: StepItemHorizontalProps[] = STEPS_EXAMPLE.map((item, index) => {
		if (index < current) return { ...item, state: STEP_STATES.done };
		if (index === current) return { ...item, state: STEP_STATES.current };
		return { ...item, state: STEP_STATES.available };
	});

	let stepsOnlyIcons = $state<StepItemHorizontalProps[]>(steps.map((item) => ({ ...item, type: STEP_TYPES.icon })));
	let stepsIconsWithNumbers = $state<StepItemHorizontalProps[]>(
		steps.map((item) => (item?.state !== STEP_STATES.available ? { ...item, type: STEP_TYPES.icon } : item))
	);

	const handleNext = () => {
		if (current === STEPS_EXAMPLE.length - 1) return;
		stepsOnlyIcons = stepsOnlyIcons.map((item, index) => {
			if (index === current) return { ...item, state: STEP_STATES.done };
			if (index === current + 1) return { ...item, state: STEP_STATES.current };
			return item;
		});
		stepsIconsWithNumbers = stepsIconsWithNumbers.map((item, index) => {
			if (index === current) return { ...item, state: STEP_STATES.done, type: STEP_TYPES.icon };
			if (index === current + 1) return { ...item, state: STEP_STATES.current, type: STEP_TYPES.icon };
			return item;
		});
		current = current + 1;
	};

	const handlePrev = () => {
		if (current === 0) return;
		stepsOnlyIcons = stepsOnlyIcons.map((item, index) => {
			if (index === current) return { ...item, state: STEP_STATES.available };
			if (index === current - 1) return { ...item, state: STEP_STATES.current };
			return item;
		});
		stepsIconsWithNumbers = stepsIconsWithNumbers.map((item, index) => {
			if (index === current) return { ...item, state: STEP_STATES.available, type: STEP_TYPES.number };
			if (index === current - 1) return { ...item, state: STEP_STATES.current };
			return item;
		});
		current = current - 1;
	};
</script>

<WizardStepsHorizontal
	textPlacement="right"
	variant="primary"
	size="m"
	currentStep={current}
	steps={stepsOnlyIcons}
	style={{ marginBottom: '40px' }}
/>
<WizardStepsHorizontal textPlacement="right" variant="primary" size="m" currentStep={current} steps={stepsIconsWithNumbers} />
<Box style={{ width: '100%', marginTop: '40px' }}>
	<Box flex justifyContent="between" style={{ width: '200px' }}>
		<Button onclick={handlePrev} disabled={current === 0} label="Previous" />
		<Button onclick={handleNext} disabled={current === STEPS_EXAMPLE.length - 1} style="margin-left: 10px" label="Next" />
	</Box>
</Box>
