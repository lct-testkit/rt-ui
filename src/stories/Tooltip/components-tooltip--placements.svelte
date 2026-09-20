<script lang="ts">
	// Port of stories/Tooltip: Placements
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import type { PlacementsType } from '$lib/hooks/usePopper/constants.js';

	const PLACEMENTS_MAP: PlacementsType[][] = [
		['topLeft', 'top', 'topRight'],
		['leftTop', 'left', 'leftBottom'],
		['rightTop', 'right', 'rightBottom'],
		['bottomLeft', 'bottom', 'bottomRight']
	];
</script>

{#snippet renderRootButtons(placements: PlacementsType[])}
	{#each placements as placement (placement)}
		<div style="margin: 15px">
			<Tooltip subtitle="Текст внутри тултипа" {placement} trigger="hover" closeButton={false} pointerIsCentered={false} style={{ width: 'min-content' }}>
				<Button label={placement} />
			</Tooltip>
		</div>
	{/each}
{/snippet}

<Typography variant="body-m">pointerIsCentered = false</Typography>
<div class="placements_container">
	<div class="siderow">{@render renderRootButtons(PLACEMENTS_MAP[0])}</div>
	<div class="centralrow">
		<div class="leftcolumn">{@render renderRootButtons(PLACEMENTS_MAP[1])}</div>
		<div class="rightcolumn">{@render renderRootButtons(PLACEMENTS_MAP[2])}</div>
	</div>
	<div class="siderow">{@render renderRootButtons(PLACEMENTS_MAP[3])}</div>
</div>
