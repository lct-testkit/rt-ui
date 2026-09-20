<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import StepItemHorizontal from '$lib/components/Wizard/StepItemHorizontal/StepItemHorizontal.svelte';
	import { STEP_STATES } from '$lib/components/Wizard/StepItemHorizontal/types.js';

	const states = Object.values(STEP_STATES);
</script>

<div style="width: 700px">
	<div style="display: flex; align-items: center; justify-content: center; margin-bottom: 50px">
		{#each states.slice(0, 3) as st (st)}
			<div style="width: 100%">
				<WizardStepsHorizontal>
					<StepItemHorizontal type="icon" subtitle="" state={st} title={`State: ${st}`} style={{ width: '100%' }} />
				</WizardStepsHorizontal>
			</div>
		{/each}
	</div>
	<div style="display: flex; align-items: center; justify-content: center">
		{#each states.slice(3) as st (st)}
			<div style="width: 100%">
				<WizardStepsHorizontal>
					<StepItemHorizontal type="icon" subtitle="" state={st} title={`State: ${st}`} style={{ width: '100%' }} />
				</WizardStepsHorizontal>
			</div>
		{/each}
	</div>
</div>
