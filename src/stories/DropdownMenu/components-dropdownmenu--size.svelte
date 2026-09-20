<script lang="ts">
	// Port of stories/DropdownMenu Size: one DropdownMenu per DROPDOWN_MENU_SIZES value, Popper disabled (`usePopperProps.enabled: false`)
	import './_styles.css';
	import './_placements.css';
	import { onMount } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import { DROPDOWN_MENU_SIZES } from '$lib/components/DropdownMenu/constants.js';
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

<div style="display: flex; justify-content: space-around; align-items: flex-start; gap: 10px; width: 600px; height: 300px;">
	{#each Object.values(DROPDOWN_MENU_SIZES) as v (v)}
		<DropdownMenu
			variant="primary"
			useInPortal={false}
			{items}
			onClickItem={handleChange}
			class="--stories"
			{isOpened}
			placement="bottom"
			size={v}
			usePopperProps={{ enabled: false }}
		>
			<div class="dd-root"></div>
		</DropdownMenu>
	{/each}
</div>
