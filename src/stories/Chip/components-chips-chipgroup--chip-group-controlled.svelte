<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChipGroup, { type ChipType } from '$lib/components/Chip/ChipGroup/ChipGroup.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import './styles.css';

	// React `storyTextElements(name, amount)` returns ready-made elements; here every element is a snippet
	// (the top-level `textElement` snippet bound to its arguments; compiled snippets take their arguments as getters).
	const renderTextElement = textElement as unknown as (anchor: Comment, name: () => string, index: () => number) => void;
	const storyTextElements = (elementsName: string, elementsAmount: number): Snippet[] =>
		Array(elementsAmount)
			.fill('')
			.map((_, i) => ((anchor: Comment) => renderTextElement(anchor, () => elementsName, () => i + 1)) as unknown as Snippet);

	const seoChip: ChipType = {
		key: 'seo',
		label: 'Сео',
		contentItems: storyTextElements('Сео', 3)
	};

	const items: ChipType[] = [
		{ key: 'design', label: 'Дизайнеры', contentItems: storyTextElements('Дизайнер', 2) },
		{ key: 'analitics', label: 'Аналитики', contentItems: storyTextElements('Аналитик', 3) },
		{ key: 'development', label: 'Разработчики', contentItems: storyTextElements('Разработчик', 1) },
		{ key: 'management', label: 'Менеджеры', contentItems: storyTextElements('Менеджер', 1) },
		seoChip
	];

	const itemsContainerProps = {
		style: {
			display: 'flex',
			flexWrap: 'wrap',
			padding: 'var(--atmr-spacing-5x)',
			marginTop: 'var(--atmr-spacing-5x)',
			border: '1px solid var(--atmr-border-default)',
			borderRadius: 'var(--atmr-border-radius-m)',
			color: 'var(--atmr-fg-default)'
		}
	};

	let chipsArray = $state.raw<ChipType[]>(items);
	let selected = $state.raw<string[]>([]);
	let disabled = $state.raw<string[]>([]);

	const handleChange = (id: string) => {
		const newSelected = [...selected];
		const indexValue = newSelected.findIndex((key) => id === key);
		if (indexValue === -1) {
			newSelected.push(id);
		} else {
			newSelected.splice(indexValue, 1);
		}
		selected = newSelected;
	};

	const toggleDisabled = () => {
		disabled = disabled.length ? [] : ['development'];
	};

	const toggleSeo = () => {
		chipsArray = chipsArray.find((i) => i.key === 'seo') ? chipsArray.filter((i) => i.key !== 'seo') : [...chipsArray, seoChip];
	};
</script>

{#snippet textElement(elementsName: string, elIndex: number)}
	<div class="text-container">
		<!-- React renders `{elementsName} {elIndex}` as three separate text nodes -->
		<Typography variant="body-l">{#each [elementsName, ' ', elIndex] as part}{part}{/each}</Typography>
	</div>
{/snippet}

<div class="container-buttons">
	<Typography variant="heading-h2">Контролируемый компонент</Typography>
	<FunctionButton onclick={toggleDisabled} label="Disable/Enable Разработчики" />
	<FunctionButton onclick={toggleSeo} label="Remove/Add Сео" />
</div>
<ChipGroup items={chipsArray} {itemsContainerProps} selectedItems={selected} disabledItems={disabled} onChange={handleChange} />
