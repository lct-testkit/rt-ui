<script lang="ts">
	// Port of TableGrid/modules/footer-area/components/FooterArea.tsx: the area under the rows (`renders.footer` + `renders.actionBar`).
	// The action bar is shown only while at least one row is selected (the selection module), the area is sticky when
	// `footerSticky` or while the action bar is shown. Pagination lives in the footer slot (`renders.footer`).
	import clsx from 'clsx';
	import { tableSlide, useTableMotion } from '../../../../ext/tableMotion.svelte.js';
	import Slot from '../../../../internal/Slot.svelte';
	import type { Content } from '../../../../internal/types.js';
	import { useSelection } from '../selection/selection.svelte.js';

	let { footerSticky = false, footerRender, renderActionBar }: { footerSticky?: boolean; footerRender?: Content; renderActionBar?: Content } = $props();

	const selection = useSelection();
	// [ext, not in original] `transition:tableSlide` slides the action bar in / out (zero-length unless `motion` is on for the table). With a footer the bar's own
	// container is the block that appears; without one the whole footer area appears with the bar, so the transition sits on the area (the container inside it is
	// created together with it, and a transition only runs for the block that is toggled).
	const motion = useTableMotion();
	const OFF = { enabled: false };
	const areaMotion = () => (motion && !footerRender ? motion.slide('actionBar') : OFF);
	const barMotion = () => (motion && footerRender ? motion.slide('actionBar') : OFF);
	const showActionBar = $derived(renderActionBar !== undefined && renderActionBar !== null && selection.selectedRows.length > 0);
	const isSticky = $derived(footerSticky || showActionBar);
</script>

{#if showActionBar || footerRender}
	<div class={clsx('atmr-tablegrid__footer-area', { 'atmr-tablegrid__footer-area--sticky': isSticky })} transition:tableSlide={areaMotion()}>
		{#if showActionBar}
			<div class="atmr-tablegrid__actionbar__container" transition:tableSlide={barMotion()}><Slot content={renderActionBar} /></div>
		{/if}
		{#if footerRender}
			<div class="atmr-tablegrid__footer__container"><Slot content={footerRender} /></div>
		{/if}
	</div>
{/if}
