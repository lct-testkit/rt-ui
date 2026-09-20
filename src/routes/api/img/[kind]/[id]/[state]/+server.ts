// Serves reference / our last failing screenshot / diff overlay PNGs to the gallery.
import { error } from '@sveltejs/kit';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

export function GET({ params }: { params: { kind: string; id: string; state: string } }) {
	const { kind, id, state } = params;
	if (!/^[\w-]+$/.test(id) || !/^[\w-]+$/.test(state)) throw error(400, 'bad id');
	const root = process.cwd();
	const file =
		kind === 'ref' ? path.join(root, 'design/reference', id, `${state}.png`)
		: kind === 'ours' ? path.join(root, 'design/diff', id, `${state}.ours.png`)
		: kind === 'diff' ? path.join(root, 'design/diff', id, `${state}.diff.png`)
		: null;
	if (!file || !fs.existsSync(file)) throw error(404, 'no image');
	return new Response(fs.readFileSync(file), { headers: { 'content-type': 'image/png', 'cache-control': 'no-cache' } });
}
