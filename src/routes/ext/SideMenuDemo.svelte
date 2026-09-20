<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the SideMenu motion (src/lib/ext/sideMenuMotion.svelte.ts + collapseMotion.svelte.ts). Every component is the ORIGINAL SideMenu family.
	// 'Выкл' = the original (two classes, the width follows through a CSS `transition`, the labels are rendered / removed at once). 'Svelte' = one Svelte Tween
	// (or Spring) drives the width of the panel and the opacity of the labels: they come in when there is room for them and go out BEFORE the panel shrinks
	// (the closed state is rendered after the move); nested groups (SideMenuCollapse) and the expand block (SideMenuExpandContent) open with a Tween /
	// Spring height + fade. The base layer `.rt-base` (label wrapping fix) stays as it is. The last menus override the mode with the `motion` prop.
	import Typography from '$lib/components/Typography/Typography.svelte';
	import LocalMode from './LocalMode.svelte';
	import SideMenuDemoMenu from './SideMenuDemoMenu.svelte';
</script>

<LocalMode param="sm" id="sm">
	<div class="grid">
		<div class="cell" data-testid="sm-cell-main">
			<Typography variant="body-s" strong as="span">SideMenu</Typography>
			<SideMenuDemoMenu id="sm-main" />
		</div>
		<div class="cell" data-testid="sm-cell-off">
			<Typography variant="body-s" strong as="span">{'motion={false}'}</Typography>
			<SideMenuDemoMenu id="sm-off" motion={false} />
		</div>
		<div class="cell" data-testid="sm-cell-spring">
			<Typography variant="body-s" strong as="span">{'motion="spring"'}</Typography>
			<SideMenuDemoMenu id="sm-spring" motion="spring" />
		</div>
	</div>
</LocalMode>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--atmr-spacing-3x);
		align-items: start;
	}
	.cell {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
</style>
