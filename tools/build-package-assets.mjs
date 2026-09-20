// Post-step of `npm run package` (runs AFTER `svelte-package`, which fills dist/ from src/lib).
//
//   1. dist/styles/rt-ui.min.css            base + components + tablegrid + tree + side-menu + top-menu  (NO themes, NO fonts), minified
//   2. dist/styles/themes/<theme>.min.css    every theme file, minified
//   3. dist/styles/fonts/*.woff|woff2        the licensed Rostelecom Basis files (git-ignored, present only locally) — copied
//                                            from src/lib/styles/fonts if svelte-package did not already put them there;
//                                            missing files are NOT an error (warning only)
//   4. dist/styles/index.d.ts                `export {}` so that `import '<pkg>/styles'` type-checks under
//                                            noUncheckedSideEffectImports (TypeScript 6 default)
//   5. dist/**/*.d.ts                        side-effect-only CSS imports (`import './ext.css'`, emitted by the declaration
//                                            generator) are removed: they cannot be resolved by TypeScript and mean nothing in a .d.ts
//   6. guards                                the author's extension keeps its MOTION CSS (dist/ext/ext.css) out of every consumer that does not use the
//                                            extension: only dist/ext/index.js and dist/ext/ExtMotionProvider.svelte may import it, and nothing of it may
//                                            end up in rt-ui.min.css. The tiny always-safe layout parts (dist/ext/layout-modal.css / layout-drawer.css: `fullHeight`)
//                                            are imported by Modal / Drawer themselves and ARE part of rt-ui.min.css. The build fails when a guard is violated.
//
// The unminified files stay in place (Vite/Rollup minify CSS in the consumer's production build anyway; the .min.css copies are for
// consumers without a bundler: <link rel="stylesheet" href=".../rt-ui.min.css">).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcStyles = path.join(root, 'src/lib/styles');
const dist = path.join(root, 'dist/styles');
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

if (!fs.existsSync(dist)) {
	console.error('build-package-assets: dist/styles not found — run `svelte-package` first (npm run package does both).');
	process.exit(1);
}

function minify(filename, code) {
	const res = transform({ filename, code: Buffer.from(code), minify: true, sourceMap: false });
	for (const w of res.warnings ?? []) console.warn(`  css warning in ${filename}: ${w.message}`);
	return res.code;
}

function write(rel, code, label) {
	const out = path.join(dist, rel);
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, code);
	console.log(`  ${rel.padEnd(38)} ${kb(code.length).padStart(10)}  gzip ${kb(gz(code)).padStart(9)}${label ? '  ' + label : ''}`);
}

// 1. component bundle (cascade order of index.css minus themes and fonts; base is the last layer)
const parts = ['components.css', 'tablegrid.css', 'tree.css', 'side-menu.css', 'top-menu.css', 'base.css'];
for (const p of parts) if (!fs.existsSync(path.join(dist, p))) throw new Error(`dist/styles/${p} is missing`);
// + the extension's always-safe layout rules (Drawer / Modal `fullHeight`: they need a modifier class that only the opt-in prop adds), so a `<link>` consumer has them too.
// NOT ext.css: that one is motion-only and stays out of the bundle (see the guards at the end of this file).
const layoutFiles = ['ext/layout-modal.css', 'ext/layout-drawer.css'].map((f) => path.join(root, 'dist', f)).filter((f) => fs.existsSync(f));
const NL = String.fromCharCode(10);
const bundle =
	parts.map((p) => `/* ${p} */${NL}` + fs.readFileSync(path.join(dist, p), 'utf8')).join(NL) +
	layoutFiles.map((f) => `${NL}/* ext/${path.basename(f)} */${NL}` + fs.readFileSync(f, 'utf8')).join('');
console.log('minified CSS:');
write('rt-ui.min.css', minify('rt-ui.css', bundle), parts.join(' + ') + layoutFiles.map((f) => ' + ext/' + path.basename(f)).join(''));

// 2. themes
const themesDir = path.join(dist, 'themes');
const themes = fs.existsSync(themesDir) ? fs.readdirSync(themesDir).filter((f) => f.endsWith('.css') && !f.endsWith('.min.css')) : [];
if (!themes.length) console.warn('WARNING: no theme files in dist/styles/themes');
for (const f of themes) write(`themes/${f.replace(/\.css$/, '.min.css')}`, minify(f, fs.readFileSync(path.join(themesDir, f), 'utf8')));

// 3. fonts (licensed, git-ignored)
const fontsSrc = path.join(srcStyles, 'fonts');
const fontsDist = path.join(dist, 'fonts');
const isFont = (f) => /\.(woff2?|ttf|otf)$/i.test(f);
fs.mkdirSync(fontsDist, { recursive: true });
if (fs.existsSync(fontsSrc)) {
	for (const f of fs.readdirSync(fontsSrc).filter(isFont)) {
		const to = path.join(fontsDist, f);
		if (!fs.existsSync(to)) fs.copyFileSync(path.join(fontsSrc, f), to);
	}
}
const fonts = fs.readdirSync(fontsDist).filter(isFont);
if (fonts.length) {
	const total = fonts.reduce((s, f) => s + fs.statSync(path.join(fontsDist, f)).size, 0);
	console.log(`fonts: ${fonts.length} files in dist/styles/fonts (${kb(total)}) — licensed by Rostelecom: keep this package PRIVATE`);
} else {
	console.warn(
		'WARNING: no font files (RostelecomBasis-{Light,Regular,Medium,Bold}.woff2/.woff) in src/lib/styles/fonts — the package is built WITHOUT the\n' +
			'         licensed font. fonts.css still references ./fonts/*, so the consumer must put the files into dist/styles/fonts (or override the\n' +
			"         @font-face rules / --atmr-font-family-body). See docs/PACKAGE.md 'Шрифты'."
	);
	fs.writeFileSync(path.join(fontsDist, '.gitkeep'), '');
}

// 4. type stub for the CSS entry
fs.writeFileSync(path.join(dist, 'index.d.ts'), '// Side-effect-only entry (all component CSS + themes + base + fonts).\nexport {};\n');

// 5. strip `import './x.css';` from declaration files
let stripped = 0;
(function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p);
		else if (e.name.endsWith('.d.ts')) {
			const src = fs.readFileSync(p, 'utf8');
			const out = src.replace(/^import\s+['"][^'"]+\.css['"];?[\r\n]*/gm, '');
			if (out !== src) (fs.writeFileSync(p, out), stripped++);
		}
	}
})(path.join(root, 'dist'));
if (stripped) console.log(`stripped CSS side-effect imports from ${stripped} .d.ts file(s)`);

// 6. guards: the motion CSS of the extension reaches a consumer only through the extension entry / ExtMotionProvider
const failures = [];
const MOTION_CSS_IMPORT = /import\s+['"][^'"]*\/ext\.css['"]|import\s+['"]\.\/ext\.css['"]/;
const ALLOWED = new Set(['ext/index.js', 'ext/ExtMotionProvider.svelte']);
(function scan(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (e.name !== 'styles') scan(p);
		} else if (/\.(js|svelte)$/.test(e.name)) {
			const rel = path.relative(path.join(root, 'dist'), p).split(path.sep).join('/');
			if (MOTION_CSS_IMPORT.test(fs.readFileSync(p, 'utf8')) && !ALLOWED.has(rel)) failures.push(`dist/${rel} imports the motion-only ext.css`);
		}
	}
})(path.join(root, 'dist'));
const minBundle = fs.readFileSync(path.join(dist, 'rt-ui.min.css'), 'utf8');
for (const marker of ['rt-ext-wizard-step', 'rt-ext-toast', 'rt-ext-tabs', 'rt-ext-side-menu']) {
	if (minBundle.includes(marker)) failures.push(`rt-ui.min.css contains motion CSS (${marker})`);
}
for (const f of ['ext/ext.css', 'ext/layout-modal.css', 'ext/layout-drawer.css']) if (!fs.existsSync(path.join(root, 'dist', f))) failures.push(`dist/${f} is missing`);
if (failures.length) {
	console.error(['build-package-assets: extension CSS guards FAILED:', ...failures.map((f) => '  ' + f)].join('\n'));
	process.exit(1);
}
console.log('extension CSS guards: ok (ext.css only from ext/index.js + ExtMotionProvider.svelte; rt-ui.min.css has no motion CSS)');

console.log('build-package-assets: done');
