<script lang="ts">
	// Story: Patterns & Recipes/Accordion -> DefaultOpen (Accordion.stories.tsx)
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';

	let contentAdded = $state(false);
</script>

{#snippet summary(isOpen: boolean)}
	<Box flex justifyContent="between" alignItems="center" style={{ width: '100%' }}>
		<Typography variant="body-m" style={{ fontWeight: 500 }}>Header</Typography>
		<Box
			ml="atmr-spacing-4x"
			flex
			alignItems="center"
			style={{
				transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
				transition: 'transform var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-standard)'
			}}
		>
			<ChevronDown style="fill: var(--atmr-fg-soft)" />
		</Box>
	</Box>
{/snippet}

<AccordionGroup flex flexDirection="column" gapY="10px" selectionMode="single">
	<Accordion bg="atmr-bg-surface1" px="atmr-spacing-2x" py="atmr-spacing-2x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" style={{ width: '350px' }} isOpen>
		<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer">
			{#snippet children({ isOpen })}{@render summary(isOpen)}{/snippet}
		</AccordionSummary>
		<AccordionDetails px="atmr-spacing-2x" py="atmr-spacing-2x" gapY="8px" flex flexDirection="column">
			<Typography variant="body-m" style={{ opacity: 0.6 }}>Контейнер аккордеона, который можно наполнять любым контентом</Typography>
			<Button onclick={() => (contentAdded = !contentAdded)} label="Добавить контент" />
			{#if contentAdded}
				<Typography variant="body-m" style={{ opacity: 0.6 }}>Контент добавлен</Typography>
			{/if}
		</AccordionDetails>
	</Accordion>

	{#each [0, 1] as i (i)}
		<Accordion bg="atmr-bg-surface1" px="atmr-spacing-2x" py="atmr-spacing-2x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" style={{ width: '350px' }}>
			<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer">
				{#snippet children({ isOpen })}{@render summary(isOpen)}{/snippet}
			</AccordionSummary>
			<AccordionDetails px="atmr-spacing-2x" py="atmr-spacing-2x">
				<Typography variant="body-m" style={{ opacity: 0.6 }}>Контейнер аккордеона, который можно наполнять любым контентом</Typography>
			</AccordionDetails>
		</Accordion>
	{/each}
</AccordionGroup>
