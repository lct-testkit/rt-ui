// Live feed of what the workflow agents are doing.
//   node tools/watch.mjs              follow the most recent workflow run (last 25 events first)
//   node tools/watch.mjs --last 80    longer backlog
//   node tools/watch.mjs --say        also show the agents' own commentary (default: on) / --no-say to hide
//   node tools/watch.mjs <run-id>     e.g. wf_14ae40ef-9c5
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const last = Number(args[args.indexOf('--last') + 1]) || 25;
const showSay = !args.includes('--no-say');
const runArg = args.find((a) => /^wf_/.test(a));

const base = path.join(os.homedir(), '.claude', 'projects');
function runDirs() {
  const out = [];
  for (const proj of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    if (!proj.startsWith('D--lct')) continue;
    const pdir = path.join(base, proj);
    let sessions; try { sessions = fs.readdirSync(pdir); } catch { continue; }
    for (const s of sessions) {
      const wf = path.join(pdir, s, 'subagents', 'workflows');
      if (!fs.existsSync(wf)) continue;
      for (const r of fs.readdirSync(wf)) {
        const d = path.join(wf, r);
        if (fs.statSync(d).isDirectory()) out.push({ id: r, dir: d, mtime: fs.statSync(d).mtimeMs });
      }
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

function plainAgentFiles() {
  const out = [];
  for (const proj of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    if (!proj.startsWith('D--lct')) continue;
    const pdir = path.join(base, proj);
    let sessions; try { sessions = fs.readdirSync(pdir); } catch { continue; }
    for (const sess of sessions) {
      const d = path.join(pdir, sess, 'subagents');
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) {
        if (!/^agent-.*\.jsonl$/.test(f)) continue;
        const p = path.join(d, f);
        if (Date.now() - fs.statSync(p).mtimeMs < 45 * 60 * 1000) out.push(p);   // only recently active ones
      }
    }
  }
  return out;
}

const runs = runDirs();
const recent = runs.filter((r) => Date.now() - r.mtime < 6 * 3600 * 1000);
const run = runArg ? runs.find((r) => r.id === runArg) : (recent[0] ?? runs[0] ?? null);
if (!run && !plainAgentFiles().length) { console.error('no agent activity found under', base); process.exit(1); }
// follow ALL runs active in the last 6 h (a new phase = a new run); a run id argument pins to that run
const followed = () => (runArg ? [run] : runDirs().filter((r) => Date.now() - r.mtime < 4 * 60 * 1000));

const C = { reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m', blue: '\x1b[34m', bold: '\x1b[1m' };
const palette = [C.cyan, C.magenta, C.yellow, C.green, C.blue, '\x1b[95m', '\x1b[96m', '\x1b[93m'];
const colorOf = new Map();
const color = (label) => { if (!colorOf.has(label)) colorOf.set(label, palette[colorOf.size % palette.length]); return colorOf.get(label); };

const short = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^.*?rt-ui\//i, '').replace(/^.*?scratchpad\//i, '~scratch/');
const oneLine = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const hhmmss = (ts) => new Date(ts).toLocaleTimeString('ru-RU', { hour12: false });

function describeTool(b) {
  const i = b.input ?? {};
  switch (b.name) {
    case 'Bash': case 'PowerShell': return oneLine(i.command, 170);
    case 'Read': return short(i.file_path) + (i.offset ? `:${i.offset}` : '');
    case 'Write': return short(i.file_path) + `  (${String(i.content ?? '').length} chars)`;
    case 'Edit': return short(i.file_path);
    case 'Glob': return i.pattern + (i.path ? '  in ' + short(i.path) : '');
    case 'Grep': return `/${i.pattern}/` + (i.path ? '  in ' + short(i.path) : '');
    default: return oneLine(JSON.stringify(i), 140);
  }
}

const files = new Map(); // path -> { off, label }
const queue = [];        // events collected during backlog phase

function emit(ev) { queue.push(ev); }

function parseLine(line, label) {
  let o; try { o = JSON.parse(line); } catch { return; }
  const ts = o.timestamp ?? Date.now();
  const msg = o.message;
  if (!msg || !Array.isArray(msg.content)) return;
  for (const b of msg.content) {
    if (o.type === 'assistant') {
      if (b.type === 'tool_use') emit({ ts, label, kind: b.name, text: describeTool(b) });
      else if (b.type === 'text' && showSay && b.text.trim()) emit({ ts, label, kind: 'SAY', text: oneLine(b.text, 260) });
    } else if (o.type === 'user' && b.type === 'tool_result') {
      const raw = Array.isArray(b.content) ? b.content.map((x) => x.text ?? '').join('\n') : String(b.content ?? '');
      if (b.is_error) { emit({ ts, label, kind: /interrupted/i.test(raw) ? 'STOP' : 'ERR', text: oneLine(raw, 200) }); continue; }
      for (const l of raw.split('\n')) {
        if (/^(PASS|FAIL)\s+\S+/.test(l)) emit({ ts, label, kind: l.startsWith('PASS') ? 'PASS' : 'FAIL', text: oneLine(l.slice(4), 150) });
        else if (/^--- \d+\/\d+ stories pass/.test(l)) emit({ ts, label, kind: 'SUM', text: l.replace(/^--- /, '') });
      }
    }
  }
}

function scan(initial) {
  const candidates = [];
  for (const r of followed()) for (const f of fs.readdirSync(r.dir)) if (/^agent-.*\.jsonl$/.test(f)) candidates.push(path.join(r.dir, f));
  if (!runArg) candidates.push(...plainAgentFiles());
  for (const p of candidates) {
    const f = path.basename(p);
    let st = files.get(p);
    if (!st) {
      let label = f.replace(/^agent-|\.jsonl$/g, '').slice(0, 8);
      try { label = JSON.parse(fs.readFileSync(p.replace(/\.jsonl$/, '.meta.json'), 'utf8')).description ?? label; } catch { /* meta may not exist yet */ }
      st = { off: 0, label, rest: '' };
      files.set(p, st);
    }
    const size = fs.statSync(p).size;
    if (size <= st.off) continue;
    const fd = fs.openSync(p, 'r');
    const buf = Buffer.alloc(size - st.off);
    fs.readSync(fd, buf, 0, buf.length, st.off);
    fs.closeSync(fd);
    st.off = size;
    const chunk = st.rest + buf.toString('utf8');
    const lines = chunk.split('\n');
    st.rest = lines.pop() ?? '';
    for (const l of lines) if (l.trim()) parseLine(l, st.label);
  }
}

function print(ev) {
  const col = color(ev.label);
  const kindCol = { STOP: C.dim, ERR: C.red, FAIL: C.red, PASS: C.green, SUM: C.bold + C.green, SAY: C.yellow, Bash: C.dim, PowerShell: C.dim, Read: C.dim, Grep: C.dim, Glob: C.dim, Write: C.blue, Edit: C.blue }[ev.kind] ?? C.reset;
  console.log(`${C.dim}${hhmmss(ev.ts)}${C.reset} ${col}${ev.label.padEnd(20).slice(0, 20)}${C.reset} ${kindCol}${ev.kind.padEnd(5)}${C.reset} ${ev.kind === 'SAY' ? C.yellow + ev.text + C.reset : ev.text}`);
}

console.log(`${C.bold}watching ${followed().map((r) => r.id).join(', ')}${C.reset}\n${C.dim}Ctrl+C to stop. Write/Edit = files, PASS/FAIL = compare.py results, SAY = agent commentary${C.reset}\n`);
scan(true);
queue.sort((a, b) => (a.ts < b.ts ? -1 : 1));
console.log(`${C.dim}--- last ${Math.min(last, queue.length)} of ${queue.length} events ---${C.reset}`);
queue.splice(0, Math.max(0, queue.length - last)).length; // drop older
while (queue.length) print(queue.shift());
console.log(`${C.dim}--- live ---${C.reset}`);
setInterval(() => {
  try { scan(false); } catch { /* files may be mid-write */ }
  queue.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  while (queue.length) print(queue.shift());
}, 1000);
