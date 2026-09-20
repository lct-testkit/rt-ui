<script lang="ts">
	// Port of the `TopMenuProfileContainer` part of packages/ui-kit/src/components/TopMenu/TopMenu.tsx
	//
	//   <TopMenuProfileContainer prefix={avatar} title="Анна Кузнецова" hint="Администратор" suffix={...} />   // structured profile
	//   <TopMenuProfileContainer>free content</TopMenuProfileContainer>                                         // no prefix/suffix/title/hint
	//
	// DOM: <div class="atmr-box atmr-top-menu__profile-container">
	//        [<div class="atmr-top-menu__profile-prefix">prefix</div>]
	//        [<div class="atmr-top-menu__profile-text"><p body-s strong>title</p><p description-l style="color:var(--atmr-fg-muted)">hint</p></div>]
	//        [<div class="atmr-top-menu__profile-suffix">suffix</div>]</div>
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import Slot from '../../internal/Slot.svelte';
	import Typography from '../Typography/Typography.svelte';
	import type { Content } from '../../internal/types.js';
	import { boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface TopMenuProfileContainerProps extends Omit<BoxProps, 'children' | 'tag' | 'ref' | 'prefix' | 'title'> {
		/** Аватар / иконка */
		prefix?: Content;
		/** Контент в конце */
		suffix?: Content;
		/** Имя */
		title?: Content;
		/** Подпись под именем */
		hint?: Content;
		/** Произвольное содержимое (когда prefix / suffix / title / hint не заданы) */
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, prefix, suffix, title, hint, ref = $bindable(null), ...boxProps }: TopMenuProfileContainerProps = $props();

	const boxPropsWithMods = $derived(boxWithMods(boxProps, []));
	const rootClassName = $derived(clsx('atmr-top-menu__profile-container', className));
	// React: `prefix ?? suffix ?? title ?? hint` (first non-nullish value, then its truthiness)
	const hasProfileContent = $derived(!!(prefix ?? suffix ?? title ?? hint));
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} bind:ref>
	{#if hasProfileContent}
		{#if prefix}<div class="atmr-top-menu__profile-prefix"><Slot content={prefix} /></div>{/if}
		{#if title != null || hint != null}
			<div class="atmr-top-menu__profile-text">
				{#if title != null}<Typography variant="body-s" strong children={title} />{/if}
				{#if hint != null}<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }} children={hint} />{/if}
			</div>
		{/if}
		{#if suffix}<div class="atmr-top-menu__profile-suffix"><Slot content={suffix} /></div>{/if}
	{:else}
		{@render children?.()}
	{/if}
</Box>
