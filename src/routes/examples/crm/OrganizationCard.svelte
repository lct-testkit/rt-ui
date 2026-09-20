<script lang="ts">
	// Content of the Drawer: the card of one organization (header, Tabs with fields / contacts / history, footer with actions).
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TabsPanel from '$lib/components/Tabs/TabsPanel/TabsPanel.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { STATUSES, STATUS_ITEMS, daysAgo, fmtDate, fmtMoney, type Organization, type StatusKey } from './data.js';

	let {
		org,
		onClose,
		onStatus,
		onDelete,
		onCall
	}: {
		org: Organization;
		onClose: () => void;
		onStatus: (status: StatusKey) => void;
		onDelete: () => void;
		onCall: () => void;
	} = $props();

	let tab = $state('info');
	const status = $derived(STATUSES[org.status]);
	const ago = $derived(daysAgo(org.lastContact));

	// fields of the "Данные" tab: [label, value]
	const fields = $derived<[string, string][]>([
		['ИНН', org.inn],
		['Город', org.city],
		['Менеджер', org.manager],
		['Последний контакт', `${fmtDate(org.lastContact)} · ${ago} дн. назад`],
		['Сумма сделки', fmtMoney(org.amount)],
		['Ректор', org.rector]
	]);
	const contacts = $derived([
		{ name: org.rector, role: 'Ректор', email: org.email },
		{ name: 'Т. Р. Жукова', role: 'Проректор по цифровизации', email: `it.${org.email.split('@')[1]}` }
	]);
	const history: [string, string][] = $derived([
		[fmtDate(org.lastContact), 'Звонок: обсудили условия договора'],
		['02.09.2026', 'Отправлено коммерческое предложение'],
		['19.08.2026', 'Встреча с проректором по цифровизации'],
		['05.08.2026', 'Организация добавлена в CRM']
	]);
</script>

<div class="card__head">
	<div class="card__title">
		<Typography variant="heading-h3" as="h2">{org.name}</Typography>
		<Badge size="s" variant="secondary" colorScheme={status.color} label={status.label} dot />
	</div>
	<CloseButton onclick={onClose} aria-label="Закрыть карточку" data-testid="card-close" />
</div>

<TabsGroup variant="primary" size="m" border horizontalFill={false} value={tab} onChange={(index) => void (tab = index)}>
	<TabsItem label="Данные" index="info" />
	<TabsItem label="Контакты" index="contacts" />
	<TabsItem label="История" index="history" />
</TabsGroup>

<TabsPanel value={tab} index="info">
	<div class="card__fields">
		{#each fields as [label, value] (label)}
			<div class="card__field">
				<Typography variant="description-l" class="card__muted">{label}</Typography>
				<Typography variant="body-m">{value}</Typography>
			</div>
		{/each}
	</div>
</TabsPanel>

<TabsPanel value={tab} index="contacts">
	<div class="card__list">
		{#each contacts as c (c.name)}
			<div class="card__field">
				<Typography variant="body-m" strong>{c.name}</Typography>
				<Typography variant="description-l" class="card__muted">{c.role} · {c.email}</Typography>
			</div>
		{/each}
	</div>
</TabsPanel>

<TabsPanel value={tab} index="history">
	<div class="card__list">
		{#each history as [date, text] (date)}
			<div class="card__field">
				<Typography variant="description-l" class="card__muted">{date}</Typography>
				<Typography variant="body-m">{text}</Typography>
			</div>
		{/each}
	</div>
</TabsPanel>

<!-- change of the status: the parent updates the row, the table and the badge follow.
     Kept OUTSIDE of <TabsPanel>: the panel draws a focus ring (`:has(:focus-visible)`) around itself while a control inside it is focused. -->
<Select label="Статус" items={STATUS_ITEMS} value={org.status} placement="bottom" deselectEnabled={false} autocomplete={{ enabled: false }} useInPortal={false}
	onChange={(key) => key && onStatus(String(key) as StatusKey)} />

<div class="card__footer">
	<Button label="Запланировать звонок" onclick={onCall} />
	<Button variant="outline" colorScheme="neutral" label="Удалить" onclick={onDelete} data-testid="card-delete" />
</div>
