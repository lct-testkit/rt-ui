<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';
</script>

<div class="textarea-story">
	<!-- render: <TextArea error="Error text" label="Input with error" {...args} /> — args (label: 'Label') win -->
	<TextArea error="Error text" size="m" variant="primary" label="Label" />
</div>
