<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { VARIANT } from '$lib/constants.js';
</script>

<ExamplesDecorator>
	{#each VARIANT as v}<Button variant={v} label={v} />{/each}
</ExamplesDecorator>
