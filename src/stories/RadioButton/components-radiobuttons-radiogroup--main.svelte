<script lang="ts">
	import RadioButton from '$lib/components/RadioButton/RadioButton/RadioButton.svelte';
	import RadioGroup from '$lib/components/RadioButton/RadioGroup/RadioGroup.svelte';
</script>

<RadioGroup value="rb-1">
	<RadioButton name="rb-1" value="rb-1" label="В Личный кабинет" />
	<RadioButton name="rb-2" value="rb-2" disabled label="На электронную почту" />
	<RadioButton name="rb-3" value="rb-3" label="На почтовый адрес" />
</RadioGroup>
