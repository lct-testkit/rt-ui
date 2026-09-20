<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// The header content of the /ext demo's side menu: logo + title. Unlike the story's RTKHeaderContent it reads the state of the MENU (`useSideMenu()`), so
	// the title stays until the panel has shrunk (the extension delays the closed state while it closes).
	import { useSideMenu } from '$lib/components/SideMenu/context.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const menu = useSideMenu();
</script>

<div class="header-container">
	<div class="header-icon-container">
		<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="32" height="32" />
	</div>
	{#if menu.isMenuOpen}
		<div>
			<Typography variant="body-s" strong>Ростелеком</Typography>
			<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>Технологии возможностей</Typography>
		</div>
	{/if}
</div>
