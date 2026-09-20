<script lang="ts">
	import TagGroup from '$lib/components/Tag/TagGroup/TagGroup.svelte';
	import { TAG_SIZES } from '$lib/components/Tag/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	<div style="display: flex; flex-direction: column; gap: 16px">
		{#each Object.values(TAG_SIZES) as v}
			<TagGroup
				size={v}
				items={[
					{ key: 'Tags', value: 'Tags' },
					{ key: 'size', value: 'size' },
					{ key: 'is', value: 'is' },
					{ key: v, value: v }
				]}
			/>
		{/each}
	</div>
</ExamplesDecorator>
