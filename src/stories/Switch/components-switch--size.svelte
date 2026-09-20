<script lang="ts">
	import Switch from '$lib/components/Switch/Switch.svelte';
	import { SWITCH_SIZES } from '$lib/components/Switch/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(SWITCH_SIZES) as v (v)}
		<Switch label={`Size ${v}`} size={v} id={`switch-${v}`} />
	{/each}
</ExamplesDecorator>
