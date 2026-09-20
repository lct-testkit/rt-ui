<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	let error = $state('Error text 1');
</script>

<DecorateStory>
	<Input label="Dynamically change Error" {error} onFocus={() => (error = 'Error text 2')} onBlur={() => (error = 'Error text 1')} />
</DecorateStory>
