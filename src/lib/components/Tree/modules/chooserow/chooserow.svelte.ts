// Port of packages/tree/src/components/Tree/modules/chooserow/{ChooseRowContext,ChooseRowProvider}.
//
// SEAM (the "selected" node): the key of the node whose title was clicked (`atmr-tree__item--selected`); reported to `onClick(key)`.
import { getContext, setContext } from 'svelte';
import type { TreeProps } from '../../types.js';

const CHOOSE_ROW_KEY = Symbol('tree.chooseRow');

export interface TreeChooseRowContext {
	readonly rowKey: string;
	onChoose(key?: string): void;
}

export function createChooseRowContext(getProps: () => TreeProps): TreeChooseRowContext {
	let rowKey = $state('');
	const context: TreeChooseRowContext = {
		get rowKey() {
			return rowKey;
		},
		onChoose(key = '') {
			rowKey = key;
			getProps().onClick?.(key);
		}
	};
	setContext(CHOOSE_ROW_KEY, context);
	return context;
}

/** React `useContext(ChooseRowContext)`. */
export const useTreeChooseRow = (): TreeChooseRowContext => getContext<TreeChooseRowContext>(CHOOSE_ROW_KEY);
