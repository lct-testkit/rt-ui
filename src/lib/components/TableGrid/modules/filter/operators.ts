// Port of TableGrid/modules/filter/operators.tsx: the operators of a `type: 'operators'` filter (DropdownMenu items).
import type { Snippet } from 'svelte';
import type { DropdownMenuItem } from '../../../DropdownMenu/types.js';
import { DEFAULT_OPERATORS } from '../../constants.js';
import type { TableGridOperator } from '../../types.js';
import { endOfLineIcon, equalsIcon, middleOfLineIcon, startOfLineIcon } from './_OperatorIcons.svelte';

export interface OperatorItem {
	key: TableGridOperator;
	value: string;
	prefix: Snippet<[DropdownMenuItem]>;
	isSelected?: boolean;
}

export const DEFAULT_OPERATORS_LIST: OperatorItem[] = [
	{ value: 'Полностью совпадает со строкой', prefix: equalsIcon, key: DEFAULT_OPERATORS.equal, isSelected: true },
	{ value: 'Совпадает с началом строки', prefix: startOfLineIcon, key: DEFAULT_OPERATORS.start },
	{ value: 'Строка содержит совпадение', prefix: middleOfLineIcon, key: DEFAULT_OPERATORS.middle },
	{ value: 'Совпадает с концом строки', prefix: endOfLineIcon, key: DEFAULT_OPERATORS.end }
];
