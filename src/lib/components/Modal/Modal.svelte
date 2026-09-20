<script lang="ts">
	// Port of packages/ui-kit/src/components/Modal/Modal.tsx
	//
	//   <Modal isOpened={open} maxWidth="420px" isCentered onEsc={close} onClickOverlay={close}>...content...</Modal>
	//
	// DOM (identical to React; nothing is rendered while the modal is closed and has finished its exit transition):
	//   <div class="atmr-modal-wrapper [atmr-modal-wrapper--hidden] {class}" {...rest}>
	//     <Overlay class="atmr-modal-overlay" style="min-height:100%;height:{modal.offsetHeight + 2 * marginTop}px" />
	//     <div class="atmr-modal [--centered] [--scroll-behaviour atmr-scroll-bar] {modalClassName}"
	//          style="--atmr-modal-margin-top; --atmr-modal-max-width; --atmr-modal-max-height">{children}</div>
	//   </div>
	//
	// * react-transition-group: `<CSSTransition in={isOpened} nodeRef={modal} timeout={300} classNames="atmr-modal" mountOnEnter unmountOnExit>`
	//   is reproduced below (`Transition` state machine + `CSSTransition` class sequence on the `.atmr-modal` node:
	//   enter -> enter + enter-active -> [timeout] -> enter-done; exit -> exit + exit-active -> [timeout] -> exit-done -> unmounted).
	//   `transitionProps` may override `in`, `timeout`, `classNames`, `appear` / `enter` / `exit`, `mountOnEnter` / `unmountOnExit` and
	//   the `onEnter` ... `onExited` callbacks.
	// * `<ModalContext.Provider value={{ isInModal: true }}>` -> `setModalContext()` (components inside read it with `useModalContext()`).
	// * `createPortal(modal, document.body)` when `useInPortal && isOpened` -> the wrapper is moved to <body> while opened.
	// * Like React, a `window` keydown listener is always attached: `Escape` calls `onEsc(e)` and `onClose()`, and the body gets
	//   `overflow-y: hidden` while `isOpened && overlay`. A click on the overlay / wrapper (outside the modal box) calls
	//   `onClickOverlay()` and `onClose()` (twice for a click on the overlay itself, as in React: the overlay and the wrapper both handle it).
	// * Any other prop (`id`, `style`, `data-*`, an unknown `triggerRef` ...) goes to the wrapper `div` (React `restArgs`).
	import clsx from 'clsx';
	import { onDestroy, tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Overlay from '../Overlay/Overlay.svelte';
	import { OVERLAY_VARIANTS, type OverlayVariant } from '../Overlay/constants.js';
	import { setModalContext } from '../wrappers/ModalProvider/ModalContext.js';
	import { noop } from '../../utils/function.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import '../../ext/layout-modal.css'; // [ext] the tiny always-safe `fullHeight` rules (`rt-ext-modal--full`); nothing of the motion CSS
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { useShowMotion } from '../../ext/showMotion.svelte.js';
	import { DEFAULT_MARGIN_TOP, SCROLL_BEHAVIOR_MAP, type ScrollBehavior } from './constants.js';

	/** `classNames` of react-transition-group's CSSTransition: a prefix (`"atmr-modal"`) or an explicit map. */
	export interface ModalTransitionClassNames {
		appear?: string;
		appearActive?: string;
		appearDone?: string;
		enter?: string;
		enterActive?: string;
		enterDone?: string;
		exit?: string;
		exitActive?: string;
		exitDone?: string;
	}

	/** The subset of react-transition-group's `CSSTransitionProps` the Modal supports (`transitionProps`). */
	export interface ModalTransitionProps {
		in?: boolean;
		timeout?: number | { appear?: number; enter?: number; exit?: number };
		classNames?: string | ModalTransitionClassNames;
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

	export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Открывает (показывает) компонент */
		isOpened?: boolean;
		/** Дочерние элементы компонента */
		children?: Snippet;
		/** Задает максимальную ширину */
		maxWidth?: string;
		/** Задает максимальную высоту */
		maxHeight?: string;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
		/** Параметр, отвечающий за то, удалять ли модальное окно из DOM дерева или нет (как и в React не используется) */
		unmount?: boolean;
		/** Выравнивает по центру */
		isCentered?: boolean;
		/** Определяет какой вариант Overlay отображается */
		overlayVariant?: OverlayVariant;
		/** Задает отображение оверлея */
		overlay?: boolean;
		/** Задаёт использование внутреннего или внешнего скролла */
		scrollBehaviour?: ScrollBehavior;
		/** Величина отступа сверху, если параметр isCentered не указан */
		marginTop?: number;
		/** Callback функция, вызываемая при клике на Overlay */
		onClickOverlay?: () => void;
		/** Callback функция, вызываемая при нажатии на Escape */
		onEsc?: (e: KeyboardEvent) => void;
		/** Задает параметры для CSSTransition (https://reactcommunity.org/react-transition-group) */
		transitionProps?: ModalTransitionProps;
		/** Задает дополнительные классы для модального окна */
		modalClassName?: string;
		/** Задает дополнительные стили для модального окна */
		modalStyle?: StyleValue;
		/** Задает дополнительные классы для оверлея */
		overlayClassName?: string;
		/** Задает дополнительные стили для оверлея */
		overlayStyle?: StyleValue;
		/** Callback функция, вызываемая при закрытии */
		onClose?: () => void;
		/** Задает дополнительные стили для компонента (корневой элемент `.atmr-modal-wrapper`) */
		style?: StyleValue;
		/** Не используется компонентом: как и в React попадает в атрибуты корневого элемента (`triggerref="[object Object]"`) */
		triggerRef?: unknown;
		/**
		 * [ext, not in original] Svelte-анимация открытия / закрытия (fade + scale + лёгкий сдвиг окна, fade оверлея; Tween вместо CSS-классов
		 * `atmr-modal-enter` ...). `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено,
		 * `true` / `{ duration, easing }` — включено. Работает при `mountOnEnter` / `unmountOnExit` по умолчанию; тайминги `transitionProps.timeout`
		 * в этом режиме заменяются длительностью анимации.
		 */
		motion?: MotionProp;
		/**
		 * [ext, not in original] Окно растягивается на высоту экрана с сохранением отступов `marginTop` сверху и снизу (тело прокручивается внутри).
		 * Добавляет класс `rt-ext-modal--full` окну `.atmr-modal` (правила в `src/lib/ext/layout-modal.css`); без пропа (по умолчанию `false`) разметка и классы — как в оригинале.
		 */
		fullHeight?: boolean;
	}

	let {
		isOpened = false,
		children,
		maxWidth,
		maxHeight,
		useInPortal = false,
		unmount = false,
		isCentered,
		overlayVariant = 'primary',
		overlay = true,
		scrollBehaviour = SCROLL_BEHAVIOR_MAP.inside,
		marginTop = DEFAULT_MARGIN_TOP,
		class: className,
		onClickOverlay,
		onEsc = noop,
		transitionProps = {},
		modalClassName: modalCN,
		modalStyle: modalS,
		overlayClassName,
		overlayStyle,
		onClose = noop,
		style,
		motion,
		fullHeight = false,
		...rest
	}: ModalProps = $props();

	setModalContext();

	let modalEl = $state<HTMLDivElement | null>(null);
	let overlayHeight = $state<number | null>(null);

	const scrollInside = $derived(scrollBehaviour === SCROLL_BEHAVIOR_MAP.inside);
	const opened = $derived(!!isOpened);

	// [ext, not in original] Svelte-native open / close motion. `extOn` is false by default (and for transitionProps that need the original
	// state machine), then everything below runs exactly as in the original.
	const m = useMotion(() => motion, 'modal');
	const extOn = $derived(m.enabled && (transitionProps?.mountOnEnter ?? true) && (transitionProps?.unmountOnExit ?? true) && transitionProps?.enter !== false && transitionProps?.exit !== false);
	const modalMotion = useShowMotion({
		m,
		node: () => modalEl,
		prop: () => motion,
		scale: 0.96,
		origin: () => 'center',
		offset: () => ({ y: 16 }),
		in: { duration: 'm', easing: 'expressive-entrance' },
		out: { duration: 's', easing: 'expressive-exit' }
	});

	// ── classes / styles ────────────────────────────────────────────────────────────────────────────────────────────
	const modalClass = $derived(
		clsx('atmr-modal', isCentered && 'atmr-modal--centered', scrollInside && 'atmr-modal--scroll-behaviour atmr-scroll-bar', fullHeight && 'rt-ext-modal--full', modalCN)
	);
	const modalVars = $derived({
		'--atmr-modal-margin-top': `${marginTop}px`,
		'--atmr-modal-max-width': maxWidth || 'auto',
		'--atmr-modal-max-height': maxHeight || 'auto'
	});
	// React: `_extends({ vars }, modalStyle)` -> a later declaration overrides an earlier one
	const modalStyles = $derived(typeof modalS === 'string' ? styleToString(modalVars, modalS) : styleToString({ ...modalVars, ...modalS }));
	// [ext] with motion on, the wrapper stays visible while the exit animation runs (it is unmounted at its end)
	const rootClass = $derived(clsx('atmr-modal-wrapper', !opened && !extOn && 'atmr-modal-wrapper--hidden', className && className));
	const rootStyle = $derived(styleToString(style));
	const overlayClass = $derived(clsx('atmr-modal-overlay', overlayClassName));
	const overlayBase = $derived({ minHeight: '100%', ...(overlayHeight === null ? {} : { height: `${overlayHeight}px` }) });
	const overlayStyles = $derived(
		typeof overlayStyle === 'string' ? styleToString(overlayBase, overlayStyle) : styleToString({ ...overlayBase, ...overlayStyle })
	);
	// React's Overlay renders `atmr-overlay--${OVERLAY_VARIANTS[variant]}`: an unknown variant (the story passes 'none') gives `atmr-overlay--undefined`
	const overlayVariantClass = $derived(((OVERLAY_VARIANTS as readonly string[]).includes(overlayVariant) ? overlayVariant : 'undefined') as OverlayVariant);

	// ── window keydown + body scroll lock + overlay height (React: one `useEffect`) ─────────────────────────────────
	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onEsc(e);
			onClose();
		}
	}

	// `overlayHeight = modalRef.offsetHeight + marginTop * 2`, measured whenever the modal is (re)rendered
	$effect(() => {
		void [opened, overlay, maxWidth, maxHeight, isCentered, scrollInside, modalCN, marginTop];
		const el = modalEl;
		if (el) overlayHeight = el.offsetHeight + marginTop * 2;
	});

	let bodyLocked = false;
	$effect(() => {
		bodyLocked = opened && overlay;
		document.body.style.overflowY = bodyLocked ? 'hidden' : '';
	});
	onDestroy(() => {
		if (bodyLocked) document.body.style.overflowY = '';
	});

	function handleClickOverlay() {
		onClickOverlay?.();
		onClose();
	}

	function handleWrapperClick(e: MouseEvent) {
		if (!(modalEl && modalEl.contains(e.target as Node))) handleClickOverlay();
	}

	// ── react-transition-group `Transition` + `CSSTransition` (nodeRef = the `.atmr-modal` node) ─────────────────────
	const tp = $derived(transitionProps ?? {});
	const inProp = $derived(tp.in !== undefined ? !!tp.in : opened);

	type Status = 'unmounted' | 'exited' | 'entering' | 'entered' | 'exiting';
	type TransitionType = 'appear' | 'enter' | 'exit';
	type Phase = 'base' | 'active' | 'done';

	const initialStatus = (): { status: Status; appear: boolean } => {
		if (untrack(() => inProp)) return untrack(() => tp.appear) ? { status: 'exited', appear: true } : { status: 'entered', appear: false };
		return { status: untrack(() => (tp.mountOnEnter ?? true) || (tp.unmountOnExit ?? true)) ? 'unmounted' : 'exited', appear: false };
	};
	const init = initialStatus();
	let status: Status = init.status;
	let appearPending = init.appear;
	let mounted = $state(status !== 'unmounted');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let generation = 0;
	let applied: Record<TransitionType, Partial<Record<Phase, string>>> = { appear: {}, enter: {}, exit: {} };

	const timeouts = () => {
		const timeout = tp.timeout ?? 300;
		if (typeof timeout === 'number') return { exit: timeout, enter: timeout, appear: timeout };
		return { exit: timeout.exit, enter: timeout.enter, appear: timeout.appear !== undefined ? timeout.appear : timeout.enter };
	};

	const getClassName = (type: TransitionType, phase: Phase): string | undefined => {
		const classNames = tp.classNames ?? 'atmr-modal';
		if (typeof classNames === 'string') {
			const base = `${classNames ? `${classNames}-` : ''}${type}`;
			return phase === 'base' ? base : `${base}-${phase}`;
		}
		return classNames[(phase === 'base' ? type : `${type}${phase === 'active' ? 'Active' : 'Done'}`) as keyof ModalTransitionClassNames];
	};
	const forceReflow = (node: HTMLElement) => void node.scrollTop;
	const addClass = (node: HTMLElement, type: TransitionType, phase: Phase) => {
		let name = getClassName(type, phase);
		const enterDone = getClassName('enter', 'done');
		if (type === 'appear' && phase === 'done' && enterDone) name += ` ${enterDone}`;
		if (phase === 'active') forceReflow(node); // a repaint is needed to transition styles when a class is added
		if (name) {
			applied[type][phase] = name;
			for (const c of name.split(' ')) if (c) node.classList.add(c);
		}
	};
	const removeClasses = (node: HTMLElement, type: TransitionType) => {
		const { base, active, done } = applied[type];
		applied[type] = {};
		for (const name of [base, active, done]) if (name) for (const c of name.split(' ')) if (c) node.classList.remove(c);
	};

	function cancelNextCallback() {
		generation++;
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	}

	function performEnter(node: HTMLElement, appearing: boolean) {
		const type: TransitionType = appearing ? 'appear' : 'enter';
		const enterTimeout = appearing ? timeouts().appear : timeouts().enter;
		const onEntered = () => {
			removeClasses(node, type);
			addClass(node, type, 'done');
			tp.onEntered?.(appearing);
		};
		if (!appearing && tp.enter === false) {
			status = 'entered';
			onEntered();
			return;
		}
		// [ext] with motion on the Tween replaces the base / active classes and their CSS transition; `extMs` is its duration (0 = original path)
		const extMs = extOn ? modalMotion.enter() : 0;
		// onEnter
		removeClasses(node, 'exit');
		if (!extMs) addClass(node, type, 'base');
		tp.onEnter?.(appearing);
		status = 'entering';
		// onEntering
		if (!extMs) addClass(node, type, 'active');
		tp.onEntering?.(appearing);
		timer = setTimeout(() => {
			timer = undefined;
			status = 'entered';
			onEntered();
		}, extMs || (enterTimeout ?? 0));
	}

	function performExit(node: HTMLElement) {
		const afterExited = () => {
			removeClasses(node, 'exit');
			addClass(node, 'exit', 'done');
			tp.onExited?.();
			if (tp.unmountOnExit ?? true) {
				status = 'unmounted';
				mounted = false;
				applied = { appear: {}, enter: {}, exit: {} };
			}
		};
		if (tp.exit === false) {
			status = 'exited';
			afterExited();
			return;
		}
		const extMs = extOn ? modalMotion.exit() : 0; // [ext] see performEnter
		// onExit
		removeClasses(node, 'appear');
		removeClasses(node, 'enter');
		if (!extMs) addClass(node, 'exit', 'base');
		tp.onExit?.();
		status = 'exiting';
		// onExiting
		if (!extMs) addClass(node, 'exit', 'active');
		tp.onExiting?.();
		timer = setTimeout(() => {
			timer = undefined;
			status = 'exited';
			afterExited();
		}, extMs || (timeouts().exit ?? 0));
	}

	async function update(isIn: boolean) {
		if (appearPending) {
			// componentDidMount -> updateStatus(true, ENTERING)
			appearPending = false;
			await tick();
			if (modalEl) performEnter(modalEl, true);
			return;
		}
		if (isIn) {
			if (status === 'entering' || status === 'entered') return;
			cancelNextCallback();
			const gen = generation;
			if (status === 'unmounted') {
				status = 'exited';
				mounted = true;
				await tick();
				if (gen !== generation) return;
			}
			const node = modalEl;
			if (!node) return;
			if ((tp.mountOnEnter ?? true) || (tp.unmountOnExit ?? true)) forceReflow(node);
			performEnter(node, false);
		} else if (status === 'entering' || status === 'entered') {
			if (!modalEl) return;
			cancelNextCallback();
			performExit(modalEl);
		}
	}

	$effect(() => {
		const isIn = inProp;
		untrack(() => update(isIn));
	});

	onDestroy(cancelNextCallback);

	/** `createPortal(modal, document.body)` while `enabled`; the node goes back to its place otherwise. */
	function modalPortal(node: HTMLElement, enabled: boolean) {
		let anchor: Comment | null = null;
		const attach = () => {
			if (anchor || !node.parentNode) return;
			anchor = document.createComment('');
			node.parentNode.insertBefore(anchor, node);
			document.body.appendChild(node);
		};
		const detach = () => {
			if (!anchor) return;
			anchor.parentNode?.insertBefore(node, anchor);
			anchor.remove();
			anchor = null;
		};
		if (enabled) attach();
		return {
			update: (value: boolean) => (value ? attach() : detach()),
			destroy() {
				anchor?.remove();
				anchor = null;
			}
		};
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if mounted}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div {...rest} class={rootClass} style={rootStyle} onclick={handleWrapperClick} use:modalPortal={useInPortal && (opened || extOn)}>
		<Overlay style={overlayStyles} variant={overlayVariantClass} isOpened={overlay && opened} onclick={handleClickOverlay} useInPortal={false} class={overlayClass} {motion} motionKind="modal" motionAppear />
		<div class={modalClass} bind:this={modalEl} style={modalStyles}>{@render children?.()}</div>
	</div>
{/if}
