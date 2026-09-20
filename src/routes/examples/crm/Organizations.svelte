<script lang="ts">
	// Screen "Организации": tabs, filter bar, TableGrid (sorting, row selection, action bar, pagination), Drawer card, confirm Modal, toasts.
	// It is a showcase — copy pieces from here. In your own app import from the package: `import { Button, Select, TableGrid } from '@lct-testkit/rt-ui'`
	// (this playground uses direct `$lib/...` paths).
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Counter from '$lib/components/Counter/Counter.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton/FloatingActionButton/FloatingActionButton.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import { MONTHS } from '$lib/components/PickerDate/constants.js';
	import Select from '$lib/components/Select/Select.svelte';
	import { ActionBar, TableGrid, type TableGridColumn, type TableGridRow } from '$lib/components/TableGrid';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import FilterIcon from '$lib/icons/24/action/Filter.svelte';
	import CloseLarge from '$lib/icons/24/navigation/CloseLarge.svelte';
	import Trash from '$lib/icons/24/action/Trash.svelte';
	import TableCards from '$lib/ext/TableCards.svelte';
	import { useBreakpoint } from '$lib/ext/responsive.svelte.js';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import Download from '$lib/icons/24/action/Download.svelte';
	import OrganizationCard from './OrganizationCard.svelte';
	import { CURRENT_USER, ORGANIZATIONS, STATUSES, STATUS_ITEMS, daysAgo, fmtDate, fmtMoney, type Organization, type StatusKey } from './data.js';

	const { addNotification } = useNotificationsStack();
	const toast = (title: string, subtitle: string, colorScheme: 'success' | 'info' | 'warning' | 'error' = 'success') =>
		addNotification({ title, subtitle, colorScheme, closeButton: true, timeout: 5000 });

	// adaptive screen: desktop (>= 1024) table + filter grid; tablet (768-1023) table without INN / manager / contact date, no page jumper; phone (< 768) cards, inline filter panel, FAB
	const bp = useBreakpoint();
	const fs = $derived(bp.isMobile ? 'l' : 'm'); // controls are 48 px tall on a phone (touch targets)
	let filtersOpen = $state(false);

	// ---------------------------------------------------------------- data + filters
	let orgs = $state.raw<Organization[]>(ORGANIZATIONS);
	type Tab = 'all' | 'mine' | 'attention' | 'archive';
	let tab = $state<Tab>('all');
	let search = $state('');
	let status = $state<string | number>('');
	let cities = $state<string[]>([]);
	let from = $state<Date | undefined>();
	let to = $state<Date | undefined>();
	let resetKey = $state(0); // re-creates the filter fields on "Сбросить"

	const CITY_ITEMS = [...new Set(ORGANIZATIONS.map((o) => o.city))].sort((a, b) => a.localeCompare(b, 'ru')).map((c) => ({ key: c, value: c }));

	const TAB_RULES: Record<Tab, (o: Organization) => boolean> = {
		all: (o) => o.status !== 'lost',
		mine: (o) => o.manager === CURRENT_USER && o.status !== 'lost',
		attention: (o) => o.status !== 'lost' && daysAgo(o.lastContact) > 45, // no contact for a long time
		archive: (o) => o.status === 'lost'
	};
	const TABS: [Tab, string][] = [['all', 'Все'], ['mine', 'Мои'], ['attention', 'Требуют внимания'], ['archive', 'Архив']];

	const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const filtered = $derived(
		orgs.filter((o) => {
			const q = search.trim().toLowerCase();
			return (
				TAB_RULES[tab](o) &&
				(!q || o.name.toLowerCase().includes(q) || o.inn.includes(q)) &&
				(!status || o.status === status) &&
				(!cities.length || cities.includes(o.city)) &&
				(!from || o.lastContact >= iso(from)) &&
				(!to || o.lastContact <= iso(to))
			);
		})
	);

	// ---------------------------------------------------------------- sorting (the table only shows the state, we sort)
	type SortDir = 'asc' | 'desc' | 'default';
	let sort = $state<{ col: string; dir: SortDir }>({ col: 'name', dir: 'default' });
	const nextDir = (d: SortDir): SortDir => (d === 'default' ? 'asc' : d === 'asc' ? 'desc' : 'default');
	const toggleSort = (col: string) => (sort = { col, dir: sort.col === col ? nextDir(sort.dir) : 'asc' });
	const sorted = $derived.by(() => {
		if (sort.dir === 'default') return filtered;
		const key = sort.col as 'name' | 'city' | 'manager' | 'lastContact' | 'amount';
		const k = sort.dir === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => (typeof a[key] === 'number' ? (a[key] as number) - (b[key] as number) : String(a[key]).localeCompare(String(b[key]), 'ru')) * k);
	});

	const activeFilters = $derived((status ? 1 : 0) + (cities.length ? 1 : 0) + (from || to ? 1 : 0));
	// phone: one Select instead of the clickable column titles
	const SORT_ITEMS = [
		{ key: 'default', value: 'Без сортировки' }, { key: 'name:asc', value: 'Название А–Я' }, { key: 'name:desc', value: 'Название Я–А' },
		{ key: 'amount:desc', value: 'Сумма: по убыванию' }, { key: 'amount:asc', value: 'Сумма: по возрастанию' },
		{ key: 'lastContact:desc', value: 'Контакт: сначала свежие' }, { key: 'lastContact:asc', value: 'Контакт: сначала давние' }
	];
	const sortKey = $derived(sort.dir === 'default' ? 'default' : `${sort.col}:${sort.dir}`);
	const applySortKey = (k: string | number | null) => {
		const [col, dir] = String(k ?? 'default').split(':');
		sort = k && k !== 'default' ? { col, dir: dir as SortDir } : { col: 'name', dir: 'default' };
		page = 1;
	};

	// ---------------------------------------------------------------- pagination + selection
	let page = $state(1);
	let pageSize = $state(10);
	let selected = $state<string[]>([]);
	const pageFrom = $derived((page - 1) * pageSize);
	const pageRows = $derived(sorted.slice(pageFrom, pageFrom + pageSize));
	const pageCount = $derived(Math.max(1, Math.ceil(sorted.length / pageSize)));
	const visibleIds = $derived(pageRows.map((o) => String(o.id)));
	const allChecked = $derived(visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id)));
	const someChecked = $derived(visibleIds.some((id) => selected.includes(id)));

	/** any filter / tab change: back to the first page, selection is dropped */
	const filtersChanged = () => {
		page = 1;
		selected = [];
	};
	const resetFilters = () => {
		search = ''; status = ''; cities = []; from = to = undefined;
		resetKey++;
		filtersChanged();
	};

	// rows of the table: plain text cells (`row[column.key]`), the status cell is a snippet
	interface Row extends TableGridRow {
		name: string; city: string; inn: string; manager: string; status: StatusKey; last: string; amountText: string;
	}
	const rows: Row[] = $derived(
		pageRows.map((o) => ({
			id: o.id, name: o.name, city: o.city, inn: o.inn, manager: o.manager, status: o.status,
			last: fmtDate(o.lastContact), amountText: fmtMoney(o.amount)
		}))
	);
	const sortOf = (col: string) => ({ sort: sort.col === col ? sort.dir : ('default' as SortDir), onSort: () => toggleSort(col) });
	const columns: TableGridColumn<Row>[] = $derived(([
		// a CSS track works as a width: the name takes the free space, but never less than 220px
		{ name: 'name', title: 'Организация', size: { width: 'minmax(220px, 2fr)' }, sorting: sortOf('name') },
		{ name: 'city', title: 'Город', size: { width: 140 }, sorting: sortOf('city') },
		{ name: 'inn', title: 'ИНН', size: { width: 120 } },
		{ name: 'manager', title: 'Менеджер', size: { width: 150 }, sorting: sortOf('manager') },
		{ name: 'status', title: 'Статус', size: { width: 130 }, render: statusCell },
		{ name: 'last', title: 'Контакт', size: { width: 130 }, sorting: sortOf('lastContact') },
		{ name: 'amountText', title: 'Сумма', align: 'right', size: { width: 140 }, sorting: sortOf('amount') }
	] as TableGridColumn<Row>[]).filter((c) => !bp.isTablet || (c.name !== 'inn' && c.name !== 'manager' && c.name !== 'last')));

	// ---------------------------------------------------------------- Drawer (card) and Modal (confirm)
	let openId = $state<number | null>(null);
	// a click on a row checkbox also bubbles up to the row (`rowConfig.onClick`): remember where the click started and ignore it
	let clickStartedInCheckbox = false;
	const openCard = (id: string | number) => {
		if (!clickStartedInCheckbox) openId = Number(id);
	};
	const current = $derived(orgs.find((o) => o.id === openId));
	let pendingDelete = $state<number[] | null>(null); // ids waiting for confirmation

	function setStatus(id: number, next: StatusKey) {
		orgs = orgs.map((o) => (o.id === id ? { ...o, status: next } : o));
		toast('Статус обновлён', `Теперь: «${STATUSES[next].label}»`);
	}
	function confirmDelete() {
		const ids = pendingDelete ?? [];
		orgs = orgs.filter((o) => !ids.includes(o.id));
		if (openId !== null && ids.includes(openId)) openId = null;
		pendingDelete = null;
		selected = [];
		if (page > pageCount) page = pageCount;
		toast('Удалено', `Организаций: ${ids.length}`);
	}

	const counts = $derived({
		all: orgs.filter(TAB_RULES.all).length, mine: orgs.filter(TAB_RULES.mine).length,
		attention: orgs.filter(TAB_RULES.attention).length, archive: orgs.filter(TAB_RULES.archive).length
	});
</script>

<svelte:window onclickcapture={(e) => (clickStartedInCheckbox = !!(e.target as Element).closest?.('.atmr-tablegrid__checktree__container'))} />

<!-- cells / table slots -->
{#snippet statusCell(row: Row)}
	<div class="orgs__status"><Badge size="s" variant="secondary" colorScheme={STATUSES[row.status].color} label={STATUSES[row.status].label} dot /></div>
{/snippet}
{#snippet headerCheck()}
	<Checkbox variant="primary" checked={allChecked} indeterminate={someChecked && !allChecked}
		onChange={(v: boolean) => (selected = v ? [...new Set([...selected, ...visibleIds])] : selected.filter((id) => !visibleIds.includes(id)))} />
{/snippet}
{#snippet actionBar()}
	<ActionBar onDelete={(keys) => (pendingDelete = keys.map(Number))} onCancel={() => (selected = [])}>
		<Button size="s" variant="secondary" colorScheme="neutral" label="Экспорт" onclick={() => toast('Экспорт готов', `Файл organizations.xlsx (${selected.length} шт.) сохранён`)} />
	</ActionBar>
{/snippet}
{#snippet footer()}
	<Pagination type="buttons" alignment="left" count={sorted.length} {pageSize} {page} onPageChange={(p) => (page = p)}
		onPageSizeChange={(size) => { pageSize = size; page = 1; }}
		total={{ enabled: true, label: `Организации ${sorted.length ? pageFrom + 1 : 0}–${Math.min(pageFrom + pageSize, sorted.length)} из ${sorted.length}` }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50], props: { placement: 'top' } }} jumper={{ enabled: !bp.isTablet, labelSuffix: `из ${pageCount}` }} />
{/snippet}
{#snippet emptyTable()}
	<div style="padding: var(--atmr-spacing-8x); text-align: center"><Typography variant="body-m">Ничего не найдено — измените фильтры</Typography></div>
{/snippet}
{#snippet searchIcon()}<Search />{/snippet}
{#snippet addIcon()}<AddLarge />{/snippet}
{#snippet exportIcon()}<Download />{/snippet}
{#snippet filterIcon()}<FilterIcon />{/snippet}
{#snippet trashIcon()}<Trash />{/snippet}
{#snippet closeIcon()}<CloseLarge />{/snippet}

<!-- the screen: header, tabs and filters keep their height, only the table area scrolls (on a phone the whole screen scrolls: cards, no table) -->
<div class="orgs">
<!-- page header -->
<div class="orgs__head">
	<div class="orgs__head-title">
		<Typography variant={bp.isMobile ? 'heading-h3' : 'heading-h2'} as="h1">Организации</Typography>
		{#if !bp.isMobile}<Typography variant="body-s" class="orgs__note">Вузы-партнёры и потенциальные клиенты · данные вымышленные</Typography>{/if}
	</div>
	{#if !bp.isMobile}
		<Button variant="outline" colorScheme="neutral" iconPrefix={exportIcon} label="Экспорт списка" onclick={() => toast('Экспорт списка', 'Выгрузка всех организаций поставлена в очередь', 'info')} />
		<Button iconPrefix={addIcon} label="Добавить организацию" onclick={() => toast('Новая организация', 'Форма создания не входит в демо', 'info')} data-testid="add-org" />
	{:else}
		<IconButton size="l" variant="outline" colorScheme="neutral" icon={exportIcon} aria-label="Экспорт списка" data-testid="export-mobile"
			onclick={() => toast('Экспорт списка', 'Выгрузка всех организаций поставлена в очередь', 'info')} />
	{/if}
</div>

<!-- tabs (horizontally scrollable when they do not fit) -->
<TabsGroup variant="primary" size="m" border horizontalFill={false} value={tab} onChange={(index) => { tab = index as Tab; filtersChanged(); }}>
	{#each TABS as [key, label] (key)}
		<TabsItem index={key} label="{label} · {counts[key]}" />
	{/each}
</TabsGroup>

<!-- filters: search, status (Select), cities (Multiselect), period (InputDate range) -->
{#key resetKey}
	{#if bp.isMobile}
		<!-- phone: the search field + a button that opens the rest of the filters in an inline panel -->
		<div class="orgs__mfilters" data-testid="filters">
			<div class="orgs__mfilters-row">
				<div class="orgs__grow">
					<Input size="l" placeholder="Название или ИНН" clearable iconPrefix={searchIcon} value={search} aria-label="Поиск по названию или ИНН"
						onChange={(e: Event) => { search = (e.target as HTMLInputElement).value; filtersChanged(); }} onClear={() => { search = ''; filtersChanged(); }} />
				</div>
				<div class="orgs__iconwrap">
					<IconButton size="l" variant={filtersOpen ? 'secondary' : 'outline'} colorScheme="neutral" icon={filterIcon} aria-label="Фильтры" aria-expanded={filtersOpen}
						onclick={() => (filtersOpen = !filtersOpen)} data-testid="filters-toggle" />
					{#if activeFilters}<span class="orgs__iconwrap-badge"><Counter size="xs">{activeFilters}</Counter></span>{/if}
				</div>
			</div>
			{#if filtersOpen}
				<div class="orgs__mpanel" data-testid="filters-panel">
					<Select size="l" label="Статус" placeholder="Все статусы" placement="bottom" items={STATUS_ITEMS} value={status || null} clearable autocomplete={{ enabled: false }}
						onChange={(key) => { status = key; filtersChanged(); }} onClear={() => { status = ''; filtersChanged(); }} />
					<Multiselect size="l" label="Города" placeholder="Все города" placement="bottom" items={CITY_ITEMS} clearable autocomplete={{ enabled: true }}
						onChange={(items) => { cities = items.map((i) => String(i.key)); filtersChanged(); }} />
					<InputDate size="l" isRange label="Последний контакт" placeholder="Любые даты" placement="bottom" dateFormat="DD.MM.YYYY" months={MONTHS} useInPortal
						onChange={(start, end) => { from = start; to = end; filtersChanged(); }} />
					<div class="orgs__mpanel-actions">
						<Button size="l" variant="outline" colorScheme="neutral" label="Сбросить" onclick={resetFilters} data-testid="reset" />
						<Button size="l" label="Показать: {sorted.length}" onclick={() => (filtersOpen = false)} data-testid="filters-apply" />
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="orgs__filters" data-testid="filters">
			<Input size="m" label="Название или ИНН" placeholder="Поиск" clearable iconPrefix={searchIcon} value={search}
				onChange={(e: Event) => { search = (e.target as HTMLInputElement).value; filtersChanged(); }} onClear={() => { search = ''; filtersChanged(); }} />
			<Select size="m" label="Статус" placeholder="Все статусы" placement="bottom" items={STATUS_ITEMS} value={status || null} clearable autocomplete={{ enabled: false }}
				onChange={(key) => { status = key; filtersChanged(); }} onClear={() => { status = ''; filtersChanged(); }} />
			<Multiselect size="m" label="Города" placeholder="Все города" placement="bottom" items={CITY_ITEMS} clearable autocomplete={{ enabled: true }}
				onChange={(items) => { cities = items.map((i) => String(i.key)); filtersChanged(); }} />
			<InputDate size="m" isRange label="Последний контакт" placeholder="Любые даты" placement="bottom" dateFormat="DD.MM.YYYY" months={MONTHS} useInPortal
				onChange={(start, end) => { from = start; to = end; filtersChanged(); }} />
			<Button size="m" variant="ghost" colorScheme="neutral" label="Сбросить" onclick={resetFilters} data-testid="reset" />
		</div>
	{/if}
{/key}

{#if bp.isMobile}
	<!-- phone: the count and one Select instead of the clickable column titles -->
	<div class="orgs__mbar">
		<Typography variant="body-s" class="orgs__note">Найдено: {sorted.length}</Typography>
		<div class="orgs__mbar-sort">
			<Select size="m" items={SORT_ITEMS} value={sortKey} deselectEnabled={false} autocomplete={{ enabled: false }} placement="bottomRight" onChange={applySortKey} aria-label="Сортировка" />
		</div>
	</div>
{/if}

<!-- table: as tall as its rows, but never taller than the free area (flex column + max-height) — then the grid scrolls inside, header and footer with Pagination stay -->
<div class="orgs__table">
	{#if bp.isMobile}
		<!-- phone: cards instead of the 7-column table (ext/TableCards: same rows, same selection keys) -->
		<TableCards rows={pageRows} selectable selected={selected} onSelectionChange={(keys) => (selected = keys)} onRowClick={(o) => (openId = o.id)}
			aria-label="Организации" emptyText="Ничего не найдено — измените фильтры">
			{#snippet card(o)}
				<div class="ocard">
					<Typography variant="body-m" strong>{o.name}</Typography>
					<Typography variant="description-l" class="orgs__note">{o.city} · {o.manager}</Typography>
					<div class="ocard__row">
						<Badge size="s" variant="secondary" colorScheme={STATUSES[o.status].color} label={STATUSES[o.status].label} dot />
						<Typography variant="body-s" strong>{fmtMoney(o.amount)}</Typography>
					</div>
					<Typography variant="description-l" class="orgs__note">Контакт: {fmtDate(o.lastContact)}</Typography>
				</div>
			{/snippet}
		</TableCards>
		{#if pageCount > 1}
			<div class="orgs__mpager">
				<Pagination type="buttonsMobile" alignment="left" count={sorted.length} {pageSize} {page} onPageChange={(p) => (page = p)}
					total={{ enabled: true, label: `${pageFrom + 1}–${Math.min(pageFrom + pageSize, sorted.length)} из ${sorted.length}` }} />
			</div>
		{/if}
	{:else}
		<TableGrid id="orgs" alignCells columnConfig={{ sorting: true }} headerSticky footerSticky {columns} {rows} style={{ width: '100%', height: 'auto', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}
			rowConfig={{
				onClick: openCard,
				selection: { defaultSelected: selected, onSelectionChange: (keys) => (selected = keys), renderFirstColumnHeader: headerCheck }
			}}
			renders={{ actionBar, footer, emptyTable: rows.length ? undefined : emptyTable }} />
	{/if}
</div>

<!-- phone: the bar for selected cards sticks to the bottom (TableGrid's ActionBar works only inside the table) -->
{#if bp.isMobile && selected.length}
	<div class="orgs__bulk" data-testid="bulk-bar">
		<Typography variant="body-s" strong>{selected.length} выбрано</Typography>
		<div class="orgs__bulk-actions">
			<Button size="m" variant="secondary" colorScheme="neutral" label="Экспорт" onclick={() => toast('Экспорт готов', `Файл organizations.xlsx (${selected.length} шт.) сохранён`)} />
			<Button size="m" variant="outline" colorScheme="neutral" iconPrefix={trashIcon} label="Удалить" onclick={() => (pendingDelete = selected.map(Number))} data-testid="bulk-delete" />
			<IconButton size="m" variant="ghost" colorScheme="neutral" icon={closeIcon} aria-label="Снять выбор" onclick={() => (selected = [])} />
		</div>
	</div>
{/if}
</div>

<!-- phone: "add" is a floating button (hidden while cards are selected: the bulk bar takes the corner) -->
{#if bp.isMobile && !selected.length}
	<FloatingActionButton iconPrefix={addIcon} aria-label="Добавить организацию" onclick={() => toast('Новая организация', 'Форма создания не входит в демо', 'info')} data-testid="fab-add" />
{/if}

<!-- Drawer with the card of the organization -->
<!-- `fullHeight` = full viewport height, the content scrolls inside [ext, not in the original design system] -->
<Drawer class="crm-drawer" fullHeight dimension={Math.min(480, bp.width || 480)} isOpened={openId !== null} onClickOverlay={() => (openId = null)} onClose={() => (openId = null)}>
	{#if current}
		<OrganizationCard org={current} onClose={() => (openId = null)} onStatus={(s) => setStatus(current.id, s)}
			onDelete={() => (pendingDelete = [current.id])}
			onCall={() => toast('Звонок запланирован', `${current.name}: завтра в 11:00`)} />
	{/if}
</Drawer>

<!-- confirm Modal -->
<Modal isOpened={pendingDelete !== null} maxWidth={bp.isMobile ? 'calc(100vw - 32px)' : '520px'} maxHeight={bp.isMobile ? 'min(90vh, 340px)' : '220px'} modalClassName="crm-modal" isCentered
	onClickOverlay={() => (pendingDelete = null)} onEsc={() => (pendingDelete = null)}>
	<div class="crm-modal__head">
		<Typography variant="heading-h2">Удалить организации: {pendingDelete?.length ?? 0}?</Typography>
		<Typography variant="body-m" style={{ color: 'var(--atmr-fg-soft)' }}>Это действие нельзя отменить — карточки исчезнут из списка.</Typography>
		<CloseButton class="crm-modal__close" onclick={() => (pendingDelete = null)} aria-label="Закрыть" />
	</div>
	<div class="crm-modal__actions">
		<Button size="l" label="Удалить" onclick={confirmDelete} data-testid="confirm-delete" />
		<Button size="l" variant="secondary" colorScheme="neutral" label="Отмена" onclick={() => (pendingDelete = null)} data-testid="cancel-delete" />
	</div>
</Modal>
