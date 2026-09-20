<script lang="ts">
	// Port of stories/File: FileSizes
	import File from '$lib/components/File/File.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<div style="display: flex; flex-direction: column; gap: 20px">
		<div style="display: flex; flex-direction: column; gap: 10px">
			<File size="m" name="filename.jpg" fileSize={124124124} />
			<File size="m" name="filename.jpg" fileSize={124124124} description="description" />
			<File size="m" name="filename.jpg" fileSize={124124124} loading />
			<File size="m" name="filename.jpg" fileSize={124124124} error="error" />
		</div>
		<div style="display: flex; flex-direction: column; gap: 10px">
			<File size="xl" name="filename.jpg" fileSize={124124124} />
			<File size="xl" name="filename.jpg" fileSize={124124124} description="description" />
			<File size="xl" name="filename.jpg" fileSize={124124124} loading />
			<File size="xl" name="filename.jpg" fileSize={124124124} error="error" />
		</div>
	</div>
</DecorateStory>
