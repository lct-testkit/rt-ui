<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the Accordion motion (src/lib/ext/collapseMotion.svelte.ts). Every component is the ORIGINAL Accordion / AccordionSummary /
	// AccordionDetails. 'Выкл' = the original (a CSS `transition` of the height inside a react-transition-group-like state machine); 'Svelte' = the height is
	// driven by a Svelte Tween (or Spring), the content fades and slides while it opens, and a change of the content size glides. The chevron is drawn by
	// the consumer (here: AccordionChevron.svelte). The last rows override the mode with the `motion` prop.
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import type { MotionProp } from '$lib/ext/motion.svelte.js';
	import AccordionChevron from './AccordionChevron.svelte';
	import LocalMode from './LocalMode.svelte';

	const QUESTIONS = [
		{ id: 'a1', title: 'Какой тариф выбрать?', text: 'Выбор тарифа зависит от объёма ваших проектов и команды. Если у вас есть сомнения, мы готовы помочь с выбором.' },
		{
			id: 'a2',
			title: 'Хочу купить Атомаро, что делать?',
			text: 'Можно воспользоваться нашим онлайн-калькулятором на сайте для предварительного расчёта стоимости тарифа, или обратиться к нам для индивидуального предложения.'
		},
		{ id: 'a3', title: 'Будет ли поддержка при переезде?', text: 'Да, конечно! Проведём консультирование и аудит, обеспечим сетап команды и всегда будем на связи.' }
	];
	let extra = $state(0);
	let extraSpring = $state(0);
</script>

{#snippet summary(title: string, isOpen: boolean, motion?: MotionProp)}
	<Box flex justifyContent="between" alignItems="center" style={{ width: '100%' }}>
		<Typography variant="body-m" style={{ fontWeight: 500 }}>{title}</Typography>
		<AccordionChevron open={isOpen} {motion} />
	</Box>
{/snippet}

<LocalMode param="acc" id="acc">
	<div class="grid">
		<div class="cell" data-testid="acc-cell-group">
			<Typography variant="body-s" strong as="span">AccordionGroup · single</Typography>
			<Typography variant="body-s" as="span" class="muted">Открывается один: предыдущий сворачивается, новый раскрывается.</Typography>
			<AccordionGroup bg="atmr-bg-surface1" px="atmr-spacing-4x" py="atmr-spacing-4x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" selectionMode="single" style={{ width: '100%' }}>
				{#each QUESTIONS as q, i (q.id)}
					<Accordion isOpen={i === 0} data-testid="acc-{i + 1}">
						<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer" data-testid="acc-{i + 1}-sum">
							{#snippet children({ isOpen })}{@render summary(q.title, isOpen)}{/snippet}
						</AccordionSummary>
						<AccordionDetails px="atmr-spacing-2x" pt="atmr-spacing-1x" pb="atmr-spacing-2x" data-testid="acc-{i + 1}-det">
							<Typography variant="body-m" style={{ opacity: 0.6 }}>{q.text}</Typography>
						</AccordionDetails>
					</Accordion>
				{/each}
			</AccordionGroup>
		</div>

		<div class="cell" data-testid="acc-cell-grow">
			<Typography variant="body-s" strong as="span">Меняющееся содержимое</Typography>
			<Typography variant="body-s" as="span" class="muted">Пока аккордеон открыт, добавленный контент плавно раздвигает его (с движением) или просто сдвигает (оригинал).</Typography>
			<Accordion bg="atmr-bg-surface1" px="atmr-spacing-2x" py="atmr-spacing-2x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" style={{ width: '100%' }} isOpen data-testid="acc-grow">
				<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer" data-testid="acc-grow-sum">
					{#snippet children({ isOpen })}{@render summary('Контейнер с любым содержимым', isOpen)}{/snippet}
				</AccordionSummary>
				<AccordionDetails px="atmr-spacing-2x" py="atmr-spacing-2x" gapY="8px" flex flexDirection="column" data-testid="acc-grow-det">
					<Typography variant="body-m" style={{ opacity: 0.6 }}>Контейнер аккордеона можно наполнять любым контентом.</Typography>
					<Box flex gapX="8px">
						<Button size="s" label="Добавить строку" onclick={() => (extra += 1)} data-testid="acc-grow-add" />
						<Button size="s" variant="outline" colorScheme="neutral" label="Сбросить" onclick={() => (extra = 0)} data-testid="acc-grow-reset" />
					</Box>
					{#each Array.from({ length: extra }, (_, k) => k) as k (k)}
						<Typography variant="body-m" style={{ opacity: 0.6 }}>Добавленная строка {k + 1}</Typography>
					{/each}
				</AccordionDetails>
			</Accordion>
		</div>

		<div class="cell" data-testid="acc-cell-off">
			<Typography variant="body-s" strong as="span">{'motion={false}'}</Typography>
			<Typography variant="body-s" as="span" class="muted">Проп сильнее режима: всегда оригинал (CSS-transition высоты).</Typography>
			<Accordion bg="atmr-bg-surface1" px="atmr-spacing-2x" py="atmr-spacing-2x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" style={{ width: '100%' }} motion={false} data-testid="acc-off">
				<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer" data-testid="acc-off-sum">
					{#snippet children({ isOpen })}{@render summary('Всегда оригинал', isOpen, false)}{/snippet}
				</AccordionSummary>
				<AccordionDetails px="atmr-spacing-2x" pb="atmr-spacing-2x" data-testid="acc-off-det">
					<Typography variant="body-m" style={{ opacity: 0.6 }}>Оригинальная анимация: CSS <code>transition</code> высоты.</Typography>
				</AccordionDetails>
			</Accordion>
		</div>

		<div class="cell" data-testid="acc-cell-spring">
			<Typography variant="body-s" strong as="span">{"motion=\"spring\""}</Typography>
			<Typography variant="body-s" as="span" class="muted">Всегда Svelte, но высота едет на пружине (Spring), а не по кривой.</Typography>
			<Accordion bg="atmr-bg-surface1" px="atmr-spacing-2x" py="atmr-spacing-2x" borderRadius="atmr-border-radius-xl" boxShadow="atmr-shadow-bottom-s" style={{ width: '100%' }} motion="spring" data-testid="acc-spring">
				<AccordionSummary px="atmr-spacing-2x" py="atmr-spacing-2x" cursor="pointer" data-testid="acc-spring-sum">
					{#snippet children({ isOpen })}{@render summary('Пружина', isOpen, 'spring')}{/snippet}
				</AccordionSummary>
				<AccordionDetails px="atmr-spacing-2x" pb="atmr-spacing-2x" gapY="8px" flex flexDirection="column" data-testid="acc-spring-det">
					<Typography variant="body-m" style={{ opacity: 0.6 }}>Высота движется Spring (stiffness / damping), без фиксированной длительности.</Typography>
					<Button size="s" label="Добавить строку" onclick={() => (extraSpring += 1)} />
					{#each Array.from({ length: extraSpring }, (_, k) => k) as k (k)}
						<Typography variant="body-m" style={{ opacity: 0.6 }}>Строка {k + 1}</Typography>
					{/each}
				</AccordionDetails>
			</Accordion>
		</div>
	</div>
</LocalMode>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--atmr-spacing-3x);
		align-items: start;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
</style>
