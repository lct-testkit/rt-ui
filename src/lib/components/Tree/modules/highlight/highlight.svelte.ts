// Port of packages/tree/src/components/Tree/modules/highlight/{HighlightContext,HighlightProvider}.
//
// SEAM (highlighted nodes): `highlightedKeys` (`atmr-tree__item--highlighted`) and the index of the first highlighted row of the flat
// list (`highlightScrollIndex`, 0 when there is none).
import { getContext, setContext } from 'svelte';
import { useRows } from '../../../TableGrid/modules/rows/rows.svelte.js';
import type { TreeProps } from '../../types.js';

const HIGHLIGHT_KEY = Symbol('tree.highlight');

export interface TreeHighlightContext {
	readonly highlightedKeys: string[];
	readonly highlightScrollIndex: number;
}

export function createHighlightContext(getProps: () => TreeProps): TreeHighlightContext {
	const rows = useRows();
	const highlightedKeys = $derived(getProps().highlightedKeys ?? []);
	const highlightScrollIndex = $derived.by(() => {
		const flattedRows = rows.rows;
		if (flattedRows && flattedRows.length > 0 && highlightedKeys && highlightedKeys.length > 0) {
			const indexes: number[] = [];
			highlightedKeys.forEach((key) => {
				const keyIndex = flattedRows.findIndex((row) => row.id === key);
				if (keyIndex >= 0) {
					indexes.push(keyIndex);
				}
			});
			return indexes.sort((a, b) => a - b)[0];
		}
		return 0;
	});
	const context: TreeHighlightContext = {
		get highlightedKeys() {
			return highlightedKeys;
		},
		get highlightScrollIndex() {
			return highlightScrollIndex;
		}
	};
	setContext(HIGHLIGHT_KEY, context);
	return context;
}

/** React `useContext(HighlightContext)`. */
export const useTreeHighlight = (): TreeHighlightContext => getContext<TreeHighlightContext>(HIGHLIGHT_KEY);
