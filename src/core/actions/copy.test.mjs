import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./copy.js', import.meta.url), 'utf8');
const action = source.slice(source.indexOf('  async function copyPrompt'), source.indexOf('  // ── ⌘M'));
function setup(fail = false) {
  const selected = [{isConnected:true, name:'first'}, {isConnected:true, name:'second'}];
  const writes = [];
  const context = vm.createContext({
    selectedElements:selected, settings:{combined:false}, lang:'zh',
    selectionPrompt: elements => elements.map(el => el.name).join(','),
    navigator:{clipboard:{writeText: async text => { if (fail) throw Error('denied'); writes.push(text); }}},
    fallbackCopy: () => false, showCopyFeedback: () => {}
  });
  vm.runInContext(action, context);
  return {context, selected, writes};
}
test('copies only the requested element without changing selection', async () => {
  const {context, selected, writes} = setup();
  assert.equal(await context.submitElement(selected[1]), true);
  assert.deepEqual(writes, ['second']);
  assert.equal(context.selectedElements, selected);
  assert.equal(await context.copyPrompt(), true);
  assert.deepEqual(writes, ['second', 'first,second']);
});
test('clipboard failure preserves selection and reports failure', async () => {
  const {context, selected} = setup(true);
  assert.equal(await context.copyPrompt(), false);
  assert.equal(context.selectedElements, selected);
});
test('runtime sources no longer connect to editor bridge or launch protocols', () => {
  for (const file of ['../editor.js','../panel/preferences.js','../panel/panel.js','../context/source.js','./copy.js']) {
    const content = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(content, /autoConnectBridge|bridgeRequest|17321|vscode:\/\//);
  }
});
