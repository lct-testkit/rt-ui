<script lang="ts">
	import Badge from '$lib/components/Badge/Badge.svelte';
	import { BADGE_VARIANTS } from '$lib/components/Badge/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each BADGE_VARIANTS as v}<Badge variant={v} label={v} />{/each}
</ExamplesDecorator>
