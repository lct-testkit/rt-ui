<script lang="ts">
	// Port of stories/File: FileCompact
	import File from '$lib/components/File/File.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<div style="display: flex; gap: 20px">
		<File compact name="filename.jpg" fileSize={124124124} />
		<File compact name="filename.jpg" fileSize={124124124} description="description" />
		<File compact name="filename.jpg" fileSize={124124124} loading />
		<File compact name="filename.jpg" fileSize={124124124} error="error" />
	</div>
</DecorateStory>
