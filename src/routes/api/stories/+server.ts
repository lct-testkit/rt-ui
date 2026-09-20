// Live inventory for /gallery: every reference story + whether we have a Svelte story for it + last compare result.
import { json } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const root = process.cwd();
let known: Set<string> | null = null;

function walk(dir: string, out: { file: string; mtime: number }[] = []) {
	if (!fs.existsSync(dir)) return out;
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (e.name.endsWith('.svelte')) out.push({ file: p, mtime: fs.statSync(p).mtimeMs });
	}
	return out;
}

export function GET() {
	const index = JSON.parse(fs.readFileSync(path.join(root, '_mirror/gen2/react-storybook/index.json'), 'utf8')).entries as Record<string, any>;

	const impl = new Map<string, { mtime: number; dir: string }>();
	for (const f of walk(path.join(root, 'src/stories'))) {
		const id = path.basename(f.file, '.svelte');
		if (id.startsWith('_') || !id.includes('--')) continue;
		impl.set(id, { mtime: f.mtime, dir: path.basename(path.dirname(f.file)) });
	}

	// vite's import.meta.glob (used by /story/[id]) does not notice new files by itself -> nudge the route when a new story shows up
	// (compare.py calls this endpoint before every run, the gallery polls it — so nobody has to touch the route by hand)
	const fresh = [...impl.keys()].filter((id) => !known || !known.has(id));
	let nudged = false;
	if (fresh.length) {
		try { const t = new Date(); fs.utimesSync(path.join(root, 'src/routes/story/[id]/+page.svelte'), t, t); nudged = true; } catch { /* ignore */ }
	}
	known = new Set(impl.keys());

	const statusDir = path.join(root, 'design/diff/status');
	const status: Record<string, any> = {};
	if (fs.existsSync(statusDir)) {
		for (const f of fs.readdirSync(statusDir)) {
			try { status[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(statusDir, f), 'utf8')); } catch { /* mid-write */ }
		}
	}

	const stories = Object.values(index)
		.filter((e) => e.type === 'story')
		.map((e) => {
			const i = impl.get(e.id);
			const refStates = fs.existsSync(path.join(root, 'design/reference', e.id))
				? fs.readdirSync(path.join(root, 'design/reference', e.id)).filter((n) => n.endsWith('.png')).map((n) => n.replace(/\.png$/, ''))
				: [];
			return { id: e.id, title: e.title as string, name: e.name as string, implemented: !!i, mtime: i?.mtime ?? 0, status: status[e.id] ?? null, states: refStates };
		});

	return json({ generatedAt: Date.now(), nudged, stories }, { headers: { 'cache-control': 'no-store' } });
}
