<script lang="ts">
	// Port of stories/DropdownMenu CustomMenu (renderDropdownMenu, footerSlot) with the height:300px decorator.
	// React's `checkIcon: <CheckLarge />` arg goes through `checkIcon.toString()` -> `ICONS_DROPDOWN_MENU['[object Object]']`,
	// i.e. undefined: no check icon is rendered.
	import './_styles.css';
	import './_placements.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import RenderDropdownMenu from './_RenderDropdownMenu.svelte';
	import { OPTIONS_CUSTOM } from './_options.js';
</script>

<div style="height: 300px;">
	<RenderDropdownMenu size="m" variant="primary" items={OPTIONS_CUSTOM} useInPortal={false} class="--stories-custom">
		{#snippet footerSlot(close)}
			<Button onclick={close} label="Закрыть" variant="secondary" size="l" colorScheme="neutral" class="closeButton-story" />
		{/snippet}
	</RenderDropdownMenu>
</div>
