import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';
import { runInNewContext, Script } from 'node:vm';

const exec = promisify(execFile);
const docker = (args, timeout = 15000) => exec('docker', args, { timeout, maxBuffer: 4 * 1024 * 1024 });

test('AItool serves its subpath offline and produces a complete bookmarklet', { timeout: 240000 }, async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aitool-nginx-test-'));
  const name = `aitool-nginx-test-${randomUUID()}`;
  const image = `${name}:test`;
  let built = false;
  let created = false;
  t.after(async () => {
    try {
      if (created) await docker(['rm', '-f', name]);
    } finally {
      try {
        if (built) await docker(['image', 'rm', image]);
      } finally {
        assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
        assert.match(path.basename(root), /^aitool-nginx-test-[a-zA-Z0-9]+$/);
        await rm(root, { recursive: true, force: true });
      }
    }
  });
  for (const file of ['Dockerfile', '.dockerignore', 'nginx.conf']) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    await writeFile(path.join(root, file), contents.replaceAll('\r\n', '\n'));
  }
  const assets = ['index.html', 'assets/favicon.svg', 'assets/forest.svg', 'assets/demo.mp4', 'core/index.js', 'core/dist/selector.js', 'core/dist/selector.css'];
  for (const file of assets) {
    const target = path.join(root, 'site', file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(new URL(`../../src/${file}`, import.meta.url), target);
  }
  await docker(['build', '--tag', image, root], 180000);
  built = true;
  await docker(['run', '--rm', '--network', 'none', image, 'nginx', '-t']);
  await docker(['create', '--name', name, '--network', 'none', image]);
  created = true;
  await docker(['start', name]);
  for (let attempt = 0; attempt < 30; attempt++) {
    const { stdout } = await docker(['inspect', '--format', '{{.State.Health.Status}}', name]);
    if (stdout.trim() === 'healthy') break;
    assert.notEqual(stdout.trim(), 'unhealthy');
    assert.ok(attempt < 29, 'AItool must become healthy without external network access');
    await setTimeout(1000);
  }
  const request = async (url, headersOnly = false) => {
    const { stdout } = await docker(['exec', name, 'curl', '--silent', '--show-error', '--noproxy', '*', '--max-time', '5',
      ...(headersOnly ? ['--dump-header', '-', '--output', '/dev/null'] : ['--fail']), `http://127.0.0.1${url}`]);
    return stdout;
  };
  const redirect = await request('/AItool?lang=zh', true);
  assert.match(redirect, /^HTTP\/1\.1 301 /);
  assert.match(redirect, /^Location: \/AItool\/\?lang=zh\r?$/mi);
  for (const file of ['', ...assets]) {
    const headers = await request(`/AItool/${file}`, true);
    assert.match(headers, /^HTTP\/1\.1 200 /, file);
    assert.match(headers, /^Cache-Control: no-cache\r?$/mi, file);
  }
  assert.match(await request('/AItool/', true), /^Content-Type: text\/html\r?$/mi);
  assert.match(await request('/AItool/core/index.js', true), /^Content-Type: (?:application|text)\/javascript\r?$/mi);
  assert.match(await request('/AItool/core/dist/selector.css', true), /^Content-Type: text\/css\r?$/mi);
  for (const url of ['/', '/aitool/', '/AItool/missing.js', '/AItool/core/build.js', '/AItool/core/editor.js', '/AItool/AGENTS.md', '/AItool/.git/config']) {
    const headers = await request(url, true);
    assert.match(headers, /^HTTP\/1\.1 404 /, url);
    assert.match(headers, /^Cache-Control: no-store\r?$/mi, url);
  }
  assert.match(await request('/AItool/'), /id="bm-link"/);
  const fetched = [];
  const link = { href: '#', classList: { remove() {} } };
  const error = { style: { display: 'none' } };
  let ready;
  runInNewContext(await request('/AItool/core/index.js'), {
    URL,
    document: {
      currentScript: { src: 'https://example.test/AItool/core/index.js' },
      addEventListener(event, callback) { if (event === 'DOMContentLoaded') ready = callback; },
      getElementById(id) { return id === 'bm-link' ? link : error; },
    },
    fetch: async url => {
      fetched.push(new URL(url).pathname);
      const body = await request(new URL(url).pathname);
      return { ok: true, text: async () => body };
    },
  });
  ready();
  for (let attempt = 0; attempt < 100 && link.href === '#' && error.style.display === 'none'; attempt++) await setTimeout(50);
  assert.equal(error.style.display, 'none');
  assert.deepEqual(fetched.sort(), ['/AItool/core/dist/selector.css', '/AItool/core/dist/selector.js']);
  assert.match(link.href, /^javascript:/);
  assert.doesNotThrow(() => new Script(decodeURIComponent(link.href.slice('javascript:'.length))));
});
