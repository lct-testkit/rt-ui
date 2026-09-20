<script lang="ts">
	// Port of `SearchInput` from stories-app/src/stories/SideMenu/1_SideMenu/SideMenu.tsx: an Input bound to the side menu search query
	import Input from '$lib/components/Input/Input.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import { useSideMenu } from '$lib/components/SideMenu/context.js';

	const sideMenu = useSideMenu();
</script>

{#snippet searchIcon()}<Search />{/snippet}

<Input
	placeholder="Поиск по меню"
	iconPrefix={searchIcon}
	size="m"
	showLabel={false}
	value={sideMenu.searchQuery}
	onChange={(e: Event) => sideMenu.setSearchQuery((e.target as HTMLInputElement).value)}
/>
