<script lang="ts">
	// Port of packages/sidemenu/src/react/Providers/SideMenuPopoverContentProvider.tsx
	// No DOM: everything inside knows (`useSideMenuPopoverContent()` === true) that it lives in the popover of a collapsed menu.
	import type { Snippet } from 'svelte';
	import { setSideMenuPopoverContent } from './context.js';

	let { children }: { children?: Snippet } = $props();

	setSideMenuPopoverContent(true);
</script>

{@render children?.()}
