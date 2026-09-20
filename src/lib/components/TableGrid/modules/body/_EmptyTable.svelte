<script lang="ts">
	// Port of TableGrid/EmptyTable.tsx: the "no rows" area (`renders.emptyTable` replaces the default text).
	import Slot from '../../../../internal/Slot.svelte';
	import type { Content } from '../../../../internal/types.js';
	import Typography from '../../../Typography/Typography.svelte';

	let { content }: { content?: Content } = $props();
</script>

<div class="atmr-tablegrid__empty">
	{#if content}<Slot {content} />{:else}<Typography variant="body-m" children="Таблица пуста" />{/if}
</div>
