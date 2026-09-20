<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// The chevron of an accordion header in the /ext demo. The Accordion component draws no chevron: it is part of the header the CONSUMER renders (the
	// original stories rotate it with an inline CSS `transition`). Off (the default): exactly that. With motion on the angle follows the open state with
	// a Svelte Tween / Spring (`useMotionValue`), no CSS transition.
	import Box from '$lib/components/Box/Box.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import { useMotion, useMotionValue, type MotionProp } from '$lib/ext/motion.svelte.js';

	let { open, motion }: { open: boolean; motion?: MotionProp } = $props();

	const m = useMotion(() => motion, 'accordion');
	const angle = useMotionValue(
		() => (open ? 180 : 0),
		() => m.config
	);
</script>

<Box
	ml="atmr-spacing-4x"
	flex
	alignItems="center"
	data-testid="acc-chevron"
	style={m.enabled
		? { transform: `rotate(${angle.current}deg)` }
		: { transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-standard)' }}
>
	<ChevronDown style="fill: var(--atmr-fg-soft)" />
</Box>
