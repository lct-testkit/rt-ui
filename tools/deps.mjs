// Dependency graph between design-system units, derived from the extracted React sources.
// Output: tools/deps.json  { units: {name: {files, deps[], vendor[], level}}, stories: {dir: {units[], level}} }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'design/react-src');

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

function unitOf(rel) {
  let m;
  if ((m = rel.match(/^packages\/ui-kit\/src\/components\/([^/]+)/))) return `ui:${m[1]}`;
  if ((m = rel.match(/^packages\/ui-kit\/src\/(hooks|utils|constants)/))) return 'ui:_shared';
  if (/^packages\/icons/.test(rel)) return 'icons';
  if ((m = rel.match(/^packages\/(tablegird|tree|sidemenu|core|themes)/))) return `pkg:${m[1]}`;
  if ((m = rel.match(/^stories-app\/src\/stories\/([^/]+)/))) return `story:${m[1]}`;
  if (/^stories-app\/src\/utils/.test(rel)) return 'story:_utils';
  return null;
}

const units = {};
const norm = (s) => s.replace(/^(\.\.\/)+/, '').replace(/^\.\//, 'stories-app/');
for (const f of walk(srcDir)) {
  const rel = path.relative(srcDir, f).replace(/\\/g, '/');
  const u = unitOf(rel);
  if (!u) continue;
  const text = fs.readFileSync(f, 'utf8');
  const x = (units[u] ??= { files: [], deps: new Set(), vendor: new Set() });
  x.files.push(rel);
  for (const m of text.matchAll(/__webpack_require__\("([^"]+)"\)/g)) {
    const id = m[1];
    if (/node_modules/.test(id)) {
      const v = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/)?.[1];
      if (v && !/^(react|react-dom|scheduler|@babel|style-loader|css-loader|prop-types)$/.test(v)) x.vendor.add(v);
      continue;
    }
    const d = unitOf(norm(id));
    if (d && d !== u) x.deps.add(d);
  }
}

// levels (only over non-story units first)
const level = {};
const lv = (u, stack = []) => {
  if (level[u] !== undefined) return level[u];
  if (stack.includes(u)) return 0; // cycle guard
  const deps = [...(units[u]?.deps ?? [])].filter((d) => !d.startsWith('story:') && d !== 'icons' && d !== 'ui:_shared');
  return (level[u] = deps.length ? 1 + Math.max(...deps.map((d) => lv(d, [...stack, u]))) : 0);
};
Object.keys(units).filter((u) => !u.startsWith('story:')).forEach((u) => lv(u));

const out = { units: {}, stories: {} };
for (const [u, x] of Object.entries(units)) {
  const rec = { files: x.files.length, deps: [...x.deps].sort(), vendor: [...x.vendor].sort() };
  if (u.startsWith('story:')) {
    const need = rec.deps.filter((d) => !d.startsWith('story:'));
    out.stories[u.slice(6)] = { files: rec.files, needs: need, level: Math.max(0, ...need.map((d) => level[d] ?? 0)) };
  } else out.units[u] = { ...rec, level: level[u] ?? 0 };
}
fs.writeFileSync(path.join(root, 'tools/deps.json'), JSON.stringify(out, null, 1));

const byLevel = {};
for (const [u, x] of Object.entries(out.units)) (byLevel[x.level] ??= []).push(`${u}${x.deps.filter((d) => !['icons', 'ui:_shared'].includes(d)).length ? '←' + x.deps.filter((d) => !['icons', 'ui:_shared'].includes(d)).map((d) => d.replace('ui:', '')).join('+') : ''}`);
for (const [l, us] of Object.entries(byLevel)) console.log(`L${l}: ${us.join('  ')}`);
console.log('\nvendor libs:', Object.fromEntries(Object.entries(out.units).filter(([, x]) => x.vendor.length).map(([u, x]) => [u, x.vendor.join(',')])));
console.log('\nstory dirs:');
for (const [s, x] of Object.entries(out.stories)) console.log(`  ${s.padEnd(22)} L${x.level}  needs: ${x.needs.map((d) => d.replace('ui:', '')).join(' ')}`);
