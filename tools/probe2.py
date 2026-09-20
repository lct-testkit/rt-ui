import json
from playwright.sync_api import sync_playwright
url = 'http://127.0.0.1:6006/gen2/react-storybook/iframe.html?id=components-buttons-button--main&viewMode=story'
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1000, 'height': 700})
    pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(1000)
    info = pg.evaluate("""() => {
      const sheets = [...document.styleSheets].map(s => { let n=-1,len=0; try { n=s.cssRules.length; len=[...s.cssRules].reduce((a,r)=>a+r.cssText.length,0);} catch(e){} return {href:s.href, owner:s.ownerNode?.tagName, id:s.ownerNode?.id, rules:n, len}; });
      const prev = window.__STORYBOOK_PREVIEW__;
      return { sheets, hasPreview: !!prev, keys: prev ? Object.keys(prev).slice(0,20) : [], store: !!(prev && prev.storyStoreValue), htmlAttrs:[...document.documentElement.attributes].map(a=>a.name+'='+a.value), bodyAttrs:[...document.body.attributes].map(a=>a.name+'='+a.value.slice(0,80)) };
    }""")
    print(json.dumps({k:v for k,v in info.items() if k!='sheets'}))
    css = pg.evaluate("() => [...document.styleSheets].map(s=>{try{return [...s.cssRules].map(r=>r.cssText).join(String.fromCharCode(10))}catch(e){return ''}}).join(String.fromCharCode(10))")
    open('../design/_page_all.css','w',encoding='utf-8').write(css)
    print('page css chars', len(css))
    # story metadata via store
    meta = pg.evaluate("""async () => {
      const prev = window.__STORYBOOK_PREVIEW__; const s = await prev.storyStoreValue.loadStory({storyId:'components-buttons-button--main'});
      return { keys:Object.keys(s), component: s.component && (s.component.displayName||s.component.name), argTypes: s.argTypes, initialArgs: s.initialArgs, params: Object.keys(s.parameters||{}), decorators: (s.decorators||[]).length };
    }""")
    print(json.dumps(meta, indent=1, default=str)[:2500])
    b.close()
