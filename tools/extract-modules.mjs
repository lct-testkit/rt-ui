// Split the (unminified) webpack chunks of the mirrored Storybook into one file per module.
//   workspace packages -> design/react-src/<path>     (ui-kit, icons, table-grid, stories ...)
//   node_modules       -> design/react-vendor/<path>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mirror = path.join(root, '_mirror/gen2/react-storybook');
const outSrc = path.join(root, 'design/react-src');
const outVendor = path.join(root, 'design/react-vendor');
fs.mkdirSync(outSrc, { recursive: true });
fs.mkdirSync(outVendor, { recursive: true }); // files are overwritten in place

const header = /^\/\*\*\*\/ "((?:[^"\\]|\\.)+)"\r?$/gm;
const seen = new Set();

// Strip transpiler noise so the React sources are pleasant to read: babel helpers, docgen blocks, webpack suffixes.
function clean_src(body) {
  return body
    .replace(/^function (?:_[A-Za-z0-9_]+|asyncGeneratorStep)\([^\n]*\{\n[\s\S]*?^\}\n/gm, '')
    .replace(/\ntry \{\s*\n\s*\/\/ @ts-ignore\n\s*\w+\.displayName[\s\S]*?catch \(__react_docgen_typescript_loader_error\) \{\s*\}\s*/g, '\n')
    .replace(/__WEBPACK_IMPORTED_MODULE_\d+__/g, '')
    .replace(/\/\*#__PURE__\*\/|\/\* @__PURE__ \*\//g, '')
    .replace(/^\/\* harmony export \*\/.*\n/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}
let files = 0, dup = 0;

for (const f of fs.readdirSync(mirror).filter(n => n.endsWith('.iframe.bundle.js'))) {
  const text = fs.readFileSync(path.join(mirror, f), 'utf8');
  const marks = [...text.matchAll(header)].map(m => ({ id: m[1], start: m.index, bodyStart: m.index + m[0].length }));
  marks.forEach((m, i) => {
    let body = text.slice(m.bodyStart, i + 1 < marks.length ? marks[i + 1].start : text.length);
    body = body.replace(/\s*\/\*\*\*\/ \},?\s*$/, '\n').replace(/^\r?\n/, '');
    const id = m.id;
    if (/^(webpack|data:|\(webpack\))/.test(id) || id.includes('?')) return;
    if (seen.has(id)) { dup++; return; }
    seen.add(id);
    let clean = id.replace(/^(\.\.\/)+/, '').replace(/^\.\//, 'stories-app/').replace(/[:*"<>|]/g, '_');
    const isVendor = /node_modules\//.test(id);
    if (isVendor) clean = clean.replace(/^.*?node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?/, '');
    const target = path.join(isVendor ? outVendor : outSrc, clean);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, isVendor ? body : clean_src(body));
    files++;
  });
}
console.log(`modules written: ${files}, duplicates skipped: ${dup}`);
