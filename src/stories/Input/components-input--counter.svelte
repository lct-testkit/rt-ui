<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';

	let value = $state('');
	let valueTwo = $state('');
	const maxLetters = 7;
	const validationRules = [
		{
			error: `Максимум ${maxLetters} символов`,
			validate: (inputValue: string) => inputValue?.length <= maxLetters
		}
	];
</script>

<DecorateStory>
	<ExamplesDecorator>
		<Input
			maxlength={maxLetters}
			{value}
			onChange={(e) => (value = e.target.value)}
			hintSuffix={`${value.length}/${maxLetters}`}
			style="min-width: 220px"
		/>
		<Input
			label="Counter with error"
			{validationRules}
			value={valueTwo}
			onChange={(e) => (valueTwo = e.target.value)}
			style="min-width: 220px"
		>
			{#snippet hintSuffix()}
				<!-- React renders `{n}/{max}` as three text nodes; Svelte would merge them, so the "/" goes through a snippet -->
				{#snippet slash()}/{/snippet}
				<span style:color={valueTwo.length > maxLetters ? 'var(--atmr-error-default)' : 'inherit'}>{valueTwo.length}{@render slash()}{maxLetters}</span>
			{/snippet}
		</Input>
	</ExamplesDecorator>
</DecorateStory>
