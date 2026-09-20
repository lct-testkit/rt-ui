<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuUtilityProfile.tsx
	// <li class="... atmr-side-menu__item atmr-side-menu__utility-profile"> [prefix (avatar)] <div><p body-s strong>title</p><p description-l muted>hint</p></div> [suffix]
	// (text and suffix only while the menu is open).
	import clsx from 'clsx';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import Typography from '../Typography/Typography.svelte';
	import type { Content } from '../../internal/types.js';
	import { useSideMenu } from './context.js';

	export interface SideMenuUtilityProfileProps extends SideMenuListItemBase {
		title?: Content;
		hint?: Content;
		suffix?: Content;
		[key: string]: unknown;
	}

	let { class: className, title, hint, suffix, ref = $bindable(null), ...tail }: SideMenuUtilityProfileProps = $props();

	const sideMenu = useSideMenu();
</script>

<ListItem class={clsx('atmr-side-menu__item atmr-side-menu__utility-profile', className)} bind:ref suffix={sideMenu.isMenuOpen ? suffix : undefined} {...tail}>
	{#if sideMenu.isMenuOpen}
		<div>
			<Typography variant="body-s" strong children={title} />
			<Typography variant="description-l" class="atmr-side-menu__text-muted" children={hint} />
		</div>
	{/if}
</ListItem>
