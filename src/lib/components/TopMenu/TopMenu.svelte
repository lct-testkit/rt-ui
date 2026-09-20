<script lang="ts">
	// Port of packages/ui-kit/src/components/TopMenu/TopMenu.tsx (root `TopMenu`)
	//
	//   <TopMenu variant="floating|default" class="...">
	//     <TopMenuNavigationContainer/> <TopMenuBrandContainer/> <TopMenuProductContainer/> <TopMenuActionsContainer/> <TopMenuUtilitiesContainer/> <TopMenuProfileContainer/>
	//   </TopMenu>
	//   <TopMenu><TopMenuFlow left>...</TopMenuFlow><TopMenuFlow center>...</TopMenuFlow><TopMenuFlow right>...</TopMenuFlow></TopMenu>
	//
	// DOM: <header class="atmr-box atmr-top-menu [atmr-top-menu--floating]" ...>children</header>
	// The React static members (TopMenu.BrandContainer ...) are separate files here (TopMenuBrandContainer.svelte ...).
	// DEVIATION: React sorts the direct children into left (Flow left, Navigation, Brand, Utilities placed before the Product container) /
	// center (Flow center, Product) / right (Flow right, Actions, Profile, the other Utilities) groups and drops every other child. Svelte cannot
	// inspect its children, so they are rendered in declaration order (identical whenever they are declared in that canonical order).
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface TopMenuProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		/** Вариант меню (floating - «парящее» скруглённое меню с тенью) */
		variant?: 'default' | 'floating';
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, variant = 'default', ref = $bindable(null), ...boxProps }: TopMenuProps = $props();

	const mods = $derived(boxMods({ floating: variant === 'floating' }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
	const rootClassName = $derived(clsx('atmr-top-menu', { 'atmr-top-menu--floating': variant === 'floating' }, className));
</script>

<Box {...boxPropsWithMods} tag="header" class={rootClassName} bind:ref>{@render children?.()}</Box>
