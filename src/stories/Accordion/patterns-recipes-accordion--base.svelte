<script lang="ts">
	// Story: Patterns & Recipes/Accordion -> Base (Accordion.stories.tsx)
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Mail from '$lib/icons/24/communication/Mail.svelte';
	import Telegram from '$lib/icons/24/logo/Telegram.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';

	const questions = [
		{ title: 'Какой тариф выбрать?', text: 'Выбор тарифа зависит от\u00a0объема ваших проектов и\u00a0команды. Если у\u00a0вас есть сомнения, мы готовы помочь с\u00a0выбором.' },
		{
			title: 'Хочу купить Атомаро, что делать?',
			text: 'Можно воспользоваться нашим онлайн-калькулятором на\u00a0сайте для предварительного расчета стоимости тарифа, или обратиться к\u00a0нам для индивидуального предложения.'
		},
		{
			title: 'Будет ли поддержка при переезде?',
			text: 'Да, конечно! Проведем консультирование и\u00a0аудит, обеспечим сетап команды и\u00a0всегда будем на\u00a0связи, если понадобятся помощь или доработки.'
		}
	];
</script>

{#snippet summary(title: string, isOpen: boolean)}
	<Box flex justifyContent="between" alignItems="center" style={{ width: '100%' }}>
		<Typography variant="body-m" style={{ fontWeight: 500 }}>{title}</Typography>
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

<AccordionGroup bg="atmr-bg-surface1" px="atmr-spacing-4x" py="atmr-spacing-4x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s">
	<Accordion style={{ width: '400px' }}>
		<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer">
			{#snippet children({ isOpen })}{@render summary('Хочу купить Атомаро, что делать?', isOpen)}{/snippet}
		</AccordionSummary>
		<AccordionDetails px="atmr-spacing-2x" pt="atmr-spacing-1x" pb="atmr-spacing-2x">
			<Typography variant="body-m" style={{ opacity: 0.6 }}
				>Если вы&nbsp;изучили нашу Дизайн-систему и&nbsp;хотите ее&nbsp;приобреси, напишите нам, пожалуйста, на почту или в&nbsp;телеграм</Typography
			>
			<Box pt="atmr-spacing-3x" flex gapX="10px">
				<FunctionButton iconPosition="left" label="hello@atomaro.design" onclick={() => {}} size="s" variant="primary">
					{#snippet icon()}<Mail />{/snippet}
				</FunctionButton>
				<FunctionButton iconPosition="left" label="@atomaro" onclick={() => {}} size="s" variant="primary">
					{#snippet icon()}<Telegram />{/snippet}
				</FunctionButton>
			</Box>
		</AccordionDetails>
	</Accordion>

	{#each questions as q (q.title + q.text)}
		<Accordion style={{ width: '400px' }}>
			<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer">
				{#snippet children({ isOpen })}{@render summary(q.title, isOpen)}{/snippet}
			</AccordionSummary>
			<AccordionDetails px="atmr-spacing-2x" pt="atmr-spacing-1x" pb="atmr-spacing-2x">
				<Typography variant="body-m" style={{ opacity: 0.6 }}>{q.text}</Typography>
			</AccordionDetails>
		</Accordion>
	{/each}
</AccordionGroup>
