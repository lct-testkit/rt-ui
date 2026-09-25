import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

// Линтим библиотеку (src/lib); playground (src/routes, src/stories) и tools/ не публикуются.
//
// Это порт React-библиотеки, поэтому правила стиля/типизации, шумящие на тысячах строк порта, выключены
// осознанно (причины ниже). Правила корректности включены как warning'и с ХРАПОВИКОМ: `npm run lint` запускает
// ESLint с `--max-warnings <N>`, где N — число накопленных замечаний на момент включения. Число можно только
// снижать: новое замечание роняет CI, исправленное — уменьшите N в package.json.
export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['dist/**', 'design/**', 'docs/**', 'tools/**', 'src/routes/**', 'src/stories/**', 'static/**'] },
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint не рекомендует no-undef для TS-проектов
			'no-undef': 'off',
			// Порт React-референса: пропсы намеренно типизированы свободно, чтобы 1:1 повторять API оригинала (~1400 мест).
			'@typescript-eslint/no-explicit-any': 'off',
			// Map/Set/Date в компонентах создаются внутри $derived или заменяются целиком, не мутируются на месте.
			'svelte/prefer-svelte-reactivity': 'off',
			// Стилистика: `{'literal'}` в разметке порта оставлен ради 1:1 сходства с референсом.
			'svelte/no-useless-mustaches': 'off',
			// Храповик: эти правила — предупреждения, число замечаний ограничено --max-warnings.
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
			'@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/require-each-key': 'warn',
			'svelte/prefer-writable-derived': 'warn',
			'svelte/no-unused-props': 'warn',
			'no-useless-assignment': 'warn',
			'no-import-assign': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: { parserOptions: { projectService: true, extraFileExtensions: ['.svelte'], parser: ts.parser } }
	}
);
