// Generate ALL Svelte icon components (tokens-icons group).
//
// tools/gen-icons.mjs only sees the icon modules webpack emitted as separate files
// (design/react-src/packages/icons/dist/**). Most icons were concatenated INTO the Icons/24 and Icons/16 story chunks
// (`;// ../../packages/icons/dist/24/action/Attachment.js` sections), and gen-icons.mjs also drops non-literal attributes
// (`fill`/`secondaryColor` defaults of the coloured icons) and non-<path> children (`<g>`, `<defs>`, text ",").
//
// This script parses both sources with acorn and writes
//   src/lib/icons/{24,16}/<group>/<Name>.svelte          (only when the content changed; nothing is ever deleted)
//   src/lib/icons/index.ts                               (same naming rules as gen-icons.mjs)
//   src/stories/Icons/_packs/<size>-<group>.ts           (ordered `{ Name: Component }` of every icon story = webpack namespace object)
//
// Run after tools/gen-icons.mjs (which wipes src/lib/icons):  node tools/gen-icons-full.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'design/react-src/packages/icons/dist');
const storyDir = path.join(root, 'design/react-src/stories-app/src/stories/Icons');
// ICONS_OUT_DIR=<dir> writes everything below <dir> instead (dry run / diffing): <dir>/icons, <dir>/packs
const dry = process.env.ICONS_OUT_DIR;
const outLib = dry ? path.join(dry, 'icons') : path.join(root, 'src/lib/icons');
const outPacks = dry ? path.join(dry, 'packs') : path.join(root, 'src/stories/Icons/_packs');

let written = 0;
function write(file, text) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return;
	fs.writeFileSync(file, text);
	written++;
}

// webpack module bodies look like `(__unused_webpack_module, __webpack_exports__, __webpack_require__) {\n ... `
// (no closing brace when the chunk trailer was cut) - wrap them into a function declaration to parse them.
function parseModule(text) {
	const comments = [];
	const src = 'function __f' + text.replace(/\/\*\*\*\/ \}\s*\}\]\);\s*$/, '') + '\n}';
	const ast = acorn.parse(src, {
		ecmaVersion: 'latest',
		sourceType: 'script',
		onComment: (block, t, start, end) => comments.push({ block, t, start, end })
	});
	return { src, ast, comments };
}

const kebab = (k) => (k === 'viewBox' ? k : k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()));
const usedAttrs = new Set();

// ---- component function -> svelte -------------------------------------------------------------------------------------
function convert(fn, src, file) {
	if (fn.body.type !== 'BlockStatement') throw new Error(`${file}: expression-bodied component`);
	const decls = [];
	let ret = null;
	let rootBase = null; // which icon base the React component renders: `Icon` (24 viewBox, `size`) or `IconStatic16` (fixed 16 viewBox)
	for (const st of fn.body.body) {
		if (st.type === 'ReturnStatement') ret = st.argument;
		else if (st.type === 'VariableDeclaration') {
			for (const d of st.declarations) {
				if (d.id.type !== 'ObjectPattern' || !(d.init && d.init.type === 'Identifier' && d.init.name === 'props'))
					throw new Error(`${file}: unsupported declaration ${src.slice(st.start, st.end)}`);
				for (const p of d.id.properties) {
					if (p.type !== 'Property' || p.key.type !== 'Identifier') throw new Error(`${file}: unsupported pattern property`);
					const key = p.key.name;
					if (p.value.type === 'Identifier') decls.push(`const ${p.value.name} = $derived(props.${key});`);
					else if (p.value.type === 'AssignmentPattern' && p.value.left.type === 'Identifier')
						decls.push(
							`const ${p.value.left.name} = $derived(props.${key} === undefined ? (${src.slice(p.value.right.start, p.value.right.end)}) : props.${key});`
						);
					else throw new Error(`${file}: unsupported pattern value`);
				}
			}
		} else throw new Error(`${file}: unsupported statement ${st.type}`);
	}
	if (!ret) throw new Error(`${file}: no return`);

	const isJsx = (n) =>
		n.type === 'CallExpression' &&
		n.callee.type === 'SequenceExpression' &&
		n.callee.expressions.length === 2 &&
		n.callee.expressions[1].type === 'MemberExpression' &&
		/^jsxs?$/.test(n.callee.expressions[1].property.name);
	const attrVal = (v) => {
		if (v.type === 'Literal' && typeof v.value === 'string') return { lit: v.value };
		if (v.type === 'Identifier') return { expr: v.name };
		return { expr: src.slice(v.start, v.end) };
	};
	const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

	function children(node, indent, out) {
		if (node.type === 'ArrayExpression') node.elements.forEach((e) => children(e, indent, out));
		else if (node.type === 'Literal' && typeof node.value === 'string') out.push(`${indent}{${JSON.stringify(node.value)}}`);
		else if (isJsx(node)) out.push(element(node, indent, false));
		else throw new Error(`${file}: unsupported child ${node.type}`);
	}
	function element(node, indent, isRoot) {
		const [tagNode, propsNode] = node.arguments;
		const tag = tagNode.type === 'Literal' ? tagNode.value : 'Base';
		if (isRoot) {
			const n = tagNode.type === 'MemberExpression' && tagNode.object.type === 'Identifier' ? tagNode.object.name : '';
			rootBase = /IconStatic16/.test(n) ? 'IconStatic16' : /^_?Icon(_js)?$/.test(n) ? 'Icon' : null;
		}
		if (isRoot && tag !== 'Base') throw new Error(`${file}: root is not Icon`);
		const attrs = [];
		let kids = null;
		for (const p of propsNode.properties) {
			if (p.type === 'SpreadElement') {
				if (!(p.argument.type === 'Identifier' && p.argument.name === 'props')) throw new Error(`${file}: unsupported spread`);
				attrs.push('{...props}');
				continue;
			}
			const key = p.key.name ?? p.key.value;
			if (key === 'children') {
				kids = p.value;
				continue;
			}
			usedAttrs.add(key);
			const name = kebab(key);
			const v = p.shorthand ? { expr: key } : attrVal(p.value);
			attrs.push(v.lit !== undefined ? `${name}="${esc(v.lit)}"` : v.expr === name ? `{${name}}` : `${name}={${v.expr}}`);
		}
		const open = `${indent}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
		if (!kids) return open + ' />';
		const inner = [];
		children(kids, indent + '\t', inner);
		return `${open}>\n${inner.join('\n')}\n${indent}</${tag}>`;
	}
	const body = element(ret, '', true);
	return { decls, body, base: rootBase };
}

// ---- collect component functions from a webpack module (dist file or story chunk) ---------------------------------------------
function collectComponents(text) {
	const { src, ast, comments } = parseModule(text);
	const found = new Map(); // identifier -> { fn, src, header }
	const body = ast.body[0].body.body;
	for (const st of body) {
		if (st.type !== 'VariableDeclaration') continue;
		for (const d of st.declarations) {
			if (
				d.init &&
				d.init.type === 'ArrowFunctionExpression' &&
				d.id.type === 'Identifier' &&
				d.init.params.length === 1 &&
				d.init.params[0].name === 'props'
			) {
				let header = null; // nearest ";// ../../packages/icons/dist/24/action/X.js" comment before this statement
				for (const c of comments) {
					if (c.end > st.start) break;
					const m = /packages\/icons\/dist\/(\d+)\/(\w+)\/(\w+)\.js\s*$/.exec(c.t);
					if (m && !c.block) header = { size: m[1], group: m[2], file: m[3] };
				}
				found.set(d.id.name, { fn: d.init, src, header });
			}
		}
	}
	return { found, src, ast };
}

const icons = new Map(); // "size/group/file" -> { size, group, file, svelte }
function addIcon(size, group, file, info) {
	const key = `${size}/${group}/${file}`;
	if (icons.has(key)) return key;
	const { decls, body, base: rootBase } = convert(info.fn, info.src, key);
	// the base comes from the React component itself (a few `16` icons are built on the scalable `Icon`, e.g. PeopleWait16)
	const base = rootBase ?? (size === '16' ? 'IconStatic16' : 'Icon');
	const script = [`\timport Base from '../../${base}.svelte';`, `\tlet props: Record<string, any> = $props();`, ...decls.map((d) => '\t' + d)].join('\n');
	// React DOM creates every child of an <svg> in the SVG namespace, also a stray HTML tag (ScriptColor has a `<span>2312312312</span>`
	// between the paths). Svelte infers the HTML namespace for such a mixed fragment and the <path>s would not render, so foreign tags are
	// emitted as <svelte:element> (which takes the component namespace) and the component gets namespace="svg".
	const SVG_TAGS = new Set(['path', 'g', 'defs', 'clipPath', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'mask', 'linearGradient', 'radialGradient', 'stop', 'use', 'text', 'tspan', 'symbol', 'pattern', 'filter']);
	const foreign = [...new Set([...body.matchAll(/<([a-zA-Z][\w-]*)/g)].map((m) => m[1]))].filter((n) => n !== 'Base' && !SVG_TAGS.has(n));
	let svgBody = body;
	for (const n of foreign) svgBody = svgBody.replaceAll(`<${n}`, `<svelte:element this={${JSON.stringify(n)}}`).replaceAll(`</${n}>`, '</svelte:element>');
	const options = foreign.length ? '<svelte:options namespace="svg" />\n\n' : '';
	icons.set(key, { size, group, file, svelte: `${options}<script lang="ts">\n${script}\n</script>\n\n${svgBody}\n` });
	return key;
}

// 1) separately emitted modules
for (const size of ['24', '16']) {
	for (const group of fs.readdirSync(path.join(dist, size))) {
		const dir = path.join(dist, size, group);
		if (!fs.statSync(dir).isDirectory()) continue;
		for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'index.js')) {
			const { found } = collectComponents(fs.readFileSync(path.join(dir, f), 'utf8'));
			const name = f.replace(/\.js$/, '');
			const info = found.get(name) ?? [...found.values()][0];
			if (!info) throw new Error('no component in ' + f);
			addIcon(size, group, name, info);
		}
	}
}

// 2) story chunks: inline (concatenated) modules + namespace objects
const packs = []; // { size, group, entries: [{ name, key }] }
for (const size of ['24', '16']) {
	const text = fs.readFileSync(path.join(storyDir, `Icons${size}.stories.tsx`), 'utf8');
	const { found, ast } = collectComponents(text);
	const body = ast.body[0].body.body;
	const ext = new Map(); // var X = __webpack_require__("../../packages/icons/dist/24/action/X.js")
	const alias = new Map(); // X_default -> X
	for (const st of body) {
		if (st.type !== 'VariableDeclaration') continue;
		for (const d of st.declarations) {
			if (!d.init) continue;
			if (d.init.type === 'CallExpression' && d.init.callee.name === '__webpack_require__' && d.init.arguments[0]?.type === 'Literal') {
				const m = /packages\/icons\/dist\/(\d+)\/(\w+)\/(\w+)\.js$/.exec(d.init.arguments[0].value);
				if (m) ext.set(d.id.name, { size: m[1], group: m[2], file: m[3] });
			} else if (d.init.type === 'Identifier' && d.id.type === 'Identifier') alias.set(d.id.name, d.init.name);
		}
	}
	for (const info of found.values()) if (info.header) addIcon(info.header.size, info.header.group, info.header.file, info);

	// __webpack_require__.d(<group>_namespaceObject, { Key: () => (Ident) })
	const calls = body.filter(
		(st) =>
			st.type === 'ExpressionStatement' &&
			st.expression.type === 'CallExpression' &&
			st.expression.callee.type === 'MemberExpression' &&
			st.expression.callee.property.name === 'd' &&
			st.expression.arguments[0]?.name?.endsWith('_namespaceObject')
	);
	for (const c of calls) {
		const nsName = c.expression.arguments[0].name;
		const group = nsName.replace(/_namespaceObject$/, '');
		const entries = [];
		for (const p of c.expression.arguments[1].properties) {
			const key = p.key.name ?? p.key.value;
			const ref = p.value.body;
			let key2;
			if (ref.type === 'MemberExpression') {
				const e = ext.get(ref.object.name);
				if (!e) throw new Error(`namespace ${nsName}.${key}: unknown external ${ref.object.name}`);
				key2 = `${e.size}/${e.group}/${e.file}`;
				if (!icons.has(key2)) throw new Error(`namespace ${nsName}.${key}: missing dist module ${key2}`);
			} else if (ref.type === 'Identifier') {
				const comp = alias.get(ref.name) ?? ref.name;
				const info = found.get(comp);
				if (!info?.header) throw new Error(`namespace ${nsName}.${key}: no inline module for ${ref.name}`);
				key2 = `${info.header.size}/${info.header.group}/${info.header.file}`;
			} else throw new Error(`namespace ${nsName}.${key}: unsupported getter ${ref.type}`);
			entries.push({ name: key, key: key2 });
		}
		packs.push({ size, group, entries });
	}
}

// ---- write ---------------------------------------------------------------------------------------------------------------
for (const i of icons.values()) write(path.join(outLib, i.size, i.group, i.file + '.svelte'), i.svelte);

// barrel (same rules as gen-icons.mjs)
const all = [...icons.values()].sort((a, b) =>
	a.size === b.size ? (a.group + '/' + a.file < b.group + '/' + b.file ? -1 : 1) : a.size < b.size ? 1 : -1
);
const count = {};
all.forEach((i) => (count[i.file] = (count[i.file] || 0) + 1));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const lines = all.map((i) => `export { default as ${count[i.file] > 1 ? cap(i.group) + i.file : i.file} } from './${i.size}/${i.group}/${i.file}.svelte';`);
write(
	path.join(outLib, 'index.ts'),
	`export { default as Icon } from './Icon.svelte';\nexport { default as IconStatic16 } from './IconStatic16.svelte';\n${lines.join('\n')}\n`
);

// story packs
for (const p of packs) {
	const imports = p.entries.map((e, n) => `import I${n} from '$lib/icons/${e.key}.svelte';`);
	const objs = p.entries.map((e, n) => `\t${JSON.stringify(e.name)}: I${n}`);
	write(
		path.join(outPacks, `${p.size}-${p.group}.ts`),
		`// GENERATED by tools/gen-icons-full.mjs - webpack namespace object of packages/icons/dist/${p.size}/${p.group}/index.js (order kept)\n${imports.join('\n')}\n\nexport default {\n${objs.join(',\n')}\n};\n`
	);
}
const perSize = (s) =>
	packs
		.filter((p) => p.size === s)
		.map((p) => `${p.group}:${p.entries.length}`)
		.join(' ');
console.log(
	`icons: ${icons.size} (24: ${[...icons.values()].filter((i) => i.size === '24').length}, 16: ${[...icons.values()].filter((i) => i.size === '16').length}); files written/changed: ${written}`
);
console.log('24 packs:', perSize('24'));
console.log('16 packs:', perSize('16'));
console.log('attribute keys used:', [...usedAttrs].sort().join(', '));
