// Port of shared/config/{ConfigContext,ConfigProvider,hooks/useConfig,hooks/useConfigEnabledModes}.
//
// SEAM: the config context is the only thing every other module needs. It exposes
//   * `config`  - the raw TableGrid props (reactive; React passed `props` as `config`, so defaults are NOT applied here),
//   * `modes`   - which features are switched on by the props (`isSelectionModeEnabled` ...),
//   * `cache` / `setCache` - state that must survive re-mounts of nested tables (expanded rows, highlighted row, user layout of a
//     table's columns). Only the outermost table owns the cache, nested tables read and write the parent's one.
import { getContext, setContext } from 'svelte';
import type { TableGridProps } from '../../types.js';

const CONFIG_KEY = Symbol('tablegrid.config');

export interface EnabledModes {
	isExpandableModeEnabled: boolean;
	isSelectionModeEnabled: boolean;
	// columnConfig flags are passed through untouched (React: `draggable={isDndModeEnabled}` renders draggable="false" for `false`
	// and no attribute for `undefined`)
	isResizeModeEnabled: boolean | undefined;
	isDndModeEnabled: boolean | undefined;
	isFilterModeEnabled: boolean | undefined;
	isSortingModeEnabled: boolean | undefined;
}

export interface ConfigContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly config: TableGridProps<any>;
	readonly modes: EnabledModes;
	readonly cache: Record<string, unknown>;
	setCache(key: string, value: unknown): void;
}

/** Creates the config context of one TableGrid (call once, during component initialisation, before any other module). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createConfigContext(getConfig: () => TableGridProps<any>): ConfigContext {
	const parent = getContext<ConfigContext | undefined>(CONFIG_KEY);
	let ownCache = $state.raw<Record<string, unknown>>({});

	const modes = $derived.by<EnabledModes>(() => {
		const { rowConfig, columnConfig } = getConfig();
		return {
			isExpandableModeEnabled: !!rowConfig?.expand,
			isSelectionModeEnabled: !!rowConfig?.selection,
			isResizeModeEnabled: columnConfig?.resize,
			isDndModeEnabled: columnConfig?.move,
			isFilterModeEnabled: columnConfig?.filter,
			isSortingModeEnabled: columnConfig?.sorting
		};
	});

	const context: ConfigContext = {
		get config() {
			return getConfig();
		},
		get modes() {
			return modes;
		},
		get cache() {
			return parent ? parent.cache : ownCache;
		},
		setCache(key, value) {
			if (parent) parent.setCache(key, value);
			else ownCache = { ...ownCache, [key]: value };
		}
	};
	setContext(CONFIG_KEY, context);
	return context;
}

/** `useConfig()` of React: `{ config, modes, cache, setCache }`. */
export const useConfig = (): ConfigContext => getContext<ConfigContext>(CONFIG_KEY);

const modesViews = new WeakMap<ConfigContext, EnabledModes>();

/**
 * `useConfigEnabledModes()` of React. Returns a LIVE view (one object per table): read the flags where they are used
 * (template / `$derived`), do not destructure them at component initialisation (that would freeze the value).
 */
export const useConfigEnabledModes = (): EnabledModes => {
	const context = useConfig();
	let view = modesViews.get(context);
	if (!view) {
		view = {
			get isExpandableModeEnabled() {
				return context.modes.isExpandableModeEnabled;
			},
			get isSelectionModeEnabled() {
				return context.modes.isSelectionModeEnabled;
			},
			get isResizeModeEnabled() {
				return context.modes.isResizeModeEnabled;
			},
			get isDndModeEnabled() {
				return context.modes.isDndModeEnabled;
			},
			get isFilterModeEnabled() {
				return context.modes.isFilterModeEnabled;
			},
			get isSortingModeEnabled() {
				return context.modes.isSortingModeEnabled;
			}
		};
		modesViews.set(context, view);
	}
	return view;
};
