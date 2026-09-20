<script lang="ts">
	import InputNumberStepper from '$lib/components/InputNumberStepper/InputNumberStepper.svelte';
	import { NUMBER_STEPPER_DISABLED } from '$lib/components/InputNumberStepper/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(NUMBER_STEPPER_DISABLED) as v}<InputNumberStepper disabled={v} />{/each}
</ExamplesDecorator>
