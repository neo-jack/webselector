  // Development metadata is optional; never invent coordinates for component-only results.
  function sourceVueComponent(el) {
    let detected = false;
    for (let node = el, depth = 0; node && depth < 100; node = node.parentElement, depth++) {
      // In mixed-framework pages, respect a closer React host rather than an outer Vue wrapper.
      if (Object.keys(node).some(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'))) break;
      const instance = node.__vueParentComponent || node.__vnode?.component;
      if (!instance) continue;
      detected = true;
      const seen = new Set();
      for (let current = instance; current && !seen.has(current) && seen.size < 50; current = current.parent) {
        seen.add(current);
        const file = current.type?.__file;
        if (typeof file === 'string' && file.trim()) return { file, framework: 'vue', precision: 'component' };
      }
    }
    if (detected) throw new Error('已检测到 Vue，但组件没有 __file 源码信息；请使用保留开发信息的页面');
    return null;
  }
  function sourcePositionSuffix(result) {
    return result.precision === 'component' ? '' : ':' + result.line + ':' + result.column;
  }
  function sourceStackFrames(stack) {
    return String(stack || '').split('\n').flatMap(line => {
      const match = line.match(/((?:https?|file):\/\/[^\s)]+):(\d+):(\d+)\)?\s*$/);
      return match ? [{ file: match[1], line: +match[2], column: +match[3] }] : [];
    }).filter(frame => !/\/node_modules\/|\/@vite\/|react[-_]jsx|react-dom/.test(frame.file));
  }

  function sourceMapPosition(map, line, column) {
    if (map.version !== 3 || map.sections || typeof map.mappings !== 'string') throw new Error('暂不支持此 source map 格式');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let source = 0, originalLine = 0, originalColumn = 0;
    const rows = map.mappings.split(';');
    for (let row = 0; row < line && row < rows.length; row++) {
      let generated = 0, found = null;
      for (const segment of rows[row].split(',')) {
        if (!segment) continue;
        const values = []; let value = 0, shift = 0;
        for (const char of segment) {
          const digit = alphabet.indexOf(char);
          if (digit < 0 || shift > 30) throw new Error('source map 编码无效');
          value += (digit & 31) * Math.pow(2, shift);
          if (digit & 32) shift += 5;
          else { values.push(value & 1 ? -Math.floor(value / 2) : Math.floor(value / 2)); value = 0; shift = 0; }
        }
        if (shift || ![1, 4, 5].includes(values.length)) throw new Error('source map 段无效');
        generated += values[0];
        if (values.length > 1) { source += values[1]; originalLine += values[2]; originalColumn += values[3]; }
        if (row === line - 1 && generated <= column - 1) found = values.length > 1 && map.sources[source] != null
          ? { file: map.sources[source], line: originalLine + 1, column: originalColumn + 1 } : null;
      }
      if (row === line - 1) return found;
    }
    return null;
  }

  async function sourceFetch(url) {
    const parsed = new URL(url, location.href);
    if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) throw new Error('源码地址协议不受支持');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(parsed.href, { signal: controller.signal, credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('源码或 source map 无法读取（HTTP ' + response.status + '）');
      const body = await response.text();
      if (body.length > 15000000) throw new Error('source map 过大');
      return { body, url: response.url || parsed.href, header: response.headers.get('SourceMap') || response.headers.get('X-SourceMap') };
    } finally { clearTimeout(timer); }
  }

  async function sourceResolveFrame(frame) {
    const script = await sourceFetch(frame.file);
    const matches = [...script.body.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g)];
    const ref = script.header || (matches.length && matches[matches.length - 1][1]);
    if (!ref) throw new Error('页面没有可用 source map，无法还原源码行列');
    const mapURL = new URL(ref, script.url).href;
    const map = JSON.parse((await sourceFetch(mapURL)).body);
    const result = sourceMapPosition(map, frame.line, frame.column);
    if (!result) throw new Error('该位置没有源码映射');
    let file = (map.sourceRoot || '').replace(/\/?$/, '/') + result.file;
    if (!map.sourceRoot) file = result.file;
    if (!/^[a-z]:[\\/]/i.test(file) && !/^(?:webpack|file):/.test(file)) file = new URL(file, mapURL.startsWith('data:') ? script.url : mapURL).href;
    return { ...result, file };
  }

  function sourceLocalPath(file, root) {
    root = String(root || '').trim().replace(/\\/g, '/').replace(/\/+$/, '');
    if (!/^(?:[a-z]:\/|\/)/i.test(root)) throw new Error('请在设置中填写本地项目的绝对路径');
    let path = String(file).replace(/\\/g, '/');
    if (/^https?:/.test(path)) path = decodeURIComponent(new URL(path).pathname).replace(/^\/@fs\//, '');
    else if (/^file:/.test(path)) path = decodeURIComponent(new URL(path).pathname).replace(/^\/([a-z]:\/)/i, '$1');
    else if (/^webpack:/.test(path)) path = path.replace(/^webpack:\/\/[^/]*\//, '').replace(/^\.\//, '');
    const absolute = /^[a-z]:\//i.test(path) || path.toLowerCase().startsWith(root.toLowerCase() + '/');
    if (absolute) {
      if (!path.toLowerCase().startsWith(root.toLowerCase() + '/')) throw new Error('源码绝对路径不在配置的项目内，请检查项目根目录');
      path = path.slice(root.length + 1);
    }
    const parts = [];
    for (const part of path.replace(/^\/+/, '').split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!parts.length) throw new Error('源码路径超出项目目录'); parts.pop(); }
      else { if (/[:\x00-\x1f]/.test(part)) throw new Error('源码路径无效'); parts.push(part); }
    }
    if (!parts.length) throw new Error('源码文件路径为空');
    return root + '/' + parts.join('/');
  }

  async function locateElementSource(el, button) {
    button.disabled = true;
    const originalTitle = button.title;
    button.title = '正在定位源码…';
    try {
      let result = sourceVueComponent(el);
      if (!result) {
        let fiber = null;
        for (let node = el; node && !fiber; node = node.parentElement) {
          const key = Object.keys(node).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
          if (key) fiber = node[key];
        }
        if (!fiber) throw new Error('未找到 React / Vue 组件开发信息；当前支持 React 源码位置和 Vue 3 组件文件定位');
        let lastError; const seen = new Set();
        for (let current = fiber; current && seen.size < 50 && !seen.has(current); current = current._debugOwner || current.return) {
          seen.add(current);
          const direct = current._debugSource;
          if (direct && direct.fileName && direct.lineNumber) { result = { file: direct.fileName, line: direct.lineNumber, column: direct.columnNumber || 1 }; break; }
          for (const frame of sourceStackFrames(current._debugStack && current._debugStack.stack)) {
            try { result = await sourceResolveFrame(frame); break; } catch (error) { lastError = error; }
          }
          if (result) break;
        }
        if (!result) throw lastError || new Error('没有开发源码信息；生产构建通常无法定位');
      }
      const path = settings.sourceRoot ? sourceLocalPath(result.file, settings.sourceRoot) : result.file;
      if (!button.isConnected) return;
      const text = path + sourcePositionSuffix(result);
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else if (!fallbackCopy(text)) throw new Error('剪贴板不可用');
      showCopyFeedback('已复制源码位置');
      button.title = originalTitle;
    } catch (error) { button.title = error.message || '源码定位失败'; showCopyFeedback('源码定位失败', true, button.title); }
    finally { button.disabled = false; }
  }
