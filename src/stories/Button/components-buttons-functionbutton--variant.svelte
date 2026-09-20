<script lang="ts">
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import { FUNCTION_BUTTON_VARIANTS } from '$lib/components/Button/FunctionButton/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each FUNCTION_BUTTON_VARIANTS as v}<FunctionButton variant={v} label={v} />{/each}
</ExamplesDecorator>
