<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuInfoBlock.tsx
	// <li class="... atmr-side-menu__info-block"> [prefix (default: information icon)] <p description-m>title | shortenedTitle</p>
	// The prefix is hidden while the menu is collapsed (unless `isOpened`); the text is `title` when open, `shortenedTitle` when collapsed.
	import clsx from 'clsx';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import Typography from '../Typography/Typography.svelte';
	import InformationMonochrome from '../../icons/24/alert/InformationMonochrome.svelte';
	import type { Content } from '../../internal/types.js';
	import { useSideMenu } from './context.js';

	export interface SideMenuInfoBlockProps extends SideMenuListItemBase {
		/** Показывать иконку независимо от состояния меню */
		isOpened?: boolean;
		/** Текст в раскрытом меню */
		title?: Content;
		/** Сокращённый текст в свёрнутом меню */
		shortenedTitle?: Content;
		/** Иконка (по умолчанию информационная) */
		prefix?: Content;
		[key: string]: unknown;
	}

	let { isOpened, class: className, title, shortenedTitle, prefix, ref = $bindable(null), ...tail }: SideMenuInfoBlockProps = $props();

	const sideMenu = useSideMenu();
	const showPrefix = $derived(isOpened || sideMenu.isMenuOpen);
</script>

{#snippet defaultPrefix()}
	<InformationMonochrome fill="var(--atmr-neutral-container-default)" secondaryColor="var(--atmr-neutral-on-container)" />
{/snippet}

<ListItem {...tail} bind:ref class={clsx('atmr-side-menu__info-block', className)} prefix={showPrefix ? prefix || defaultPrefix : null}>
	<Typography variant="description-m" children={sideMenu.isMenuOpen ? title : shortenedTitle} />
</ListItem>
