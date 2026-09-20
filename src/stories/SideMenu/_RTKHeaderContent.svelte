<script lang="ts">
	// Port of stories-app/src/stories/SideMenu/RTKHeaderContent.tsx (logo + title of the side menu header)
	import Typography from '$lib/components/Typography/Typography.svelte';

	let {
		menuIsOpen,
		header = 'Ростелеком',
		subHeader = 'Технологии возможностей'
	}: { menuIsOpen?: boolean; header?: string; subHeader?: string } = $props();
</script>

<div class="header-container">
	<div class="header-icon-container">
		<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="32" height="32" />
	</div>
	{#if menuIsOpen}
		<div>
			<Typography variant="body-s" strong>{header}</Typography>
			<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>{subHeader}</Typography>
		</div>
	{/if}
</div>
