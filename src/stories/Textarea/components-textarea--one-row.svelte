<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';

	const autoHeight = { enabled: true, maxRows: 7 };
</script>

<div class="textarea-story">
	<TextArea size="m" variant="primary" label="Label" rows={1} {autoHeight} class="textarea-story__one-row" />
</div>
