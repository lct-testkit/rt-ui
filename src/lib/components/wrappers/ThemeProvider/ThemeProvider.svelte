<script lang="ts">
	// Svelte-only convenience (React has no ThemeProvider: see Documentation/Themes in the storybook).
	//
	// A theme is applied by putting ONE class on a root container (or on <body>); all `--atmr-*` CSS variables of that theme
	// then apply to everything inside:
	//   .Theme_root_rtk_default_light   .Theme_root_rtk_default_dark   .Theme_root_rtk_purple_light   .Theme_root_rtk_purple_dark
	// (the stylesheets are loaded once by src/lib/styles/index.css). This component is just that container:
	//
	//   <ThemeProvider theme="rtk_default_dark">…any components…</ThemeProvider>
	//   -> <div class="Theme_root_rtk_default_dark">…</div>
	//
	// Nesting works ("theme in theme"): the inner provider overrides the variables for its subtree. Popups rendered in a
	// portal (Popover, ...) are re-wrapped in the theme class of their trigger by usePopper's portal, so they keep the theme.
	//
	// To theme the whole page instead, set the class on <body>:  document.body.classList.add(themeClassName(theme))
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import clsx from 'clsx';
	import { DEFAULT_THEME, themeClassName, type Theme } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Тема: rtk_default_light | rtk_default_dark | rtk_purple_light | rtk_purple_dark */
		theme?: Theme;
		/** [ext, not in original] Базовый слой приложения (`.rt-base`): шрифт Rostelecom Basis и цвет текста. Оригинальные компоненты сами их не задают, а наследуют от корня. */
		base?: boolean;
		children?: Snippet;
	}

	let { theme = DEFAULT_THEME, base = true, class: className, children, ...rest }: Props = $props();
</script>

<div class={clsx(themeClassName(theme), base && 'rt-base', className)} {...rest}>{@render children?.()}</div>
