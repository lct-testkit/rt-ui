<script lang="ts">
	// Port of stories/File: FileFunctionButton (`functionButtonIcon={<Download />}` without a handler: the button is not rendered, as in React)
	import File from '$lib/components/File/File.svelte';
	import Download from '$lib/icons/24/action/Download.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

{#snippet download()}<Download />{/snippet}

<DecorateStory>
	<div style="display: flex; flex-direction: column; gap: 20px; min-width: 280px">
		<File size="m" name="filename.jpg" fileSize={124124124} functionButtonIcon={download} />
		<File size="xl" name="filename.jpg" fileSize={124124124} functionButtonIcon={download} />
	</div>
</DecorateStory>
