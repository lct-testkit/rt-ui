import type { Component } from 'svelte';
import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
import Pin from '$lib/icons/24/navigation/Pin.svelte';
import Overview6Screen from '$lib/icons/24/media/Overview6Screen.svelte';
import Atom from '$lib/icons/24/technology/Atom.svelte';
import type { SegmentedControlSize } from '$lib/components/SegmentedControl/constants.js';

// Port of the OPTIONS / OPTIONS_WITHOUT_ICONS / OPTIONS_ICONS constants of the React SegmentedControl stories.
// React kept icon elements in the items; here an item holds the icon component (+ its size prop).
export interface SegmentOption {
	label?: string;
	icon?: Component<any>;
	iconSize?: number;
	disabled?: boolean;
}

const list = (iconSize?: number): SegmentOption[] => [
	{ label: 'Список', icon: MenuKebab, iconSize },
	{ label: 'Таблица', icon: Overview6Screen, iconSize },
	{ label: 'На карте', icon: Pin, iconSize, disabled: true }
];

export const OPTIONS: Record<SegmentedControlSize, SegmentOption[]> = {
	l: list(),
	m: list(),
	s: list(16)
};

export const OPTIONS_WITHOUT_ICONS: SegmentOption[] = [{ label: '1' }, { label: '2' }, { label: '3' }, { label: '4' }, { label: '5' }];

export const OPTIONS_ICONS: Record<SegmentedControlSize, SegmentOption[]> = {
	l: new Array(5).fill({ icon: Atom }),
	m: new Array(5).fill({ icon: Atom }),
	s: new Array(5).fill({ icon: Atom, iconSize: 16 })
};
