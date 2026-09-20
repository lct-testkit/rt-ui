/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Motion of the calendar (PickerDate / InputDate); see src/lib/ext/README.md, "Календарь".
//
// The original calendar changes month / year IN PLACE (the cells of the grid just get new text and classes). With the extension on:
//
//   * page change (previous / next month, year or day): the grid of the new page slides in from the side the user is heading to while the
//     old one slides out the other way and fades (`{#key nav.key}` + `in:` / `out:rtShift` around the grid, see Calendar.svelte); the month /
//     year / date labels of the header slide + fade in from the same side (`useTextSwap`);
//   * view change (day <-> month <-> year, the whole calendar is re-created): the new view zooms in (`in:rtShift` with `kind: 'zoom'`);
//   * the highlight of a day / range cell that has just been selected softens in (`softHighlight`: a Svelte `Tween` of the cell's
//     opacity / scale that is written INLINE and removed again when it is over, so the settled DOM is the original one).
//
// With the extension off (the default) `usePageNav().key` never changes, `useTextSwap` and `softHighlight` do nothing at all and the
// transition params are zero-length: the ORIGINAL markup and behaviour.
import { untrack } from 'svelte';
import { Tween } from 'svelte/motion';
import { motionDuration, motionEasing, type DurationToken, type EasingFn, type EasingToken, type MotionHandle, type MotionProp } from './motion.svelte.js';
import { useShowMotion } from './showMotion.svelte.js';

/** A `MotionHandle` that is never enabled (for components used without a handle). */
export const MOTION_OFF: MotionHandle = Object.freeze({
	requested: false,
	enabled: false,
	mode: 'off',
	config: null,
	transition: ((extra?: object) => ({ ...extra, enabled: false })) as MotionHandle['transition']
}) as MotionHandle;

/** `duration` / `easing` / `delay` of a `motion` prop that was given as an options object (`undefined` for `true` / `'tween'` ... ). */
export interface ExplicitLeg {
	duration?: number | DurationToken;
	easing?: EasingFn | EasingToken;
	delay?: number;
}

/** The options object of a `motion` prop (or `undefined`). */
export function explicitMotion(prop: MotionProp): ExplicitLeg | undefined {
	return prop && typeof prop === 'object' ? prop : undefined;
}

// ─── page navigation (direction + key) ───────────────────────────────────────────────────────────────────────────

export interface PageNav {
	/** `1` when the last page change went forward (next month / year / day), `-1` when it went back */
	readonly dir: 1 | -1;
	/** for `{#key nav.key}`: constant `0` while motion is off (the grid is never re-created), changes on every page change while it is on */
	readonly key: number;
	/** the instance has had at least one page change while motion was on (the page it was created with never animates) */
	readonly moved: boolean;
}

/**
 * Tracks which way the visible page moves. `page()` is any number that grows with time (`year * 12 + month`, a day number ...);
 * every change of it is a page change. Call at component init.
 */
export function usePageNav(page: () => number, enabled: () => boolean): PageNav {
	let dir = $state<1 | -1>(1);
	let count = $state(0);
	let last = untrack(page);
	// before the DOM update: the key and the direction are known when the `{#key}` block re-renders and its transitions start
	$effect.pre(() => {
		const next = page();
		const on = enabled();
		untrack(() => {
			if (next === last) return;
			dir = next > last ? 1 : -1;
			last = next;
			if (on) count += 1;
		});
	});
	return {
		get dir() {
			return dir;
		},
		get key() {
			return enabled() ? count : 0;
		},
		get moved() {
			return count > 0;
		}
	};
}

// ─── header labels ───────────────────────────────────────────────────────────────────────────────────────────────

export interface TextSwapOptions {
	/** the component's handle (`useMotion(..., 'calendar')`); `undefined` = never animates */
	m: () => MotionHandle | undefined;
	/** the element whose text changes */
	node: () => HTMLElement | null | undefined;
	/** the text; every change starts the motion */
	text: () => string;
	/** side the new text arrives from: `1` = from the end (next), `-1` = from the start (previous) */
	dir: () => 1 | -1 | undefined;
	/** the component's own `motion` prop (an options object may set duration / easing) */
	prop?: () => MotionProp;
}

/**
 * The label of a header (`Сентябрь`, `2026`, `20.09.2026`) slides + fades in from the side of the change (a Svelte `Tween` written as
 * inline `opacity` / `translate`, see `useShowMotion`). Nothing happens while motion is off. Call at component init.
 */
export function useTextSwap(o: TextSwapOptions): void {
	const show = useShowMotion({
		get m() {
			return o.m() ?? MOTION_OFF;
		},
		node: o.node,
		prop: o.prop,
		offset: () => ({ x: (o.dir() ?? 1) * 10, unit: 'px' }),
		in: { duration: 's', easing: 'expressive-entrance' }
	});
	let last = untrack(o.text);
	// before the DOM update, so the new text never shows at full opacity for a frame
	$effect.pre(() => {
		const text = o.text();
		untrack(() => {
			if (text === last) return;
			last = text;
			show.enter({ restart: true });
		});
	});
}

// ─── the highlight of the selected day / range ───────────────────────────────────────────────────────────────────

export interface SoftHighlightParams {
	/** motion is on for the calendar (`useMotion().enabled`) */
	enabled: boolean;
	/** `DATE_STATUS` of the cell (`default` / `disabled` / `focused` / `focusedFirst` / `focusedLast`) */
	status: string;
	/** placeholder cell of a month grid (never highlighted) */
	empty?: boolean;
	/** options of the `motion` prop when it is an object */
	explicit?: ExplicitLeg;
}

const HIGHLIGHT_RANK: Record<string, number> = { focused: 1, focusedFirst: 2, focusedLast: 2 };

/**
 * Action for a calendar cell (`div.atmr-calendar__item`): when the cell is highlighted (selected day, an end of the range or a day inside
 * the range) it softens in: the end points pop from 0.88 to 1 while the whole highlight fades from 40 % to 100 %. A Svelte `Tween` writes the
 * INLINE `opacity` / `scale` of the cell's `.atmr-calendar__inner` and removes them when it is over (a `style` attribute that did not exist is
 * removed again), so the settled DOM is the original one. A cell that is already highlighted never re-animates; the departing highlight is
 * not animated (it disappears at once, like the original).
 */
export function softHighlight(node: HTMLElement, initial: SoftHighlightParams) {
	let prev = initial;
	let tween: Tween<number> | undefined;
	let stopEffects: (() => void) | undefined;
	let inner: HTMLElement | null = null;
	let playing = false;
	let endpoint = false;
	let hadStyleAttr = false;
	let gen = 0;

	const apply = (p: number) => {
		if (!playing || !inner) return;
		inner.style.setProperty('opacity', String(Math.round((0.4 + 0.6 * Math.min(1, p)) * 1000) / 1000));
		if (endpoint) inner.style.setProperty('scale', String(Math.round((0.88 + 0.12 * p) * 1000) / 1000));
	};

	function restore() {
		playing = false;
		const el = inner;
		inner = null;
		if (!el) return;
		el.style.removeProperty('opacity');
		el.style.removeProperty('scale');
		if (!hadStyleAttr && !el.getAttribute('style')) el.removeAttribute('style');
	}

	function play(p: SoftHighlightParams) {
		const el = node.querySelector<HTMLElement>(':scope > .atmr-calendar__inner');
		if (!el) return;
		if (playing) restore();
		inner = el;
		hadStyleAttr = el.hasAttribute('style');
		endpoint = HIGHLIGHT_RANK[p.status] === 2;
		const duration = motionDuration(p.explicit?.duration ?? 'xs', el);
		const easing = motionEasing(p.explicit?.easing ?? (endpoint ? 'productive-bouncing' : 'productive-entrance'), el);
		const delay = Math.max(0, p.explicit?.delay ?? 0);
		if (!tween) {
			const t = new Tween(0, { duration: 0 });
			tween = t;
			stopEffects = $effect.root(() => {
				$effect(() => {
					const v = t.current;
					untrack(() => apply(v));
				});
			});
		}
		playing = true;
		const g = ++gen;
		void tween.set(0, { duration: 0 });
		apply(0);
		void tween.set(1, { duration, easing, delay }).then(() => {
			if (g === gen) restore();
		});
	}

	function cancel() {
		gen++;
		if (playing) restore();
	}

	let destroyed = false;
	return {
		update(next: SoftHighlightParams) {
			const was = prev;
			prev = next;
			if (!next.enabled || next.empty) {
				cancel();
				return;
			}
			// only an ARRIVAL of the highlight (from a cell that had none) animates; started in a microtask: after the DOM update of this flush and
			// outside of the action's own effect (the Tween is a reactive value)
			if (was.enabled && was.status !== next.status && !(HIGHLIGHT_RANK[was.status] > 0) && HIGHLIGHT_RANK[next.status] > 0) {
				queueMicrotask(() => {
					if (!destroyed && prev === next) play(next);
				});
			}
		},
		destroy() {
			destroyed = true;
			cancel();
			stopEffects?.();
		}
	};
}
