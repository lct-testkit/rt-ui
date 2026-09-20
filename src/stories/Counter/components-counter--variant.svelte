<script lang="ts">
	import Counter from '$lib/components/Counter/Counter.svelte';
	import { COUNTER_VARIANTS } from '$lib/components/Counter/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each COUNTER_VARIANTS as v}<Counter variant={v}>+10</Counter>{/each}
</ExamplesDecorator>
