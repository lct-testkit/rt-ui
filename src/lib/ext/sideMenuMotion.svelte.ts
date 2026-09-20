/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Open / close motion of the SideMenu panel; see src/lib/ext/README.md, "SideMenu".
//
// The original switches the panel between two CLASSES (`atmr-side-menu--opened` = 256 px, `--closed` = 56 px, icons only): the width follows through an
// inline-free CSS `transition`, but the LABELS are simply rendered / removed at once (`{#if isMenuOpen}` in every item), so the text appears at full
// strength inside a still narrow panel or vanishes while the panel is still wide. With the extension on the panel is driven by one Svelte `Tween`
// (or `Spring`) of a progress 0..1 that writes:
//
//   * the INLINE `width` of the panel (from where it is now to the width of the target state; `transition: none` while it moves);
//   * the CSS variable `--rt-ext-sm-label` (0..1): the opacity + a small shift of every label; the rules are in ext.css and only match while the panel has
//     the class `rt-ext-side-menu--motion`. Opening: the labels appear in the second half, when there is room for them. Closing: they are gone in the
//     first half, before the panel gets too narrow.
//
// And it DELAYS the switch to the closed state until the panel has shrunk: `shown` (what the panel and its items render) stays "open" while it closes,
// so the labels are still in the DOM to fade out. The whole thing puts every inline value back when it is over: the settled DOM is the original's.
//
//   const menu = useSideMenuMotion({ m, node: () => ref, open: () => isOpened });
//   // render with `menu.open` instead of `isOpened`; add `menu.animating && 'rt-ext-side-menu--motion'` to the class list
import { untrack } from 'svelte';
import { Driver, SPRING, type DriveLeg } from './driver.svelte.js';
import { motionDuration, motionEasing, type MotionHandle, type MotionProp } from './motion.svelte.js';

export interface SideMenuMotionOptions {
	m: MotionHandle;
	/** the panel element (`div.atmr-side-menu`, a `bind:ref` variable) */
	node: () => HTMLElement | null | undefined;
	/** the `isOpened` prop */
	open: () => boolean;
	/** the component's own `motion` prop */
	prop?: () => MotionProp;
}

export interface SideMenuMotion {
	/** the open state to RENDER: `open()` at rest (and always while motion is off), still `true` while the panel closes */
	readonly open: boolean;
	/** a move is running: the panel carries the class that makes the labels follow `--rt-ext-sm-label` */
	readonly animating: boolean;
}

/** what the panel had inline before a move */
interface SavedInline {
	width: string;
	transition: string;
	label: string;
}

const smooth = (p: number) => {
	const x = Math.min(1, Math.max(0, p));
	return x * x * (3 - 2 * x);
};

/** The width (px) the panel has in the open / closed state (the CSS decides: the classes are toggled for a moment, no paint happens in between). */
function widthOf(el: HTMLElement, closed: boolean): number {
	const cls = el.className;
	const width = el.style.width;
	const transition = el.style.transition;
	el.style.transition = 'none';
	el.style.width = '';
	el.classList.toggle('atmr-side-menu--closed', closed);
	el.classList.toggle('atmr-side-menu--opened', !closed);
	const w = el.getBoundingClientRect().width;
	el.className = cls;
	el.style.width = width;
	el.style.transition = transition;
	return w;
}

/** Call at component init (it creates effects). */
export function useSideMenuMotion(o: SideMenuMotionOptions): SideMenuMotion {
	const d = new Driver(1);
	let shown = $state(untrack(o.open));
	let animating = $state(false);
	let last = untrack(o.open);
	let mounted = false;
	let from = 0;
	let to = 0;
	let opening = true;
	let gen = 0;
	let saved: SavedInline | null = null;
	let hadStyleAttr = false;

	function leg(el: HTMLElement, opening: boolean): DriveLeg {
		const cfg = o.m.config!;
		return {
			type: cfg.type,
			duration: cfg.set.duration ? cfg.duration : motionDuration('m', el),
			easing: cfg.set.easing ? cfg.easing : motionEasing(opening ? 'expressive-entrance' : 'productive-standard', el),
			delay: cfg.delay,
			stiffness: cfg.set.stiffness ? cfg.stiffness : SPRING.smooth.stiffness,
			damping: cfg.set.damping ? cfg.damping : SPRING.smooth.damping,
			precision: cfg.set.precision ? cfg.precision : 0.002
		};
	}

	function apply(p: number) {
		const el = o.node();
		if (!el || !saved) return;
		const clamped = Math.min(1.02, Math.max(-0.02, p));
		el.style.setProperty('width', `${Math.round((from + (to - from) * clamped) * 100) / 100}px`);
		// opening: the labels come in during the second part of the motion, closing: they go out during the first part
		const label = opening ? smooth((p - 0.3) / 0.7) : 1 - smooth(p / 0.55);
		el.style.setProperty('--rt-ext-sm-label', String(Math.round(label * 1000) / 1000));
	}

	// what the panel had inline before the move; the `transition` is put back one frame AFTER the rest (`pending`): the last painted width is a fraction of a
	// px off the final one and the CSS transition would drift there
	let pending: { el: HTMLElement; s: SavedInline; raf: number } | null = null;

	function flushPending() {
		const p = pending;
		pending = null;
		if (!p) return;
		cancelAnimationFrame(p.raf);
		if (p.s.transition) p.el.style.setProperty('transition', p.s.transition);
		else p.el.style.removeProperty('transition');
		if (!hadStyleAttr && !p.el.getAttribute('style')) p.el.removeAttribute('style');
	}

	function restore() {
		const el = o.node();
		const s = saved;
		saved = null;
		if (!el || !s) return;
		if (s.width) el.style.setProperty('width', s.width);
		else el.style.removeProperty('width');
		el.style.removeProperty('--rt-ext-sm-label');
		pending = {
			el,
			s,
			raf: requestAnimationFrame(() => {
				pending = null;
				if (s.transition) el.style.setProperty('transition', s.transition);
				else el.style.removeProperty('transition');
				if (!hadStyleAttr && !el.getAttribute('style')) el.removeAttribute('style');
			})
		};
	}

	function start(want: boolean) {
		const el = o.node();
		if (!el || !o.m.enabled || !o.m.config) return false;
		const now = el.getBoundingClientRect().width;
		if (!saved) {
			if (pending && pending.el === el) {
				// the previous move's `transition: none` is still there: the original value is the one that was waiting to be put back
				saved = pending.s;
				cancelAnimationFrame(pending.raf);
				pending = null;
			} else {
				hadStyleAttr = el.hasAttribute('style');
				saved = { width: el.style.getPropertyValue('width'), transition: el.style.getPropertyValue('transition'), label: el.style.getPropertyValue('--rt-ext-sm-label') };
			}
		}
		el.style.setProperty('transition', 'none');
		from = now;
		to = widthOf(el, !want);
		opening = want;
		animating = true;
		d.jump(0);
		apply(0);
		const g = ++gen;
		void d.go(1, leg(el, want)).then(() => {
			if (g !== gen) return;
			animating = false;
			shown = want; // the closed state is rendered only now (the labels had time to fade out)
			restore();
		});
		return true;
	}

	// every frame of the move
	$effect(() => {
		const p = d.value;
		untrack(() => {
			if (animating) apply(p);
		});
	});

	// a change of the `isOpened` prop: before the DOM update, so the width can be pinned before the class switches
	$effect.pre(() => {
		const want = o.open();
		untrack(() => {
			if (want === last) return;
			last = want;
			if (!mounted || !o.m.enabled) {
				gen++;
				animating = false;
				restore();
				shown = want;
				return;
			}
			if (want) shown = true; // opening: the labels are rendered from the first frame (invisible until there is room for them)
			if (!start(want)) shown = want;
		});
	});
	$effect(() => {
		mounted = true;
		return () => {
			gen++;
			restore();
			flushPending();
		};
	});

	return {
		get open() {
			// motion off (the default): the prop itself, with no state in between = the original
			return o.m.enabled ? shown : o.open();
		},
		get animating() {
			return animating;
		}
	};
}
