<script lang="ts">
	// Port of packages/ui-kit/src/components/Drawer/Drawer.tsx
	//
	//   <Drawer isOpened={open} position="right" dimension={420} onClose={close}>...content...</Drawer>
	//
	// DOM (identical to React; nothing is rendered while the drawer is closed and has finished its exit transition):
	//   <div class="atmr-drawer atmr-drawer--{transitionState} atmr-drawer--{position} {class}" style="--atmr-drawer-dimension: {dimension}px|auto; ..." {...rest}>
	//     <Overlay class="atmr-drawer__overlay {overlayClassName}" variant={overlayVariant} isOpened={overlay && isOpened} useInPortal={false} />
	//     <div class="atmr-drawer__content {drawerClassName}" style={drawerStyle}>{children}</div>
	//   </div>
	//
	// * react-transition-group `<Transition in={isOpened} timeout={300} mountOnEnter unmountOnExit nodeRef={drawerRef}>{state => ...}</Transition>`:
	//   the state (`exited` -> `entering` -> `entered` / `exiting` -> `exited`) is part of the class name (`atmr-drawer--entered`); the
	//   state machine is the shared one of Notifications/_transition.svelte.ts (no `classNames`, so it only drives `status`).
	//   `transitionProps` may override `in`, `timeout`, `appear` / `enter` / `exit`, `mountOnEnter` / `unmountOnExit` and the callbacks
	//   `onEnter` ... `onExited` (called like react-transition-group does with `nodeRef`: `onEnter(appearing)`, `onExit()` ...).
	// * `createPortal(drawer, document.body)` when `useInPortal` (default true): the drawer is moved to the end of <body> when it mounts
	//   (React re-creates the node when `useInPortal` changes, so does the `{#key}` below).
	// * Like React, a `window` keydown listener is always attached: `Escape` calls `onEsc(e)` and `onClose()`; the body gets
	//   `overflow-y: hidden` while `isOpened && overlay` (and `overflow-y: ''` otherwise, also on mount - React does not reset it on unmount).
	// * A click on the overlay calls `onClickOverlay()` and `onClose()`.
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { portal } from '../../actions/portal.js';
	import { noop } from '../../utils/function.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import '../../ext/layout-drawer.css'; // [ext] the tiny always-safe `fullHeight` rules (`rt-ext-drawer--full`); nothing of the motion CSS
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { SPRING } from '../../ext/driver.svelte.js';
	import { useShowMotion } from '../../ext/showMotion.svelte.js';
	import { CSSTransition } from '../Notifications/_transition.svelte.js';
	import Overlay from '../Overlay/Overlay.svelte';
	import type { OverlayVariant } from '../Overlay/constants.js';
	import { DRAWER_POSITION, type DrawerPosition } from './constants.js';

	/** The subset of react-transition-group's `TransitionProps` the Drawer supports (`transitionProps`). */
	export interface DrawerTransitionProps {
		in?: boolean;
		timeout?: number | { appear?: number; enter?: number; exit?: number };
		appear?: boolean;
		enter?: boolean;
		exit?: boolean;
		mountOnEnter?: boolean;
		unmountOnExit?: boolean;
		onEnter?: (appearing: boolean) => void;
		onEntering?: (appearing: boolean) => void;
		onEntered?: (appearing: boolean) => void;
		onExit?: () => void;
		onExiting?: () => void;
		onExited?: () => void;
	}

	export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Открывает (показывает) компонент */
		isOpened?: boolean;
		/** Определяет какой вариант Overlay отображается */
		overlayVariant?: OverlayVariant;
		/** Задает отображение оверлея */
		overlay?: boolean;
		/** Callback функция, вызываемая при клике на Overlay */
		onClickOverlay?: () => void;
		/** Callback функция, вызываемая при нажатии на Escape */
		onEsc?: (e: KeyboardEvent) => void;
		/** Задает расположение */
		position?: DrawerPosition;
		/** Задает ширину (для left / right) или высоту (для top / bottom) в px; без значения - `auto` */
		dimension?: number;
		/** Задает дополнительные стили для компонента (корневой элемент `.atmr-drawer`) */
		style?: StyleValue;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
		/** Дочерние элементы компонента */
		children?: Snippet;
		/** Задает параметры для Transition (https://reactcommunity.org/react-transition-group) */
		transitionProps?: DrawerTransitionProps;
		/** Задает дополнительные классы для контента */
		drawerClassName?: string;
		/** Задает дополнительные стили для контента */
		drawerStyle?: StyleValue;
		/** Задает дополнительные классы для оверлея */
		overlayClassName?: string;
		/** Задает дополнительные стили для оверлея */
		overlayStyle?: StyleValue;
		/** Callback функция, вызываемая при закрытии */
		onClose?: () => void;
		/**
		 * [ext, not in original] Svelte-анимация открытия / закрытия (выезд панели от края `position`, fade оверлея; Tween вместо CSS-анимации
		 * `drawerKeyframes*`). `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено,
		 * `true` / `{ duration, easing }` — включено. Работает при `mountOnEnter` / `unmountOnExit` по умолчанию; `transitionProps.timeout`
		 * в этом режиме заменяется длительностью анимации.
		 */
		motion?: MotionProp;
		/**
		 * [ext, not in original] Панель на всю высоту экрана (left / right; для top / bottom — на всю ширину); содержимое панели прокручивается внутри.
		 * Добавляет класс `rt-ext-drawer--full` на корень (правила в `src/lib/ext/layout-drawer.css`); без пропа (по умолчанию `false`) разметка и классы — как в оригинале.
		 */
		fullHeight?: boolean;
	}

	let {
		isOpened,
		overlayVariant = 'primary',
		overlay = true,
		onClickOverlay = noop,
		onEsc = noop,
		position = DRAWER_POSITION.right,
		dimension,
		style,
		class: className,
		useInPortal = true,
		children,
		transitionProps = {},
		drawerClassName,
		drawerStyle,
		overlayClassName,
		overlayStyle,
		onClose = noop,
		motion,
		fullHeight = false,
		...rest
	}: DrawerProps = $props();

	let drawerEl = $state<HTMLDivElement | null>(null);
	let contentEl = $state<HTMLDivElement | null>(null);

	// [ext, not in original] Svelte-native slide from the `position` edge. `extOn` is false by default (and for transitionProps that need the
	// original state machine), then everything below runs exactly as in the original.
	const m = useMotion(() => motion, 'drawer');
	const extOn = $derived(
		m.enabled && (transitionProps.mountOnEnter ?? true) && (transitionProps.unmountOnExit ?? true) && transitionProps.enter !== false && transitionProps.exit !== false
	);
	const OFFSETS = { top: { y: -100 }, right: { x: 100 }, bottom: { y: 100 }, left: { x: -100 } } as const;
	const contentMotion = useShowMotion({
		m,
		node: () => contentEl,
		prop: () => motion,
		opacity: false,
		offset: () => ({ ...OFFSETS[position as keyof typeof OFFSETS], unit: '%' }),
		in: { duration: 'm', easing: 'expressive-entrance' },
		out: { duration: 's', easing: 'expressive-exit' },
		// a spring slides the panel in without overshooting past its edge
		spring: { in: SPRING.smooth, out: SPRING.smooth }
	});

	// ── handlers ────────────────────────────────────────────────────────────────────────────────────────────────────
	function handleClickOverlay() {
		if (onClickOverlay) onClickOverlay();
		onClose();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onEsc(e);
			onClose();
		}
	}

	// React: `useEffect(() => { body.style.overflowY = isOpened && overlay ? 'hidden' : ''; ... }, [isOpened, overlay, handleKey])`
	$effect(() => {
		document.body.style.overflowY = isOpened && overlay ? 'hidden' : '';
	});

	// ── react-transition-group `Transition` (nodeRef = the `.atmr-drawer` node) ─────────────────────────────────────
	const transition = new CSSTransition(
		() => ('in' in transitionProps ? !!transitionProps.in : !!isOpened),
		() => {
			const tp = transitionProps;
			return {
				timeout: 300,
				mountOnEnter: true,
				unmountOnExit: true,
				...tp,
				// [ext] with motion on the timeouts are the durations of the Tween
				...(extOn ? { timeout: { appear: contentMotion.durationIn(), enter: contentMotion.durationIn(), exit: contentMotion.durationOut() } } : {}),
				// with `nodeRef` react-transition-group calls the hooks without the node
				onEnter: (_node, appearing) => {
					if (extOn) contentMotion.enter(); // [ext]
					tp.onEnter?.(!!appearing);
				},
				onEntering: (_node, appearing) => tp.onEntering?.(!!appearing),
				onEntered: (_node, appearing) => tp.onEntered?.(!!appearing),
				onExit: () => {
					if (extOn) contentMotion.exit(); // [ext]
					tp.onExit?.();
				},
				onExiting: () => tp.onExiting?.(),
				onExited: () => tp.onExited?.()
			};
		},
		() => drawerEl
	);

	// ── classes / styles ────────────────────────────────────────────────────────────────────────────────────────────
	// [ext] with motion on `entering` / `exiting` are drawn as `entered` (fully open); the Tween slides the content instead of the CSS keyframes
	const stateClass = $derived(extOn && (transition.status === 'entering' || transition.status === 'exiting') ? 'entered' : transition.status);
	const rootClass = $derived(clsx('atmr-drawer', `atmr-drawer--${stateClass}`, `atmr-drawer--${position}`, fullHeight && 'rt-ext-drawer--full', className && className));
	const rootVars = $derived({ '--atmr-drawer-dimension': dimension ? `${dimension}px` : 'auto' });
	// React: `_extends({ '--atmr-drawer-dimension': ... }, style)` -> a later declaration overrides an earlier one
	const rootStyle = $derived(typeof style === 'string' ? styleToString(rootVars, style) : styleToString({ ...rootVars, ...style }));
	const overlayClass = $derived(clsx('atmr-drawer__overlay', overlayClassName));
	const contentClass = $derived(clsx('atmr-drawer__content', drawerClassName));
	const contentStyle = $derived(styleToString(drawerStyle));

	/** `createPortal(drawer, document.body)` when `enabled` (evaluated when the drawer mounts). */
	function maybePortal(node: HTMLElement, enabled: boolean) {
		const instance = enabled ? portal(node, undefined) : undefined;
		return {
			destroy() {
				instance?.destroy?.();
			}
		};
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if transition.status !== 'unmounted'}
	{#key useInPortal}
		<div {...rest} bind:this={drawerEl} class={rootClass} style={rootStyle} use:maybePortal={useInPortal}>
			<Overlay variant={overlayVariant} onclick={handleClickOverlay} class={overlayClass} style={overlayStyle} isOpened={!!(overlay && isOpened)} useInPortal={false} {motion} motionKind="drawer" motionAppear />
			<div class={contentClass} style={contentStyle} bind:this={contentEl}>{@render children?.()}</div>
		</div>
	{/key}
{/if}
