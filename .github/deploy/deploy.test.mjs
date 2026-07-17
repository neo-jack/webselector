import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const shell = process.env.DEPLOY_TEST_SHELL || 'sh';
const script = fileURLToPath(new URL('deploy.sh', import.meta.url));
function shellPath(value) {
  if (process.platform !== 'win32') return value;
  const result = spawnSync(shell, ['-c', 'cygpath -u "$1"', 'probe', value], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function deployment(t, failure = '', { existing = true, backup = false, running = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aitool-deploy-test-'));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.match(path.basename(root), /^aitool-deploy-test-[a-zA-Z0-9]+$/);
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'state'));
  // Unrelated containers must survive every success and failure path.
  await writeFile(path.join(root, 'state', '100my-page'), 'homepage');
  await writeFile(path.join(root, 'state', '100my-page-ai'), 'api');
  if (existing) await writeFile(path.join(root, 'state', '101my-aitool'), 'old');
  if (backup) await writeFile(path.join(root, 'state', '101my-aitool-previous'), 'retained');
  await writeFile(path.join(root, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  await writeFile(path.join(root, 'docker'), `#!/bin/sh
printf '%s\\n' "$*" >> "$MOCK_ROOT/commands"
if [ "$1" = --config ]; then shift 2; fi
state="$MOCK_ROOT/state"
case "$1" in
 container) test -f "$state/$3" ;;
 login) cat >/dev/null; [ "$FAILURE" != login ] ;;
 pull) [ "$FAILURE" != pull ] ;;
 run) [ "$FAILURE" != validate ] ;;
 network)
   if [ "$2" = inspect ]; then exit 1; fi
   [ "$FAILURE" != network ] ;;
 inspect)
   if [ "$3" = '{{.State.Running}}' ]; then printf '%s' "$WAS_RUNNING"
   elif [ "$FAILURE" = health ]; then printf unhealthy
   elif [ "$FAILURE" = timeout ]; then printf starting
   else printf healthy; fi ;;
 rename) mv "$state/$2" "$state/$3" ;;
 stop) [ "$FAILURE" != stop ] ;;
 create)
   [ "$FAILURE" != create ] || exit 1
   printf new > "$state/$3" ;;
 start)
   if [ "$FAILURE" = start ] && [ "$(cat "$state/$2")" = new ]; then exit 1; fi ;;
 rm)
   shift
   if [ "$1" = -f ]; then shift; fi
   rm "$state/$1" ;;
 *) exit 98 ;;
esac
`, { mode: 0o755 });
  const result = spawnSync(shell, ['-c',
    'PATH="$1:$PATH"; export PATH; [ "$(command -v docker)" = "$1/docker" ] || exit 99; exec sh "$2"',
    'probe', shellPath(root), shellPath(script)], {
    encoding: 'utf8', timeout: 30000,
    env: { ...process.env, MOCK_ROOT: shellPath(root), FAILURE: failure, WAS_RUNNING: String(running),
      GHCR_USER: 'fixture', GHCR_TOKEN: 'fixture-secret', DEPLOY_IMAGE: 'fixture-aitool:sha' },
  });
  assert.equal(result.error, undefined, String(result.error));
  assert.notEqual(result.status, 99, 'Offline tests must never use the real Docker daemon');
  const state = Object.fromEntries(await Promise.all((await readdir(path.join(root, 'state')))
    .map(async name => [name, await readFile(path.join(root, 'state', name), 'utf8')])));
  const commands = await readFile(path.join(root, 'commands'), 'utf8');
  assert.equal(state['100my-page'], 'homepage');
  assert.equal(state['100my-page-ai'], 'api');
  delete state['100my-page'];
  delete state['100my-page-ai'];
  assert.doesNotMatch(commands + result.stdout + result.stderr, /fixture-secret/);
  return { ...result, state, commands };
}

test('updates only AItool, publishes no host port and removes backup after health check', async t => {
  const result = await deployment(t);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.state, { '101my-aitool': 'new' });
  const create = result.commands.split('\n').find(line => line.startsWith('create '));
  assert.match(create, /--network 100my-page-network --network-alias ai-tool/);
  assert.doesNotMatch(create, /(?: -p |--publish)/);
  assert.ok(result.commands.indexOf('nginx -t') < result.commands.indexOf('stop '));
  assert.ok(result.commands.indexOf('.State.Health.Status') < result.commands.indexOf('rm 101my-aitool-previous'));
});
test('first deployment succeeds without an existing AItool container', async t => {
  const result = await deployment(t, '', { existing: false });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.state, { '101my-aitool': 'new' });
});
for (const failure of ['login', 'pull', 'validate', 'network', 'stop', 'create', 'start', 'health', 'timeout']) {
  test(`restores the old container after ${failure} failure`, async t => {
    const result = await deployment(t, failure);
    assert.notEqual(result.status, 0);
    assert.deepEqual(result.state, { '101my-aitool': 'old' });
  });
}
test('first deployment failure removes the failed container', async t => {
  const result = await deployment(t, 'health', { existing: false });
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.state, {});
});
test('rollback does not start a previously stopped container', async t => {
  const result = await deployment(t, 'health', { running: false });
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.state, { '101my-aitool': 'old' });
  assert.equal(result.commands.split('\n').filter(line => line === 'start 101my-aitool').length, 1);
});
test('refuses to overwrite a pending rollback backup', async t => {
  const result = await deployment(t, '', { backup: true });
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.state, { '101my-aitool': 'old', '101my-aitool-previous': 'retained' });
  assert.doesNotMatch(result.commands, /(?:stop|rename|create) /);
});
