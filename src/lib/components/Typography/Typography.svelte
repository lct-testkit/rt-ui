<script lang="ts">
	// Port of packages/ui-kit/src/components/Typography/Typography.tsx
	//
	//   <Typography variant="body-m" strong>text</Typography>              -> <p class="atmr-typography atmr-typography--body-m atmr-typography--strong">
	//   <Typography as="h1" variant="heading-h1" {children}/>              -> any tag name via `as` (React also allowed components: not supported)
	//   <Typography elipsis elipsisLines={3} style="max-width: 200px">...</Typography>
	//
	// `style` accepts a CSS string (Svelte) or a React-like object ({ width: 300, marginTop: '4px' }).
	// Everything else (id, data-*, aria-*, onclick ...) is spread on the element.
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Content } from '../../internal/types.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { DEFAULT_TYPOGRAPHY_VARIANT, type TypographyVariant } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style'> {
		/** Задает вариант типографики */
		variant?: TypographyVariant;
		/** Задает жирность шрифту */
		strong?: boolean;
		/** Задает тег для типографики */
		as?: string;
		/** Задает дополнительные стили для компонента */
		style?: StyleValue;
		/** Включает обрезку текста многоточием */
		elipsis?: boolean;
		/** Количество строк до обрезки (при elipsis) */
		elipsisLines?: number;
		/** Дочерние элементы компонента */
		children?: Content;
	}

	let {
		children,
		as: tag = 'p',
		variant = DEFAULT_TYPOGRAPHY_VARIANT,
		strong = false,
		class: className,
		style = {},
		elipsis = false,
		elipsisLines = 1,
		...rest
	}: Props = $props();
</script>

<svelte:element
	this={tag}
	class={clsx('atmr-typography', `atmr-typography--${variant}`, strong && 'atmr-typography--strong', elipsis && 'atmr-typography--elipsis', className)}
	style={styleToString(elipsis ? { '--atmr-typography-elipsis-lines': elipsisLines } : {}, style)}
	{...rest}>{#if typeof children === 'function'}{@render children()}{:else if children !== null && children !== undefined && children !== false}{children}{/if}</svelte:element
>
