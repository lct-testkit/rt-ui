<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import StepItemHorizontal from '$lib/components/Wizard/StepItemHorizontal/StepItemHorizontal.svelte';
</script>

<div style="width: max-content">
	<WizardStepsHorizontal>
		<StepItemHorizontal title="Этап 1" subtitle="Описание этапа 1" type="number" />
	</WizardStepsHorizontal>
</div>
