<script lang="ts">
	import { SideMenu, SideMenuContent, SideMenuItem } from '../../src/lib/index.js';

	let { isOpened = true, itemProps = {} }: { isOpened?: boolean; itemProps?: Record<string, unknown> } = $props();
</script>

<SideMenu {isOpened}>
	<SideMenuContent>
		<SideMenuItem {...itemProps}>
			{#snippet prefix()}<svg data-icon="x"></svg>{/snippet}
			Сделки
		</SideMenuItem>
	</SideMenuContent>
</SideMenu>
