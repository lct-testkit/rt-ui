// React runs the state updates caused by `mouseenter` / `mouseleave` (continuous events) in a separate task (Scheduler -> MessageChannel),
// i.e. AFTER the frame that already painted the `:hover` change, whereas Svelte flushes them in the microtask right after the handler,
// inside the same frame. That changes how Chrome groups the paint invalidations (one bounding box instead of two rects), which re-rasterizes
// unrelated pixels (anti-aliasing of the header chevrons) differently. `scheduleContinuous` reproduces the React timing: the callbacks queued
// in the same tick run together in ONE task (React batches them into one render, e.g. the `mouseleave` of the old cell + `mouseenter` of the new one).
let queue: Array<() => void> = [];
let channel: MessageChannel | undefined;

const flush = (): void => {
	const callbacks = queue;
	queue = [];
	for (const callback of callbacks) callback();
};

export const scheduleContinuous = (callback: () => void): void => {
	queue.push(callback);
	if (queue.length > 1) return;
	if (typeof MessageChannel === 'undefined') {
		setTimeout(flush, 0);
		return;
	}
	if (!channel) {
		channel = new MessageChannel();
		channel.port1.onmessage = flush;
	}
	channel.port2.postMessage(null);
};
