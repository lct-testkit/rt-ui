<script lang="ts">
	import TagItem from '$lib/components/Tag/TagItem/TagItem.svelte';
	import { TAG_SIZES } from '$lib/components/Tag/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(TAG_SIZES) as v}
		<TagItem size={v}>{v}</TagItem>
	{/each}
</ExamplesDecorator>
