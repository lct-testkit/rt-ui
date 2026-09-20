<script lang="ts">
	import Counter from '$lib/components/Counter/Counter.svelte';
	import { COUNTER_COLORSCHEMES } from '$lib/components/Counter/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each COUNTER_COLORSCHEMES as v}<Counter colorScheme={v}>123</Counter>{/each}
</ExamplesDecorator>
