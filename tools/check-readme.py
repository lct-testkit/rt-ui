"""Checks README.md (and the images of docs/*.md) so the landing page never ships broken:

  * every relative link / image of README.md and docs/*.md points to an existing file or directory; `#anchors` match a heading (GitHub slugs);
  * every image in docs/img is a PNG <= 1400 px wide, the whole folder is < 4 MB, no orphan files (not used by README / docs);
  * every ```svelte block of README.md compiles with the Svelte 5 compiler (real code, not pseudo-code) - needs `npm install`;
  * the marker blocks (<!--STATS-->, <!--CATALOG-->) are filled (run `python tools/fill-docs.py`).

  python tools/check-readme.py [--no-compile] [--preview out.png]

--preview renders README.md to HTML (node_modules/.bin/marked + a GitHub-like stylesheet, 1012 px wide like the GitHub column) and saves a
full-page screenshot: look at it to judge the layout (mermaid is not rendered offline). Exit code 0 = everything is fine.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAX_W = 1400
MAX_TOTAL = 4 * 1024 * 1024
problems = []


def bad(msg):
    problems.append(msg)
    print('  FAIL', msg)


def slug(heading: str) -> str:
    """GitHub anchor of a heading: lowercase, drop punctuation, spaces -> hyphens"""
    s = re.sub(r'<[^>]+>', '', heading).strip().lower()
    s = s.replace('`', '')
    s = re.sub(r'[^\w\- ]', '', s, flags=re.UNICODE)
    return s.replace(' ', '-')


def headings(text: str):
    out, seen, fence = set(), {}, False
    for line in text.splitlines():
        if line.startswith('```'):
            fence = not fence
        m = None if fence else re.match(r'^#{1,6}\s+(.*)$', line)
        if m:
            s = slug(m.group(1))
            n = seen.get(s, 0)
            seen[s] = n + 1
            out.add(s if n == 0 else f'{s}-{n}')
    return out


def strip_code(text: str) -> str:
    """links inside code fences / inline code are not links"""
    text = re.sub(r'```.*?```', '', text, flags=re.S)
    return re.sub(r'`[^`\n]*`', '', text)


def targets(text: str):
    body = strip_code(text)
    for m in re.finditer(r'!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)', body):
        yield m.group(1), m.group(0).startswith('!')
    for m in re.finditer(r'<img[^>]*\ssrc="([^"]+)"', body):
        yield m.group(1), True
    for m in re.finditer(r'<a[^>]*\shref="([^"]+)"', body):
        yield m.group(1), False


def check_doc(path: Path, used_images: set):
    text = path.read_text(encoding='utf-8')
    own = headings(text)
    n = 0
    for target, is_img in targets(text):
        if re.match(r'^(https?:|mailto:|data:)', target):
            continue
        n += 1
        file_part, _, anchor = unquote(target).partition('#')
        dest = path if not file_part else (path.parent / file_part).resolve()
        if not dest.exists():
            bad(f'{path.relative_to(ROOT)}: missing {"image" if is_img else "link target"}: {target}')
            continue
        if is_img:
            used_images.add(dest)
        if anchor and dest == path and anchor not in own:
            bad(f'{path.relative_to(ROOT)}: no heading for anchor #{anchor}')
        elif anchor and dest.suffix == '.md' and dest != path and anchor not in headings(dest.read_text(encoding='utf-8')):
            bad(f'{path.relative_to(ROOT)}: no heading #{anchor} in {file_part}')
    print(f'  {path.relative_to(ROOT)}: {n} relative links / images checked')
    return text


def check_images(used: set):
    folder = ROOT / 'docs' / 'img'
    files = sorted(folder.glob('*'))
    total = sum(f.stat().st_size for f in files)
    for f in files:
        if f.suffix != '.png':
            bad(f'docs/img/{f.name}: not a PNG')
            continue
        w, h = Image.open(f).size
        if w > MAX_W:
            bad(f'docs/img/{f.name}: {w}px wide (max {MAX_W})')
        if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*\.png', f.name):
            bad(f'docs/img/{f.name}: file names must be lowercase-kebab')
        if f.resolve() not in used:
            print(f'  note: docs/img/{f.name} is not referenced by README / docs')
    print(f'  docs/img: {len(files)} files, {total / 1024 / 1024:.2f} MB')
    if total > MAX_TOTAL:
        bad(f'docs/img is {total / 1024 / 1024:.2f} MB (max 4 MB)')


def check_markers(text: str):
    for key in ('STATS', 'CATALOG'):
        m = re.search(rf'<!--{key}-->(.*?)<!--/{key}-->', text, re.S)
        if not m:
            bad(f'README.md: marker <!--{key}--> ... <!--/{key}--> is missing')
        elif not m.group(1).strip():
            bad(f'README.md: marker {key} is empty - run python tools/fill-docs.py')


def check_svelte(text: str):
    blocks = re.findall(r'^```svelte\n(.*?)^```', text, re.S | re.M)
    if not blocks:
        return
    if not (ROOT / 'node_modules' / 'svelte').exists():
        print('  (svelte is not installed: run npm install to compile the code blocks)')
        return
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(blocks, f)
        tmp = f.name
    script = (
        "import fs from 'node:fs'; import { compile } from 'svelte/compiler';"
        "const blocks = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); let failed = 0;"
        "blocks.forEach((src, i) => { try { compile(src, { filename: `README-block-${i + 1}.svelte`, generate: 'client' }); }"
        " catch (e) { failed++; console.log(`block ${i + 1}: ${e.message.split('\\n')[0]}`); } });"
        "console.log(`${blocks.length} svelte blocks, ${failed} failed`); process.exit(failed ? 1 : 0);"
    )
    r = subprocess.run(['node', '--input-type=module', '-e', script, tmp], cwd=ROOT, capture_output=True, text=True, shell=sys.platform == 'win32')
    print('  ' + (r.stdout.strip() or r.stderr.strip()).replace('\n', '\n  '))
    if r.returncode:
        bad('README.md: svelte code blocks do not compile')


CSS = """
body{margin:0;background:#fff;color:#1f2328;font:16px/1.5 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
.markdown-body{box-sizing:border-box;width:1012px;margin:0 auto;padding:32px 45px}
h1,h2{border-bottom:1px solid #d1d9e0;padding-bottom:.3em}h1{font-size:2em}h2{font-size:1.5em;margin-top:24px}h3{font-size:1.25em;margin-top:24px}
h1,h2,h3{font-weight:600;line-height:1.25;margin-bottom:16px}
code{background:#818b981f;border-radius:6px;padding:.2em .4em;font:85% ui-monospace,Consolas,monospace}
pre{background:#f6f8fa;border-radius:6px;padding:16px;overflow:auto;font-size:85%;line-height:1.45}pre code{background:none;padding:0;font-size:100%}
table{border-collapse:collapse;display:block;width:max-content;max-width:100%;overflow:auto;margin:0 0 16px}
th,td{border:1px solid #d1d9e0;padding:6px 13px}tr:nth-child(2n){background:#f6f8fa}
blockquote{margin:0 0 16px;padding:0 1em;color:#59636e;border-left:.25em solid #d1d9e0}
img{max-width:100%}a{color:#0969da;text-decoration:none}details{margin:0 0 16px}summary{cursor:pointer}
div[align=center] table td,div[align=center] table th{border:1px solid #d1d9e0}
"""


def preview(out: str):
    """README.md -> HTML (marked) -> full-page screenshot"""
    from playwright.sync_api import sync_playwright
    marked = ROOT / 'node_modules' / '.bin' / ('marked.cmd' if sys.platform == 'win32' else 'marked')
    r = subprocess.run([str(marked), '--gfm', '-i', str(ROOT / 'README.md')], capture_output=True, text=True, encoding='utf-8', cwd=ROOT)
    if r.returncode:
        bad('marked failed: ' + r.stderr[:200])
        return
    html = f'<!doctype html><meta charset="utf-8"><base href="{ROOT.as_uri()}/"><style>{CSS}</style><article class="markdown-body">{r.stdout}</article>'
    page_file = Path(tempfile.gettempdir()) / 'rt-ui-readme-preview.html'
    page_file.write_text(html, encoding='utf-8')
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 1012, 'height': 900})
        pg.goto(page_file.as_uri())
        pg.wait_for_load_state('load')
        pg.wait_for_timeout(500)
        broken = pg.evaluate('[...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute("src"))')
        for src in broken:
            bad(f'README.md renders a broken image: {src}')
        wide = pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        if wide:
            bad('README.md renders wider than the 1012 px column (horizontal scroll)')
        pg.screenshot(path=out, full_page=True)
        b.close()
    print(f'  preview: {out}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-compile', action='store_true')
    ap.add_argument('--preview', metavar='PNG', help='render README.md and save a full-page screenshot')
    a = ap.parse_args()
    used: set = set()
    readme = check_doc(ROOT / 'README.md', used)
    for md in sorted((ROOT / 'docs').glob('*.md')):
        check_doc(md, used)
    check_images(used)
    check_markers(readme)
    if not a.no_compile:
        check_svelte(readme)
    if a.preview:
        preview(a.preview)
    print('OK' if not problems else f'{len(problems)} problem(s)')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
