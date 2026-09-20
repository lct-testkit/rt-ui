<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';
</script>

<div class="textarea-story">
	<!-- render: <TextArea hintPrefix="Hint text" label="Input with hint" {...args} /> — args (label: 'Label') win -->
	<TextArea hintPrefix="Hint text" size="m" variant="primary" label="Label" />
</div>
