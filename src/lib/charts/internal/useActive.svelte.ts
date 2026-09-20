/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// The "active data position" of a chart, shared by the pointer and the keyboard: the crosshair / highlight / tooltip follow it.
// Keyboard model: the data points are real `<button>`s inside one `role="group"` layer with a roving tabindex - Tab enters the chart at one
// point (the last active one), the arrows / Home / End move between points, Enter / Space activate, Escape hides the tooltip.

export interface ActiveState {
	/** the position under the pointer / focus, `null` when there is none */
	readonly active: number | null;
	/** the position to draw: the active one, or the last active one while the tooltip fades out */
	readonly shown: number;
	/** the position that owns `tabindex="0"` */
	readonly roving: number;
	readonly focusInside: boolean;
	/** pointer moved over a position (`null`: left the plot; keeps the keyboard focus's position) */
	pointer(i: number | null): void;
	clear(): void;
	/** `onkeydown` of the layer of buttons */
	onKey(e: KeyboardEvent): void;
	/** `onfocus` of the button `i` */
	focusIn(i: number): void;
	/** `onblur` of a button: leaving the layer clears the position */
	focusOut(e: FocusEvent): void;
}

export function useActive(opts: { count: () => number; hits: () => HTMLElement | undefined; onSelect?: (index: number) => void }): ActiveState {
	let active = $state<number | null>(null);
	/** the last position that was active (pointer or keyboard): what is drawn while the tooltip fades out */
	let last = $state(0);
	/** the last position the KEYBOARD stood on: the roving tabindex (the pointer must not move it) */
	let focused = $state(0);
	let focusInside = $state(false);

	$effect(() => {
		if (active !== null) last = active;
	});

	const clampIndex = (i: number) => Math.min(Math.max(0, opts.count() - 1), Math.max(0, i));

	function focusHit(i: number) {
		const buttons = opts.hits()?.querySelectorAll<HTMLButtonElement>('button');
		if (!buttons?.length) return;
		buttons[Math.min(buttons.length - 1, Math.max(0, i))].focus();
	}

	return {
		get active() {
			return active;
		},
		get shown() {
			return clampIndex(active ?? last);
		},
		get roving() {
			return clampIndex(focused);
		},
		get focusInside() {
			return focusInside;
		},
		pointer(i) {
			if (i === null) {
				if (!focusInside) active = null;
			} else active = i;
		},
		clear() {
			if (!focusInside) active = null;
		},
		onKey(e) {
			const n = opts.count();
			if (n === 0) return;
			const i = clampIndex(focusInside ? (active ?? focused) : focused);
			let next: number | null = null;
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(n - 1, i + 1);
			else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, i - 1);
			else if (e.key === 'Home') next = 0;
			else if (e.key === 'End') next = n - 1;
			else if (e.key === 'Escape') {
				active = null;
				return;
			} else if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				opts.onSelect?.(i);
				return;
			}
			if (next !== null) {
				e.preventDefault();
				focusHit(next);
			}
		},
		focusIn(i) {
			focusInside = true;
			focused = i;
			active = i;
		},
		focusOut(e) {
			const layer = opts.hits();
			if (layer && e.relatedTarget instanceof Node && layer.contains(e.relatedTarget)) return;
			focusInside = false;
			active = null;
		}
	};
}
