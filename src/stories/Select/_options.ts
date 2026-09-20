// Port of stories-app/src/stories/Multiselect/constants.tsx (OPTIONS, OPTIONS_CITIES, OPTIONS_SELECTIONS - shared by the Select stories)
// and stories-app/src/stories/Select/constants.tsx (OPTIONS_WITH_SLOTS).
import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
import {
	atomaroSuffix,
	heartPrefix,
	kebabSuffix,
	kodSuffix,
	slotPrefix1,
	slotPrefix2,
	slotPrefix3,
	slotPrefix4,
	slotPrefix5,
	unionSuffix
} from './_snippets.svelte';

export const OPTIONS_CITIES: DropdownMenuItem[] = [
	'Москва',
	'Санкт-Петербург',
	'Новосибирск',
	'Екатеринбург',
	'Нижний Новгород',
	'Казань',
	'Челябинск',
	'Омск',
	'Самара',
	'Ростов-На-Дону',
	'Уфа'
].map((value) => ({ value, key: value }));

export const OPTIONS_SELECTIONS: DropdownMenuItem[] = Array.from({ length: 9 }, (_, i) => ({ value: `Selection ${i + 1}`, key: `selection${i + 1}` }));

export const OPTIONS: DropdownMenuItem[] = [
	{ value: 'Title', key: 'title', isSelected: false, isTitle: true },
	{ value: 'Ember', key: 'ember', hint: 'hint', suffix: kebabSuffix, isSelected: false, prefix: heartPrefix },
	{ value: '', key: 'divider', isDivider: true },
	{ value: 'Polymer', key: 'polymer' },
	{ value: 'Meteor', key: 'meteor', disabled: true },
	{ value: 'Mithril', key: 'mithril' },
	{ value: 'Sodium', key: 'sodium' },
	{ value: 'Gallium', key: 'gallium' },
	{ value: 'Sulfur', key: 'sulfur' }
];

export const OPTIONS_WITH_SLOTS: DropdownMenuItem[] = [
	{ value: 'Юлия Максимова', key: 'union-1', hint: 'Менеджер', suffix: unionSuffix, prefix: slotPrefix1 },
	{ value: 'Артём Афанасьев', key: 'KOD-1', hint: 'Разработчик', suffix: kodSuffix, prefix: slotPrefix2 },
	{ value: 'Мирослава Александрова', key: 'atomaro-1', hint: 'UX-писатель', suffix: atomaroSuffix, prefix: slotPrefix3 },
	{ value: 'Григорий Александров', key: 'atomaro-2', hint: 'Дизайнер', suffix: atomaroSuffix, prefix: slotPrefix4 },
	{ value: 'Иван Михеев', key: 'Union-2', hint: 'Аналитик', suffix: unionSuffix, prefix: slotPrefix5 }
];
