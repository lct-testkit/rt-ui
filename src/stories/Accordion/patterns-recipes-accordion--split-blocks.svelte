<script lang="ts">
	// Story: Patterns & Recipes/Accordion -> SplitBlocks (Accordion.stories.tsx)
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Download from '$lib/icons/24/action/Download.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
</script>

{#snippet block()}
	<Accordion
		borderRadius="atmr-border-radius-s"
		borderWidth="1px"
		borderStyle="solid"
		borderColor="atmr-border-soft"
		bg="atmr-bg-surface1"
		px="atmr-spacing-6x"
		py="atmr-spacing-5x"
	>
		<AccordionSummary cursor="pointer">
			{#snippet children({ isOpen })}
				<Box flex justifyContent="between" alignItems="center">
					<Box flex justifyContent="between" style={{ width: '100%' }}>
						<Typography variant="heading-h3">Добро пожаловать!</Typography>
						<Typography variant="body-s" style={{ opacity: 0.6 }}>Пройдено 2 из 3</Typography>
					</Box>

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
		</AccordionSummary>
		<AccordionDetails mt="atmr-spacing-6x">
			<Box>
				<Box bg="atmr-bg-surface3" borderRadius="atmr-border-radius-s" px="atmr-spacing-4x" py="atmr-spacing-4x" my="atmr-spacing-2x" flex alignItems="start" style={{ width: '100%' }}>
					<Box>
						<Checkbox />
					</Box>
					<Box pl="atmr-spacing-2x" py="atmr-spacing-0-5x" style={{ width: '100%' }}>
						<Typography variant="heading-h4">Просмотр welcome-видео и презентации</Typography>

						<Box flex alignItems="center" py="atmr-spacing-4x">
							<Box mr="atmr-spacing-2x">
								<Download />
							</Box>
							<Typography variant="body-s">Welcome-презентация[1].pdf</Typography>
						</Box>

						<FunctionButton label="Welcome-видео" />
					</Box>
				</Box>

				<Box bg="atmr-bg-surface3" borderRadius="atmr-border-radius-s" px="atmr-spacing-4x" py="atmr-spacing-3x" my="atmr-spacing-2x" flex alignItems="start" style={{ width: '100%' }}>
					<Box>
						<Checkbox />
					</Box>
					<Box pl="atmr-spacing-4x" py="atmr-spacing-0-5x" style={{ width: '100%' }}>
						<Typography variant="heading-h4">Просмотр welcome-видео и презентации</Typography>

						<Box flex alignItems="center" py="atmr-spacing-4x">
							<Box mr="atmr-spacing-2x">
								<Download />
							</Box>
							<Typography variant="body-s">Welcome-презентация[1].pdf</Typography>
						</Box>
					</Box>
				</Box>

				<Box bg="atmr-bg-surface3" borderRadius="atmr-border-radius-s" px="atmr-spacing-4x" py="atmr-spacing-3x" my="atmr-spacing-2x" flex alignItems="start" style={{ width: '100%' }}>
					<Box>
						<Checkbox />
					</Box>
					<Box pl="atmr-spacing-4x" py="atmr-spacing-0-5x" style={{ width: '100%' }}>
						<Typography variant="heading-h4">Просмотр welcome-видео и презентации</Typography>

						<Box mt="atmr-spacing-2x">
							<FunctionButton label="Welcome-видео" />
						</Box>
					</Box>
				</Box>
			</Box>
		</AccordionDetails>
	</Accordion>
{/snippet}

<AccordionGroup selectionMode="single" flex flexDirection="column" gapY="10px" style={{ width: '100%', minWidth: '440px' }}>
	{@render block()}
	{@render block()}
	{@render block()}
</AccordionGroup>
