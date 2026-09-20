<script lang="ts" module>
	// Icons of the filter operators as snippets (DropdownMenu item `prefix` / Input `iconPrefix` take snippets, React passed elements).
	import Equals16 from '../../../../icons/16/editor/Equals16.svelte';
	import StartOfLine16 from '../../../../icons/16/editor/StartOfLine16.svelte';
	import MiddleOfLine16 from '../../../../icons/16/editor/MiddleOfLine16.svelte';
	import EndOfLine16 from '../../../../icons/16/editor/EndOfLine16.svelte';

	export { equalsIcon, startOfLineIcon, middleOfLineIcon, endOfLineIcon };
</script>

{#snippet equalsIcon()}<Equals16 />{/snippet}
{#snippet startOfLineIcon()}<StartOfLine16 />{/snippet}
{#snippet middleOfLineIcon()}<MiddleOfLine16 />{/snippet}
{#snippet endOfLineIcon()}<EndOfLine16 />{/snippet}
