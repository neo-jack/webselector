import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./screenshot.js', import.meta.url), 'utf8');
function mediaSetup(getMedia) {
  let requests = 0;
  const track = new EventTarget();
  track.readyState = 'live';
  track.stop = () => { track.readyState = 'ended'; };
  const stream = { getVideoTracks: () => [track], getTracks: () => [track] };
  const context = vm.createContext({ navigator: { mediaDevices: {
    getDisplayMedia: () => { requests++; return getMedia ? getMedia(stream) : Promise.resolve(stream); },
  }, userActivation: { isActive: false } } });
  vm.runInContext(source, context);
  return { context, stream, track, requests: () => requests };
}
test('live stream is reused, including fallback without user activation', async () => {
  const { context, stream, requests } = mediaSetup();
  assert.equal(await context.acquireDisplayCapture(), stream);
  assert.equal(await context.acquireDisplayCapture(), stream);
  vm.runInContext('captureViaDisplayMedia = () => acquireDisplayCapture()', context);
  assert.equal(await context.requestDisplayMediaFallback([]), stream);
  assert.equal(requests(), 1);
  context.closeDisplayCapture();
  assert.equal(stream.getVideoTracks()[0].readyState, 'ended');
  await assert.rejects(context.acquireDisplayCapture(), e => e.selectorCode === 'cancelled');
});
test('browser stop clears cached stream', async () => {
  const { context, track } = mediaSetup();
  await context.acquireDisplayCapture();
  track.readyState = 'ended'; track.dispatchEvent(new Event('ended'));
  assert.equal(context.liveDisplayCapture(), null);
});
test('two screenshots keep the track live and release both frame resources', async () => {
  const { context, track, requests } = mediaSetup();
  let framesClosed = 0;
  const overlay = { style: { display: 'block' } };
  Object.assign(context, {
    NS: 'test', window: { devicePixelRatio: 1 },
    requestAnimationFrame: callback => callback(), setTimeout: callback => callback(),
    document: { querySelectorAll: () => [overlay], createElement: () => ({
      getContext: () => ({ drawImage() {} }), toBlob: done => done('png'),
    }) },
    grabFrame: async () => ({ width: 800, height: 600, close: () => { framesClosed++; } }),
  });
  const elements = [{ getBoundingClientRect: () => ({ left: 10, top: 10, right: 100, bottom: 100 }) }];
  assert.equal(await context.captureViaDisplayMedia(elements), 'png');
  assert.equal(await context.requestDisplayMediaFallback(elements), 'png');
  assert.equal(requests(), 1);
  assert.equal(track.readyState, 'live');
  assert.equal(framesClosed, 2);
  assert.equal(overlay.style.display, 'block');
  context.closeDisplayCapture();
  assert.equal(track.readyState, 'ended');
});
test('concurrent requests share permission and late approval after close is released', async () => {
  let approve;
  const { context, stream, track, requests } = mediaSetup(() => new Promise(resolve => { approve = resolve; }));
  const first = context.acquireDisplayCapture();
  const second = context.acquireDisplayCapture();
  context.closeDisplayCapture(); approve(stream);
  const results = await Promise.allSettled([first, second]);
  assert.equal(requests(), 1);
  assert.ok(results.every(result => result.status === 'rejected' && result.reason.selectorCode === 'cancelled'));
  assert.equal(track.readyState, 'ended');
});
test('permission rejection can be retried', async () => {
  let fail = true;
  const { context, stream, requests } = mediaSetup(value => fail ? Promise.reject(new Error('denied')) : Promise.resolve(value));
  await assert.rejects(context.acquireDisplayCapture(), /denied/);
  fail = false;
  assert.equal(await context.acquireDisplayCapture(), stream);
  assert.equal(requests(), 2);
});
function setup({ host = {}, domError, hostError } = {}) {
  const calls = [];
  const context = vm.createContext({ HOST: host, settings: {}, selectedElements: [], innerWidth: 800, innerHeight: 600, calls, domError, hostError });
  vm.runInContext(source + `
    captureViaDOM = async elements => { calls.push(['dom', elements]); if (domError) throw domError; return 'dom-png'; };
    captureViaHost = async elements => { calls.push(['host', elements]); if (hostError) throw hostError; return 'host-png'; };
    requestDisplayMediaFallback = async elements => { calls.push(['fallback', elements]); return 'screen-png'; };
  `, context);
  return { calls, capture: context.captureScreenshotBlob };
}
const selected = () => ({ isConnected: true, getBoundingClientRect: () => ({ left: 10, top: 10, right: 100, bottom: 100 }) });
test('bookmarklet always requests shared capture without DOM rendering', async () => {
  const { calls, capture } = setup(); const elements = [selected()];
  assert.equal(await capture(elements), 'screen-png');
  assert.deepEqual(calls.map(call => call[0]), ['fallback']);
  assert.equal(calls[0][1], elements);
});
test('empty, detached and offscreen selections do not request permission', async () => {
  const { calls, capture } = setup();
  for (const elements of [[], [{ ...selected(), isConnected: false }],
    [{ isConnected: true, getBoundingClientRect: () => ({ left: 900, right: 950, top: 10, bottom: 30 }) }]]) {
    await assert.rejects(capture(elements), error => error.selectorCode === 'empty');
  }
  assert.equal(calls.length, 0);
});
test('extension host keeps priority over DOM rendering', async () => {
  const { calls, capture } = setup({ host: { grabViewportFrame: true } });
  assert.equal(await capture([{}]), 'host-png'); assert.deepEqual(calls.map(call => call[0]), ['host']);
});
test('host failure retains existing behavior without unexpected authorization', async () => {
  const { calls, capture } = setup({ host: { grabViewportFrame: true }, hostError: new Error('host failed') });
  await assert.rejects(capture([{}]), /host failed/); assert.equal(calls.length, 1);
});
