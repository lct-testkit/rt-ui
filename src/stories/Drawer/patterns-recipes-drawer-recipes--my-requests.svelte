<script lang="ts">
	// Port of stories/Drawer/Recipes: MyRequests (title "Patterns & Recipes/Drawer/Recipes"): "my requests" list (tabs + accordions) in a right
	// drawer; the list of the active tab is "loaded" (500 ms) whenever the drawer is opened or the tab changes.
	import './_recipe-my-requests.css';
	import dayjs from 'dayjs';
	import { untrack } from 'svelte';
	import Accordion from '$lib/components/Accordion/Accordion/Accordion.svelte';
	import AccordionDetails from '$lib/components/Accordion/AccordionDetails/AccordionDetails.svelte';
	import AccordionGroup from '$lib/components/Accordion/AccordionGroup/AccordionGroup.svelte';
	import AccordionSummary from '$lib/components/Accordion/AccordionSummary/AccordionSummary.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import Loader from '$lib/components/Loader/Loader.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TabsPanel from '$lib/components/Tabs/TabsPanel/TabsPanel.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Synchronization from '$lib/icons/24/action/Synchronization.svelte';
	import DeliveryBox from '$lib/icons/24/business/DeliveryBox.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import FaceFrowning from '$lib/icons/24/rating/FaceFrowning.svelte';

	const ServiceTypes = { connection: 'connection', delivery: 'delivery', complaint: 'complaint' } as const;
	type ServiceType = (typeof ServiceTypes)[keyof typeof ServiceTypes];
	const ApplicationStatus = { active: 'active', complete: 'complete', reject: 'reject' } as const;
	type Status = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

	interface RequestItem {
		id: number;
		name: string;
		type: ServiceType;
		date: Date;
		application_number: string;
		status: Status;
		address: string;
		owner: string;
	}

	// (React keeps `{ icon: <Icon fill=.../>, bg }` per service type; the icons are rendered by `serviceIcon` below)
	const bgByServiceType: Record<ServiceType, string> = {
		[ServiceTypes.connection]: 'var(--atmr-status-06-container-default)',
		[ServiceTypes.delivery]: 'rgba(255, 79, 18, 0.1',
		[ServiceTypes.complaint]: 'var(--atmr-status-05-container-default)'
	};

	const closeParens = (value: string) => value + ')'.repeat(Math.max(0, (value.match(/\(/g)?.length ?? 0) - (value.match(/\)/g)?.length ?? 0)));
	const rawBg = (value: string) => (node: HTMLElement) => {
		node.style.setProperty('--atmr-box-bg', value);
	};

	const statusMap: Record<Status, string> = {
		[ApplicationStatus.active]: 'Заявка в работе',
		[ApplicationStatus.complete]: 'Заявка выполнента',
		[ApplicationStatus.reject]: 'Заявка отклонена'
	};

	const mock = (name: string, type: ServiceType, status: Status): RequestItem => ({
		id: Math.random(),
		name,
		type,
		date: new Date('2024.04.24'),
		application_number: '1233219876783',
		status,
		address: 'Санкт-Петербург Энергетиков 48 164',
		owner: 'Константинопольский Константин Константинович'
	});
	const requestsMock: RequestItem[] = [
		mock('Подключение услуги', ServiceTypes.connection, ApplicationStatus.active),
		mock('Настройка доставки счетов', ServiceTypes.delivery, ApplicationStatus.active),
		mock('Претензия', ServiceTypes.complaint, ApplicationStatus.active),
		mock('Подключение услуги', ServiceTypes.connection, ApplicationStatus.active),
		mock('Подключение услуги', ServiceTypes.connection, ApplicationStatus.complete),
		mock('Настройка доставки счетов', ServiceTypes.delivery, ApplicationStatus.complete),
		mock('Претензия', ServiceTypes.complaint, ApplicationStatus.complete),
		mock('Настройка доставки счетов', ServiceTypes.delivery, ApplicationStatus.reject),
		mock('Претензия', ServiceTypes.complaint, ApplicationStatus.reject)
	];

	let isDrawerOpen = $state(false);
	let tab = $state('0');
	let requests = $state.raw<RequestItem[]>([]);
	let isLoading = $state(false);

	const loadRequests = (status: string) =>
		new Promise<RequestItem[]>((resolve) => {
			setTimeout(() => {
				resolve(requestsMock.filter((item) => item.status === status));
			}, 500);
		});

	// useEffect(..., [tab, isDrawerOpen])
	$effect(() => {
		const currentTab = tab;
		const open = isDrawerOpen;
		untrack(() => {
			if (open) {
				isLoading = true;
				loadRequests(Object.keys(ApplicationStatus)[+currentTab])
					.then((data) => {
						requests = data;
					})
					.finally(() => {
						isLoading = false;
					});
			}
		});
	});

	const handleClose = () => {
		isDrawerOpen = false;
	};
	const handleOpen = () => {
		isDrawerOpen = true;
	};
</script>

<!-- The story's delivery `bg` is 'rgba(255, 79, 18, 0.1' (a missing parenthesis). React writes inline styles through the CSSOM, so that value is stored as
     it is (and CSS closes the function at the end of the value) without touching the other declarations; Box renders `style` as a string,
     where the unbalanced parenthesis would swallow `width` / `height`. So Box gets the balanced value and the raw one is written through the CSSOM. -->
{#snippet serviceIcon(type: ServiceType)}
	<Box
		flex
		justifyContent="center"
		alignItems="center"
		borderRadius="atmr-border-radius-l"
		bg={closeParens(bgByServiceType[type])}
		style={{ width: '44px', height: '44px' }}
		{@attach rawBg(bgByServiceType[type])}
	>
		{#if type === ServiceTypes.connection}
			<Synchronization fill="var(--atmr-status-06-default)" />
		{:else if type === ServiceTypes.delivery}
			<DeliveryBox fill="var(--atmr-accent-default)" />
		{:else}
			<FaceFrowning fill="var(--atmr-status-05-default)" />
		{/if}
	</Box>
{/snippet}

<!-- React children `a, " - № ", b` are three text nodes: every `{#each}` iteration below is one text node -->
{#snippet textNodes(parts: string[])}{#each parts as part}{part}{/each}{/snippet}

{#snippet detailRow(key: string, value: string)}
	<Box flex py="atmr-spacing-0-5x" class="requests-list__detail">
		<Box class="requests-list__detail-key">
			<Typography variant="body-s" style={{ opacity: '0.6' }}>{key}</Typography>
		</Box>
		<Box>
			<Typography variant="body-s" class="requests-list__detail-value">{value}</Typography>
		</Box>
	</Box>
{/snippet}

{#snippet requestList()}
	{#if isLoading}
		<Box flex justifyContent="center">
			<Loader type="dots" size="m" />
		</Box>
	{:else}
		<AccordionGroup flex flexDirection="column" gapY="12px" bg="transparent" style={{ width: '100%' }}>
			{#each requests as item (item.id)}
				<Accordion bg="atmr-bg-surface2" borderRadius="atmr-border-radius-l">
					<AccordionSummary px="atmr-spacing-3x" py="atmr-spacing-3x" cursor="pointer">
						{#snippet children({ isOpen })}
							<Box class="requests-list__header" flex justifyContent="between" alignItems="center">
								<Box style={{ width: '50px' }} class="requests-list__icon">
									{@render serviceIcon(item.type)}
								</Box>
								<Box style={{ width: '40%' }} px="atmr-spacing-4x" class="requests-list__name">
									<Box py="atmr-spacing-1x">
										<Typography variant="body-m" strong>{item.name}</Typography>
									</Box>
									<Typography variant="description-l" style={{ opacity: '0.6' }}>
										{@render textNodes([dayjs(item.date).format('DD.MM.YYYY'), ' - № ', item.application_number])}
									</Typography>
								</Box>
								<Box style={{ width: '60%' }} px="atmr-spacing-4x" class="requests-list__status">
									<Box pb="atmr-spacing-2x">
										<Typography variant="description-l" style={{ opacity: 0.6 }}>{statusMap[item.status] || 'Не определен'}</Typography>
									</Box>
									<Box flex gapX="5px">
										<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-accent-default" />
										<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-accent-default" />
										<Box style={{ width: '50px', height: '4px' }} borderRadius="atmr-border-radius-m" bg="atmr-neutral-50" />
									</Box>
								</Box>
								<Box ml="atmr-spacing-4x">
									<IconButton variant="ghost">
										{#snippet icon()}
											<ChevronDown
												style="fill: var(--atmr-fg-muted); transform: {isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}; transition: transform var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-standard)"
											/>
										{/snippet}
									</IconButton>
								</Box>
							</Box>
						{/snippet}
					</AccordionSummary>
					<AccordionDetails my="atmr-spacing-2x" mx="atmr-spacing-5x" style={{ paddingLeft: '50px' }}>
						<Box>
							<Box flex py="atmr-spacing-0-5x" class="requests-list__detail">
								<Box class="requests-list__detail-key">
									<Typography variant="body-s" style={{ opacity: '0.6' }}>№ заявки:</Typography>
								</Box>
								<Box>
									<Typography variant="body-s" class="requests-list__detail">{item.application_number}</Typography>
								</Box>
							</Box>
							{@render detailRow('Статус заявки:', statusMap[item.status])}
							{@render detailRow('Дата и время создания:', dayjs(item.date).format('DD.MM.YYYY'))}
							{@render detailRow('Адрес подключения:', item.address)}
							{@render detailRow('Контактное лицо:', item.owner)}
							<Box mt="atmr-spacing-3x">
								{#if item.status === ApplicationStatus.active}
									<Button variant="secondary" size="s" colorScheme="neutral" label="Отменить заявку" />
								{/if}
							</Box>
						</Box>
					</AccordionDetails>
				</Accordion>
			{/each}
		</AccordionGroup>
	{/if}
{/snippet}

<Button onclick={handleOpen} label="Открыть Drawer" />
<Drawer class="my-requests-drawer" isOpened={isDrawerOpen} onClickOverlay={handleClose}>
	<div class="atmr-drawer__header">
		<Typography variant="heading-h1" as="h1">Мои заявки</Typography>
		<div class="atmr-drawer__actions">
			<CloseButton onclick={handleClose} aria-label="Close" />
		</div>
	</div>
	<div class="atmr-drawer__body requests">
		<TabsGroup value={tab} onChange={(index) => {
			tab = index;
		}} size="s" horizontalFill={false}>
			<TabsItem index="0" label="Активные" id="tab-1" />
			<TabsItem index="1" label="Выполненные" id="tab-2" />
			<TabsItem index="2" label="Отклоненные" id="tab-3" />
		</TabsGroup>
		<TabsPanel value={tab} index="0" id="panel-1" aria-labelledby="tab-1" class="requests-list">{@render requestList()}</TabsPanel>
		<TabsPanel value={tab} index="1" id="panel-2" aria-labelledby="tab-2" class="requests-list">{@render requestList()}</TabsPanel>
		<TabsPanel value={tab} index="2" id="panel-3" aria-labelledby="tab-3" class="requests-list">{@render requestList()}</TabsPanel>
	</div>
	<div class="atmr-drawer__footer">
		<Button size="l" label="Создать" />
		<Button colorScheme="neutral" onclick={handleClose} variant="outline" size="l" label="Отмена" />
	</div>
</Drawer>
