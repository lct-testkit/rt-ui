<script lang="ts">
	import RadioButton from '$lib/components/RadioButton/RadioButton/RadioButton.svelte';
	import { RADIOBUTTON_SIZES } from '$lib/components/RadioButton/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(RADIOBUTTON_SIZES) as v}
		<RadioButton size={v} label={v} />
	{/each}
</ExamplesDecorator>
