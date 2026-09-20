<script lang="ts">
	// Port of packages/ui-kit/src/components/Box/Box.tsx (+ types.ts)
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { BOX_TOKEN_SET } from './tokens.js';
	import type { BorderRadiusToken, BoxShadowToken, ColorToken, SpacingToken } from './tokens.js';

	/** Free-form CSS value (React: `CssSizeValues` = `${number}px` | ... | string) */
	type Css = string & {};
	type Spacing = SpacingToken | Css;
	type BorderWidth = '0px' | '1px' | '2px' | '4px' | Css;
	type BorderStyle = 'none' | 'hidden' | 'dotted' | 'dashed' | 'solid' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset' | Css;

	export type BoxDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
	export type BoxJustify = 'start' | 'end' | 'between' | 'around' | 'center' | 'evenly';
	export type BoxAlign = 'start' | 'end' | 'stretch' | 'center';

	// IJustify / IAlign from Box/types.ts
	const JUSTIFY: Record<string, string> = {
		start: 'flex-start',
		end: 'flex-end',
		between: 'space-between',
		around: 'space-around',
		center: 'center',
		evenly: 'space-evenly'
	};
	const ALIGN: Record<string, string> = { start: 'flex-start', end: 'flex-end', stretch: 'stretch', center: 'center' };

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style'> {
		/** HTML-тег корневого элемента (по умолчанию div) */
		tag?: string;
		/** Содержимое */
		children?: Snippet;
		/** Включает display: flex */
		flex?: boolean;
		/** display: inline-* */
		inline?: boolean;
		justifyContent?: BoxJustify;
		alignItems?: BoxAlign;
		flexDirection?: BoxDirection;
		flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
		flexShrink?: number | string;
		flexBasis?: number | string;
		flexGrow?: number | string;
		order?: number | string;
		gapX?: string | number;
		gapY?: string | number;
		style?: StyleValue;
		bg?: ColorToken | Css;
		boxShadow?: BoxShadowToken | Css;
		borderRadius?: BorderRadiusToken | Css;
		pt?: Spacing;
		pb?: Spacing;
		pl?: Spacing;
		pr?: Spacing;
		py?: Spacing;
		px?: Spacing;
		p?: Spacing;
		mt?: Spacing;
		mb?: Spacing;
		ml?: Spacing;
		mr?: Spacing;
		my?: Spacing;
		mx?: Spacing;
		m?: Spacing;
		borderColor?: ColorToken | Css;
		borderStyle?: BorderStyle;
		borderWidth?: BorderWidth;
		topBorderColor?: ColorToken | Css;
		topBorderStyle?: BorderStyle;
		topBorderWidth?: BorderWidth;
		bottomBorderColor?: ColorToken | Css;
		bottomBorderStyle?: BorderStyle;
		bottomBorderWidth?: BorderWidth;
		rightBorderColor?: ColorToken | Css;
		rightBorderStyle?: BorderStyle;
		rightBorderWidth?: BorderWidth;
		leftBorderColor?: ColorToken | Css;
		leftBorderStyle?: BorderStyle;
		leftBorderWidth?: BorderWidth;
		cursor?: string;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
	}

	let {
		tag,
		children,
		class: className,
		flex = false,
		justifyContent,
		alignItems,
		flexDirection,
		inline = false,
		flexWrap: _flexWrap, // accepted, but (like in React) has no effect
		flexShrink,
		flexBasis,
		flexGrow,
		style,
		order,
		gapX,
		gapY,
		bg,
		boxShadow,
		borderRadius,
		pt: paddingTop,
		pb: paddingBottom,
		pl: paddingLeft,
		pr: paddingRight,
		py: paddingY,
		px: paddingX,
		mt: marginTop,
		mb: marginBottom,
		ml: marginLeft,
		mr: marginRight,
		my: marginY,
		mx: marginX,
		p: padding,
		m: margin,
		borderColor,
		borderStyle,
		borderWidth,
		topBorderColor,
		topBorderStyle,
		topBorderWidth,
		bottomBorderColor,
		bottomBorderStyle,
		bottomBorderWidth,
		rightBorderColor,
		rightBorderStyle,
		rightBorderWidth,
		leftBorderColor,
		leftBorderStyle,
		leftBorderWidth,
		cursor,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const formatted = (token: string | undefined): string | undefined => {
		if (!token) return undefined;
		if (BOX_TOKEN_SET.has(token)) return `var(--${token})`;
		return token;
	};

	const isShowLeftBorder = $derived(leftBorderColor || leftBorderStyle || leftBorderWidth);
	const isShowRightBorder = $derived(rightBorderColor || rightBorderStyle || rightBorderWidth);
	const isShowTopBorder = $derived(topBorderColor || topBorderStyle || topBorderWidth);
	const isShowBottomBorder = $derived(bottomBorderColor || bottomBorderStyle || bottomBorderWidth);
	const isShowBorder = $derived(
		borderColor || borderStyle || borderWidth || isShowLeftBorder || isShowRightBorder || isShowTopBorder || isShowBottomBorder
	);

	const borderVariables = $derived.by(() => {
		const res: Record<string, string | undefined> = {};
		if (borderWidth || borderStyle || borderColor) {
			if (borderColor) res['--atmr-border-color'] = formatted(borderColor);
			if (borderStyle) res['--atmr-border-style'] = borderStyle;
			if (borderWidth) res['--atmr-border-width'] = formatted(borderWidth);
		}
		if (topBorderWidth || topBorderStyle || topBorderColor) {
			if (topBorderColor) res['--atmr-border-top-color'] = formatted(topBorderColor);
			if (topBorderStyle) res['--atmr-border-top-style'] = topBorderStyle;
			if (topBorderWidth) res['--atmr-border-top-width'] = formatted(topBorderWidth);
		}
		if (bottomBorderWidth || bottomBorderStyle || bottomBorderColor) {
			if (bottomBorderColor) res['--atmr-border-bottom-color'] = formatted(bottomBorderColor);
			if (bottomBorderStyle) res['--atmr-border-bottom-style'] = bottomBorderStyle;
			if (bottomBorderWidth) res['--atmr-border-bottom-width'] = formatted(bottomBorderWidth);
		}
		if (rightBorderWidth || rightBorderStyle || rightBorderColor) {
			if (rightBorderColor) res['--atmr-border-right-color'] = formatted(rightBorderColor);
			if (rightBorderStyle) res['--atmr-border-right-style'] = rightBorderStyle;
			if (rightBorderWidth) res['--atmr-border-right-width'] = formatted(rightBorderWidth);
		}
		if (leftBorderWidth || leftBorderStyle || leftBorderColor) {
			if (leftBorderColor) res['--atmr-border-left-color'] = formatted(leftBorderColor);
			if (leftBorderStyle) res['--atmr-border-left-style'] = leftBorderStyle;
			if (leftBorderWidth) res['--atmr-border-left-width'] = formatted(leftBorderWidth);
		}
		return res;
	});

	const rootStyle = $derived.by(() => {
		// same insertion order / precedence as the object spread in Box.tsx
		const s: Record<string, string | number | undefined> = {};
		if (flexShrink) s['--atmr-box-flex-shrink'] = flexShrink;
		if (flexGrow) s['--atmr-box-flex-grow'] = flexGrow;
		if (flexBasis) s['--atmr-box-flex-basis'] = flexBasis;
		if (order) s['--atmr-box-order'] = order;
		if (gapX) s['--atmr-box-gap-x'] = gapX;
		if (gapY) s['--atmr-box-gap-y'] = gapY;
		if (bg) s['--atmr-box-bg'] = formatted(bg);
		if (boxShadow) s['--atmr-box-shadow'] = formatted(boxShadow);
		if (borderRadius) s['--atmr-box-border-radius'] = formatted(borderRadius);
		if (paddingY || paddingTop) s['--atmr-box-padding-top'] = formatted(paddingY) || formatted(paddingTop);
		if (paddingY || paddingBottom) s['--atmr-box-padding-bottom'] = formatted(paddingY) || formatted(paddingBottom);
		if (paddingX || paddingLeft) s['--atmr-box-padding-left'] = formatted(paddingX) || formatted(paddingLeft);
		if (paddingX || paddingRight) s['--atmr-box-padding-right'] = formatted(paddingX) || formatted(paddingRight);
		if (marginY || marginTop) s['--atmr-box-margin-top'] = formatted(marginY) || formatted(marginTop);
		if (marginY || marginBottom) s['--atmr-box-margin-bottom'] = formatted(marginY) || formatted(marginBottom);
		if (marginX || marginLeft) s['--atmr-box-margin-left'] = formatted(marginX) || formatted(marginLeft);
		if (marginX || marginRight) s['--atmr-box-margin-right'] = formatted(marginX) || formatted(marginRight);
		if (padding) {
			s['--atmr-box-padding-top'] = formatted(padding);
			s['--atmr-box-padding-bottom'] = formatted(padding);
			s['--atmr-box-padding-left'] = formatted(padding);
			s['--atmr-box-padding-right'] = formatted(padding);
		}
		if (margin) {
			s['--atmr-box-margin-top'] = formatted(margin);
			s['--atmr-box-margin-bottom'] = formatted(margin);
			s['--atmr-box-margin-left'] = formatted(margin);
			s['--atmr-box-margin-right'] = formatted(margin);
		}
		if (isShowBorder) Object.assign(s, borderVariables);
		if (cursor) s.cursor = cursor;
		return styleToString(s, style);
	});

	const rootClass = $derived.by(() => {
		const hasFlex = flex || flexShrink || flexGrow || flexBasis || order || gapX || gapY;
		return clsx(
			'atmr-box',
			{ 'atmr-box--inline': inline },
			hasFlex && {
				'atmr-box--flex': true,
				[`atmr-box--justify-${JUSTIFY[justifyContent || 'center']}`]: !!justifyContent,
				[`atmr-box--align-${ALIGN[alignItems || 'center']}`]: !!alignItems,
				[`atmr-box--direction-${flexDirection}`]: !!flexDirection
			},
			{
				'atmr-box--margin': marginX || marginY || marginTop || marginBottom || marginRight || marginLeft || margin,
				'atmr-box--padding': paddingX || paddingY || paddingTop || paddingBottom || paddingRight || paddingLeft || padding,
				'atmr-box--border-radius': !!borderRadius,
				'atmr-box--box-shadow': !!boxShadow,
				'atmr-box--bg': !!bg,
				'atmr-box--border': isShowBorder,
				'atmr-box--border-top': isShowTopBorder,
				'atmr-box--border-bottom': isShowBottomBorder,
				'atmr-box--border-left': isShowLeftBorder,
				'atmr-box--border-right': isShowRightBorder,
				'atmr-box--flex-shrink': flexShrink,
				'atmr-box--flex-grow': flexGrow,
				'atmr-box--flex-basis': flexBasis,
				'atmr-box--flex-order': order
			},
			className
		);
	});
</script>

<svelte:element this={tag || 'div'} class={rootClass} style={rootStyle} {...rest} bind:this={ref}>{@render children?.()}</svelte:element>
