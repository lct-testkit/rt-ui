// List story ids for React story dirs (or explicit ids) and their status.
//   node tools/stories-of.mjs Badge Counter            -> ids of those dirs
//   node tools/stories-of.mjs --status Badge           -> + reference / svelte-story presence
//   node tools/stories-of.mjs --json Badge Counter
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(fs.readFileSync(path.join(root, '_mirror/gen2/react-storybook/index.json'), 'utf8')).entries;
const args = process.argv.slice(2);
const status = args.includes('--status');
const asJson = args.includes('--json');
const names = args.filter((a) => !a.startsWith('--'));

const stories = Object.values(index).filter((e) => e.type === 'story');
const dirOf = (e) => e.importPath.match(/^\.\/src\/stories\/([^/]+)\//)?.[1];

function hasSvelte(id) {
  const base = path.join(root, 'src/stories');
  if (!fs.existsSync(base)) return false;
  for (const d of fs.readdirSync(base, { withFileTypes: true })) if (d.isDirectory() && fs.existsSync(path.join(base, d.name, `${id}.svelte`))) return true;
  return false;
}

const picked = stories.filter((e) => names.length === 0 || names.includes(dirOf(e)) || names.includes(e.id));
const rows = picked.map((e) => ({
  id: e.id,
  dir: dirOf(e),
  file: e.importPath.replace('./src/stories/', 'design/react-src/stories-app/src/stories/'),
  ...(status ? { reference: fs.existsSync(path.join(root, 'design/reference', e.id, 'meta.json')), svelte: hasSvelte(e.id) } : {}),
}));
if (asJson) console.log(JSON.stringify(rows, null, 1));
else for (const r of rows) console.log(`${r.id}${status ? `  ref:${r.reference ? 'y' : 'N'} svelte:${r.svelte ? 'y' : '-'}` : ''}   ${r.file}`);
console.error(`${rows.length} stories`);
