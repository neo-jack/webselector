// npm exec --yes --package=playwright -- node src/core/vendor/figma-capture.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const packageFile = (process.env.PATH || '').split(path.delimiter)
  .map(bin => path.resolve(bin, '..', 'playwright', 'package.json')).find(file => fs.existsSync(file));
if (!packageFile) throw new Error('Run with npm exec --package=playwright');
const { chromium } = createRequire(packageFile)('playwright');
const source = fs.readFileSync(path.join(__dirname, 'figma-capture.js'), 'utf8');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="red"/></svg>';
    const fixture = `<!doctype html><style>
      body{margin:0;background:rgb(20,30,40)}
      .backdrop{position:fixed;inset:0;z-index:-2;background:linear-gradient(transparent,#0004),url('/art.svg')}
      #outside{position:absolute;left:900px;top:0;width:40px;height:40px;z-index:-1;background:url('/missing.svg')}
      main{margin:40px;width:320px;height:200px;position:relative;color:#abcdef}
      #mask{width:24px;height:24px;mask:url('/art.svg') center/contain no-repeat;background:#123456}
      #pseudo:before{content:'';display:block;width:24px;height:24px;background:url('/art.svg')}
    </style><div class="backdrop" aria-hidden="true"></div><div id="outside"></div>
    <header>Unrelated header must not be captured</header><main><p>中文正文</p>
    <svg id="icon" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path id="path" d="M4 4L24 24"/></svg>
    <div id="mask"></div><div id="pseudo"></div><div class="ai-editor-root">TOOL UI</div></main>`;
    await context.route('http://capture.test/**', route => {
      const url = new URL(route.request().url());
      return route.fulfill(url.pathname === '/' ? { contentType: 'text/html', body: fixture }
        : url.pathname === '/art.svg' ? { contentType: 'image/svg+xml', body: svg }
          : { status: 404, body: 'Missing asset' });
    });
    await page.goto('http://capture.test/');
    await page.addScriptTag({ content: source + '\nwindow.capture = FIGMA_CAPTURE;' });
    await page.evaluate(() => {
      window.decode = html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const value = doc.querySelector('[data-h2d]').getAttribute('data-h2d');
        return JSON.parse(new TextDecoder().decode(Uint8Array.from(
          atob(value.slice('<!--(figh2d)'.length, -'(/figh2d)-->'.length)), c => c.charCodeAt(0))));
      };
      window.nodes = root => [root, ...(root.childNodes || []).flatMap(window.nodes),
        ...Object.values(root.pseudoElementNodes || {}).filter(Boolean).flatMap(window.nodes)];
    });
    const result = await page.evaluate(async () => {
      const data = decode(await capture(document.querySelector('main')));
      const list = nodes(data.root);
      const icon = list.find(n => n.tag === 'SVG');
      const xml = new DOMParser().parseFromString(icon.content, 'image/svg+xml');
      // Standalone SVG must actually decode and paint, not only contain a path string.
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icon.content);
      await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, 32, 32).data;
      const painted = pixels.some((value, index) => index % 4 === 3 && value > 0);
      return { rect: data.root.rect, forest: !!data.assets['http://capture.test/art.svg']?.blob,
        backgroundType: data.assets['http://capture.test/art.svg']?.blob?.type,
        unwanted: JSON.stringify(data).includes('Unrelated header') || JSON.stringify(data).includes('TOOL UI'),
        uniqueIds: new Set(list.map(n => n.id)).size === list.length,
        mask: list.some(n => n.tag === 'IMG' && n.placeholderUrl?.startsWith('mask-')),
        pseudo: list.some(n => n.pseudoElementNodes?.before),
        namespace: xml.documentElement.namespaceURI, painted };
    });
    assert.deepEqual(result.rect, { x: 0, y: 0, width: 320, height: 200 });
    for (const key of ['forest', 'uniqueIds', 'mask', 'pseudo', 'painted']) assert.equal(result[key], true, key);
    assert.equal(result.unwanted, false);
    assert.equal(result.namespace, 'http://www.w3.org/2000/svg');
    assert.equal(result.backgroundType, 'image/png');
    const fragment = await page.evaluate(async () => {
      const data = decode(await capture(document.querySelector('#path')));
      const node = nodes(data.root).find(n => n.tag === 'SVG');
      const xml = new DOMParser().parseFromString(node.content, 'image/svg+xml');
      return { root: xml.documentElement.tagName, stroke: xml.querySelector('path').getAttribute('stroke-width'),
        color: xml.querySelector('path').getAttribute('stroke'), cap: xml.querySelector('path').getAttribute('stroke-linecap') };
    });
    assert.equal(fragment.root, 'svg');
    assert.equal(fragment.stroke, '3px');
    assert.equal(fragment.color, 'rgb(171, 205, 239)');
    assert.equal(fragment.cap, 'round');
    const missing = await page.evaluate(async () => {
      document.querySelector('main').style.backgroundImage = 'url(/missing.svg)';
      try { await capture(document.querySelector('main')); return ''; } catch (error) { return error.message; }
    });
    assert.match(missing, /图片资源无法读取/);
    const maskMissing = await page.evaluate(async () => {
      document.querySelector('main').style.backgroundImage = 'none';
      document.querySelector('#mask').style.maskImage = 'url(/missing.svg)';
      try { await capture(document.querySelector('main')); return ''; } catch (error) { return error.message; }
    });
    assert.match(maskMissing, /遮罩资源无法读取/);
    const retry = await page.evaluate(async () => {
      document.querySelector('#mask').style.maskImage = 'url(/art.svg)';
      return !!decode(await capture(document.querySelector('main'))).root;
    });
    assert.equal(retry, true);
    console.log('PASS: backdrop/crop, unrelated-content exclusion, SVG rendering/subnodes, masks/pseudos, resource failure and retry');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
