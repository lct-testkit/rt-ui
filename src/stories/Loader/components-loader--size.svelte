<script lang="ts">
	import Loader from '$lib/components/Loader/Loader.svelte';
	import { LOADER_SIZES } from '$lib/components/Loader/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each LOADER_SIZES as v}<Loader size={v} />{/each}
</ExamplesDecorator>
