// Port of react-virtualized 9.22.6 `vendor/detectElementResize` (Chrome path): detects the size change of an element without a
// ResizeObserver. It appends `<div class="resize-triggers"><div class="expand-trigger"><div></div></div><div class="contract-trigger"></div></div>`
// to the element (and makes a `position: static` element `position: relative`), which the AutoSizer of react-virtualized does to its
// parent - that DOM is part of the reference, so it is reproduced exactly.
//
//   const detect = createDetectElementResize();
//   detect.addResizeListener(parent, onResize);   // ... detect.removeResizeListener(parent, onResize);

type ResizeListener = (event?: Event) => void;

interface ResizeElement extends HTMLElement {
	__resizeTriggers__?: (HTMLElement & { __animationListener__?: ((e: AnimationEvent) => void) | null }) | boolean;
	__resizeLast__?: { width?: number; height?: number };
	__resizeListeners__?: ResizeListener[];
	__resizeRAF__?: number;
}

const ANIMATION_NAME = 'resizeanim';

export function createDetectElementResize(hostWindow: Window = window) {
	const requestFrame = (fn: () => void): number => hostWindow.requestAnimationFrame(fn);
	const cancelFrame = (id: number): void => hostWindow.cancelAnimationFrame(id);

	const triggersOf = (element: ResizeElement) => element.__resizeTriggers__ as HTMLElement & { __animationListener__?: ((e: AnimationEvent) => void) | null };

	const resetTriggers = (element: ResizeElement): void => {
		const triggers = triggersOf(element);
		const expand = triggers.firstElementChild as HTMLElement;
		const contract = triggers.lastElementChild as HTMLElement;
		const expandChild = expand.firstElementChild as HTMLElement;
		contract.scrollLeft = contract.scrollWidth;
		contract.scrollTop = contract.scrollHeight;
		expandChild.style.width = expand.offsetWidth + 1 + 'px';
		expandChild.style.height = expand.offsetHeight + 1 + 'px';
		expand.scrollLeft = expand.scrollWidth;
		expand.scrollTop = expand.scrollHeight;
	};

	const checkTriggers = (element: ResizeElement): boolean =>
		element.offsetWidth != element.__resizeLast__!.width || element.offsetHeight != element.__resizeLast__!.height;

	function scrollListener(this: ResizeElement, e: Event): void {
		const target = e.target as HTMLElement;
		if (target.className && typeof target.className.indexOf === 'function' && target.className.indexOf('contract-trigger') < 0 && target.className.indexOf('expand-trigger') < 0) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const element = this;
		resetTriggers(this);
		if (this.__resizeRAF__) {
			cancelFrame(this.__resizeRAF__);
		}
		this.__resizeRAF__ = requestFrame(() => {
			if (checkTriggers(element)) {
				element.__resizeLast__!.width = element.offsetWidth;
				element.__resizeLast__!.height = element.offsetHeight;
				element.__resizeListeners__!.forEach((fn) => {
					fn.call(element, e);
				});
			}
		});
	}

	const createStyles = (doc: Document): void => {
		if (!doc.getElementById('detectElementResize')) {
			const css =
				'@keyframes ' +
				ANIMATION_NAME +
				' { from { opacity: 0; } to { opacity: 0; } } ' +
				'.resize-triggers { animation: 1ms ' +
				ANIMATION_NAME +
				'; visibility: hidden; opacity: 0; } ' +
				'.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }';
			const head = doc.head || doc.getElementsByTagName('head')[0];
			const style = doc.createElement('style');
			style.id = 'detectElementResize';
			style.appendChild(doc.createTextNode(css));
			head.appendChild(style);
		}
	};

	const addResizeListener = (el: HTMLElement, fn: ResizeListener): void => {
		const element = el as ResizeElement;
		if (!element.__resizeTriggers__) {
			const doc = element.ownerDocument;
			const elementStyle = hostWindow.getComputedStyle(element);
			if (elementStyle && elementStyle.position == 'static') {
				element.style.position = 'relative';
			}
			createStyles(doc);
			element.__resizeLast__ = {};
			element.__resizeListeners__ = [];
			const triggers = doc.createElement('div') as HTMLElement & { __animationListener__?: ((e: AnimationEvent) => void) | null };
			element.__resizeTriggers__ = triggers;
			triggers.className = 'resize-triggers';
			const expandTrigger = doc.createElement('div');
			expandTrigger.className = 'expand-trigger';
			expandTrigger.appendChild(doc.createElement('div'));
			const contractTrigger = doc.createElement('div');
			contractTrigger.className = 'contract-trigger';
			triggers.appendChild(expandTrigger);
			triggers.appendChild(contractTrigger);
			element.appendChild(triggers);
			resetTriggers(element);
			element.addEventListener('scroll', scrollListener, true);
			triggers.__animationListener__ = (e: AnimationEvent) => {
				if (e.animationName == ANIMATION_NAME) {
					resetTriggers(element);
				}
			};
			triggers.addEventListener('animationstart', triggers.__animationListener__ as EventListener);
		}
		element.__resizeListeners__!.push(fn);
	};

	const removeResizeListener = (el: HTMLElement, fn: ResizeListener): void => {
		const element = el as ResizeElement;
		const listeners = element.__resizeListeners__;
		if (!listeners) return;
		listeners.splice(listeners.indexOf(fn), 1);
		if (!listeners.length) {
			element.removeEventListener('scroll', scrollListener, true);
			const triggers = triggersOf(element);
			if (triggers.__animationListener__) {
				triggers.removeEventListener('animationstart', triggers.__animationListener__ as EventListener);
				triggers.__animationListener__ = null;
			}
			try {
				element.__resizeTriggers__ = !element.removeChild(triggers);
			} catch {
				// the trigger element is already gone
			}
		}
	};

	return { addResizeListener, removeResizeListener };
}
