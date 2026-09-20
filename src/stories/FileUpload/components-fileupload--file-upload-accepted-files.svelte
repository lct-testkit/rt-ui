<script lang="ts">
	// Port of stories/FileUpload: FileUploadAcceptedFiles (only `.jpg` is accepted: `accept="image/jpg,.jpg"` on the input)
	import FileUpload, { type UploadFile } from '$lib/components/FileUpload/FileUpload.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	let uploadItems = $state.raw<UploadFile[]>([]);
</script>

<DecorateStory>
	<div style="width: 380px">
		<Typography as="p" variant="body-m">Только картинки с расширением .jpg</Typography>
		<FileUpload accept={{ 'image/jpg': ['.jpg'] }} value={uploadItems} onChange={(i) => (uploadItems = i)} />
	</div>
</DecorateStory>
