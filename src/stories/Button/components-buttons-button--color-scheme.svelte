<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { COLORSCHEME } from '$lib/constants.js';
</script>

<ExamplesDecorator>
	{#each COLORSCHEME as v}<Button colorScheme={v} label={v} />{/each}
</ExamplesDecorator>
