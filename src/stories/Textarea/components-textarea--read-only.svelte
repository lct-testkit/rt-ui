<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';
</script>

<div class="textarea-story">
	<!-- render: <TextArea readOnly label="Read only" defaultValue="Readonly value" {...args} /> — args (label: 'Label') win -->
	<TextArea readOnly defaultValue="Readonly value" size="m" variant="primary" label="Label" />
</div>
