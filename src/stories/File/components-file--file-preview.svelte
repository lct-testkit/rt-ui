<script lang="ts">
	// Port of stories/File: FilePreview (the preview is an external image, as in React)
	import File from '$lib/components/File/File.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	const preview = 'https://hips.hearstapps.com/hmg-prod/images/white-cat-breeds-blue-eyed-cat-67bcc893e8b39.jpg?crop=1xw:1xh;center,top';
</script>

<DecorateStory>
	<div style="display: flex; flex-direction: column; gap: 20px">
		<File size="xl" name="filename.jpg" fileSize={124124124} {preview} />
		<File compact name="filename.jpg" fileSize={124124124} {preview} />
	</div>
</DecorateStory>
