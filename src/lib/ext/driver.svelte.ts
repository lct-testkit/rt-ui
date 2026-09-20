/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// One animated number that is driven IMPERATIVELY (`go()` / `jump()` / `freeze()`), with either a Svelte `Tween` (duration + easing) or a
// Svelte `Spring` (stiffness + damping) behind it - whichever the resolved motion asks for. It is the engine of the hooks that start a motion
// from an event and write the result to the DOM themselves (`useShowMotion`, `useCollapseMotion`, `useIndicatorMotion`, `useSideMenuMotion`);
// `useMotionValue` (motion.svelte.ts) is the same choice for a value that just follows a reactive target.
//
//   const d = new Driver(0);
//   $effect(() => { el.style.height = `${d.value}px`; });        // `value` is reactive
//   await d.go(240, cfg);                                       // resolves when it has SETTLED at 240 (an interrupted move never resolves)
//
// Both engines hold the same number: when the type changes between two moves the new engine takes over from where the value is now.
import { Spring, Tween } from 'svelte/motion';
import type { EasingFn, MotionType, ResolvedMotion } from './motion.svelte.js';

/** What one move needs (a `ResolvedMotion`, or its parts overridden per leg). */
export interface DriveLeg {
	/** engine of this move (default: 'tween') */
	type?: MotionType;
	/** Tween: ms */
	duration?: number;
	/** Tween: ms */
	delay?: number;
	/** Tween: easing function */
	easing?: EasingFn;
	/** Spring: 0..1 */
	stiffness?: number;
	/** Spring: 0..1 */
	damping?: number;
	/** Spring: settle precision, in the units of the value */
	precision?: number;
}

/** `ResolvedMotion` -> a leg (options given in `over` win) */
export function legOf(cfg: ResolvedMotion, over: DriveLeg = {}): DriveLeg {
	return {
		type: over.type ?? cfg.type,
		duration: over.duration ?? cfg.duration,
		delay: over.delay ?? cfg.delay,
		easing: over.easing ?? cfg.easing,
		stiffness: over.stiffness ?? cfg.stiffness,
		damping: over.damping ?? cfg.damping,
		precision: over.precision ?? cfg.precision
	};
}

/**
 * Sane spring defaults per kind of motion (Svelte's own defaults, stiffness 0.15 / damping 0.8, are a slow over-damped settle: ~480 ms). The numbers are per
 * 60 fps frame like Svelte's (see `springSettleMs`); the overshoot / settle time are of a unit step and measured with the same integration Svelte uses.
 */
export const SPRING = {
	/** no visible overshoot, settled in ~300 ms: sizes, offsets, big panels (accordion height, side menu width, a drawer) */
	smooth: { stiffness: 0.2, damping: 0.75 },
	/** a small, lively overshoot (~1 % of the distance), settled in ~370 ms, a fade over it takes ~150 ms: things that pop in or slide between places (popover / modal, the tabs indicator) */
	lively: { stiffness: 0.1, damping: 0.45 }
} as const;

/**
 * Estimated time (ms) a spring needs to settle from a unit step (60 fps steps, like Svelte's `Spring`), i.e. how long to wait before a
 * finished motion may be treated as done when its promise is not available (state machines with timeouts). `precision` is in units of the
 * step, so 0.01 = within 1 %.
 */
export function springSettleMs(stiffness: number, damping: number, precision = 0.01): number {
	let x = 0;
	let last = 0;
	for (let frame = 1; frame <= 600; frame++) {
		const v = x - last;
		const a = stiffness * (1 - x) - damping * v;
		const d = v + a;
		last = x;
		x += d;
		if (Math.abs(d) < precision && Math.abs(1 - x) < precision) return Math.round((frame * 1000) / 60);
	}
	return 10000;
}

export class Driver {
	#tween: Tween<number>;
	#spring: Spring<number> | null = null;
	#type = $state<MotionType>('tween');
	/** bumped by every jump / go: a delayed start of an older move must not run */
	#gen = 0;

	constructor(from = 0) {
		this.#tween = new Tween<number>(from, { duration: 0 });
	}

	/** the current value (reactive) */
	get value(): number {
		return this.#type === 'spring' && this.#spring ? this.#spring.current : this.#tween.current;
	}

	/** the value the running move is heading for (reactive) */
	get target(): number {
		return this.#type === 'spring' && this.#spring ? this.#spring.target : this.#tween.target;
	}

	/** jumps to `v` at once and stops whatever is running */
	jump(v: number): void {
		this.#gen++;
		void this.#tween.set(v, { duration: 0 });
		if (this.#spring) void this.#spring.set(v, { instant: true });
	}

	/** stops where the value is now */
	freeze(): void {
		this.jump(this.value);
	}

	/**
	 * Moves to `to` with `leg` and returns a promise that resolves when the value has SETTLED there. A move that is interrupted by another
	 * `go()` / `jump()` / `freeze()` never resolves (it is not an error): always compare a generation counter in the callback.
	 */
	go(to: number, leg: DriveLeg): Promise<void> {
		const from = this.value;
		const type: MotionType = leg.type === 'spring' ? 'spring' : 'tween';
		this.jump(from); // a running move of either engine stops here
		const gen = this.#gen;
		this.#type = type;
		if (type === 'spring') {
			if (!this.#spring) this.#spring = new Spring<number>(from, { stiffness: leg.stiffness, damping: leg.damping, precision: leg.precision });
			const s = this.#spring;
			if (leg.stiffness !== undefined) s.stiffness = leg.stiffness;
			if (leg.damping !== undefined) s.damping = leg.damping;
			if (leg.precision !== undefined) s.precision = leg.precision;
			void s.set(from, { instant: true });
			// a Spring's promise REJECTS when it is interrupted: swallow that, the caller only hears about a settled move
			return new Promise<void>((resolve) => {
				const run = () => {
					if (gen === this.#gen) void s.set(to).then(resolve, () => {});
				};
				if (leg.delay && leg.delay > 0) setTimeout(run, leg.delay);
				else run();
			});
		}
		return this.#tween.set(to, { duration: leg.duration ?? 300, easing: leg.easing, delay: leg.delay ?? 0 });
	}
}
