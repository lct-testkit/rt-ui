<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';

	let value = $state('');
	const maxLetters = 25;

	function handleChange(e: Event & { target: HTMLTextAreaElement }) {
		if (e.target.value.length > maxLetters) {
			return;
		}
		value = e.target.value;
	}
</script>

<div class="textarea-story">
	<TextArea hintSuffix={`${value.length}/${maxLetters}`} {value} onChange={handleChange} label="Label" />
</div>
