<script lang="ts">
	import Badge from '$lib/components/Badge/Badge.svelte';
	import { SYSTEM_COLORS } from '$lib/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each SYSTEM_COLORS as v}<Badge colorScheme={v} label={v} />{/each}
</ExamplesDecorator>
