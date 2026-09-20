<script lang="ts">
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import { CLOSE_BUTTON_SIZES } from '$lib/components/Button/CloseButton/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each CLOSE_BUTTON_SIZES as v}<CloseButton size={v} />{/each}
</ExamplesDecorator>
