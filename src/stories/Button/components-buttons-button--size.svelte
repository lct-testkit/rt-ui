<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { SIZES } from '$lib/constants.js';
</script>

<ExamplesDecorator>
	{#each SIZES as v}<Button size={v} label={v} />{/each}
</ExamplesDecorator>
