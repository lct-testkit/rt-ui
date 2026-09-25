// Стиль-гейт дизайн-системы (спека §12.6): в стилях компонентов цвета берутся ТОЛЬКО из токенов темы
// (`var(--atmr-…)`), «сырой» hex ломает переключение тем. Определения самих токенов живут в
// src/lib/styles/themes/** — они исключены. Проверяются *.css и <style>-блоки *.svelte в src/lib.
//
// ХРАПОВИК: библиотека — порт эталонного CSS и уже содержит литеральные hex-цвета (36 на момент включения),
// поэтому правило — warning, а `npm run lint:styles` запускает stylelint с `--max-warnings 36`. Новый «сырой»
// цвет роняет CI; заменили hex на токен — уменьшите число в package.json.
/** @type {import('stylelint').Config} */
export default {
	overrides: [{ files: ['**/*.svelte'], customSyntax: 'postcss-html' }],
	ignoreFiles: ['dist/**', 'node_modules/**', 'src/lib/styles/themes/**', 'src/routes/**', 'src/stories/**', 'design/**', 'docs/**', 'tools/**'],
	rules: {
		'color-no-hex': [true, { severity: 'warning', message: 'Цвет — только из токенов темы: var(--atmr-…)' }],
		// rgb()/rgba() здесь допустимы: дизайн-система собирает полупрозрачные цвета из токенов
		// (`rgba(var(--…-rgb), .5)`) и из «сырых» прозрачностей эффектов (тени, оверлеи).
		// Ограничение — только на литеральные hex-цвета.
	}
};
