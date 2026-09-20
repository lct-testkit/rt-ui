<script lang="ts">
	import './styles.css';
	import Input from '$lib/components/Input/Input.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<form class="stories-input-form" method="dialog">
		<div>
			<Input required label="Input required" name="inputFieldName" type="text" />
		</div>
		<Button type="submit" label="Submit" />
	</form>
</DecorateStory>
