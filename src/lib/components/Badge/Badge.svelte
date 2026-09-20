<script lang="ts">
	// Port of packages/ui-kit/src/components/Badge/Badge.tsx
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Content } from '../../internal/types.js';
	import { DEFAULT_BADGE_COLORSCHEME, DEFAULT_BADGE_SIZE, DEFAULT_BADGE_VARIANT } from './constants.js';
	import type { BadgeColorScheme, BadgeSize, BadgeVariant } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Текст бейджа */
		label?: Content;
		/** Вариант */
		variant?: BadgeVariant;
		/** Размер */
		size?: BadgeSize;
		/** Цветовая схема */
		colorScheme?: BadgeColorScheme;
		/** Показывать точку */
		dot?: boolean;
		/** Кастомная точка (по умолчанию `<span class="atmr-badge__dot">`) */
		dotSlot?: Snippet;
	}

	let {
		label,
		variant = DEFAULT_BADGE_VARIANT,
		size = DEFAULT_BADGE_SIZE,
		colorScheme = DEFAULT_BADGE_COLORSCHEME,
		class: className,
		dot = false,
		dotSlot,
		...rest
	}: Props = $props();

</script>

<div class={clsx('atmr-badge', `atmr-badge--size-${size}`, `atmr-badge--${variant}`, `atmr-badge--${colorScheme}`, dot && 'atmr-badge--is-dot', className)} {...rest}>
	{#if dot}{#if dotSlot}{@render dotSlot()}{:else}<span class="atmr-badge__dot"></span>{/if}{/if}
	<div class="atmr-badge__text">{#if typeof label === 'function'}{@render label()}{:else if label !== null && label !== undefined && label !== false}{label}{/if}</div>
</div>
