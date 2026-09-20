/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// SVG path builders of the chart module: polylines, monotone-cubic curves (no overshoot), areas, arcs and bars with a rounded data end.

export type Pt = [x: number, y: number];

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** Splits a series into runs of consecutive defined points (a `null` starts a new run: a gap in the line). */
export function runsOf(points: (Pt | null)[]): Pt[][] {
	const runs: Pt[][] = [];
	let run: Pt[] = [];
	for (const p of points) {
		if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) run.push(p);
		else if (run.length) {
			runs.push(run);
			run = [];
		}
	}
	if (run.length) runs.push(run);
	return runs;
}

// ─── monotone cubic (Fritsch–Carlson, the same tangents as d3's curveMonotoneX) ─────────────────────────────────

const sign = (x: number) => (x < 0 ? -1 : 1);

function slope3(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
	const h0 = x1 - x0;
	const h1 = x2 - x1;
	const s0 = (y1 - y0) / (h0 || (h1 < 0 ? -0 : 0));
	const s1 = (y2 - y1) / (h1 || (h0 < 0 ? -0 : 0));
	const p = (s0 * h1 + s1 * h0) / (h0 + h1);
	return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

function slope2(x0: number, y0: number, x1: number, y1: number, t: number): number {
	const h = x1 - x0;
	return h ? ((3 * (y1 - y0)) / h - t) / 2 : t;
}

function monotoneSegments(run: Pt[]): string {
	const n = run.length;
	const t: number[] = new Array(n);
	if (n === 2) {
		const s = (run[1][1] - run[0][1]) / (run[1][0] - run[0][0] || 1);
		t[0] = s;
		t[1] = s;
	} else {
		for (let i = 1; i < n - 1; i++) t[i] = slope3(run[i - 1][0], run[i - 1][1], run[i][0], run[i][1], run[i + 1][0], run[i + 1][1]);
		t[0] = slope2(run[0][0], run[0][1], run[1][0], run[1][1], t[1]);
		t[n - 1] = slope2(run[n - 2][0], run[n - 2][1], run[n - 1][0], run[n - 1][1], t[n - 2]);
	}
	let d = '';
	for (let i = 1; i < n; i++) {
		const [x0, y0] = run[i - 1];
		const [x1, y1] = run[i];
		const dx = (x1 - x0) / 3;
		d += `C${f(x0 + dx)},${f(y0 + dx * t[i - 1])} ${f(x1 - dx)},${f(y1 - dx * t[i])} ${f(x1)},${f(y1)}`;
	}
	return d;
}

function runPath(run: Pt[], smooth: boolean): string {
	if (run.length === 1) return `M${f(run[0][0])},${f(run[0][1])}h0.01`; // a lone point: a dot with round caps
	const head = `M${f(run[0][0])},${f(run[0][1])}`;
	if (smooth && run.length > 2) return head + monotoneSegments(run);
	if (smooth && run.length === 2) return head + `L${f(run[1][0])},${f(run[1][1])}`;
	let d = head;
	for (let i = 1; i < run.length; i++) d += `L${f(run[i][0])},${f(run[i][1])}`;
	return d;
}

/** Path of a line through `points` (gaps for `null`), straight or smooth (monotone: never overshoots the data). */
export function linePath(points: (Pt | null)[], smooth = false): string {
	return runsOf(points)
		.map((r) => runPath(r, smooth))
		.join('');
}

/** Closed area between the line through `points` and the horizontal `baseline` (one shape per run of defined points). */
export function areaPath(points: (Pt | null)[], baseline: number, smooth = false): string {
	return runsOf(points)
		.filter((r) => r.length > 1)
		.map((r) => {
			const body = runPath(r, smooth);
			const last = r[r.length - 1];
			return `${body}L${f(last[0])},${f(baseline)}L${f(r[0][0])},${f(baseline)}Z`;
		})
		.join('');
}

// ─── arcs (donut / pie) ──────────────────────────────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;

/** point on a circle; angle 0 = 12 o'clock, growing clockwise */
export function polar(cx: number, cy: number, r: number, angle: number): Pt {
	return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

/** Ring segment (or pie wedge when `r0 = 0`) from angle `a0` to `a1` (radians, 0 = top, clockwise). */
export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
	const span = Math.min(TAU, Math.max(0, a1 - a0));
	if (span <= 1e-6) return '';
	if (span >= TAU - 1e-6) {
		// a full circle cannot be one arc: two halves
		const top = polar(cx, cy, r1, 0);
		const bottom = polar(cx, cy, r1, Math.PI);
		let d = `M${f(top[0])},${f(top[1])}A${f(r1)},${f(r1)} 0 1 1 ${f(bottom[0])},${f(bottom[1])}A${f(r1)},${f(r1)} 0 1 1 ${f(top[0])},${f(top[1])}Z`;
		if (r0 > 0) {
			const it = polar(cx, cy, r0, 0);
			const ib = polar(cx, cy, r0, Math.PI);
			d += `M${f(it[0])},${f(it[1])}A${f(r0)},${f(r0)} 0 1 0 ${f(ib[0])},${f(ib[1])}A${f(r0)},${f(r0)} 0 1 0 ${f(it[0])},${f(it[1])}Z`;
		}
		return d;
	}
	const large = span > Math.PI ? 1 : 0;
	const [ox0, oy0] = polar(cx, cy, r1, a0);
	const [ox1, oy1] = polar(cx, cy, r1, a0 + span);
	if (r0 <= 0.5) return `M${f(cx)},${f(cy)}L${f(ox0)},${f(oy0)}A${f(r1)},${f(r1)} 0 ${large} 1 ${f(ox1)},${f(oy1)}Z`;
	const [ix1, iy1] = polar(cx, cy, r0, a0 + span);
	const [ix0, iy0] = polar(cx, cy, r0, a0);
	return `M${f(ox0)},${f(oy0)}A${f(r1)},${f(r1)} 0 ${large} 1 ${f(ox1)},${f(oy1)}L${f(ix1)},${f(iy1)}A${f(r0)},${f(r0)} 0 ${large} 0 ${f(ix0)},${f(iy0)}Z`;
}

// ─── bars ────────────────────────────────────────────────────────────────────────────────────────────────────────

export type BarEdge = 'top' | 'bottom' | 'left' | 'right' | 'none';

/**
 * Rectangle path with the corners of ONE edge rounded (the data end of the bar; the baseline end stays square).
 * `r` is clamped so that it never exceeds half of the bar.
 */
export function barPath(x: number, y: number, w: number, h: number, r: number, edge: BarEdge): string {
	if (w <= 0 || h <= 0) return '';
	const rr = edge === 'none' ? 0 : Math.max(0, Math.min(r, w / 2, h / 2));
	if (rr === 0) return `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
	const x1 = x + w;
	const y1 = y + h;
	switch (edge) {
		case 'top':
			return `M${f(x)},${f(y1)}V${f(y + rr)}Q${f(x)},${f(y)} ${f(x + rr)},${f(y)}H${f(x1 - rr)}Q${f(x1)},${f(y)} ${f(x1)},${f(y + rr)}V${f(y1)}Z`;
		case 'bottom':
			return `M${f(x)},${f(y)}H${f(x1)}V${f(y1 - rr)}Q${f(x1)},${f(y1)} ${f(x1 - rr)},${f(y1)}H${f(x + rr)}Q${f(x)},${f(y1)} ${f(x)},${f(y1 - rr)}Z`;
		case 'right':
			return `M${f(x)},${f(y)}H${f(x1 - rr)}Q${f(x1)},${f(y)} ${f(x1)},${f(y + rr)}V${f(y1 - rr)}Q${f(x1)},${f(y1)} ${f(x1 - rr)},${f(y1)}H${f(x)}Z`;
		default: // left
			return `M${f(x1)},${f(y)}H${f(x + rr)}Q${f(x)},${f(y)} ${f(x)},${f(y + rr)}V${f(y1 - rr)}Q${f(x)},${f(y1)} ${f(x + rr)},${f(y1)}H${f(x1)}Z`;
	}
}
