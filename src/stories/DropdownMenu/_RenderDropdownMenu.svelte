<script lang="ts">
	// Port of `renderDropdownMenu(args)` of stories/DropdownMenu/DropdownMenu.stories.tsx: a DropdownMenu that opens right after the
	// first render (React: `useEffect(() => setIsOpened(true), [])`, "нужен хук на первом рендере, чтобы правильно отрисовать"),
	// keeps the items in state and selects exactly the clicked item.
	import { onMount, untrack, type ComponentProps } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';

	type Props = Omit<ComponentProps<typeof DropdownMenu>, 'items' | 'isOpened' | 'placement' | 'onClickItem' | 'children'> & {
		items: DropdownMenuItem[];
	};

	let { items: initialItems, class: className, ...args }: Props = $props();

	let isOpened = $state(false);
	let items = $state.raw<DropdownMenuItem[]>(untrack(() => (Array.isArray(initialItems) ? initialItems : [])));

	function handleChange(item: DropdownMenuItem) {
		items = items.map((i) => ({ ...i, isSelected: i.key === item.key }));
	}

	onMount(() => {
		isOpened = true;
	});
</script>

<DropdownMenu
	{...args}
	disabledItems={Array.isArray(args.disabledItems) ? args.disabledItems : []}
	{items}
	class={className || '--stories'}
	{isOpened}
	placement="bottom"
	onClickItem={handleChange}
>
	<div class="dd-root"></div>
</DropdownMenu>
