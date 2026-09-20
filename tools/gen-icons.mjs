// Generate Svelte icon components from the (extracted) React icon modules.
//   design/react-src/packages/icons/dist/{24,16}/<group>/<Name>.js  ->  src/lib/icons/{24,16}/<group>/<Name>.svelte
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'design/react-src/packages/icons/dist');
const out = path.join(root, 'src/lib/icons');
fs.rmSync(out, { recursive: true, force: true }); // src/lib/icons is generated

const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const attrName = (k) => (['viewBox'].includes(k) ? k : kebab(k));

const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };

write(path.join(out, 'Icon.svelte'), `<script lang="ts">
	// Port of packages/icons Icon (24px, scalable). size <= 1 is a fraction of the parent ("100%").
	import type { Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
		size?: number;
		viewBox?: string;
		fill?: string;
		children?: Snippet;
	}

	let { size = 24, viewBox = '0 0 24 24', children, class: className, fill, style, ...rest }: Props = $props();

	const sizeStr = $derived(size <= 1 ? \`\${size * 100}%\` : size);
	const iconClass = $derived(\`atmr-icon \${className || ''}\`.trim());
	const iconStyle = $derived([fill != null ? \`fill: \${fill};\` : '', style ?? ''].filter(Boolean).join(' ') || undefined);
</script>

<svg
	class={iconClass}
	width={sizeStr}
	height={sizeStr}
	{viewBox}
	aria-hidden="true"
	xmlns="http://www.w3.org/2000/svg"
	style={iconStyle}
	{...rest}
>{@render children?.()}</svg>
`);

write(path.join(out, 'IconStatic16.svelte'), `<script lang="ts">
	// Port of packages/icons IconStatic16 (fixed 16px).
	import type { Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
		fill?: string;
		children?: Snippet;
	}

	let { children, class: className, fill, style, ...rest }: Props = $props();

	const iconClass = $derived(\`atmr-icon \${className || ''}\`.trim());
	const iconStyle = $derived([fill != null ? \`fill: \${fill};\` : '', style ?? ''].filter(Boolean).join(' ') || undefined);
</script>

<svg
	class={iconClass}
	width="16"
	height="16"
	viewBox="0 0 16 16"
	aria-hidden="true"
	xmlns="http://www.w3.org/2000/svg"
	style={iconStyle}
	{...rest}
>{@render children?.()}</svg>
`);

const all = [];
for (const size of ['24', '16']) {
  for (const group of fs.readdirSync(path.join(src, size))) {
    const dir = path.join(src, size, group);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'index.js')) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      const name = f.replace(/\.js$/, '');
      const paths = [...text.matchAll(/\.jsx\)?\("path", \{([\s\S]*?)\}\)/g)].map((m) => {
        const attrs = [...m[1].matchAll(/(\w+): "((?:[^"\\]|\\.)*)"/g)].map(([, k, v]) => `${attrName(k)}="${v}"`);
        return `\t<path ${attrs.join(' ')} />`;
      });
      const base = size === '16' ? 'IconStatic16' : 'Icon';
      const rel = '../../' + base + '.svelte';
      write(path.join(out, size, group, name + '.svelte'),
        `<script lang="ts">\n\timport Base from '${rel}';\n\tlet props: Record<string, any> = $props();\n</script>\n\n<Base {...props}>\n${paths.join('\n')}\n</Base>\n`);
      all.push({ size, group, name });
    }
  }
}

// barrel: flat names; on collision prefix the group
const count = {};
all.forEach((i) => (count[i.name] = (count[i.name] || 0) + 1));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const lines = all.map((i) => {
  const exported = count[i.name] > 1 ? `${cap(i.group)}${i.name}` : i.name;
  return `export { default as ${exported} } from './${i.size}/${i.group}/${i.name}.svelte';`;
});
write(path.join(out, 'index.ts'), `export { default as Icon } from './Icon.svelte';\nexport { default as IconStatic16 } from './IconStatic16.svelte';\n${lines.join('\n')}\n`);
console.log(`icons generated: ${all.length} (24: ${all.filter((i) => i.size === '24').length}, 16: ${all.filter((i) => i.size === '16').length}), name collisions: ${Object.values(count).filter((c) => c > 1).length}`);
