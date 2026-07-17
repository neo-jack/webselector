import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const context = vm.createContext({ URL, setTimeout, clearTimeout, AbortController });
vm.runInContext(readFileSync(new URL('./source.js', import.meta.url), 'utf8'), context);

test('Vue resolves non-enumerable instance metadata and ancestors without inventing line numbers', () => {
  const owner = { type: { __file: 'C:/project/src/Card.vue' } };
  const root = {}; Object.defineProperty(root, '__vueParentComponent', { value: owner });
  const result = context.sourceVueComponent({ parentElement: root });
  assert.equal(result.file, owner.type.__file);
  assert.equal(result.precision, 'component');
  assert.equal(context.sourcePositionSuffix(result), '');
  assert.equal(context.sourcePositionSuffix({ line: 84, column: 7 }), ':84:7');
  assert.equal(context.sourceVueComponent({ __vueParentComponent: { type: {}, parent: owner } }).file, owner.type.__file);
  assert.equal(context.sourceVueComponent({ __vnode: { component: owner } }).file, owner.type.__file);
});

test('Vue missing metadata and cycles terminate; nearer React hosts preserve React lookup', () => {
  const instance = { type: {} }; instance.parent = instance;
  assert.throws(() => context.sourceVueComponent({ __vueParentComponent: instance }), /__file/);
  assert.equal(context.sourceVueComponent({}), null);
  assert.equal(context.sourceVueComponent({ '__reactFiber$test': {}, parentElement: { __vueParentComponent: { type: { __file: 'Outer.vue' } } } }), null);
});

test('maps one-based coordinates and respects unmapped segments', () => {
  const map = { version: 3, sources: ['App.tsx'], mappings: 'AAAA,KACE;AACF' };
  const result = context.sourceMapPosition(map, 1, 6);
  assert.equal(result.line, 2); assert.equal(result.column, 3);
  assert.equal(context.sourceMapPosition(map, 2, 1).line, 3);
  assert.equal(context.sourceMapPosition({ ...map, mappings: 'AAAA,K' }, 1, 6), null);
  assert.throws(() => context.sourceMapPosition({ ...map, sections: [] }, 1, 1));
});

test('maps Vite, file, webpack and Windows paths within the configured root', () => {
  for (const source of ['http://localhost/src/App.tsx', 'http://localhost/@fs/C:/repo/src/App.tsx', 'file:///C:/repo/src/App.tsx', 'webpack://app/./src/App.tsx', 'C:\\repo\\src\\App.tsx']) {
    assert.equal(context.sourceLocalPath(source, 'C:/repo'), 'C:/repo/src/App.tsx');
  }
  for (const source of ['../outside.tsx', 'D:/other/a.tsx', 'C:/repo/../outside.tsx']) {
    assert.throws(() => context.sourceLocalPath(source, 'C:/repo'));
  }
});

test('parses Chromium and Firefox stack coordinates, filtering dependency frames', () => {
  const frames = context.sourceStackFrames(' at App (http://localhost:5173/src/App.tsx?t=1:67:21)\nApp@http://localhost/src/Other.tsx:2:3\n at jsx (http://localhost/node_modules/react.js:1:1)');
  assert.equal(frames.length, 2); assert.equal(frames[0].line, 67); assert.equal(frames[1].column, 3);
});

test('loads inline and external maps without returning generated coordinates', async () => {
  context.location = { href: 'http://localhost/' };
  const map = JSON.stringify({ version: 3, sources: ['App.tsx'], mappings: 'AAAA' });
  for (const ref of ['App.js.map', 'data:application/json;base64,' + Buffer.from(map).toString('base64')]) {
    context.fetch = async url => ({ ok: true, url, headers: { get: () => null }, text: async () => url.endsWith('/App.js') ? '//# sourceMappingURL=' + ref : map });
    const result = await context.sourceResolveFrame({ file: 'http://localhost/src/App.js', line: 1, column: 1 });
    assert.equal(result.file, 'http://localhost/src/App.tsx'); assert.equal(result.line, 1);
  }
  context.fetch = async url => ({ ok: true, url, headers: { get: () => null }, text: async () => 'no map' });
  await assert.rejects(context.sourceResolveFrame({ file: 'http://localhost/src/App.js', line: 1, column: 1 }), /source map/);
});
