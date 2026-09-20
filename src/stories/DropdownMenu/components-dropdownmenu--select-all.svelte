<script lang="ts">
	// Port of stories/DropdownMenu SelectAll: multi-select of the items with a "Select all" button; Popper disabled
	import './_styles.css';
	import './_placements.css';
	import { onMount } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS } from './_options.js';

	let isOpened = $state(false);
	let items = $state.raw<DropdownMenuItem[]>(OPTIONS);

	// React: useEffect(() => setIsOpened(true), [])
	onMount(() => {
		isOpened = true;
	});

	function handleSelect({ key }: DropdownMenuItem) {
		items = items.map((item) => ({ ...item, isSelected: key === item.key ? !item.isSelected : !!item.isSelected }));
	}

	function handleSelectAll() {
		items = items.map((item) => {
			if (item.key === 'title' || item.key === 'divider' || item.disabled) {
				return item;
			}
			return { ...item, isSelected: true };
		});
	}
</script>

<div>
	<Button label="Select all" onclick={handleSelectAll} style="margin-bottom: 10px;" />
	<DropdownMenu onClickItem={handleSelect} {items} class="--stories" {isOpened} placement="bottom" usePopperProps={{ enabled: false }} useInPortal={false}>
		<div class="dd-root"></div>
	</DropdownMenu>
</div>
