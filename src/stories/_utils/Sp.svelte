<script lang="ts">
	// JSX `{' '}` between text and elements = its OWN text node. Svelte merges "text {expr}" into ONE text node, and a merged
	// text run is shaped differently by Chrome (sub-pixel glyph offsets, ~1/64 px) than two separate nodes, which shows up as a few
	// differing pixels against the React reference. Rendering the space through a component keeps it a separate text node:
	//   Параметр<Sp /><Typography as="span">size</Typography><Sp />имеет 2 значения
</script>

{' '}
