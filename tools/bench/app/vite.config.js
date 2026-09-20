// Vite (NOT SvelteKit) production build of one benchmark scenario. Used by ../size.mjs (Vite JS API) and usable by hand:
//   BENCH_SCENARIO=s1 npx vite build --config tools/bench/app/vite.config.js
// vite / @sveltejs/vite-plugin-svelte / svelte are resolved from the ROOT node_modules on purpose (one Svelte runtime for
// the app and the library sources); react / react-dom come from tools/bench/node_modules.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const repo = path.resolve(here, '../../..');
export const LIB = path.join(repo, 'src/lib');
const LIB_JS = /[\\/]src[\\/]lib[\\/].*\.(svelte|ts|js)$/;

/** @param {string} name scenario folder name
 *  @param {{ dir?: string, sideEffects?: boolean, outDir?: string, cssMinify?: boolean | 'lightningcss' | 'esbuild', minify?: boolean }} [o] */
export function scenarioConfig(name, o = {}) {
	const root = o.dir ?? path.join(here, 'scenarios', name);
	return {
		root,
		base: './',
		configFile: false,
		logLevel: 'warn',
		clearScreen: false,
		plugins: [
			...(o.sideEffects != null
				? [{ name: 'bench-side-effects', enforce: 'post', transform: (code, id) => (LIB_JS.test(id) ? { code, map: null, moduleSideEffects: o.sideEffects } : null) }]
				: []),
			svelte({
				configFile: false,
				onwarn: () => {}, // the library's own compiler warnings (a11y ...) are not the benchmark's business
				// same rule as the repo svelte.config.js: runes mode for our sources, libraries in node_modules decide themselves
				compilerOptions: { runes: ({ filename }) => (filename.replace(/\\/g, '/').split('/').includes('node_modules') ? undefined : true) }
			})
		],
		resolve: {
			// the library is consumed from source, like a bundler would consume a package
			alias: [
				{ find: '@rt-ui', replacement: LIB },
				{ find: '$lib', replacement: LIB }
			],
			dedupe: ['svelte']
		},
		build: {
			outDir: o.outDir ?? path.join(here, 'dist', name),
			emptyOutDir: true,
			minify: o.minify ?? true, // JS: default minifier (oxc)
			cssMinify: o.cssMinify ?? 'lightningcss', // CSS: Lightning CSS (the Vite 8 default, set explicitly)
			sourcemap: false,
			reportCompressedSize: false,
			assetsInlineLimit: 0, // fonts stay separate files
			modulePreload: { polyfill: false },
			chunkSizeWarningLimit: 100000,
			// `sideEffects` (diagnostic only, scenario s1n): override the package.json "sideEffects" hint for everything under src/lib.
			// `true` = what a consumer gets from a package WITHOUT the field: every module is kept if the barrel imports it.
			rolldownOptions: {
				checks: { pluginTimings: false },
			}
		}
	};
}

export default scenarioConfig(process.env.BENCH_SCENARIO ?? 's1');
