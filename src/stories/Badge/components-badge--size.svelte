<script lang="ts">
	import Badge from '$lib/components/Badge/Badge.svelte';
	import { BADGE_SIZES } from '$lib/components/Badge/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each BADGE_SIZES as v}<Badge size={v} label={v} />{/each}
</ExamplesDecorator>
