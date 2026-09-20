<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import { STEPPER_VARIANTS } from '$lib/components/Stepper/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each STEPPER_VARIANTS as v}<Stepper size="m" variant={v} />{/each}
</ExamplesDecorator>
