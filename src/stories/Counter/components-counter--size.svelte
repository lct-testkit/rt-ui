<script lang="ts">
	import Counter from '$lib/components/Counter/Counter.svelte';
	import { COUNTER_SIZES } from '$lib/components/Counter/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each COUNTER_SIZES as v}<Counter size={v}>12</Counter>{/each}
</ExamplesDecorator>
