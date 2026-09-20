<script lang="ts">
	// Port of TableGrid/modules/header-bar/components/HeaderBar.tsx: the table title bar (`renders.extraHeader`).
	import Slot from '../../../../internal/Slot.svelte';
	import Typography from '../../../Typography/Typography.svelte';
	import type { TableGridHeaderBarProps } from '../../types.js';

	let { title, content }: TableGridHeaderBarProps = $props();
</script>

{#if title || content}
	<div class="atmr-tablegrid__header__bar">
		<Typography variant="heading-h2" children={title} />
		<Slot {content} />
	</div>
{/if}
