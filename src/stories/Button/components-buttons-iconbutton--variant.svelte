<script lang="ts">
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import { VARIANT } from '$lib/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each VARIANT as v}<IconButton variant={v}>{#snippet icon()}<AddLarge />{/snippet}</IconButton>{/each}
</ExamplesDecorator>
