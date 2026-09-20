"""Project metrics for docs/ (real numbers, read from disk). Usage: python tools/metrics.py [--json]"""
import collections, glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


def loc(paths):
    n = 0
    for p in paths:
        try:
            n += sum(1 for _ in open(p, encoding='utf-8', errors='ignore'))
        except OSError:
            pass
    return n


def norm(p):
    return p.replace('\\', '/')


comp_files = [norm(p) for p in glob.glob('src/lib/components/**/*', recursive=True) if os.path.isfile(p)]
libcode = [norm(p) for p in glob.glob('src/lib/**/*', recursive=True)
           if os.path.isfile(p) and re.search(r'\.(svelte|ts)$', p) and '/icons/' not in norm(p)]
story_files = [norm(p) for p in glob.glob('src/stories/**/*.svelte', recursive=True) if not os.path.basename(p).startswith('_')]
idx = json.load(open('_mirror/gen2/react-storybook/index.json', encoding='utf-8'))['entries']
titles = {k: v['title'] for k, v in idx.items() if v['type'] == 'story'}

st = {}
for f in glob.glob('design/diff/status/*.json'):
    try:
        st[os.path.basename(f)[:-5]] = json.load(open(f, encoding='utf-8'))
    except (OSError, ValueError):
        pass

by = collections.defaultdict(lambda: [0, 0, 0])   # pass, fail, total
for sid, t in titles.items():
    parts = t.split('/')
    g = parts[0] + ('/' + parts[1] if len(parts) > 1 else '')
    by[g][2] += 1
    if sid in st:
        by[g][0 if st[sid]['ok'] else 1] += 1

theme_css = open('src/lib/styles/themes/rtk_default_light.css', encoding='utf-8').read()
m = {
    'reference_stories': len(titles),
    'reference_story_groups': len(set(titles.values())),
    'reference_screenshots': len(glob.glob('design/reference/*/*.png')),
    'component_dirs': len([d for d in os.listdir('src/lib/components') if os.path.isdir('src/lib/components/' + d)]),
    'component_svelte_files': len([p for p in comp_files if p.endswith('.svelte')]),
    'lib_loc_svelte_ts': loc(libcode),
    'icons_generated': len(glob.glob('src/lib/icons/**/*.svelte', recursive=True)) - 2,
    'story_files': len(story_files),
    'stories_loc': loc(story_files),
    'interaction_scenarios': len(glob.glob('tools/interactions/*.json')),
    'stories_compared': len(st),
    'stories_pass': sum(1 for s in st.values() if s['ok']),
    'stories_pass_exact': sum(1 for s in st.values() if s['ok'] and not s.get('aa')),
    'stories_pass_aa_only': sum(1 for s in st.values() if s['ok'] and s.get('aa')),
    'stories_fail': sum(1 for s in st.values() if not s['ok']),
    'states_compared_last_run': sum(len(s['states']) for s in st.values()),
    'theme_variables_per_theme': len(re.findall(r'--atmr-[\w-]+\s*:', theme_css)),
    'components_css_kb': round(os.path.getsize('src/lib/styles/components.css') / 1024),
    'react_modules_extracted': sum(len(fs) for _, _, fs in os.walk('design/react-src')),
    'groups': {k: v for k, v in sorted(by.items())},
}
if '--json' in sys.argv:
    print(json.dumps(m, ensure_ascii=False, indent=1))
else:
    for k, v in m.items():
        if k != 'groups':
            print(f'{k:28} {v}')
    pct = round(100 * m['stories_pass'] / m['reference_stories'], 1)
    print(f'{"coverage (pass/reference)":28} {pct} %')
