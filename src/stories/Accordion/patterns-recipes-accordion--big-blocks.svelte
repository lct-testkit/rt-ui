<script lang="ts">
	// Story: Patterns & Recipes/Accordion -> BigBlocks (Accordion.stories.tsx)
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
</script>

{#snippet chevron(isOpen: boolean)}
	<Box
		flex
		alignItems="center"
		style={{
			transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
			transition: 'transform var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-standard)'
		}}
	>
		<ChevronDown style="fill: var(--atmr-fg-soft)" />
	</Box>
{/snippet}

{#snippet conditions()}
	<Box bg="atmr-bg-surface3" py="atmr-spacing-6x" px="atmr-spacing-6x" style={{ width: '350px' }}>
		<Typography variant="heading-h4">Условия</Typography>
		<Typography variant="body-s">Общая сумма в чеке может превышать лимит. На руки ты получишь введённую сумму за вычетом 13%, но не больше лимита.</Typography>
		<Box pt="atmr-spacing-3x" pb="atmr-spacing-5x">
			<Input label="Сумма из чека" hintPrefix="Твой лимит 19 540 ₽" style={{ width: '100%' }} />
		</Box>
		<Button label="Отправить" style="width: 100%" />
	</Box>
{/snippet}

<AccordionGroup
	borderRadius="atmr-border-radius-s"
	bg="atmr-bg-surface1"
	boxShadow="atmr-shadow-bottom-s"
	px="atmr-spacing-0-5x"
	py="atmr-spacing-1-5x"
	style={{ maxWidth: '800px', minWidth: '450px' }}
>
	<Accordion borderColor="atmr-border-muted" borderStyle="solid" bottomBorderWidth="1px">
		<AccordionSummary px="atmr-spacing-8x" py="atmr-spacing-6x" cursor="pointer">
			{#snippet children({ isOpen })}
				<Box flex justifyContent="between" alignItems="start">
					<Box style={{ width: '50px' }}>
						<Switch />
					</Box>
					<Box flex flexDirection="column" justifyContent="between" style={{ width: '100%' }} px="atmr-spacing-3x">
						<Box py="atmr-spacing-1x">
							<Typography variant="heading-h3">Помощь ко дню рождения</Typography>
						</Box>

						<Typography variant="body-m" style={{ opacity: 0.6 }}
							>Празднуйте свой особенный день с&nbsp;дополнительной финансовой поддержкой от&nbsp;нашего кафетерия-плана льгот. Относится к&nbsp;обязательному двухнедельному
							отпуску.</Typography
						>
					</Box>

					{@render chevron(isOpen)}
				</Box>
			{/snippet}
		</AccordionSummary>
		<AccordionDetails mb="atmr-spacing-5x" mx="atmr-spacing-5x" style={{ paddingLeft: '68px' }}>
			{@render conditions()}
		</AccordionDetails>
	</Accordion>

	<Accordion borderColor="atmr-border-muted" borderStyle="solid" bottomBorderWidth="1px">
		<AccordionSummary px="atmr-spacing-8x" py="atmr-spacing-6x" cursor="pointer">
			{#snippet children({ isOpen })}
				<Box flex justifyContent="between" alignItems="start">
					<Box style={{ width: '50px' }}>
						<Switch />
					</Box>
					<Box flex flexDirection="column" justifyContent="between" style={{ width: '100%' }} px="atmr-spacing-3x">
						<Box py="atmr-spacing-1x" flex>
							<Typography variant="heading-h3">Компенсация спорта</Typography>
							<Box
								px="atmr-spacing-2x"
								bg="atmr-info-50"
								borderRadius="atmr-border-radius-s"
								ml="atmr-spacing-2x"
								style={{ color: 'var(--atmr-info-700)', font: 'var(--atmr-font-description-s)', lineHeight: '20px', fontWeight: 500 }}
							>
								Нужны документы
							</Box>
						</Box>

						<Typography variant="body-m" style={{ opacity: 0.6 }}
							>Можно компенсировать оплату любых спортивных занятий. Услуга может быть оказана и члену семьи, но&nbsp;подтверждающие документы должны быть оформлены на&nbsp;тебя
							и датированы текущим годом. Подробнее о&nbsp;подтверждающих документах здесь.</Typography
						>
					</Box>

					{@render chevron(isOpen)}
				</Box>
			{/snippet}
		</AccordionSummary>
		<AccordionDetails mb="atmr-spacing-5x" mx="atmr-spacing-5x" style={{ paddingLeft: '68px' }}>
			{@render conditions()}
		</AccordionDetails>
	</Accordion>

	<Accordion>
		<AccordionSummary px="atmr-spacing-8x" py="atmr-spacing-6x" cursor="pointer">
			{#snippet children({ isOpen })}
				<Box flex justifyContent="between" alignItems="start">
					<Box style={{ width: '50px' }}>
						<Switch />
					</Box>
					<Box flex flexDirection="column" justifyContent="between" style={{ width: '100%' }} px="atmr-spacing-3x">
						<Box py="atmr-spacing-1x">
							<Typography variant="heading-h3">Помощь к отпуску</Typography>
						</Box>

						<Typography variant="body-m" style={{ opacity: 0.6 }}
							>Получите финансовую помощь для вашего идеального отдыха, чтобы сделать ваш отпуск еще более беззаботным и&nbsp;приятным</Typography
						>
					</Box>

					{@render chevron(isOpen)}
				</Box>
			{/snippet}
		</AccordionSummary>
		<AccordionDetails mb="atmr-spacing-5x" mx="atmr-spacing-5x" style={{ paddingLeft: '68px' }}>
			{@render conditions()}
		</AccordionDetails>
	</Accordion>
</AccordionGroup>
