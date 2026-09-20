<script lang="ts">
	// Port of the TagAdd component declared next to TagGroup (packages/ui-kit/src/components/Tag/TagAdd/TagAdd.tsx):
	// the "Добавить" button of a editable TagGroup.
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import AddLarge16 from '../../../icons/16/action/AddLarge16.svelte';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, TAG_SIZES, TAG_VARIANTS, warnDeprecatedSecondaryVariant, type TagSize, type TagVariant } from '../constants.js';

	export interface TagAddProps extends Omit<HTMLButtonAttributes, 'children'> {
		/** Размер компонента */
		size?: TagSize;
		/** Задаёт вариант для компонента */
		variant?: TagVariant;
		/** Иконка кнопки */
		icon?: Content;
		/** Дочерние элементы компонента */
		children?: Content;
	}

	let { size = DEFAULT_SIZE, variant = DEFAULT_VARIANT, class: className, onclick, icon: iconProp, children, ...restProps }: TagAddProps = $props();

	if (variant === TAG_VARIANTS.secondary) {
		warnDeprecatedSecondaryVariant('TagAdd');
	}

	const rootClass = $derived(clsx('atmr-tagitem', `atmr-tagitem--${TAG_VARIANTS[variant]}`, `atmr-tagitem--size-${TAG_SIZES[size]}`, className));
</script>

<button type="button" class={rootClass} {onclick} {...restProps}>
	<span class="atmr-tagitem__label"><Slot content={children} /></span>
	<span class="atmr-tagitem__addbutton">
		{#if iconProp != null}
			<Slot content={iconProp} />
		{:else if size === 'xs' || size === 's'}
			<AddLarge16 style="width: 12px; height: 12px;" />
		{:else}
			<AddLarge16 />
		{/if}
	</span>
</button>
