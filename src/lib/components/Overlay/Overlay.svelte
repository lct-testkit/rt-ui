<script lang="ts">
	// Port of packages/ui-kit/src/components/Overlay/Overlay.tsx
	//
	// React wraps the div in react-transition-group's CSSTransition
	//   { in: isOpened, timeout: 300, mountOnEnter, unmountOnExit, classNames: { enter, enterActive, exit, exitActive } }
	// which mounts the node when `in` becomes true, manipulates its classList through the transition
	// (enter -> enter+enter-active -> [300 ms] -> nothing, exit -> exit+exit-active -> [300 ms] -> unmounted), and
	// portals it to <body> when `useInPortal` (default true). The same sequence is reproduced below with classList calls.
	import clsx from 'clsx';
	import { onDestroy, tick, untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { portal } from '../../actions/portal.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { useMotion, type MotionKind, type MotionProp } from '../../ext/motion.svelte.js';
	import { useShowMotion } from '../../ext/showMotion.svelte.js';
	import { DEFAULT_VARIANT, type OverlayVariant } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
		/** Задает состояние (открыто/закрыто) */
		isOpened?: boolean;
		/** Задает вариант для компонента */
		variant?: OverlayVariant;
		/** Использовать портал (рендер в document.body) */
		useInPortal?: boolean;
		/** Задает дополнительные стили для компонента */
		style?: StyleValue;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLDivElement | undefined;
		/**
		 * [ext, not in original] Svelte-анимация появления / исчезновения оверлея (fade, Tween). `undefined` — наследуется от `ExtMotionProvider`
		 * (без него выключено = оригинал: классы `atmr-overlay--enter` ...), `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
		/** [ext, not in original] К какому «виду» (kind) `ExtMotionProvider` относить оверлей: Modal / Drawer передают свой (`'modal'` / `'drawer'`). По умолчанию `'overlay'`. */
		motionKind?: MotionKind;
		/**
		 * [ext, not in original] Для Modal / Drawer: оверлей создаётся уже открытым (в оригинале он появляется без перехода); с включённым `motion` и этим
		 * флагом он плавно появляется (fade) сразу после создания.
		 */
		motionAppear?: boolean;
	}

	let {
		isOpened = false,
		variant = DEFAULT_VARIANT,
		useInPortal = true,
		class: className,
		style,
		ref = $bindable(),
		motion,
		motionKind,
		motionAppear = false,
		...rest
	}: Props = $props();

	const TIMEOUT = 300;
	const CLASSES = {
		enter: 'atmr-overlay--enter',
		enterActive: 'atmr-overlay--enter-active',
		exit: 'atmr-overlay--exit',
		exitActive: 'atmr-overlay--exit-active'
	};

	const rootClass = $derived(clsx('atmr-overlay', `atmr-overlay--${variant}`, className));
	const rootStyle = $derived(styleToString(style));

	// react-transition-group `Transition` states (mountOnEnter + unmountOnExit)
	type Status = 'unmounted' | 'exited' | 'entering' | 'entered' | 'exiting';
	let status: Status = untrack(() => (isOpened ? 'entered' : 'unmounted'));
	let mounted = $state(untrack(() => isOpened));
	let timer: ReturnType<typeof setTimeout> | undefined;
	let generation = 0;

	const forceReflow = (node: HTMLElement) => void node.scrollTop;
	const addClass = (node: HTMLElement, ...names: string[]) => node.classList.add(...names);
	const removeClasses = (node: HTMLElement, ...names: string[]) => node.classList.remove(...names);

	function cancel() {
		generation++;
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	}

	// [ext, not in original] Svelte-native fade; `m.enabled` is false by default, then the class sequence below runs as in the original.
	const m = useMotion(() => motion, untrack(() => motionKind) ?? 'overlay');
	const showMotion = useShowMotion({
		m,
		node: () => ref,
		prop: () => motion,
		in: { duration: 'm', easing: 'expressive-entrance' },
		out: { duration: 's', easing: 'productive-exit' }
	});

	let appearPending = untrack(() => motionAppear && isOpened);
	$effect(() => {
		// [ext] created already open (Modal / Drawer): fade in once, right after the mount
		if (!appearPending || !ref) return;
		appearPending = false;
		const ms = untrack(() => showMotion.enter());
		if (ms > 0) {
			status = 'entering';
			timer = setTimeout(() => {
				timer = undefined;
				status = 'entered';
			}, ms);
		}
	});

	function performEnter(node: HTMLElement) {
		const ms = showMotion.enter();
		if (ms > 0) {
			status = 'entering';
			timer = setTimeout(() => {
				timer = undefined;
				status = 'entered';
			}, ms);
			return;
		}
		removeClasses(node, CLASSES.exit, CLASSES.exitActive);
		addClass(node, CLASSES.enter);
		status = 'entering';
		forceReflow(node);
		addClass(node, CLASSES.enterActive);
		timer = setTimeout(() => {
			timer = undefined;
			status = 'entered';
			removeClasses(node, CLASSES.enter, CLASSES.enterActive);
		}, TIMEOUT);
	}

	function performExit(node: HTMLElement) {
		const ms = showMotion.exit();
		if (ms > 0) {
			status = 'exiting';
			timer = setTimeout(() => {
				timer = undefined;
				status = 'unmounted';
				mounted = false;
			}, ms);
			return;
		}
		removeClasses(node, CLASSES.enter, CLASSES.enterActive);
		addClass(node, CLASSES.exit);
		status = 'exiting';
		forceReflow(node);
		addClass(node, CLASSES.exitActive);
		timer = setTimeout(() => {
			timer = undefined;
			removeClasses(node, CLASSES.exit, CLASSES.exitActive);
			status = 'unmounted';
			mounted = false;
		}, TIMEOUT);
	}

	async function update(opened: boolean) {
		if (opened) {
			if (status === 'entering' || status === 'entered') return;
			cancel();
			const gen = generation;
			if (status === 'unmounted') {
				status = 'exited';
				mounted = true;
				await tick();
				if (gen !== generation) return;
			}
			if (!ref) return;
			forceReflow(ref);
			performEnter(ref);
		} else if ((status === 'entering' || status === 'entered') && ref) {
			cancel();
			performExit(ref);
		}
	}

	$effect(() => {
		const opened = isOpened;
		untrack(() => update(opened));
	});

	onDestroy(cancel);

	/** `createPortal(overlay, document.body)` only when `useInPortal`. */
	function maybePortal(node: HTMLElement, enabled: boolean) {
		const instance = enabled ? portal(node, undefined) : undefined;
		return {
			destroy() {
				instance?.destroy?.();
			}
		};
	}
</script>

{#if mounted}
	<div bind:this={ref} class={rootClass} style={rootStyle} use:maybePortal={useInPortal} {...rest}></div>
{/if}
