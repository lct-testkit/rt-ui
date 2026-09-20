<script lang="ts">
	// Port of packages/ui-kit/src/components/TextArea/components/TextAreaAutoSize.tsx
	//
	// Grows with its content (the height itself comes from the CSS grid trick of `.atmr-input--auto-size`, fed by the
	// `data-replicated-value` attribute of the container) and, when `autoHeight.maxRows` is set, limits the height to that many rows:
	//  * `--atmr-max-height` on the container + `max-height` on the <textarea> once the content reaches `maxRows` rows;
	//  * the `atmr-scroll-bar` class once the content is taller than `maxRows` rows.
	//
	// Differences to React: `ref` is a bindable prop that holds the <textarea>; the native `input` event handler of the
	// React `onInput` is `oninput` (a user `oninput` runs after the internal one).
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	export interface TextAreaAutoHeight {
		enabled?: boolean;
		/** Maximum number of rows before the textarea starts to scroll */
		maxRows?: number;
	}

	interface Props extends Omit<HTMLTextareaAttributes, 'value' | 'class'> {
		autoHeight?: boolean | TextAreaAutoHeight;
		value?: string;
		class?: string;
		ref?: HTMLTextAreaElement | null;
	}

	let { autoHeight, value, class: className, ref = $bindable(null), ...otherProps }: Props = $props();

	const objectHeight = $derived(typeof autoHeight === 'object' && autoHeight != null ? autoHeight : undefined);
	const limitRows = $derived(objectHeight ? objectHeight.maxRows || 0 : 0);
	const isMaxRowExist = $derived(!!objectHeight?.maxRows);

	let rowsCount = $state(0);
	let maxHeight = $state<number | undefined>(undefined);

	function calculateRows() {
		const el = ref;
		if (objectHeight && el && objectHeight.maxRows) {
			const lineHeight = getComputedStyle(el).getPropertyValue('line-height');
			const lineHeightNum = parseFloat(lineHeight) || 20;
			const currentScrollHeight = el.scrollHeight;
			const currentRowsCount = currentScrollHeight / lineHeightNum;
			rowsCount = currentRowsCount;
			if (limitRows > 0 && !maxHeight) {
				maxHeight = lineHeightNum * limitRows;
			}
		}
	}

	function handleInput(event: Event) {
		calculateRows();
		(otherProps.oninput as ((event: Event) => void) | null | undefined)?.(event);
	}

	// re-measure when the value (or the autoHeight option) changes
	$effect(() => {
		const height = autoHeight;
		const current = value;
		untrack(() => {
			if (height && current && current.length) {
				calculateRows();
			}
		});
	});

	const classes = $derived(clsx(className, { 'atmr-scroll-bar': isMaxRowExist ? rowsCount > limitRows : false }));

	// limit the height once the content reaches `maxRows` rows
	$effect(() => {
		const rows = rowsCount;
		const limit = limitRows;
		const height = maxHeight;
		const el = ref;
		const opts = objectHeight;
		if (el && el.parentNode && opts && opts.maxRows && height && limit > 0) {
			const container = el.parentNode as HTMLElement;
			const shouldLimitHeight = rows >= limit;
			if (shouldLimitHeight) {
				container.style.setProperty('--atmr-max-height', `${height}px`);
				el.style.maxHeight = `${height}px`;
			} else {
				container.style.setProperty('--atmr-max-height', 'unset');
				el.style.maxHeight = '';
			}
		}
	});

	const attrs = $derived({ value, class: classes, ...otherProps, oninput: handleInput });
</script>

<textarea bind:this={ref} {...attrs}></textarea>
