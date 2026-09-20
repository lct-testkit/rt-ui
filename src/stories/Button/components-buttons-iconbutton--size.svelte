<script lang="ts">
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import { SIZES } from '$lib/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each SIZES as v}<IconButton size={v}>{#snippet icon()}<AddLarge />{/snippet}</IconButton>{/each}
</ExamplesDecorator>
