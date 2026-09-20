<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuCollapseTrigger.tsx
	//
	//   <SideMenuCollapseTrigger selected={...}>{#snippet prefix()}<Home />{/snippet}Title</SideMenuCollapseTrigger>
	//   <SideMenuCollapseTrigger>{#snippet render({ isOpen })}custom{/snippet}</SideMenuCollapseTrigger>   <- React function-as-children
	//
	// DOM: <div class="atmr-box atmr-side-menu__collapse-trigger [--opened (menu open)] [--popover-open]" prefix="[object Object]">
	//        <li class="atmr-box atmr-list-item atmr-side-menu__item">prefix, title, chevron suffix</li></div>
	// (React spreads every prop on BOTH the Box and the inner SideMenuItem: `prefix` ends up as the DOM attribute `prefix="[object Object]"`;
	// `selected` is only a DOM property of the div there, so it leaves no attribute.)
	// A click toggles the collapse while the menu is open. The title is also registered as the title of the collapsed-menu popover.
	import clsx from 'clsx';
	import { onDestroy, type ComponentProps, type Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import ChevronUp from '../../icons/24/navigation/ChevronUp.svelte';
	import type { Content } from '../../internal/types.js';
	import { boxWithMods } from '../../utils/boxMods.js';
	import SideMenuItem from './SideMenuItem.svelte';
	import { useSideMenu, useSideMenuCollapse } from './context.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuCollapseTriggerProps extends Omit<BoxProps, 'children' | 'tag' | 'ref' | 'prefix' | 'onclick'> {
		/** Обработчик клика по внутреннему элементу (React `onClick`) */
		onclick?: (event: MouseEvent) => void;
		/** Заголовок (в свёрнутом меню показывается заголовком popover) */
		children?: Snippet;
		/** Render-prop вместо стандартного элемента (React: функция в children) */
		render?: Snippet<[{ isOpen: boolean }]>;
		/** Иконка / контент в «начале» */
		prefix?: Content;
		selected?: boolean;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, render, ref = $bindable(null), ...boxProps }: SideMenuCollapseTriggerProps = $props();

	const sideMenu = useSideMenu();
	const collapse = useSideMenuCollapse();

	$effect(() => {
		collapse.setTitle(render ? null : children);
	});
	onDestroy(() => collapse.setTitle(null));
	$effect(() => {
		if (ref) collapse.triggerRef.current = ref;
	});

	// prefix is a DOM attribute of the Box in React (`prefix="[object Object]"`)
	const domProps = $derived.by(() => {
		const props = boxWithMods(boxProps, []);
		const prefix = props.prefix;
		props.prefix = prefix === undefined || prefix === null || prefix === false ? undefined : typeof prefix === 'string' || typeof prefix === 'number' ? String(prefix) : '[object Object]';
		// React sets `selected` as a DOM *property* (no attribute on a div)
		delete props.selected;
		return props;
	});

	const rootClassName = $derived(
		clsx(
			'atmr-side-menu__collapse-trigger',
			{ 'atmr-side-menu__collapse-trigger--opened': sideMenu.isMenuOpen, 'atmr-side-menu__collapse-trigger--popover-open': collapse.isPopoverOpen },
			className
		)
	);

	function handleClick() {
		if (sideMenu.isMenuOpen) {
			collapse.toggle();
		}
	}
</script>

{#snippet chevron()}
	<ChevronUp class={clsx('atmr-side-menu__chevron', !collapse.isCollapseOpen && 'atmr-side-menu__chevron--rotated')} />
{/snippet}

<Box {...domProps} tag="div" class={rootClassName} bind:ref onclick={handleClick}>
	{#if render}
		{@render render({ isOpen: collapse.isCollapseOpen })}
	{:else}
		<SideMenuItem {...boxProps} suffix={chevron}>{#if sideMenu.isMenuOpen}{@render children?.()}{/if}</SideMenuItem>
	{/if}
</Box>
