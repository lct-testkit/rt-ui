<script lang="ts">
	import Loader from '$lib/components/Loader/Loader.svelte';
	import { LOADER_VIEW } from '$lib/components/Loader/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each LOADER_VIEW as v}<Loader variant={v} />{/each}
</ExamplesDecorator>
