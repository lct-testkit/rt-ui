<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import StepItemHorizontal from '$lib/components/Wizard/StepItemHorizontal/StepItemHorizontal.svelte';
	import { STEP_TYPES } from '$lib/components/Wizard/StepItemHorizontal/types.js';
	import OkStroke from '$lib/icons/24/alert/OkStroke.svelte';
	import Invoice from '$lib/icons/24/business/Invoice.svelte';
	import ForkKnife from '$lib/icons/24/place/ForkKnife.svelte';
	import DeliveryCourier from '$lib/icons/24/business/DeliveryCourier.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import { DEFAULT_CURRENT_STEP, STEPS_EXAMPLE } from './constants.js';

	const args = { currentStep: DEFAULT_CURRENT_STEP, textPlacement: 'right', variant: 'primary', size: 'm', steps: STEPS_EXAMPLE } as const;

	const STEPS_ONLY_ICONS = STEPS_EXAMPLE.map(() => ({ type: STEP_TYPES.icon }));
	const STEPS_ICONS_WITH_NUMBERS = STEPS_EXAMPLE.map((_item, index) =>
		index < (args.currentStep || 0) ? { type: STEP_TYPES.icon } : { type: STEP_TYPES.number }
	);
</script>

<WizardStepsHorizontal {...args} steps={STEPS_ONLY_ICONS} style={{ marginBottom: 40 }} />
<WizardStepsHorizontal {...args} steps={STEPS_ICONS_WITH_NUMBERS} style={{ marginBottom: 40 }} />
<WizardStepsHorizontal {...args}>
	<StepItemHorizontal type="icon">
		{#snippet icon()}<OkStroke />{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal type="icon">
		{#snippet icon()}<Invoice />{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal type="icon">
		{#snippet icon()}<ForkKnife />{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal type="icon">
		{#snippet icon()}<DeliveryCourier />{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal type="icon">
		{#snippet icon()}<Home />{/snippet}
	</StepItemHorizontal>
</WizardStepsHorizontal>
