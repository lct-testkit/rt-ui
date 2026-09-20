<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<Input clearable size="l" defaultValue="Useless text" label="Clearable" data-testid="focus" />
</DecorateStory>
