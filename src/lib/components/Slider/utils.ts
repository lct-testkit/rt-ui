// Port of packages/ui-kit/src/components/Slider/utils.ts

export function getOffset(e: MouseEvent | TouchEvent, el: HTMLElement): number {
	const rect = el.getBoundingClientRect();
	const touch = 'touches' in e ? e.touches[0] : e;
	return touch.clientX - (rect.left + rect.width / 2);
}

export function getPosition(e: MouseEvent | TouchEvent, position: 'clientX' | 'clientY' = 'clientX'): number {
	if ('touches' in e && e.touches.length) return e.touches[0][position];
	else if ('changedTouches' in e && e.changedTouches.length) return e.changedTouches[0][position];
	else return (e as MouseEvent)[position];
}

export function getDecimals(value: number | string): number {
	const trimmedStr = value.toString().trim();
	return trimmedStr.includes('.') ? trimmedStr.length - trimmedStr.indexOf('.') - 1 : 0;
}

export function clamp(value: number, min = 0, max = 1): number {
	return Math.max(min, Math.min(max, value));
}
