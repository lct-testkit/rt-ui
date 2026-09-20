<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	const args = { size: 'l', required: true } as const;

	const error = 'Неверный email';
	const requiredError = 'Поле обязательно для заполнения';
	const requiredRule = {
		error: requiredError,
		validate: (value: string) => value.length
	};
	const validationRules: { error: string; validate: (value: string) => unknown }[] = [
		{
			error,
			validate: (value: string) =>
				(value === '' && !error) ||
				/^(?!.*\.\.)(?!.*\.@)(?!.*--)(?!.*__)(?!.*-@)(?!.*_@)(?=[a-z0-9][a-z0-9._@-]{5,255}$)[a-z0-9._-]{1,}@(?:[a-z0-9](?:[a-z0-9-_]{0,}[a-z0-9])?\.){1,}[a-z]{2,}$/i.test(value)
		}
	];
	if (args.required) {
		validationRules.push(requiredRule);
	}
</script>

<DecorateStory>
	<Input {...args} placeholder="Email" {validationRules} autocomplete="email" />
</DecorateStory>
