<script lang="ts">
	import { INPUT_SIZES } from '$lib/components/Input/constants.js';
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import './styles.css';
</script>

<div class="textarea-story">
	<ExamplesDecorator>
		{#each Object.values(INPUT_SIZES) as v}
			<TextArea size={v} label="size {v}" />
		{/each}
	</ExamplesDecorator>
</div>
