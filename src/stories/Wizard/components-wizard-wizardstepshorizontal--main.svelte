<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import { DEFAULT_CURRENT_STEP, STEPS_EXAMPLE } from './constants.js';
</script>

<WizardStepsHorizontal currentStep={DEFAULT_CURRENT_STEP} textPlacement="right" variant="primary" size="m" steps={STEPS_EXAMPLE} />
