<script lang="ts">
	// One JSX text child = its OWN text node (`activeDate: {expr},` in React gives three nodes, Svelte merges them into one).
	// The canonical DOM keeps text nodes separate, so mixed text / expression runs are written as `<T text="activeDate: " /><T text={x} /><T text="," />`.
	let { text }: { text: string } = $props();
</script>

{text}
