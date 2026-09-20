/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Motion of the TableGrid (README of the table: "Анимации (вне оригинала)", ext README: "TableGrid").
//
// The table is ONE css grid whose rows are `display: contents` (the cells are the grid items), so `animate:flip` (which measures and transforms the
// element it is on) cannot be used on a row: a `display: contents` box has no rect and no transform. This file is the Svelte-native equivalent for that layout:
//
//   rows      keyed `{#each}` reorders / adds / removes DOM nodes as usual; this module measures the FIRST box of every row before the DOM update
//             (`$effect.pre`) and the LAST box after it (`$effect`), then animates the CELLS of every row that moved: FLIP for the rows that stay
//             (what `animate:flip` does), fade + rise for the rows that appear, fade for the rows that go (Svelte's `out:` keeps the removed row in the
//             DOM until its duration is over: `tableRowOut`; its cells are pinned where they were - `position: absolute` - so the grid closes the gap at once and
//             the rows below FLIP into it instead of waiting for the fade). The motion is Web Animations (`translate` / `opacity`), like the css transitions
//             and `animate:` of Svelte itself: compositor-only, no per-frame JS (a per-frame inline style on the cells of a table costs ~80 us per cell: the
//             inline `--column-index` of every cell makes its style recalculation expensive);
//   expand    `transition:tableSlide` on `.atmr-tablegrid__expand__container` (Svelte's `slide`: height + fade, reversible);
//   action bar `transition:tableSlide` on the action bar container (or on the footer area when it only holds the action bar);
//   icons     the sort arrow turns / cross-fades, the expand chevron rotates (measured after the DOM update, played on the new `<svg>`);
//   colours   a row whose background changes (`highlightOnClick`, `rowConfig.backgroundColor(row)`, e.g. a "selected" tint) fades between the two colours;
//   hover     the hovered row's background eases in / out, icon buttons dip a little while pressed.
//
// EVERYTHING here is inactive (nothing is read, measured or written) until `motion` is on for the table (its `motion` prop or an `ExtMotionProvider`), the user
// does not prefer reduced motion and the table is not `virtual`. Nothing leaves a marker in the DOM: all inline styles / helper nodes exist only while an
// animation runs, so the settled DOM of a table with motion on is the DOM of the same table with motion off.
//
//   <TableGrid motion columns rows />                                 all of it, default tokens
//   <TableGrid motion={{ duration: 200, expand: false }} ... />       options (MotionOptions + the switches of TableMotionOptions)
//   <ExtMotionProvider mode="svelte"><TableGrid ... /></ExtMotionProvider>
//   <ExtMotionProvider mode="svelte" overrides={{ 'table-rows': false }}> ... </ExtMotionProvider>      switch the tables off inside a provider
//
// The component (TableGrid.svelte) calls `createTableMotion()` once; `_Layout.svelte` calls `tm.track()`; `_LayoutRow` / `_ExpandContainer` / `_FooterArea` use
// `tableRowOut` / `tableSlide` with `tm.slide(...)`. Row keys and DOM order are the ones the table already has (the `{#each}` key of `_TableBody`).
import { getContext, setContext, tick, untrack } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';
import {
	motionDuration,
	motionEasing,
	useMotion,
	type DurationToken,
	type EasingFn,
	type EasingToken,
	type MotionHandle,
	type MotionOptions,
	type MotionProp
} from './motion.svelte.js';
import { rtSlide, type RtSlideParams } from './transitions.js';

// ─── options / public types ───────────────────────────────────────────────────────────────────────────────────────

/** The switches of the table motion (the `MotionOptions` `type` / `duration` / `easing` / `delay` / `stiffness` / `damping` apply to the row motion). */
export interface TableMotionOptions extends MotionOptions {
	/** Rows: FLIP when sort / filter / page change the order, fade + rise for new rows, fade for removed ones (default true). */
	rows?: boolean;
	/** The content of an expanded row slides open / shut (default true). */
	expand?: boolean;
	/** The action bar (rows selected) slides in / out (default true). */
	actionBar?: boolean;
	/** The sort arrow and the expand chevron turn / cross-fade (default true). */
	icons?: boolean;
	/** A row whose background colour changes (highlight on click, `rowConfig.backgroundColor(row)`) fades between the colours (default true). */
	highlight?: boolean;
	/** The hovered row's background eases in / out, icon buttons dip while pressed (default true). */
	hover?: boolean;
	/**
	 * Tables with more rows than this stay instant for the ROW motion and the action bar (default 300). The rows are ONE css grid: FLIP / fade run on the compositor
	 * (no per-frame layout), the action bar changes the height of the last grid row. Icons, colours and hover do not depend on it.
	 */
	maxRows?: number;
	/**
	 * Tables with more rows than this stay instant when a row is expanded / collapsed (default 80). The height of the content is animated, so the whole grid is
	 * laid out and the rows below are repainted on every frame: measured ~16 ms per frame up to 60 rows, 33 ms (30 fps) from ~100 rows.
	 */
	maxExpandRows?: number;
}

/** What the `motion` prop of the TableGrid accepts: a `MotionProp` (`true`, `false`, 'tween', 'spring', options) or `TableMotionOptions`. */
export type TableGridMotion = MotionProp | TableMotionOptions;

export type TableMotionFeature = 'rows' | 'expand' | 'actionBar' | 'icons' | 'highlight' | 'hover';

/** What the motion needs to know about a row (a structural subset of the table's `RowState`). */
export interface TableMotionRow {
	id: string | number;
	/** unique `{#each}` key (the id, with a suffix for duplicated ids) */
	key?: string;
	backgroundColor?: string | null;
	highlightColor?: string | null;
	borderBottom?: string | null;
}

export interface TableMotionTracking {
	/** `div.atmr-tablegrid__layout` (the grid); `undefined` until mounted */
	root: () => HTMLElement | undefined;
	/** the rows in display order */
	rows: () => readonly TableMotionRow[];
	/** id of the highlighted row (`highlightOnClick`) */
	highlighted: () => string | number | null | undefined;
	/** ids of the expanded rows (strings) */
	expanded: () => readonly string[];
	/** column name -> `{ sort }` of the sorting buttons */
	sortings: () => Readonly<Record<string, { sort?: string } | undefined>>;
}

export interface TableMotionInit {
	/** the table's own `motion` prop */
	prop: () => TableGridMotion;
	/** `virtual: { isEnable }`: the window of rows changes on every scroll step, motion is skipped there */
	virtual: () => boolean;
	/** number of rows of the table (for `maxRows`) */
	rowCount: () => number;
}

export interface TableMotion {
	/** the extension is on for this table and may animate (not reduced motion, not virtual) */
	readonly active: boolean;
	/** `active` and the switch (`motion={{ rows: false }}`) is not off */
	feature(name: TableMotionFeature): boolean;
	/** params for `tableSlide`: `transition:tableSlide={tm.slide('expand')}` */
	slide(kind: 'expand' | 'actionBar'): RtSlideParams;
	/** binds the grid element and the reactive state to the motion. Call once at init of the grid root component (creates effects). */
	track(o: TableMotionTracking): void;
	/** for `tableRowOut` */
	leave(row: Element): TransitionConfig;
}

// ─── the theme tokens ─────────────────────────────────────────────────────────────────────────────────────────────

type Leg = 'flip' | 'in' | 'out' | 'color' | 'icon' | 'press';
const LEGS: Record<Leg, { duration: DurationToken; easing: EasingToken }> = {
	flip: { duration: 'm', easing: 'productive-standard' },
	in: { duration: 'm', easing: 'expressive-entrance' },
	out: { duration: 'xs', easing: 'productive-entrance' },
	color: { duration: 's', easing: 'productive-standard' },
	icon: { duration: 's', easing: 'productive-standard' },
	press: { duration: '2xs', easing: 'productive-standard' }
};
const BEZIER_FALLBACK: Record<string, string> = {
	'productive-standard': 'cubic-bezier(0.4, 0, 0.6, 1)',
	'productive-entrance': 'cubic-bezier(0, 0, 0.6, 1)',
	'productive-exit': 'cubic-bezier(0.3, 0, 1, 0.9)',
	'expressive-standard': 'cubic-bezier(0.8, 0, 0.2, 1)',
	'expressive-entrance': 'cubic-bezier(0, 0, 0.3, 1)',
	'expressive-exit': 'cubic-bezier(0.8, 0.15, 1, 1)'
};

/** `cubic-bezier(...)` of an easing token as the theme defines it (`linear` for `linear`). */
function bezierOf(token: EasingToken, el: Element): string {
	if (token === 'linear') return 'linear';
	let raw = '';
	try {
		raw = getComputedStyle(el).getPropertyValue(`--atmr-motion-easing-${token}`).trim();
	} catch {
		// no style access: use the fallback
	}
	return /^cubic-bezier\(/.test(raw) ? raw : (BEZIER_FALLBACK[token] ?? BEZIER_FALLBACK['productive-standard']);
}

/**
 * The step response of a spring (the same model as Svelte's `Spring`, 60 fps steps) as an easing function that may overshoot, and the time it takes to settle.
 * A table has no per-frame JS, so a spring is sampled into keyframes.
 */
function springEasing(stiffness: number, damping: number): { ease: EasingFn; duration: number } {
	const xs = [0];
	let x = 0;
	let last = 0;
	for (let frame = 1; frame <= 240; frame++) {
		const v = x - last;
		const d = v + stiffness * (1 - x) - damping * v;
		last = x;
		x += d;
		xs.push(x);
		if (Math.abs(d) < 0.002 && Math.abs(1 - x) < 0.002) break;
	}
	xs[xs.length - 1] = 1;
	const n = xs.length - 1;
	return {
		duration: Math.round((n * 1000) / 60),
		ease: (t) => {
			const f = Math.min(1, Math.max(0, t)) * n;
			const i = Math.min(n - 1, Math.floor(f));
			return xs[i] + (xs[i + 1] - xs[i]) * (f - i);
		}
	};
}

interface Timing {
	duration: number;
	delay: number;
	ease: EasingFn;
	/** `cubic-bezier(...)` when the curve is a theme token (two keyframes and the browser's own easing are enough), `null` = sample `ease` */
	css: string | null;
}

// ─── keyframes ────────────────────────────────────────────────────────────────────────────────────────────────────

interface Lerp {
	/** translateY, px */
	y?: [number, number];
	opacity?: [number, number];
	/** deg */
	rotate?: [number, number];
	scale?: [number, number];
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function frameAt(p: Lerp, k: number): Keyframe {
	const f: Keyframe = {};
	if (p.y) f.translate = `0px ${r2(lerp(p.y[0], p.y[1], k))}px`;
	if (p.opacity) f.opacity = r2(clamp01(lerp(p.opacity[0], p.opacity[1], k)) * 1000) / 1000;
	// (rotate / scale are only used on the <svg> icons, where the individual `rotate` / `scale` properties cannot run on the compositor but `transform` can)
	const tf: string[] = [];
	if (p.rotate) tf.push(`rotate(${r2(lerp(p.rotate[0], p.rotate[1], k))}deg)`);
	if (p.scale) tf.push(`scale(${r2(lerp(p.scale[0], p.scale[1], k) * 1000) / 1000})`);
	if (tf.length) f.transform = tf.join(' ');
	return f;
}

/** Keyframes of a linear interpolation between `p`'s two ends under `t`'s curve: two keyframes + a css easing, or the curve sampled at 60 fps. */
function framesOf(t: Timing, p: Lerp): { frames: Keyframe[]; easing: string } {
	if (t.css) return { frames: [frameAt(p, 0), frameAt(p, 1)], easing: t.css };
	const n = Math.max(2, Math.ceil(t.duration / (1000 / 60)));
	const frames: Keyframe[] = [];
	for (let i = 0; i <= n; i++) frames.push(frameAt(p, t.ease(i / n)));
	return { frames, easing: 'linear' };
}

const LIVE_ID = 'rt-ext-table-';

// ─── DOM of the grid ──────────────────────────────────────────────────────────────────────────────────────────────

const ROW_CLASS = 'atmr-tablegrid__row';
const MARGIN = 48;

const isRow = (el: Element): boolean => el.classList.contains(ROW_CLASS) && el.hasAttribute('data-table-row');
const isHeaderRow = (el: Element): boolean => el.firstElementChild?.classList.contains('atmr-tablegrid__header-underlay') ?? false;
/** the cells of a row (`div.row > div.columns__container > div.cell*`) */
const cellsOf = (row: Element): HTMLElement[] => Array.from(row.firstElementChild?.children ?? []) as HTMLElement[];
/** the cell whose box tells where the row is: a data cell (the addon cell of a sticky-header table is `position: sticky; top` too) */
const probeOf = (row: Element): HTMLElement | null => (row.firstElementChild?.lastElementChild as HTMLElement | null) ?? null;

/** the container of the expanded content that follows a row (`div.expand__root > div.expand__container`), if any */
function expandOf(row: Element): HTMLElement | null {
	let n = row.nextElementSibling;
	for (let i = 0; n && i < 3; i++, n = n.nextElementSibling) {
		if (isRow(n)) return null;
		if (n.classList.contains('atmr-tablegrid__expand__root')) return (n.firstElementChild as HTMLElement | null) ?? null;
	}
	return null;
}

interface Box {
	top: number;
	height: number;
}
const boxOf = (el: Element): Box => {
	const r = el.getBoundingClientRect();
	return { top: r.top, height: r.height };
};

/** a row box that is (nearly) inside the visible part of the grid */
const inClip = (b: Box, clip: Box): boolean => b.top + b.height > clip.top - MARGIN && b.top < clip.top + clip.height + MARGIN;

/** the visible vertical range of the grid: its own box, cut to the window */
function clipOf(root: HTMLElement): Box {
	const r = root.getBoundingClientRect();
	const vh = window.innerHeight || document.documentElement.clientHeight;
	const top = Math.max(r.top, 0);
	return { top, height: Math.max(0, Math.min(r.bottom, vh) - top) };
}

// ─── the state that survives a change ────────────────────────────────────────────────────────────────────────────

/** A removed row that is fading out: its cells, pinned where they were (root content coordinates). */
interface GhostSpec {
	key: string;
	items: { el: HTMLElement; left: number; top: number; width: number; height: number }[];
}

interface Pending {
	keys: string[];
	/** old visual box of the rows that stay (and of their expanded content) */
	first: Map<string, { box: Box; expand: Box | null }> | null;
	/** old box of the footer / empty state, for their own FLIP */
	footer: { box: Box } | null;
	/** rows that came back while they were still fading out: the opacity they had */
	resumed: Map<string, number>;
	/** rows whose background changes: computed colour of every cell before */
	colors: Map<string, string[]> | null;
	/** expanded state toggles (ids) */
	toggled: { id: string; opening: boolean }[];
	/** sort icons that changed: the previous `<svg>` (cloned) */
	sorts: { col: string; from: string; to: string; ghost: SVGElement | null }[];
}

const PIN = ['position', 'grid-area', 'left', 'top', 'width', 'height', 'margin', 'z-index', 'pointer-events'] as const;

// ─── the table motion ─────────────────────────────────────────────────────────────────────────────────────────────

const KEY = Symbol('rt-ext-table-motion');

/** The table motion of the surrounding TableGrid (`undefined` outside of one / for the Tree). */
export const useTableMotion = (): TableMotion | undefined => getContext<TableMotion | undefined>(KEY);

/**
 * Call once at init of the grid root component: resolves `motion` (the prop, else the surrounding table's, else the provider's `table-rows` / `mode`) and
 * puts the `TableMotion` into the context. It costs nothing while motion is off: the effects created by `track()` read one flag and return.
 */
export function createTableMotion(init: TableMotionInit): TableMotion {
	const parent = getContext<TableMotionImpl | undefined>(KEY);
	const m = useMotion(() => init.prop() ?? parent?.prop(), 'table-rows');
	const tm = new TableMotionImpl(m, init, parent);
	setContext(KEY, tm);
	return tm;
}

class TableMotionImpl implements TableMotion {
	#m: MotionHandle;
	#init: TableMotionInit;
	#parent: TableMotionImpl | undefined;
	#root: HTMLElement | undefined;
	/** rows that are fading out (the row element -> what it was): they are still in the DOM but no longer rows of the table */
	#ghosts = new Map<Element, GhostSpec>();
	#leaving = new WeakSet<Element>();
	/** the old boxes of the rows that will be removed by the update that is being made (read before the DOM update) */
	#specs = new WeakMap<Element, GhostSpec>();
	#rootPosition: string | null = null;
	/** rows that started to fade out in the update that is being played (the arriving rows wait for them a little) */
	#fading = 0;
	/** the fade-out timing of the update that is being made, resolved before the DOM changes */
	#outTiming: Timing | null = null;
	/** Animations of this table that are running */
	#live = new Set<Animation>();

	constructor(m: MotionHandle, init: TableMotionInit, parent: TableMotionImpl | undefined) {
		this.#m = m;
		this.#init = init;
		this.#parent = parent;
	}

	/** the table's own `motion` prop, else the surrounding table's (nested tables inherit) */
	prop(): TableGridMotion {
		return this.#init.prop() ?? this.#parent?.prop();
	}

	get #flags(): TableMotionOptions {
		const p = this.prop();
		return p !== null && typeof p === 'object' ? (p as TableMotionOptions) : {};
	}

	get active(): boolean {
		return this.#m.enabled && !this.#init.virtual();
	}

	feature(name: TableMotionFeature): boolean {
		return this.active && this.#flags[name] !== false;
	}

	/** the motion of the rows (and of the action bar) is worth its cost only while the grid is small enough */
	#small(limit: 'rows' | 'expand' = 'rows'): boolean {
		return this.#init.rowCount() <= (limit === 'expand' ? (this.#flags.maxExpandRows ?? 80) : (this.#flags.maxRows ?? 300));
	}

	// ── timing ───────────────────────────────────────────────────────────────────────────────────────────────────

	#timing(kind: Leg, el: Element): Timing {
		const cfg = this.#m.config;
		const d = LEGS[kind];
		if (cfg?.type === 'spring' && (kind === 'flip' || kind === 'in') && !cfg.set.duration && !cfg.set.easing) {
			const s = springEasing(cfg.set.stiffness ? cfg.stiffness : 0.2, cfg.set.damping ? cfg.damping : 0.6);
			return { duration: s.duration, delay: cfg.delay, ease: s.ease, css: null };
		}
		const duration = cfg?.set.duration ? cfg.duration : motionDuration(d.duration, el);
		if (cfg?.set.easing) return { duration, delay: cfg.delay, ease: cfg.easing, css: null };
		return { duration, delay: cfg?.delay ?? 0, ease: motionEasing(d.easing, el), css: bezierOf(d.easing, el) };
	}

	#play(el: Element, frames: Keyframe[], o: { duration: number; delay?: number; easing?: string; fill?: FillMode }, kind: string): Animation | null {
		try {
			const a = el.animate(frames, { duration: o.duration, delay: o.delay ?? 0, easing: o.easing ?? 'linear', fill: o.fill ?? 'backwards' });
			a.id = LIVE_ID + kind;
			this.#live.add(a);
			const done = () => this.#live.delete(a);
			a.addEventListener('finish', done);
			a.addEventListener('cancel', done);
			return a;
		} catch (e) {
			debug('animate', e);
			return null;
		}
	}

	#lerp(els: Iterable<Element>, t: Timing, p: Lerp, kind: string, extraDelay = 0, fill: FillMode = 'backwards'): Animation[] {
		const { frames, easing } = framesOf(t, p);
		const out: Animation[] = [];
		for (const el of els) {
			const a = this.#play(el, frames, { duration: t.duration, delay: t.delay + extraDelay, easing, fill }, kind);
			if (a) out.push(a);
		}
		return out;
	}

	#cancel(kind: string, els?: Iterable<Element>): void {
		const id = LIVE_ID + kind;
		if (els) {
			for (const el of els) for (const a of el.getAnimations()) if (a.id === id) a.cancel();
			return;
		}
		for (const a of [...this.#live]) if (a.id === id) a.cancel();
	}

	// ── Svelte transitions (expand container, action bar) ───────────────────────────────────────────────────────

	slide(kind: 'expand' | 'actionBar'): RtSlideParams {
		const on = this.feature(kind) && this.#small(kind === 'expand' ? 'expand' : 'rows');
		const cfg = this.#m.config;
		return {
			enabled: on,
			duration: cfg?.set.duration ? cfg.duration : undefined,
			easing: cfg?.set.easing ? cfg.easing : undefined,
			delay: cfg?.delay
		};
	}

	// ── rows that leave ──────────────────────────────────────────────────────────────────────────────────────────

	/**
	 * The `out:` transition of a removed row (see `tableRowOut`).
	 *
	 * All the rows removed by ONE update must answer alike: Svelte 5's keyed `{#each}` waits for the whole group of outros, but it counts the outros that finish
	 * synchronously (zero length) separately from the delayed ones and never destroys the group when the two kinds are mixed (the rows stay in the DOM). So while the
	 * table motion is active EVERY removed row takes at least one frame: a row that was in view fades (its cells pinned where they were), one that was not is simply
	 * hidden (`display: none` on the row element: it leaves the grid at once and costs no style recalculation of its cells).
	 */
	leave(row: Element): TransitionConfig {
		const root = this.#root;
		if (!root || !this.feature('rows')) return { duration: 0 };
		const spec = this.#specs.get(row);
		this.#specs.delete(row);
		this.#leaving.add(row);
		const t = this.#outTiming ?? this.#timing('out', root);
		if (!spec) {
			// (it goes away together with the ones that fade: one removal, one layout)
			(row as HTMLElement).style.display = 'none';
			return { duration: Math.max(1, t.duration + t.delay) };
		}
		this.#fading++;
		this.#ghosts.set(row, spec);
		if (this.#ghosts.size === 1 && this.#rootPosition === null && getComputedStyle(root).position === 'static') {
			this.#rootPosition = root.style.position;
			root.style.position = 'relative';
		}
		const { frames, easing } = framesOf(t, { opacity: [1, 0] });
		for (const g of spec.items) {
			const s = g.el.style;
			s.position = 'absolute';
			s.gridArea = 'auto';
			s.left = `${r2(g.left)}px`;
			s.top = `${r2(g.top)}px`;
			s.width = `${r2(g.width)}px`;
			s.height = `${r2(g.height)}px`;
			s.margin = '0';
			s.zIndex = '21'; // below the cells of the rows that stay (23 / 24)
			s.pointerEvents = 'none';
			this.#play(g.el, frames, { duration: t.duration, delay: t.delay, easing, fill: 'forwards' }, 'out');
		}
		row.addEventListener('outroend', () => this.#endGhost(row), { once: true });
		return { duration: t.duration + t.delay };
	}

	#endGhost(row: Element): void {
		this.#ghosts.delete(row);
		this.#unpinRoot();
	}

	#unpinRoot(): void {
		if (this.#ghosts.size > 0 || this.#rootPosition === null) return;
		const root = this.#root;
		if (root) {
			if (this.#rootPosition) root.style.position = this.#rootPosition;
			else root.style.removeProperty('position');
		}
		this.#rootPosition = null;
	}

	/** a row that is fading out is wanted again (its key came back): it is an ordinary row again. Returns the opacity it had. */
	#revive(key: string): number | null {
		for (const [row, spec] of this.#ghosts) {
			if (spec.key !== key) continue;
			const opacity = parseFloat(getComputedStyle(spec.items[0]?.el ?? row).opacity);
			for (const g of spec.items) {
				this.#cancel('out', [g.el]);
				for (const p of PIN) g.el.style.removeProperty(p);
			}
			this.#leaving.delete(row);
			this.#ghosts.delete(row);
			this.#unpinRoot();
			return Number.isFinite(opacity) ? opacity : 0;
		}
		return null;
	}

	/** the rows of the table in display order: what the keyed `{#each}` keeps (no header row, no rows that are fading out) */
	#dataRows(root: HTMLElement): HTMLElement[] {
		const out: HTMLElement[] = [];
		for (let el = root.firstElementChild; el; el = el.nextElementSibling) {
			if (isRow(el) && !this.#leaving.has(el) && !isHeaderRow(el)) out.push(el as HTMLElement);
		}
		return out;
	}

	// ── tracking ─────────────────────────────────────────────────────────────────────────────────────────────────

	track(o: TableMotionTracking): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		let prevKeys: string[] | null = null;
		let prevSig = new Map<string, string>();
		let prevExpanded: Set<string> | null = null;
		let prevSorts: Map<string, string> | null = null;
		let pending: Pending | null = null;

		const keyOf = (r: TableMotionRow) => r.key ?? String(r.id);
		const colorSig = (r: TableMotionRow, hl: string | number | null | undefined) =>
			`${r.backgroundColor ?? ''}\n${r.highlightColor ?? ''}\n${r.borderBottom ?? ''}\n${hl !== null && hl !== undefined && String(hl) === String(r.id) ? 'h' : ''}`;

		// The DOM before the update: what moves, what goes, what changes colour.
		$effect.pre(() => {
			const root = o.root();
			self.#root = root;
			if (!self.active || !root) {
				prevKeys = null;
				prevExpanded = null;
				prevSorts = null;
				pending = null;
				return;
			}
			const rows = o.rows();
			const hl = o.highlighted();
			const expanded = o.expanded();
			const sortings = o.sortings();
			untrack(() => {
				const keys = rows.map(keyOf);
				const sig = new Map<string, string>();
				rows.forEach((r, i) => sig.set(keys[i], colorSig(r, hl)));
				const sorts = new Map<string, string>();
				for (const [col, s] of Object.entries(sortings)) if (s) sorts.set(col, s.sort ?? '');
				const expandedSet = new Set(expanded);
				const before = prevKeys;
				const beforeSig = prevSig;
				const beforeExpanded = prevExpanded;
				const beforeSorts = prevSorts;
				prevKeys = keys;
				prevSig = sig;
				prevExpanded = expandedSet;
				prevSorts = sorts;
				if (before === null || beforeExpanded === null || beforeSorts === null) {
					pending = null; // first run / just switched on: nothing to animate from
					return;
				}
				if (pending) return; // an update that has not been played yet: keep what was read before it (the DOM has not been painted since)

				const orderChanged = before.length !== keys.length || before.some((k, i) => k !== keys[i]);
				const rowsOn = orderChanged && self.feature('rows') && self.#small() && before.length <= (self.#flags.maxRows ?? 300);
				const colorKeys = self.feature('highlight') ? keys.filter((k) => beforeSig.has(k) && beforeSig.get(k) !== sig.get(k)) : [];
				const sortChanges = self.feature('icons') ? [...sorts].filter(([col, v]) => beforeSorts.has(col) && beforeSorts.get(col) !== v) : [];
				const toggled = self.feature('icons') ? diffExpanded(beforeExpanded, expandedSet) : [];
				if (!rowsOn && !colorKeys.length && !sortChanges.length && !toggled.length) return;

				const p: Pending = { keys, first: null, footer: null, resumed: new Map(), colors: null, toggled, sorts: [] };
				try {
					const els = self.#dataRows(root);
					const synced = els.length === before.length;

					if (rowsOn && synced) {
						const clip = clipOf(root);
						const rootBox = root.getBoundingClientRect();
						const stays = new Set(keys);
						p.first = new Map();
						self.#outTiming = self.#timing('out', root);
						for (let i = 0; i < els.length; i++) {
							const probe = probeOf(els[i]);
							if (!probe) continue;
							const box = boxOf(probe);
							if (stays.has(before[i])) {
								const e = expandOf(els[i]);
								p.first.set(before[i], { box, expand: e ? boxOf(e) : null });
							} else if (inClip(box, clip)) {
								self.#specs.set(els[i], ghostOf(els[i], before[i], rootBox, root));
							}
						}
						const footer = root.querySelector(':scope > .atmr-tablegrid__footer-area, :scope > .atmr-tablegrid__empty');
						if (footer) p.footer = { box: boxOf(footer) };
						// rows that come back while they were fading out
						for (const k of keys) {
							if (!before.includes(k)) {
								const was = self.#revive(k);
								if (was !== null) p.resumed.set(k, was);
							}
						}
						// what is running now was read as it is drawn; the new layout must be measured without it
						self.#cancel('flip');
					}

					if (colorKeys.length && synced) {
						const clip = clipOf(root);
						const colors = new Map<string, string[]>();
						for (const k of colorKeys.slice(0, 200)) {
							const i = before.indexOf(k);
							const probe = i >= 0 ? probeOf(els[i]) : null;
							if (!probe || !inClip(boxOf(probe), clip)) continue;
							colors.set(k, cellsOf(els[i]).map((c) => getComputedStyle(c).backgroundColor));
						}
						if (colors.size) p.colors = colors;
					}

					for (const [col, v] of sortChanges) {
						const svg = sortIconOf(root, col)?.querySelector('svg');
						p.sorts.push({ col, from: beforeSorts.get(col) ?? '', to: v, ghost: svg ? (svg.cloneNode(true) as SVGElement) : null });
					}
				} catch (e) {
					// never let a measurement break the table
					debug('measure', e);
				}
				pending = p;
			});
		});

		// The DOM after the update: play.
		$effect(() => {
			if (!self.active) return;
			void o.root();
			void o.rows();
			void o.highlighted();
			void o.expanded();
			void o.sortings();
			untrack(() => {
				const p = pending;
				pending = null;
				const root = self.#root;
				if (!p || !root) return;
				try {
					self.#playPending(root, p, o);
				} catch (e) {
					self.#cancel('flip');
					debug('play', e);
				}
			});
		});

		// hover / press feedback
		$effect(() => {
			const root = o.root();
			if (!root || !self.feature('hover')) return;
			return self.#listen(root);
		});

		$effect(() => () => {
			for (const a of [...self.#live]) a.cancel();
			self.#root = undefined;
		});
	}

	#playPending(root: HTMLElement, p: Pending, o: TableMotionTracking): void {
		const rows = o.rows();
		const els = this.#dataRows(root);
		const synced = els.length === p.keys.length;
		const rowMotion = this.feature('rows') && !!p.first && synced;

		// read
		type Move = { el: HTMLElement; key: string; dy: number; expand: { el: HTMLElement; dy: number } | null; state: 'flip' | 'enter' | 'resume' };
		const moves: Move[] = [];
		let footerDy = 0;
		let footerEl: Element | null = null;
		if (rowMotion && p.first) {
			const clip = clipOf(root);
			for (let i = 0; i < els.length; i++) {
				const key = p.keys[i];
				const probe = probeOf(els[i]);
				if (!probe) continue;
				const box = boxOf(probe);
				const first = p.first.get(key);
				const e = expandOf(els[i]);
				if (first) {
					const dy = first.box.top - box.top;
					if (Math.abs(dy) < 0.5) continue;
					const visibleBefore = inClip(first.box, clip);
					if (!visibleBefore && !inClip(box, clip)) continue;
					// (a row that was far outside of the window does not fly across it: it appears)
					moves.push({ el: els[i], key, dy, expand: e && first.expand ? { el: e, dy: first.expand.top - boxOf(e).top } : null, state: visibleBefore ? 'flip' : 'enter' });
				} else if (inClip(box, clip)) {
					moves.push({ el: els[i], key, dy: 0, expand: e ? { el: e, dy: 0 } : null, state: p.resumed.has(key) ? 'resume' : 'enter' });
				}
			}
			const footer = root.querySelector(':scope > .atmr-tablegrid__footer-area, :scope > .atmr-tablegrid__empty');
			if (footer && p.footer && inClip(p.footer.box, clip)) {
				footerDy = p.footer.box.top - boxOf(footer).top;
				footerEl = footer;
			}
		}
		const colorNow = new Map<string, string[]>();
		if (p.colors) {
			for (const key of p.colors.keys()) {
				const i = p.keys.indexOf(key);
				if (i >= 0 && els[i]) colorNow.set(key, cellsOf(els[i]).map((c) => getComputedStyle(c).backgroundColor));
			}
		}

		// write
		const wait = this.#fading > 0 ? 60 : 0; // the arriving rows follow the ones that are fading out (they are drawn on the same places)
		this.#fading = 0;
		this.#outTiming = null;
		if (moves.length) {
			const flip = this.#timing('flip', root);
			const enter = this.#timing('in', root);
			for (const mv of moves) {
				const cells = [...cellsOf(mv.el), ...(mv.expand ? [mv.expand.el] : [])];
				if (mv.state === 'flip') {
					this.#lerp(cellsOf(mv.el), flip, { y: [mv.dy, 0] }, 'flip');
					if (mv.expand && Math.abs(mv.expand.dy) >= 0.5) this.#lerp([mv.expand.el], flip, { y: [mv.expand.dy, 0] }, 'flip');
				} else {
					const from = mv.state === 'resume' ? (p.resumed.get(mv.key) ?? 0) : 0;
					this.#lerp(cells, enter, { y: [mv.state === 'resume' ? 0 : 8, 0], opacity: [from, 1] }, 'in', wait);
				}
			}
		}
		if (footerEl && Math.abs(footerDy) >= 0.5) this.#lerp([footerEl], this.#timing('flip', root), { y: [footerDy, 0] }, 'flip');

		if (p.colors) {
			const t = this.#timing('color', root);
			for (const [key, before] of p.colors) {
				const now = colorNow.get(key);
				const i = p.keys.indexOf(key);
				if (!now || i < 0 || !els[i]) continue;
				cellsOf(els[i]).forEach((cell, c) => {
					if (before[c] && now[c] && before[c] !== now[c]) {
						this.#play(cell, [{ backgroundColor: before[c] }, { backgroundColor: now[c] }], { duration: t.duration, delay: t.delay, easing: t.css ?? 'ease-out', fill: 'backwards' }, 'color');
					}
				});
			}
		}

		// The icons are the last thing to change in the DOM: a chevron flips when the expanded keys reach the row, which can be one flush later than the rows
		// themselves (`expandedKeys` is applied by an effect of the expand module), so they are played after the pending updates are through.
		if (this.feature('icons') && (p.sorts.length || p.toggled.length)) {
			void tick().then(() => {
				if (!root.isConnected) return;
				try {
					this.#playIcons(root, p, o);
				} catch (e) {
					debug('icons', e);
				}
			});
		}
	}

	#playIcons(root: HTMLElement, p: Pending, o: TableMotionTracking): void {
		if (!this.feature('icons')) return;
		const rows = o.rows();
		const els = this.#dataRows(root);
		const t = this.#timing('icon', root);
		for (const s of p.sorts) this.#sortIcon(root, s, t);
		if (p.toggled.length && els.length === rows.length) {
			const byId = new Map<string, number>();
			rows.forEach((r, i) => byId.set(String(r.id), i));
			for (const { id, opening } of p.toggled) {
				const i = byId.get(id);
				const svg = i === undefined ? null : els[i]?.querySelector<SVGElement>('.atmr-tablegrid__expand__icon:not(.atmr-tablegrid__expand__icon--placeholder) svg');
				// right -> down turns clockwise, down -> right counter-clockwise: the new glyph starts where the old one pointed
				if (svg) this.#lerp([svg], t, { rotate: [opening ? -90 : 90, 0] }, 'icon');
			}
		}
	}

	/** the arrow of a sort button: up <-> down turns over, the chevrons <-> an arrow cross-fade */
	#sortIcon(root: HTMLElement, s: Pending['sorts'][number], t: Timing): void {
		const button = sortIconOf(root, s.col);
		const svg = button?.querySelector<SVGElement>('svg');
		if (!button || !svg) return;
		const arrows = (v: string) => v === 'asc' || v === 'desc';
		if (arrows(s.from) && arrows(s.to)) {
			this.#lerp([svg], t, { rotate: [180, 0], opacity: [0.35, 1] }, 'icon');
			return;
		}
		this.#lerp([svg], t, { rotate: [s.to === 'default' ? 90 : -90, 0], opacity: [0, 1], scale: [0.7, 1] }, 'icon');
		const ghost = s.ghost;
		if (!ghost) return;
		// the old glyph stays, absolutely positioned on the new one, and fades out
		const b = button.getBoundingClientRect();
		const r = svg.getBoundingClientRect();
		ghost.setAttribute('aria-hidden', 'true');
		const gs = ghost.style;
		gs.position = 'absolute';
		gs.left = `${r2(r.left - b.left - button.clientLeft)}px`;
		gs.top = `${r2(r.top - b.top - button.clientTop)}px`;
		gs.margin = '0';
		gs.pointerEvents = 'none';
		const saved = button.style.position;
		if (getComputedStyle(button).position === 'static') button.style.position = 'relative';
		button.appendChild(ghost);
		const done = () => {
			ghost.remove();
			if (button.isConnected) {
				if (saved) button.style.position = saved;
				else button.style.removeProperty('position');
				if (button.getAttribute('style') === '') button.removeAttribute('style');
			}
		};
		const [anim] = this.#lerp([ghost], t, { rotate: [0, s.to === 'default' ? -90 : 90], opacity: [1, 0], scale: [1, 0.7] }, 'icon', 0, 'forwards');
		if (anim) {
			anim.addEventListener('finish', done);
			anim.addEventListener('cancel', done);
		} else done();
	}

	// ── hover / press ────────────────────────────────────────────────────────────────────────────────────────────

	#listen(root: HTMLElement): () => void {
		const rowOf = (target: EventTarget | null): HTMLElement | null => {
			for (let el = target as Element | null; el && el !== root; el = el.parentElement) {
				if (el.parentElement === root) return isRow(el) && !isHeaderRow(el) && !this.#leaving.has(el) ? (el as HTMLElement) : null;
			}
			return null;
		};
		const hover = (row: HTMLElement, into: boolean) => {
			try {
				if (row.classList.contains('atmr-tablegrid__row--highlighted')) return;
				const t = this.#timing('color', root);
				const token = getComputedStyle(root).getPropertyValue('--atmr-tablegrid-primary-row-bg-color-hover').trim();
				if (!token) return;
				for (const cell of cellsOf(row)) {
					const cs = getComputedStyle(cell);
					const sticky = cell.classList.contains('atmr-tablegrid__cell--addon') && cell.classList.contains('atmr-tablegrid__cell--stickyPosition-left');
					const rest = cs.getPropertyValue(sticky ? '--addon-sticky-bg' : '--background-row').trim();
					if (!rest) continue;
					const frames = into ? [{ backgroundColor: rest }, { backgroundColor: cs.backgroundColor }] : [{ backgroundColor: token }, { backgroundColor: cs.backgroundColor }];
					this.#cancel('hover', [cell]);
					this.#play(cell, frames, { duration: into ? t.duration * 0.6 : t.duration, easing: t.css ?? 'ease-out', fill: 'none' }, 'hover');
				}
			} catch {
				// hover feedback is cosmetic
			}
		};
		const onOver = (e: MouseEvent) => {
			const row = rowOf(e.target);
			if (row && !row.contains(e.relatedTarget as Node | null)) hover(row, true);
		};
		const onOut = (e: MouseEvent) => {
			const row = rowOf(e.target);
			if (row && !row.contains(e.relatedTarget as Node | null)) hover(row, false);
		};
		const PRESSABLE = '.atmr-tablegrid__sorting__button, .atmr-tablegrid__expand__icon:not(.atmr-tablegrid__expand__icon--placeholder), .atmr-tablegrid__filter__button';
		const onDown = (e: PointerEvent) => {
			const el = (e.target as Element | null)?.closest<HTMLElement>(PRESSABLE);
			if (!el || !root.contains(el)) return;
			try {
				const t = this.#timing('press', root);
				const down = el.animate([{ scale: 1 }, { scale: 0.86 }], { duration: t.duration, easing: t.css ?? 'ease-out', fill: 'forwards' });
				down.id = LIVE_ID + 'press';
				const release = () => {
					window.removeEventListener('pointerup', release, true);
					window.removeEventListener('pointercancel', release, true);
					const up = el.animate([{ scale: 0.86 }, { scale: 1 }], { duration: t.duration * 1.6, easing: t.css ?? 'ease-out', fill: 'none' });
					up.id = LIVE_ID + 'press';
					down.cancel();
				};
				window.addEventListener('pointerup', release, true);
				window.addEventListener('pointercancel', release, true);
			} catch {
				// press feedback is cosmetic
			}
		};
		root.addEventListener('mouseover', onOver);
		root.addEventListener('mouseout', onOut);
		root.addEventListener('pointerdown', onDown);
		return () => {
			root.removeEventListener('mouseover', onOver);
			root.removeEventListener('mouseout', onOut);
			root.removeEventListener('pointerdown', onDown);
		};
	}
}

// ─── helpers of the tracking ─────────────────────────────────────────────────────────────────────────────────────

/** a failure of the motion never breaks the table (it is only cosmetic); set `globalThis.__RT_EXT_DEBUG__ = true` to print it */
function debug(where: string, e: unknown): void {
	if ((globalThis as { __RT_EXT_DEBUG__?: boolean }).__RT_EXT_DEBUG__) console.error(`[rt-ext table motion] ${where}`, e);
}

function diffExpanded(before: Set<string>, now: Set<string>): { id: string; opening: boolean }[] {
	const out: { id: string; opening: boolean }[] = [];
	for (const id of now) if (!before.has(id)) out.push({ id, opening: true });
	for (const id of before) if (!now.has(id)) out.push({ id, opening: false });
	return out;
}

function ghostOf(row: HTMLElement, key: string, rootBox: DOMRect, root: HTMLElement): GhostSpec {
	const items: GhostSpec['items'] = [];
	const add = (el: HTMLElement) => {
		const r = el.getBoundingClientRect();
		items.push({ el, left: r.left - rootBox.left - root.clientLeft + root.scrollLeft, top: r.top - rootBox.top - root.clientTop + root.scrollTop, width: r.width, height: r.height });
	};
	for (const c of cellsOf(row)) add(c);
	const e = expandOf(row);
	if (e) add(e);
	return { key, items };
}

/** the sort button of a column in the header row */
function sortIconOf(root: HTMLElement, col: string): HTMLElement | null {
	for (const cell of root.querySelectorAll<HTMLElement>(':scope > .atmr-tablegrid__row > .atmr-tablegrid__columns__container > .atmr-tablegrid__cell--header')) {
		if (cell.getAttribute('data-header-cell-name') === col) return cell.querySelector<HTMLElement>('.atmr-tablegrid__sorting__button');
	}
	return null;
}

// ─── Svelte transitions ──────────────────────────────────────────────────────────────────────────────────────────

/**
 * `out:tableRowOut={tm}` on the row element: keeps the removed row in the DOM while its cells fade (see `TableMotion.leave`). Zero-length without a table motion /
 * when the row was not visible / when motion is off, so the row goes at once like in the original.
 */
export function tableRowOut(node: Element, tm?: TableMotion): TransitionConfig {
	return tm ? tm.leave(node) : { duration: 0 };
}

/**
 * `transition:tableSlide={tm.slide('expand')}`: `rtSlide` (height + fade of the block) + puts back the empty `style` attribute that Svelte leaves behind
 * on a block that had none (the settled DOM equals the original).
 */
export function tableSlide(node: Element, params: RtSlideParams = {}): TransitionConfig {
	const cfg = rtSlide(node, params);
	if (params.enabled !== false && cfg.duration) {
		node.addEventListener(
			'introend',
			() => queueMicrotask(() => node.isConnected && node.getAttribute('style') === '' && node.removeAttribute('style')),
			{ once: true }
		);
	}
	return cfg;
}
