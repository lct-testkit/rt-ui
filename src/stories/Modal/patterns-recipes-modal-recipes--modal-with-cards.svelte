<script lang="ts">
	// Port of stories/Modal: ModalWithCards (title "Patterns & Recipes/Modal/Recipes")
	import './_modal-styles.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TabsPanel from '$lib/components/Tabs/TabsPanel/TabsPanel.svelte';
	import TagGroup from '$lib/components/Tag/TagGroup/TagGroup.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import FolderAdd from '$lib/icons/24/document/FolderAdd.svelte';
	import Magic from '$lib/icons/24/technology/Magic.svelte';

	let isModalOpen = $state(false);

	const handleClose = () => {
		isModalOpen = false;
	};
	const handleOpen = () => {
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};

	const DATA = [
		{
			key: '1',
			title: 'Midjourney',
			iconBackground: 'var(--atmr-info-muted)',
			description: 'Удобно для тех, кто не умеет рисовать или не имеет времени на создание изображений вручную',
			tags: [
				{ key: 'images', value: 'Изображения' },
				{ key: 'illustar', value: 'Иллюстрации' },
				{ key: 'visualization', value: 'Визуализация' }
			]
		},
		{
			key: '2',
			title: 'ChatGPT4',
			iconBackground: 'var(--atmr-status-03-muted)',
			description: 'Надежный помощник, который поможет тебе решить любую проблему и поднять настроение в любой момент',
			tags: [
				{ key: 'openai', value: 'OpenAI' },
				{ key: 'chatbot', value: 'Чат-бот' },
				{ key: 'gpt4', value: 'GPT-4' },
				{ key: 'assistant', value: 'Помощник' }
			]
		},
		{
			key: '3',
			title: 'DALL-E',
			iconBackground: 'var(--atmr-neutral-muted)',
			description: 'Помогает рисовать практически что угодно в пару кликов и за несколько секунд получить результат',
			tags: [
				{ key: 'openai', value: 'Open AI' },
				{ key: 'illustrations', value: 'Иллюстрации' },
				{ key: 'visualization', value: 'Визуализация' }
			]
		},
		{
			key: '4',
			title: 'ClIPDraw',
			iconBackground: 'var(--atmr-status-06-muted)',
			description: 'Помогает рисовать практически что угодно в пару кликов и за несколько секунд получить результат',
			tags: [
				{ key: 'classifier', value: 'Классификатор' },
				{ key: 'images', value: 'Изображения' },
				{ key: 'openai', value: 'Open AI' }
			]
		}
	];
</script>

{#snippet renderCard(item: (typeof DATA)[number])}
	<Box
		flex
		flexDirection="column"
		alignItems="start"
		justifyContent="start"
		px="var(--atmr-spacing-8x)"
		py="var(--atmr-spacing-8x)"
		gapY="var(--atmr-spacing-6x)"
		bg="atmr-bg-surface3"
		borderRadius="24px"
		style="width: 48%; min-height: 312px; min-width: 260px"
	>
		<Box flex alignItems="center" justifyContent="center" gapX="var(--atmr-spacing-3x)">
			<Box bg={item.iconBackground} flex alignItems="center" justifyContent="center" borderRadius="12px" style="width: 48px; height: 48px">
				<Magic size={28} fill="white" />
			</Box>
			<Typography variant="heading-h2">{item.title}</Typography>
		</Box>
		<Box flex flexDirection="row" alignItems="center" justifyContent="start" gapX="var(--atmr-spacing-4x)" style="flex-wrap: wrap; width: 100%">
			<Button size="l" label="Начать работу" colorScheme="neutral" style="width: 60%; min-width: 200px" />
			<Button size="l" label="Избранное" colorScheme="neutral" variant="secondary">
				{#snippet iconSuffix()}<FolderAdd size={20} />{/snippet}
			</Button>
		</Box>
		<div class="atmr-modal__divider"></div>
		<Typography variant="body-m" style="color: var(--atmr-fg-soft)">{item.description}</Typography>
		<TagGroup items={item.tags} />
	</Box>
{/snippet}

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="Вызвать модальное окно" />
</div>

<Modal maxWidth="95%" maxHeight="775px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} isCentered unmount>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start" mb="var(--atmr-spacing-8x)">
		<Box flex flexDirection="column" alignItems="start" justifyContent="start">
			<Typography variant="heading-h1">Header</Typography>
		</Box>
		<CloseButton onclick={handleClose} style="position: absolute; top: var(--atmr-spacing-8x); right: var(--atmr-spacing-8x)" />
	</Box>
	<Box>
		<TabsGroup value="0" horizontalFill={false}>
			<TabsItem label="Новинки" index="0" />
			<TabsItem label="Рекомендации" index="1" />
			<TabsItem label="Моя коллекция" index="2" />
		</TabsGroup>
		<TabsPanel value="0" index="0">
			<Box my="var(--atmr-spacing-8x)">
				<Input label="Найти решение">
					{#snippet iconPrefix()}<Search />{/snippet}
				</Input>
				<Box
					flex
					flexDirection="row"
					alignItems="stretch"
					justifyContent="start"
					flexWrap="wrap"
					mt="var(--atmr-spacing-4x)"
					gapX="var(--atmr-spacing-4x)"
					gapY="var(--atmr-spacing-4x)"
					style="width: 100%; flex-wrap: wrap"
				>
					{#each DATA as item (item.key)}
						{@render renderCard(item)}
					{/each}
				</Box>
			</Box>
		</TabsPanel>
	</Box>
</Modal>
