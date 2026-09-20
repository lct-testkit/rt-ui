<script lang="ts">
	// Port of stories/Tooltip: Trigger (decorator: examplesDecorator)
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { TRIGGERS } from '$lib/components/Tooltip/constants.js';
</script>

<ExamplesDecorator>
	{#each Object.values(TRIGGERS) as v (v)}
		<Tooltip title="Заголовок" subtitle="Текст внутри тултипа" size="s" style={{ width: 'auto' }} variant="primary" trigger={v}>
			<!-- React renders "Tooltip trigger " and {v} as two separate text nodes -->
			<Typography variant="body-s" style={{ cursor: 'pointer' }}>
				{#snippet children()}Tooltip trigger {#each [v] as text}{text}{/each}{/snippet}
			</Typography>
		</Tooltip>
	{/each}
</ExamplesDecorator>
