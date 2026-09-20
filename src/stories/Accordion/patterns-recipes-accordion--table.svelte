<script lang="ts">
	// Story: Patterns & Recipes/Accordion -> Table (Accordion.stories.tsx)
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Synchronization from '$lib/icons/24/action/Synchronization.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';

	const fields = [
		{ label: '№ заявки:', value: '1390000042253' },
		{ label: 'Статус заявки:', value: 'Заявка в работе' },
		{ label: 'Дата и время создания:', value: '25.05.2021 в 16:03' },
		{ label: 'Адрес подключения:', value: 'Санкт-Петербург Энергетиков 48 164' },
		{ label: 'Контактное лицо:', value: 'Константинопольский Константин Константинович' }
	];
</script>

{#snippet request()}
	<Accordion>
		<AccordionSummary px="atmr-spacing-3x" py="atmr-spacing-3x" cursor="pointer">
			{#snippet children({ isOpen })}
				<Box flex justifyContent="between" alignItems="center">
					<Box style={{ width: '50px' }}>
						<Box flex justifyContent="center" alignItems="center" borderRadius="atmr-border-radius-l" bg="atmr-status-05-container-default" style={{ width: '44px', height: '44px' }}>
							<Synchronization fill="var(--atmr-status-05-default)" />
						</Box>
					</Box>
					<Box flex flexDirection="column" justifyContent="between" style={{ width: '40%' }} px="atmr-spacing-4x">
						<Box py="atmr-spacing-1x">
							<Typography variant="body-m" strong>Подключение услуги</Typography>
						</Box>

						<Typography variant="description-l" style={{ opacity: '0.6' }}>24.04.2024 - № 1390000042253</Typography>
					</Box>
					<Box flex flexDirection="column" justifyContent="between" style={{ width: '60%' }} px="atmr-spacing-4x">
						<Box pb="atmr-spacing-2x">
							<Typography variant="description-l" style={{ opacity: 0.6 }}>Заявка в работе</Typography>
						</Box>
						<Box flex gapX="5px">
							<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-accent-default" />
							<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-accent-default" />
							<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-neutral-50" />
						</Box>
					</Box>
					<Box ml="atmr-spacing-4x" flex alignItems="center" bg="atmr-neutral-container-default" px="atmr-spacing-1x" py="atmr-spacing-1x" borderRadius="atmr-border-radius-m">
						<ChevronDown
							style={`fill: var(--atmr-fg-soft); transform: ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}; transition: transform var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-standard);`}
						/>
					</Box>
				</Box>
			{/snippet}
		</AccordionSummary>
		<AccordionDetails my="atmr-spacing-2x" mx="atmr-spacing-5x" style={{ paddingLeft: '50px' }}>
			<Box>
				{#each fields as field (field.label)}
					<Box flex py="atmr-spacing-0-5x">
						<Box style={{ width: '250px' }}>
							<Typography variant="body-s" style={{ opacity: '0.6' }}>{field.label}</Typography>
						</Box>
						<Box>
							<Typography variant="body-s">{field.value}</Typography>
						</Box>
					</Box>
				{/each}

				<Box mt="atmr-spacing-3x">
					<Button variant="secondary" size="s" colorScheme="neutral" label="Отменить заявку" />
				</Box>
			</Box>
		</AccordionDetails>
	</Accordion>
{/snippet}

<AccordionGroup borderRadius="atmr-border-radius-s" bg="atmr-bg-surface1" boxShadow="atmr-shadow-bottom-s" px="atmr-spacing-0-5x" py="atmr-spacing-1-5x" style={{ width: '800px' }}>
	{@render request()}
	{@render request()}
	{@render request()}
</AccordionGroup>
