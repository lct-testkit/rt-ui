<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';
</script>

<div class="textarea-story">
	<!-- render: <TextArea disabled label="Disabled" {...args} /> — the story args (label: 'Label') win over the render defaults -->
	<TextArea disabled size="m" variant="primary" label="Label" />
</div>
