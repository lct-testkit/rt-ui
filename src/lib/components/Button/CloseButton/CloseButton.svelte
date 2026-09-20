<script lang="ts">
	// Port of packages/ui-kit/src/components/Button/CloseButton/CloseButton.tsx
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import CloseSmall16 from '../../../icons/16/navigation/CloseSmall16.svelte';
	import CloseSmall from '../../../icons/24/navigation/CloseSmall.svelte';
	import CloseLarge from '../../../icons/24/navigation/CloseLarge.svelte';
	import type { CloseButtonSize, CloseButtonVariant } from './constants.js';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		/** Задаёт вариант для компонента */
		variant?: CloseButtonVariant;
		/** Задает размер */
		size?: CloseButtonSize;
		/** Задает кастомную иконку */
		closeIcon?: Content;
	}

	let { variant = 'primary', size = 'm', closeIcon, class: className, ...rest }: Props = $props();

	const rootClass = $derived(clsx('atmr-closebutton', `atmr-closebutton--${variant}`, `atmr-closebutton--size-${size}`, className));
</script>

<button type="button" class={rootClass} {...rest}>
	{#if closeIcon === undefined}
		{#if size === '2xs' || size === 'xs'}<CloseSmall16 />{:else if size === 's'}<CloseSmall />{:else}<CloseLarge />{/if}
	{:else}
		<Slot content={closeIcon} />
	{/if}
</button>
