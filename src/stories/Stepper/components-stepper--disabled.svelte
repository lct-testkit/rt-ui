<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import { STEPPER_DISABLED } from '$lib/components/Stepper/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each STEPPER_DISABLED as v}<Stepper disabled={v} />{/each}
</ExamplesDecorator>
