<script lang="ts">
	// Port of stories/File: Main (`File`). initialArgs: { moreActions: [], name: 'test_file.sql', size: 'm', fileSize: 1232442424, variant: 'primary' };
	// showAction / showFunctionButton / showMoreActions are unset (false) and the icon selects give `ICONS[undefined]` = undefined.
	import File from '$lib/components/File/File.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<File moreActions={[]} name="test_file.sql" size="m" fileSize={1232442424} variant="primary" />
</DecorateStory>
