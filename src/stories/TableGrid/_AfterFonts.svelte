<script lang="ts">
	// Story helper: renders its children once every declared web font face is loaded.
	//
	// WHY: a CLOSED `Select` / `DropdownMenu` keeps the inline `style` / `data-popper-placement` of the Popper instance that was created right
	// after mount, and Popper measures the trigger at that moment (position + width, e.g. `translate(841px, -244px); width: 160px`). With a
	// web font that is still loading the table is laid out with the fallback font first and re-flowed later, so the measured geometry is a
	// leftover of the fallback layout. The React reference (Storybook boots slowly, the font is loaded before the story mounts) shows the geometry
	// of the final layout; the playground mounts faster than the font arrives. Waiting for the fonts gives the same (final) geometry.
	// Used by the stories whose table contains a closed Select (pagination page size, inline select filters); no effect on the final DOM.
	// The reference states of these stories were captured with tools/snapshot_resized.py (a `resize` event re-measures the closed poppers, so the
	// reference shows the final layout too); a `resize` in harness.wait_ready() would make this helper unnecessary.
	import { onMount, type Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
	let ready = $state(false);

	onMount(() => {
		let cancelled = false;
		const faces = typeof document !== 'undefined' && document.fonts ? [...document.fonts] : [];
		Promise.all(faces.map((face) => face.load().catch(() => null))).then(() => {
			if (!cancelled) ready = true;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if ready}{@render children?.()}{/if}
