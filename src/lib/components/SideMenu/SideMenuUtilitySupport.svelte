<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuUtilitySupport.tsx
	// <li class="... atmr-side-menu__item atmr-side-menu__utility-support"> [prefix] <div><p description-l strong>title</p><p description-m muted>hint</p></div>
	// (text only while the menu is open). React drops the `className` prop of this component (it is excluded and never re-applied).
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import Typography from '../Typography/Typography.svelte';
	import type { Content } from '../../internal/types.js';
	import { useSideMenu } from './context.js';

	export interface SideMenuUtilitySupportProps extends SideMenuListItemBase {
		title?: Content;
		hint?: Content;
		[key: string]: unknown;
	}

	let { class: _className, title, hint, ref = $bindable(null), ...tail }: SideMenuUtilitySupportProps = $props();

	const sideMenu = useSideMenu();
</script>

<ListItem class="atmr-side-menu__item atmr-side-menu__utility-support" bind:ref {...tail}>
	{#if sideMenu.isMenuOpen}
		<div>
			<Typography variant="description-l" strong children={title} />
			<Typography variant="description-m" class="atmr-side-menu__text-muted" children={hint} />
		</div>
	{/if}
</ListItem>
