<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import { STEPPER_SIZES } from '$lib/components/Stepper/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each STEPPER_SIZES as v}<Stepper variant="primary" size={v} />{/each}
</ExamplesDecorator>
