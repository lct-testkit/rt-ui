// Type check of the LIBRARY only (src/lib): runs svelte-check for the whole project and fails on errors that are in src/lib.
// The playground (src/routes, src/stories: gallery, stories ported 1:1 from the reference) is not part of the package and has known type errors,
// so `npm run check` (everything) is informational, this one is the gate used by CI.
//
//   npm run check:lib
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['svelte-check', '--tsconfig', './tsconfig.json', '--threshold', 'error', '--output', 'machine'], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
if (!/COMPLETED/.test(out)) {
	console.error(out.slice(-3000));
	console.error('svelte-check did not complete');
	process.exit(2);
}
const errors = out.split('\n').filter((l) => / ERROR "/.test(l));
const lib = errors.filter((l) => /"src[\\/]+lib[\\/]/.test(l));
console.log(`svelte-check: ${errors.length} error(s) in the whole project, ${lib.length} in src/lib (the playground is ignored)`);
if (lib.length) {
	console.log(lib.join('\n'));
	process.exit(1);
}
