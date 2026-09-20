<script lang="ts">
	// Port of stories/File: FileCustomIcon
	import File from '$lib/components/File/File.svelte';
	import BlockAdd from '$lib/icons/24/action/BlockAdd.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

{#snippet orangeIcon()}<BlockAdd fill="rgba(255, 79, 18, 1)" />{/snippet}
{#snippet whiteIcon()}<BlockAdd fill="white" />{/snippet}

<DecorateStory>
	<div style="display: flex; flex-direction: column; gap: 20px; min-width: 280px">
		<File size="xl" name="filename.sql" fileSize={124124124} hideIconBackground />
		<File size="xl" name="filename.sql" fileSize={124124124} />
		<File size="xl" name="filename.png" fileSize={124124124} colorIconBackground="lightgrey" hideIconBackground icon={orangeIcon} />
		<File size="xl" name="filename.png" fileSize={124124124} colorIconBackground="rgba(255, 114, 65, 1)" icon={whiteIcon} />
		<File
			size="xl"
			name="filename.png"
			fileSize={124124124}
			colorIconBackground="lightgrey"
			preview="https://hips.hearstapps.com/hmg-prod/images/white-cat-breeds-blue-eyed-cat-67bcc893e8b39.jpg?crop=1xw:1xh;center,top"
		/>
	</div>
</DecorateStory>
