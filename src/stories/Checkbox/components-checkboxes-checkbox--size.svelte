<script lang="ts">
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import { CHECKBOX_SIZES } from '$lib/components/Checkbox/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(CHECKBOX_SIZES) as v}
		<Checkbox size={v} label={v} defaultChecked />
	{/each}
</ExamplesDecorator>
