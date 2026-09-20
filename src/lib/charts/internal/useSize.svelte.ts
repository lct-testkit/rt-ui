/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Container size of a chart: `ResizeObserver` on the element, a sensible default before the first measurement (so the server-rendered
// SVG is not empty and does not jump around), updates rounded to whole pixels so sub-pixel jitter never re-renders the chart.

export interface ElementSize {
	/** measured content width, px (the `initial` width until the element is measured) */
	readonly width: number;
	/** measured content height, px (the `initial` height until the element is measured) */
	readonly height: number;
	/** `true` after the first real measurement */
	readonly measured: boolean;
}

/**
 * @param target the observed element (`bind:this`)
 * @param initial size used until the element is measured (server side, first paint)
 * @param fixed a fixed width in px (`width` prop): nothing is observed then
 */
export function useElementSize(target: () => HTMLElement | undefined, initial: { width: number; height: number }, fixed?: () => number | undefined): ElementSize {
	let width = $state(initial.width);
	let height = $state(initial.height);
	let measured = $state(false);

	$effect(() => {
		const el = target();
		if (!el || typeof ResizeObserver === 'undefined') return;
		const apply = (w: number, h: number) => {
			const rw = Math.round(w);
			const rh = Math.round(h);
			// a hidden / collapsed container reports 0: keep the last good size
			if (rw > 0 && rw !== width) width = rw;
			if (rh > 0 && rh !== height) height = rh;
			if (rw > 0) measured = true;
		};
		const box = el.getBoundingClientRect();
		apply(box.width, box.height);
		const ro = new ResizeObserver((entries) => {
			const r = entries[entries.length - 1].contentRect;
			apply(r.width, r.height);
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	return {
		get width() {
			return fixed?.() ?? width;
		},
		get height() {
			return height;
		},
		get measured() {
			return fixed?.() !== undefined || measured;
		}
	};
}
