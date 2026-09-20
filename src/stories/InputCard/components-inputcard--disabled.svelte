<script lang="ts">
	import InputCard from '$lib/components/InputCard/InputCard.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<!-- render: <InputCard disabled label="Disabled" {...restArgs} /> — the story args (label: 'Номер карты') win over the render defaults -->
	<InputCard disabled variant="primary" size="m" label="Номер карты" />
</DecorateStory>
