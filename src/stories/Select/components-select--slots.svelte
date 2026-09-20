<script lang="ts">
	// Port of stories/Select Slots (header slot with category chips, footer button), decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Chip from '$lib/components/Chip/Chip/Chip.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_WITH_SLOTS } from './_options.js';

	let selectedCategory = $state('all');
	let items = $state.raw<DropdownMenuItem[]>(OPTIONS_WITH_SLOTS);

	const headerItems = [
		{ label: 'Atomaro', key: 'atomaro' },
		{ label: 'Union', key: 'union' },
		{ label: 'KOD', key: 'KOD' }
	];

	function handleClickHeaderSlot(key: string) {
		if (key === 'all') {
			selectedCategory = 'all';
			items = OPTIONS_WITH_SLOTS;
		} else {
			selectedCategory = key;
			items = OPTIONS_WITH_SLOTS.filter((item) => item.key.toString().includes(key));
		}
	}
</script>

{#snippet headerSlot()}
	<div style="display: flex; gap: var(--atmr-spacing-2x); padding: var(--atmr-spacing-3x)">
		<Chip label="Все" onclick={() => handleClickHeaderSlot('all')} selected={selectedCategory === 'all'} />
		{#each headerItems as item (item.key)}
			<Chip label={item.label} onclick={() => handleClickHeaderSlot(item.key)} selected={selectedCategory === item.key} />
		{/each}
	</div>
{/snippet}

{#snippet footerSlot()}
	<div style="display: flex; gap: var(--atmr-spacing-2x); padding: var(--atmr-spacing-3x)">
		<Button label="Footer button" style="width: 100%" />
	</div>
{/snippet}

<DecorateStory>
	<Select
		placement="bottom"
		label="Выберите сотрудника"
		useInPortal
		size="l"
		{items}
		{headerSlot}
		{footerSlot}
		style={{ width: '380px' }}
		dropdownMenuStyle={{ height: 'auto', maxHeight: '400px' }}
	/>
</DecorateStory>
