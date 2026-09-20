<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

<DecorateStory>
	<div style="margin-bottom: 20px">
		<Input autocomplete="given-name" label="First Name" name="FirstName" type="text" />
	</div>
	<Input autocomplete="family-name" label="Last Name" name="LastName" type="text" />
</DecorateStory>
