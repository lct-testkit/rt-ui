<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<Input readOnly label="Read only" defaultValue="Readonly value" />
</DecorateStory>
