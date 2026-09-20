// Port of packages/tree/src/components/Tree/modules/disabled/{DisabledContext,DisabledProvider}.
//
// SEAM (disabled nodes): `disabledKeys` (`atmr-tree__item--disabled`, no expand / check / click).
import { getContext, setContext } from 'svelte';
import type { TreeProps } from '../../types.js';

const DISABLED_KEY = Symbol('tree.disabled');

export interface TreeDisabledContext {
	readonly disabledKeys: string[];
}

export function createDisabledContext(getProps: () => TreeProps): TreeDisabledContext {
	const context: TreeDisabledContext = {
		get disabledKeys() {
			return getProps().disabledKeys ?? [];
		}
	};
	setContext(DISABLED_KEY, context);
	return context;
}

/** React `useContext(DisabledContext)`. */
export const useTreeDisabled = (): TreeDisabledContext => getContext<TreeDisabledContext>(DISABLED_KEY);
