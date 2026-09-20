// Port of packages/tree/src/components/Tree/modules/callbacks/{CallBacksContext,CallBacksProvider}.
//
// SEAM (events): `onCheck(checkedKeys, indeterminatedKeys)` and `onExpand(expandedKeys)`; both default to a no-op like in React
// (so `onExpand` is always "set": the expand button always reports the new expanded keys).
import { getContext, setContext } from 'svelte';
import { noop } from '../../../../utils/noop.js';
import type { TreeProps } from '../../types.js';

const CALLBACKS_KEY = Symbol('tree.callbacks');

export interface TreeCallbacksContext {
	readonly onCheck: NonNullable<TreeProps['onCheck']>;
	readonly onExpand: NonNullable<TreeProps['onExpand']>;
}

export function createCallbacksContext(getProps: () => TreeProps): TreeCallbacksContext {
	const context: TreeCallbacksContext = {
		get onCheck() {
			return getProps().onCheck ?? noop;
		},
		get onExpand() {
			return getProps().onExpand ?? noop;
		}
	};
	setContext(CALLBACKS_KEY, context);
	return context;
}

/** React `useContext(CallBacksContext)`. */
export const useTreeCallbacks = (): TreeCallbacksContext => getContext<TreeCallbacksContext>(CALLBACKS_KEY);
