// Port of stories-app/src/stories/DropdownMenu/constants.tsx
import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
import { avatarPrefix1, avatarPrefix2, avatarPrefix3, avatarPrefix4, emberSuffix, heartPrefix, shortcutSuffix } from './_snippets.svelte';

export const OPTIONS: DropdownMenuItem[] = [
	{ value: 'title', key: 'title', isTitle: true },
	{ value: 'Ember', key: 'ember', suffix: emberSuffix },
	{ value: 'divider', key: 'divider', isDivider: true },
	{ value: 'Polymer', key: 'polymer', hint: 'hint', prefix: heartPrefix, isSelected: true },
	{ value: 'Meteor', key: 'meteor', disabled: true },
	{ value: 'Mithril', key: 'mithril', suffix: shortcutSuffix }
];

export const OPTIONS_LONG: DropdownMenuItem[] = [
	'Polymer',
	'Meteor',
	'Mithril',
	'Titanium',
	'Backbone',
	'Cobalt',
	'Nickel',
	'Copper',
	'Zink',
	'Cadmium',
	'Palladium'
].map((value) => ({ value, key: value.toLowerCase() }));

export const OPTIONS_VIRTUAL_SCROLL: DropdownMenuItem[] = Array.from({ length: 2000 }, (_, idx) => ({
	value: `Item ${idx}`,
	key: idx,
	textColor: 'green'
}));

export const PLACEMENTS_MAP = [
	['topLeft', 'top', 'topRight'],
	['leftTop', 'left', 'leftBottom'],
	['rightTop', 'right', 'rightBottom'],
	['bottomLeft', 'bottom', 'bottomRight']
] as const;

export const OPTIONS_CUSTOM: DropdownMenuItem[] = [
	{ value: 'Елена Иванова', key: 'user1', prefix: avatarPrefix1, isSelected: true },
	{ value: 'Светлана Чурикова', key: 'user2', prefix: avatarPrefix2 },
	{ value: 'Вадим Кузнецов', key: 'user3', prefix: avatarPrefix3 },
	{ value: 'Анна Семенова', key: 'user4', prefix: avatarPrefix4 },
	{ value: 'divider', key: 'divider', isDivider: true }
];
