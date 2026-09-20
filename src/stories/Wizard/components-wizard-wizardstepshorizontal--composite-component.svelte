<script lang="ts">
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import StepItemHorizontal from '$lib/components/Wizard/StepItemHorizontal/StepItemHorizontal.svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import OkColor from '$lib/icons/24/alert/OkColor.svelte';
	import TimeColor from '$lib/icons/24/alert/TimeColor.svelte';
	import { DEFAULT_CURRENT_STEP, STEPS_EXAMPLE } from './constants.js';

	const args = { currentStep: DEFAULT_CURRENT_STEP, textPlacement: 'right', variant: 'primary', size: 'm', steps: STEPS_EXAMPLE } as const;
</script>

<WizardStepsHorizontal {...args}>
	<StepItemHorizontal type="icon" state="available">
		{#snippet icon()}<OkColor style="fill: green" />{/snippet}
		{#snippet subtitle()}Здесь используется кастомная иконка и badge<Badge variant="secondary" colorScheme="success" label="Текст стикера для успешного шага" />{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal type="icon" state="available" title="Ожидание">
		{#snippet icon()}<TimeColor style="fill: var(--atmr-info-default)" />{/snippet}
		{#snippet subtitle()}Здесь используется кастомная иконка и текст рыба <br />All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.{/snippet}
	</StepItemHorizontal>
	<StepItemHorizontal state="current" type="number" />
	<StepItemHorizontal state="error" type="number" title="Ошибка">
		{#snippet subtitle()}<Badge dot variant="primary" colorScheme="error" label="Проваленный шаг" />{/snippet}
	</StepItemHorizontal>
</WizardStepsHorizontal>
