// Replacement for `react-cool-inview` (used by RowsProvider for the infinite scroll trigger): a Svelte action around an
// IntersectionObserver.
//
//   <div use:inView={{ onEnter: ({ unobserve }) => { unobserve(); loadMore(); } }}>
//
// Like react-cool-inview: `onEnter` fires when the element starts intersecting the viewport (also right after `observe` when it is
// already visible), `onLeave` when it stops; `unobserve()` stops observing that element. `enabled: false` observes nothing.

export interface InViewEvent {
	entry: IntersectionObserverEntry;
	unobserve: () => void;
}

export interface InViewOptions {
	enabled?: boolean;
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
	onEnter?: (event: InViewEvent) => void;
	onLeave?: (event: InViewEvent) => void;
}

export function inView(node: Element, options: InViewOptions = {}) {
	let current = options;
	let observer: IntersectionObserver | null = null;
	let inside = false;

	const unobserve = () => {
		observer?.disconnect();
		observer = null;
	};

	const observe = () => {
		unobserve();
		inside = false;
		if (current.enabled === false || typeof IntersectionObserver === 'undefined') return;
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !inside) {
						inside = true;
						current.onEnter?.({ entry, unobserve });
					} else if (!entry.isIntersecting && inside) {
						inside = false;
						current.onLeave?.({ entry, unobserve });
					}
				}
			},
			{ root: current.root ?? null, rootMargin: current.rootMargin ?? '0px', threshold: current.threshold ?? 0 }
		);
		observer.observe(node);
	};

	observe();

	return {
		update(next: InViewOptions = {}) {
			const restart = next.enabled !== current.enabled || next.root !== current.root || next.rootMargin !== current.rootMargin || next.threshold !== current.threshold;
			current = next;
			if (restart) observe();
		},
		destroy: unobserve
	};
}
