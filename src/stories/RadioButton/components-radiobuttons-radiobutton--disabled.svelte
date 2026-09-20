<script lang="ts">
	import RadioButton from '$lib/components/RadioButton/RadioButton/RadioButton.svelte';
	import { RADIOBUTTON_VARIANTS } from '$lib/components/RadioButton/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(RADIOBUTTON_VARIANTS) as v}
		<RadioButton disabled variant={v} label={`Disabled ${v}`} />
	{/each}
</ExamplesDecorator>
