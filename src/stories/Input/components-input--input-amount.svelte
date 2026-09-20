<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import NumberFormatInput from './NumberFormatInput.svelte';

	// Правила трансформации значения в input
	const transformationRule = {
		transform: (inputValue = '') => (inputValue === ',' ? '0,' : inputValue),
		onBlurTransform: (inputValue: string) => {
			if (inputValue.endsWith(',')) {
				return `${inputValue}00`;
			}

			const decimalPart = inputValue.split(',')[1];
			if (decimalPart && decimalPart.length === 1) return `${inputValue}0`;

			return inputValue;
		}
	};
</script>

<DecorateStory>
	<Typography variant="body-l" style={{ marginBottom: '20px' }}>По умолчания дизайн-система Атомаро не поставляет компонет <b>InputAmount</b> из пакета. Ниже показан пример реализации с помощью компонента Input и библиотеки "react-number-format"</Typography>
	<Input size="m" variant="primary" label="Label" inputControl={NumberFormatInput} {transformationRule} />
</DecorateStory>
