// Runtime harness (not a size scenario): mount cost of N components and popup open/close cycles. Driven from runtime.py via window.bench.
import '@rt-ui/styles/themes/rtk_default_light.css';
import '@rt-ui/styles/base.css';
import '@rt-ui/styles/components.css';
import '@rt-ui/styles/fonts.css';
import { mount, unmount, flushSync, tick } from 'svelte';
import Many from './Many.svelte';
import Leak from './Leak.svelte';

const target = document.getElementById('app');
let inst = null;
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const until = async (cond, max = 100) => {
	for (let i = 0; i < max && !cond(); i++) await frame();
	return cond();
};

window.bench = {
	/** mount N instances synchronously, returns ms (mount + flushed effects) */
	mountMany(kind, n) {
		const t0 = performance.now();
		inst = mount(Many, { target, props: { kind, n } });
		flushSync();
		return performance.now() - t0;
	},
	/** mount + first paint (double rAF) in ms */
	async mountManyPainted(kind, n) {
		const t0 = performance.now();
		inst = mount(Many, { target, props: { kind, n } });
		flushSync();
		await frame();
		await frame();
		return performance.now() - t0;
	},
	unmountAll() {
		const t0 = performance.now();
		if (inst) unmount(inst);
		inst = null;
		flushSync();
		return performance.now() - t0;
	},
	leakInit(kind) {
		inst = mount(Leak, { target, props: { kind } });
		flushSync();
	},
	leakDestroy() {
		if (inst) unmount(inst);
		inst = null;
	},
	/** one open -> close cycle; resolves true when the popup really appeared and disappeared */
	async leakCycle(kind) {
		if (kind === 'control') {
			inst.setOpen(true);
			const shown = await until(() => document.querySelector('.leak-control'));
			inst.setOpen(false);
			const gone = await until(() => !document.querySelector('.leak-control'), 200);
			return shown && gone;
		}
		if (kind === 'modal') {
			inst.setOpen(true);
			const shown = await until(() => document.querySelector('.atmr-modal'));
			inst.setOpen(false);
			const gone = await until(() => !document.querySelector('.atmr-modal'), 200);
			return shown && gone;
		}
		// Popover / Select popups stay in the DOM when closed (as in React); "shown" is `data-show="true"` on the popup element
		const trigger = kind === 'popover' ? document.getElementById('leak-trigger') : document.querySelector('#leak-select .atmr-input__container');
		const popup = () => document.querySelector(kind === 'popover' ? '.atmr-popover' : '.atmr-dropdown-menu');
		const isShown = () => popup()?.getAttribute('data-show') === 'true';
		trigger.click();
		const shown = await until(isShown);
		document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
		document.body.click();
		const gone = await until(() => !isShown(), 200);
		return shown && gone;
	}
};
tick().then(() => performance.mark('bench-ready'));
