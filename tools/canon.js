// Canonical DOM serializer, evaluated inside the page (reference Storybook and our playground alike).
// Returns { tree, boxes } where tree is a JSON-able canonical structure and boxes maps node index -> rect.
() => {
	const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'TEMPLATE', 'BASE']);
	const SKIP_IDS = new Set(['storybook-docs', 'storybook-highlights-menu', 'storybook-highlights-root', 'svelte-announcer']);
	const ID_ATTRS = new Set(['id', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'list', 'form', 'popovertarget']);
	const DROP_ATTR = /^(data-sveltekit|data-svelte|data-rt-|data-reactroot|data-testid-ignore)/;
	const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
	const idMap = new Map();
	const mapId = (v) =>
		v.split(/\s+/).filter(Boolean).map((t) => {
			if (!idMap.has(t)) idMap.set(t, 'id' + (idMap.size + 1));
			return idMap.get(t);
		}).join(' ');
	const normStyle = (s) =>
		s.split(';').map((x) => x.trim()).filter(Boolean).map((d) => {
			const i = d.indexOf(':');
			return d.slice(0, i).trim().toLowerCase() + ':' + d.slice(i + 1).trim().replace(/\s+/g, ' ');
		}).sort().join(';');

	// asset URLs differ between the React build (/static/media/x.<hash>.svg) and our playground (/story-assets/x.svg): compare basenames
	const normUrl = (u) => u.replace(/url\((['"]?)([^)'"]+)\)/g, (_, q, p) => 'url(' + baseName(p) + ')');
	const baseName = (u) => { if (/^(data|blob):/.test(u)) return u.slice(0, 40); const f = u.split(/[?#]/)[0].split('/').pop(); return f.replace(/\.[0-9a-f]{8}(\.\w+)$/, '$1'); };

	let counter = 0;
	const boxes = [];

	function node(el) {
		const idx = counter++;
		const attrs = {};
		for (const a of el.attributes) {
			if (DROP_ATTR.test(a.name)) continue;
			let v = a.value;
			if (FORM_TAGS.has(el.tagName) && (a.name === 'value' || a.name === 'checked')) continue;
			if (a.name === 'class') v = [...new Set(v.split(/\s+/).filter(Boolean))].sort().join(' ');
			else if (a.name === 'style') v = normUrl(normStyle(v));
			else if ((a.name === 'src' || a.name === 'poster') || (a.name === 'href' && el.tagName !== 'A') || a.name === 'xlink:href') v = baseName(v);
			else if (a.name === 'srcset') v = v.split(',').map((x) => baseName(x.trim().split(/\s+/)[0]) + ' ' + (x.trim().split(/\s+/)[1] ?? '')).join(', ');
			else if (ID_ATTRS.has(a.name)) v = mapId(v);
			if (a.name === 'class' && !v) continue;
			if (a.name === 'style' && !v) continue;
			attrs[a.name] = v;
		}
		if (FORM_TAGS.has(el.tagName)) {
			if (el.type === 'checkbox' || el.type === 'radio') attrs['$checked'] = String(el.checked);
			else if (el.tagName !== 'SELECT' || true) attrs['$value'] = String(el.value ?? '');
			if (el.indeterminate) attrs['$indeterminate'] = 'true';
		}
		const r = el.getBoundingClientRect();
		boxes[idx] = r.width || r.height ? [Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] : null;
		const children = kids(el.childNodes);
		const out = { t: el.tagName.toLowerCase(), i: idx };
		if (Object.keys(attrs).length) out.a = Object.fromEntries(Object.entries(attrs).sort(([a], [b]) => (a < b ? -1 : 1)));
		if (children.length) out.c = children;
		return out;
	}

	function kids(list) {
		const out = [];
		for (const n of list) {
			if (n.nodeType === 3) {
				const t = n.textContent.replace(/\s+/g, ' ').trim();
				if (t) out.push(t);
			} else if (n.nodeType === 1) {
				if (SKIP_TAGS.has(n.tagName) || SKIP_IDS.has(n.id)) continue;
				// storybook chrome + F5 WAF injection that only exists in the reference page
				if (n.tagName === 'APM_DO_NOT_TOUCH' || n.classList.contains('sb-wrapper') || n.classList.contains('sb-argstableBlock')) continue;
				// unwrap the SvelteKit body wrapper
				if (n.tagName === 'DIV' && n.getAttribute('style') === 'display: contents' && n.parentElement === document.body) {
					out.push(...kids(n.childNodes));
					continue;
				}
				out.push(node(n));
			}
		}
		return out;
	}

	const tree = kids(document.body.childNodes);
	return { tree, boxes, body: document.body.className, count: counter };
}
