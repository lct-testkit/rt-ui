<script lang="ts">
	// Port of stories/DropdownMenu HideOnSelect: the menu closes on select / outside click, the IconButton toggles it
	import './_styles.css';
	import './_placements.css';
	import { onMount } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS } from './_options.js';

	let isOpened = $state(false);
	let items = $state.raw<DropdownMenuItem[]>(OPTIONS);

	function handleChange(item: DropdownMenuItem) {
		items = items.map((i) => ({ ...i, isSelected: i.key === item.key }));
	}

	// React: useEffect(() => setIsOpened(true), [])
	onMount(() => {
		isOpened = true;
	});
</script>

{#snippet kebab()}<MenuKebab />{/snippet}

<div style="width: 300px; height: 300px; display: flex; align-items: flex-start; justify-content: center;">
	<DropdownMenu
		size="m"
		variant="primary"
		useInPortal={false}
		hideOnSelect
		{items}
		onClickItem={handleChange}
		class="--stories"
		{isOpened}
		placement="bottom"
		onClose={() => (isOpened = false)}
	>
		<IconButton icon={kebab} class="dd-root" onclick={() => (isOpened = !isOpened)} />
	</DropdownMenu>
</div>
