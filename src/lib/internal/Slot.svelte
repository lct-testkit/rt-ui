<script lang="ts">
	// Renders a React-style "node" prop: a Snippet, a string/number, or nothing.
	// (React `label && <span>{label}</span>` <-> `{#if label}<span><Slot content={label} /></span>{/if}`)
	import type { Content } from './types.js';

	let { content }: { content: Content } = $props();
</script>

{#if typeof content === 'function'}{@render content()}{:else if content !== null && content !== undefined && content !== false}{content}{/if}
