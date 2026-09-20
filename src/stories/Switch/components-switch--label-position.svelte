<script lang="ts">
	import Switch from '$lib/components/Switch/Switch.svelte';
	import { SWITCH_LABEL_POSITION } from '$lib/components/Switch/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(SWITCH_LABEL_POSITION) as v (v)}
		<Switch label={`Label ${v}`} labelPosition={v} id={`switch-${v}`} />
	{/each}
</ExamplesDecorator>
