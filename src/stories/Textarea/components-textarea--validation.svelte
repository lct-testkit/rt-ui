<script lang="ts">
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import './styles.css';

	const validationRules = [
		{
			error: 'max lenght: 10',
			validate: (value: string) => console.log('validate', value.length) || value.length <= 10
		},
		{
			error: 'Поле обязательно для заоплнения',
			validate: (value: string) => console.log('validate', value.length) || value.length > 0
		}
	];
</script>

<div class="textarea-story">
	<TextArea size="m" variant="primary" label="Label" {validationRules} />
</div>
