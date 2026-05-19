  // ── 截图捕获 ───────────────────────────────────────────────
  let screenshotTimer = null;
  function setScreenshotButtonIdle() {
    if (!screenshotBtn) return;
    screenshotBtn.innerHTML = CAMERA_SVG;
    screenshotBtn.title = t("copyScreenshot");
    screenshotBtn.setAttribute("aria-label", t("copyScreenshot"));
  }

  function showScreenshotFeedback(msg, isError, detail) {
    const btn = chatPanel.querySelector(`.${NS}-screenshot-btn`);
    if (screenshotTimer) clearTimeout(screenshotTimer);
    btn.classList.remove(`${NS}-screenshot-done`, `${NS}-screenshot-error`);
    btn.classList.add(isError ? `${NS}-screenshot-error` : `${NS}-screenshot-done`);
    btn.title = detail || msg;
    btn.setAttribute("aria-label", detail || msg);
    btn.innerHTML = isError
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    screenshotTimer = setTimeout(() => { btn.classList.remove(`${NS}-screenshot-done`, `${NS}-screenshot-error`); setScreenshotButtonIdle(); screenshotTimer = null; }, 2400);
  }

  async function captureScreenshot(options) {
    if (selectedElements.length === 0) return;
    // ── 授权门槛（HOST_CONTRACT.md §1.2）────────────────────
    // 书签脚本没有 HOST.licensing，会跳过。扩展可能会对截图加授权门槛。
    if (HOST.licensing && HOST.licensing.required && !HOST.licensing.active) {
      HOST.requestActivation && HOST.requestActivation("copy");
      showCopyFeedback(t("needLicense"), true);
      return;
    }
    const opts = options || {};
    const feedbackTarget = opts.feedbackTarget || "screenshot";
    const showError = (code, err) => feedbackTarget === "copy" ? showCopyCaptureError(code, err) : showScreenshotError(code, err);
    const showSuccess = (savedImage) => feedbackTarget === "copy" ? showCopyFeedback(opts.downloadImage && savedImage ? t("copiedSaved") : t("copied")) : showScreenshotFeedback(t("screenshotCopied"));
    // DOM / Host 捕获不依赖 getDisplayMedia；仅授权兜底检查该能力。
    if (!navigator.clipboard) {
      showError("unsupported");
      return;
    }

    const imageFilename = opts.downloadImage ? screenshotFilename() : "";
    let imageBlob;
    try {
      imageBlob = await captureScreenshotBlob();
    } catch (err) {
      showError(classifyScreenshotError(err, "capture"), err);
      return;
    }

    let imageSaved = false;
    let savedFilename = imageFilename;
    let savedPath = "";
    if (imageFilename) {
      try {
        const saveResult = await saveScreenshotImage(imageBlob, imageFilename);
        imageSaved = saveResult.saved;
        savedFilename = saveResult.filename || imageFilename;
        savedPath = saveResult.path || "";
      } catch (err) {
        showError(classifyScreenshotError(err, "capture"), err);
        return;
      }
    }

    const text = Object.prototype.hasOwnProperty.call(opts, "text") ? opts.text : (settings.combined ? buildPromptText() : "");
    const textWithImagePath = imageFilename ? appendScreenshotSaveReference(text, savedFilename, imageSaved, savedPath) : text;

    try {
      if (imageFilename && textWithImagePath) {
        await navigator.clipboard.writeText(textWithImagePath);
      } else {
        if (!window.ClipboardItem) {
          showError("unsupported");
          return;
        }
        let itemData = { "image/png": imageBlob };
        if (textWithImagePath) {
          itemData = {
            "text/html": screenshotHtmlBlob(textWithImagePath, imageBlob),
            "text/plain": new Blob([textWithImagePath], { type: "text/plain" }),
            "image/png": imageBlob,
          };
        }
        await navigator.clipboard.write([new ClipboardItem(itemData)]);
      }
      showSuccess(imageSaved);
    } catch (err) {
      showError("clipboard", err);
    }
  }

  async function saveScreenshotImage(blob, filename) {
    // 扩展：通过 chrome.downloads 保存，并拿回真实磁盘路径；
    // 没有保存对话框，也不需要猜路径。书签脚本没有 HOST.downloadFile，
    // 会原样回落到下面的文件选择器 / 待保存流程。
    if (HOST.downloadFile) {
      try {
        const res = await HOST.downloadFile(filename, blob, "image/png");
        if (res) {
          const path = res.path || "";
          const name = path ? (path.split(/[\\/]/).pop() || filename) : filename;
          return { saved: true, filename: name, path };
        }
      } catch (err) { console.warn("[Selector] host download failed, falling back", err); }
    }
    try {
      const result = await writeScreenshotWithPicker(blob, filename);
      clearPendingScreenshotSave();
      return result;
    } catch (err) {
      if (err && err.name === "AbortError") throw screenshotError("cancelled", err);
      console.warn("[Selector] Save picker unavailable", err);
    }

    showPendingScreenshotSave(blob, filename);
    return { saved: false, filename };
  }

  // 当写轮眼报告超过剪贴板阈值时，自动把它下载成 .md 文件，并只把
  // 简短提示摘要放进剪贴板。没有明确说明的话，接收方 AI 无法知道
  // 详细报告的存在。这个提示会放在剪贴板文本最前面，确保 AI 先看到它。
  function appendSharinganDownloadReference(text, filename, fullChars, realPath) {
    const head = `Sharingan replication report: ${filename}  (${(fullChars / 1024).toFixed(1)} KB)`;
    const why = `The full DOM/CSS/font/animation report was downloaded as a Markdown file (it exceeded the clipboard size limit). The prompt body below is only an abbreviated summary — for high-fidelity replication, read the .md file.`;
    // 扩展：引用真实磁盘路径；书签脚本：只能给出 mdfind/find 之类的猜测结果。
    const locate = realPath
      ? [`Saved to: ${realPath}`]
      : [
          `To locate the absolute path, run one of:`,
          `  mdfind -name "${filename}"                              # macOS`,
          `  find ~ -name "${filename}" -mtime -1                   # Linux / WSL`,
        ];
    const ref = [head, why].concat(locate).join("\n");
    return text ? `${ref}\n\n${text}` : ref;
  }

  // 保存 Markdown 报告。扩展走 chrome.downloads（返回真实路径）；
  // 书签脚本走 anchor download（没有路径）。返回绝对路径或 ""。
  async function saveMarkdownFile(text, filename) {
    if (HOST.downloadFile) {
      try {
        const res = await HOST.downloadFile(filename, new Blob([text], { type: "text/markdown" }), "text/markdown");
        if (res && res.path) return res.path;
      } catch (_) { /* 回落 */ }
      return "";
    }
    downloadMarkdown(text, filename);
    return "";
  }

  // 浏览器不会暴露用户在保存对话框里选的绝对路径（沙箱限制），所以
  // 我们改给接收方 AI 一个可执行的定位命令。文件名带时间戳，确保全局
  // 搜索只会命中一条。
  function appendScreenshotSaveReference(text, filename, saved, realPath) {
    // 扩展：chrome.downloads 已经给出真实绝对路径，直接引用即可。
    // 下面的 mdfind/find 猜测只用于书签脚本，因为浏览器不会暴露所选路径。
    if (realPath) {
      const ref = `Screenshot saved to: ${realPath}`;
      return text ? `${text}\n\n${ref}` : ref;
    }
    const lines = saved
      ? [
          `Screenshot file: ${filename}`,
          `The user saved this PNG via the browser save dialog (path not exposed by the browser).`,
          `To locate the absolute path, run one of:`,
          `  mdfind -name "${filename}"                              # macOS`,
          `  find ~ -name "${filename}" -mtime -1                   # Linux / WSL`,
        ]
      : [
          `Screenshot file: ${filename}  (capture pending)`,
          `Auto-save did not run — ask the user to click "Save PNG" in the Selector panel and pick a folder.`,
          `After saving, locate it with:`,
          `  mdfind -name "${filename}"                              # macOS`,
          `  find ~ -name "${filename}" -mtime -1                   # Linux / WSL`,
        ];
    const ref = lines.join("\n");
    return text ? `${text}\n\n${ref}` : ref;
  }

  async function writeScreenshotWithPicker(blob, filename) {
    if (!window.showSaveFilePicker || !window.isSecureContext) throw new Error("File picker unavailable");
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
      excludeAcceptAllOption: false,
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { saved: true, filename: handle.name || filename };
  }

  function showPendingScreenshotSave(blob, filename) {
    pendingScreenshotSave = { blob, filename };
    if (!saveBtn) return;
    saveBtn.textContent = t("savePng");
    saveBtn.classList.remove(`${NS}-hidden`);
  }

  function clearPendingScreenshotSave() {
    pendingScreenshotSave = null;
    if (saveBtn) saveBtn.classList.add(`${NS}-hidden`);
  }

  async function savePendingScreenshot() {
    if (!pendingScreenshotSave) return;
    const pending = pendingScreenshotSave;
    saveBtn.disabled = true;
    try {
      await writeScreenshotWithPicker(pending.blob, pending.filename);
      clearPendingScreenshotSave();
      showCopyFeedback(t("copiedSaved"));
    } catch (err) {
      if (err && err.name !== "AbortError") showCopyCaptureError("capture", err);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  function screenshotErrorKey(code) {
    return {
      unsupported: "errUnsupported",
      cancelled: "errCancelled",
      permission: "errPermission",
      clipboard: "errClipboard",
      empty: "errEmpty",
      capture: "errCapture",
    }[code] || "errCapture";
  }

  function showScreenshotError(code, err) {
    const key = screenshotErrorKey(code);
    const detail = err ? `${err.name || "Error"}: ${err.message || String(err)}` : "";
    if (err) console.warn(`[Selector] ${t(key)}`, err);
    showScreenshotFeedback(t(key), true, detail);
  }

  function screenshotError(code, cause) {
    const err = new Error(cause && cause.message ? cause.message : code);
    err.name = cause && cause.name ? cause.name : "SelectorScreenshotError";
    err.selectorCode = code;
    err.cause = cause;
    return err;
  }

  function classifyScreenshotError(err, stage) {
    if (!err) return stage === "clipboard" ? "clipboard" : "capture";
    if (err.selectorCode) return err.selectorCode;
    if (stage === "clipboard") return "clipboard";
    const name = err.name || "";
    const message = String(err.message || "").toLowerCase();
    if (name === "NotAllowedError" || message.includes("permission")) {
      if (message.includes("system") || message.includes("denied")) return "permission";
      return "cancelled";
    }
    if (name === "SecurityError") return "permission";
    return "capture";
  }

  function defer() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  }

  // ── 截图捕获分发器（HOST_CONTRACT.md §1.3）────────────────
  // Host 保留原捕获方式；书签先 DOM 渲染，失败后请求真实截图。
  async function captureScreenshotBlob(elements = [...selectedElements]) {
    // ── 完整元素 / 整页区域捕获（HOST_CONTRACT.md §10）────
    // 完整元素 / 整页能力仍由 Host 提供。
    const scope = (settings && settings.screenshotScope) || "viewport";
    if (scope !== "viewport" && HOST.captureRegion) {
      const editorEls = document.querySelectorAll(`.${NS}-root, .${NS}-hover-box, .${NS}-sel-box, .${NS}-sel-corner, .${NS}-sel-label, .${NS}-annotate-btn, .${NS}-marquee`);
      const previousDisplay = Array.from(editorEls, el => [el, el.style.display]);
      try {
        editorEls.forEach(el => { el.style.display = "none"; });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const dpr = window.devicePixelRatio || 1;
        const docEl = document.documentElement;
        const pageWidth = docEl.scrollWidth;
        let geom;
        if (scope === "fullPage") {
          geom = {
            x: 0,
            y: 0,
            w: pageWidth,
            h: Math.max(docEl.scrollHeight, document.body ? document.body.scrollHeight : 0),
            dpr,
            pageWidth,
          };
        } else {
          // fullElement：把所选元素的矩形按文档坐标求并集。
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          elements.forEach(el => {
            const r = el.getBoundingClientRect();
            minX = Math.min(minX, r.left + window.scrollX);
            minY = Math.min(minY, r.top + window.scrollY);
            maxX = Math.max(maxX, r.right + window.scrollX);
            maxY = Math.max(maxY, r.bottom + window.scrollY);
          });
          const pad = 8;
          minX = Math.max(0, Math.floor(minX - pad));
          minY = Math.max(0, Math.floor(minY - pad));
          maxX = Math.min(pageWidth, Math.ceil(maxX + pad));
          maxY = Math.ceil(maxY + pad);
          geom = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, dpr, pageWidth };
        }
        if (!(geom.w > 0) || !(geom.h > 0)) throw screenshotError("empty");
        const blob = await HOST.captureRegion(scope, geom);
        if (!blob) throw screenshotError("capture");
        return blob;
      } finally {
        previousDisplay.forEach(([el, display]) => { el.style.display = display; });
      }
    }
    if (HOST.grabViewportFrame) return captureViaHost(elements);
    if (!elements.length || elements.some(el => !el?.isConnected)) throw screenshotError('empty');
    const rects = elements.map(el => el.getBoundingClientRect());
    const left = Math.max(0, Math.floor(Math.min(...rects.map(r => r.left)) - 8));
    const top = Math.max(0, Math.floor(Math.min(...rects.map(r => r.top)) - 8));
    const right = Math.min(innerWidth, Math.ceil(Math.max(...rects.map(r => r.right)) + 8));
    const bottom = Math.min(innerHeight, Math.ceil(Math.max(...rects.map(r => r.bottom)) + 8));
    if (right <= left || bottom <= top) throw screenshotError('empty');
    return requestDisplayMediaFallback(elements);
  }

  async function captureViaDOM(elements) {
    if (!elements.length || elements.some(el => !el?.isConnected)) throw screenshotError('empty');
    const rects = elements.map(el => el.getBoundingClientRect());
    const x = Math.max(0, Math.floor(Math.min(...rects.map(r => r.left)) - 8));
    const y = Math.max(0, Math.floor(Math.min(...rects.map(r => r.top)) - 8));
    const right = Math.min(innerWidth, Math.ceil(Math.max(...rects.map(r => r.right)) + 8));
    const bottom = Math.min(innerHeight, Math.ceil(Math.max(...rects.map(r => r.bottom)) + 8));
    const width = right - x, height = bottom - y;
    if (width <= 0 || height <= 0) throw screenshotError('empty');
    // 视频由渲染库提取可读帧或封面；跨域污染等实际失败再请求授权。
    // 跨文档内容和 WebGL 的当前帧仍不能可靠还原。
    if (elements.some(el => el.matches('iframe,canvas,object,embed') || el.querySelector('iframe,canvas,object,embed'))) {
      throw screenshotError('capture');
    }
    // SVG 中的 fixed/sticky 在滚动后可能重新定位，不能把错位图片当作成功。
    if (scrollX || scrollY) {
      for (const node of document.querySelectorAll('body *')) {
        if (node.closest(`.${NS}-root`)) continue;
        if (!['fixed', 'sticky'].includes(getComputedStyle(node).position)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.right > x && rect.left < right && rect.bottom > y && rect.top < bottom) throw screenshotError('capture');
      }
    }
    const root = document.documentElement;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let timeout;
    try {
      const canvas = await Promise.race([
        DOM_IMAGE.toCanvas(root, {
          width, height, pixelRatio,
          backgroundColor: getComputedStyle(root).backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : getComputedStyle(root).backgroundColor,
          // 在 SVG 内平移整页，保持祖先样式、多选间距和页面背景，只栅格化选区。
          style: { width: root.scrollWidth + 'px', height: root.scrollHeight + 'px',
            transform: `translate(${-x - scrollX}px, ${-y - scrollY}px)`, transformOrigin: 'top left', margin: '0' },
          filter: node => !(node.nodeType === 1 && (node.id === 'ai-editor-style' || Array.from(node.classList || []).some(name => name.startsWith(NS + '-')))),
          // 资源缺失必须失败，不能以空图片替代后继续投递。
          onImageErrorHandler: () => { throw screenshotError('capture'); },
        }),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(screenshotError('capture')), 12000); }),
      ]);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob?.size) throw screenshotError('capture');
      return blob;
    } finally { clearTimeout(timeout); }
  }

  let displayCaptureStream = null;
  let displayCapturePending = null;
  let displayCaptureClosed = false;

  function liveDisplayCapture() {
    return displayCaptureStream?.getVideoTracks()[0]?.readyState === 'live' ? displayCaptureStream : null;
  }

  function releaseDisplayCapture() {
    const stream = displayCaptureStream;
    displayCaptureStream = null;
    if (stream) stream.getTracks().forEach(track => track.stop());
  }

  function closeDisplayCapture() {
    displayCaptureClosed = true;
    releaseDisplayCapture();
  }

  async function acquireDisplayCapture() {
    if (displayCaptureClosed) throw screenshotError('cancelled');
    if (liveDisplayCapture()) return displayCaptureStream;
    if (displayCapturePending) return displayCapturePending;
    releaseDisplayCapture();
    displayCapturePending = (async () => {
      const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true, video: { frameRate: 1 } });
      if (displayCaptureClosed || stream.getVideoTracks()[0]?.readyState !== 'live') {
        stream.getTracks().forEach(track => track.stop());
        throw screenshotError('cancelled');
      }
      displayCaptureStream = stream;
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (displayCaptureStream === stream) releaseDisplayCapture();
      }, { once: true });
      return stream;
    })();
    try { return await displayCapturePending; }
    finally { displayCapturePending = null; }
  }

  function requestDisplayMediaFallback(elements) {
    if (displayCaptureClosed) return Promise.reject(screenshotError('cancelled'));
    if (liveDisplayCapture() || displayCapturePending) return captureViaDisplayMedia(elements);
    if (!navigator.mediaDevices?.getDisplayMedia) return Promise.reject(screenshotError('unsupported'));
    if (navigator.userActivation?.isActive) return captureViaDisplayMedia(elements);
    // 调用方经过异步操作导致激活失效时，需要一次新的用户点击。
    return new Promise((resolve, reject) => {
      const dialog = document.createElement('dialog');
      dialog.className = `${NS}-root ${NS}-capture-fallback`;
      dialog.style.cssText = 'position:fixed!important;inset:0!important;margin:auto!important;padding:24px!important;border:1px solid #ddd!important;border-radius:12px!important;background:#fff!important;color:#222!important;font:14px/1.6 sans-serif!important;max-width:360px!important;z-index:2147483647!important';
      const message = document.createElement('p');
      message.textContent = lang === 'zh' ? '请授权共享当前标签页；共享期间可连续截图。' : 'Share the current tab to take screenshots while sharing remains active.';
      const allow = document.createElement('button');
      allow.textContent = lang === 'zh' ? '授权截图' : 'Allow screenshot';
      const cancel = document.createElement('button');
      cancel.textContent = lang === 'zh' ? '取消' : 'Cancel';
      for (const button of [allow, cancel]) button.style.cssText = 'padding:8px 16px!important;margin:8px 8px 0 0!important;background:#eee!important;color:#222!important;border:1px solid #ccc!important;border-radius:6px!important;cursor:pointer!important;font:14px sans-serif!important';
      const cleanup = () => { observer.disconnect(); dialog.close(); dialog.remove(); };
      const abort = () => { cleanup(); reject(screenshotError('cancelled')); };
      const owner = document.querySelector(`.${NS}-root`);
      const observer = new MutationObserver(() => { if (owner && !owner.isConnected) abort(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      allow.onclick = () => { cleanup(); captureViaDisplayMedia(elements).then(resolve, reject); };
      cancel.onclick = abort;
      dialog.addEventListener('cancel', event => { event.preventDefault(); abort(); });
      dialog.append(message, allow, cancel);
      document.documentElement.append(dialog);
      dialog.showModal();
    });
  }

  // 扩展路径：从 Host 获取一帧可直接绘制的 viewport 图像（已是物理像素，
  // 即 viewport CSS px × dpr），再用与 getDisplayMedia 路径相同的数学逻辑
  // 裁剪到选择区域。无需 getDisplayMedia，也不会弹提示。
  async function captureViaHost(elements) {
    const editorEls = document.querySelectorAll(`.${NS}-root, .${NS}-hover-box, .${NS}-sel-box, .${NS}-sel-corner, .${NS}-sel-label, .${NS}-annotate-btn, .${NS}-marquee`);
    const previousDisplay = Array.from(editorEls, el => [el, el.style.display]);
    try {
      editorEls.forEach(el => { el.style.display = "none"; });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const frame = await HOST.grabViewportFrame();
      const sourceWidth = frame.width || frame.naturalWidth || frame.videoWidth;
      const sourceHeight = frame.height || frame.naturalHeight || frame.videoHeight;
      const dpr = window.devicePixelRatio || 1;
      let minX=Infinity, minY=Infinity, maxX=0, maxY=0;
      elements.forEach(el => { const r=el.getBoundingClientRect(); minX=Math.min(minX,r.left*dpr); minY=Math.min(minY,r.top*dpr); maxX=Math.max(maxX,r.right*dpr); maxY=Math.max(maxY,r.bottom*dpr); });
      const pad = 8 * dpr;
      minX=Math.max(0,Math.floor(minX-pad)); minY=Math.max(0,Math.floor(minY-pad));
      maxX=Math.min(sourceWidth,Math.ceil(maxX+pad)); maxY=Math.min(sourceHeight,Math.ceil(maxY+pad));
      const w=maxX-minX, h=maxY-minY;
      if (w <= 0 || h <= 0) throw screenshotError("empty");
      const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
      canvas.getContext("2d").drawImage(frame, minX, minY, w, h, 0, 0, w, h);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw screenshotError("capture");
      return blob;
    } finally {
      previousDisplay.forEach(([el, display]) => { el.style.display = display; });
    }
  }

  async function captureViaDisplayMedia(elements) {
    const editorEls = document.querySelectorAll(`.${NS}-root, .${NS}-hover-box, .${NS}-sel-box, .${NS}-sel-corner, .${NS}-sel-label, .${NS}-annotate-btn, .${NS}-marquee`);
    const previousDisplay = Array.from(editorEls, el => [el, el.style.display]);
    let stream = null;
    let frame = null;

    try {
      try { stream = await acquireDisplayCapture(); }
      catch (err) { throw screenshotError(classifyScreenshotError(err, "capture"), err); }
      editorEls.forEach(el => { el.style.display = "none"; });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const track = stream.getVideoTracks()[0];
      await new Promise(r => setTimeout(r, 100));
      frame = await grabFrame(stream, track);
      const sourceWidth = frame.width || frame.videoWidth;
      const sourceHeight = frame.height || frame.videoHeight;
      const dpr = window.devicePixelRatio || 1;
      let minX=Infinity, minY=Infinity, maxX=0, maxY=0;
      elements.forEach(el => { const r=el.getBoundingClientRect(); minX=Math.min(minX,r.left*dpr); minY=Math.min(minY,r.top*dpr); maxX=Math.max(maxX,r.right*dpr); maxY=Math.max(maxY,r.bottom*dpr); });
      const pad = 8 * dpr;
      minX=Math.max(0,Math.floor(minX-pad)); minY=Math.max(0,Math.floor(minY-pad));
      maxX=Math.min(sourceWidth,Math.ceil(maxX+pad)); maxY=Math.min(sourceHeight,Math.ceil(maxY+pad));
      const w=maxX-minX, h=maxY-minY;
      if (w <= 0 || h <= 0) throw screenshotError("empty");
      const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
      canvas.getContext("2d").drawImage(frame, minX, minY, w, h, 0, 0, w, h);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw screenshotError("capture");
      return blob;
    } finally {
      if (frame?.close) frame.close();
      if (frame?.tagName === 'VIDEO') { frame.pause(); frame.srcObject = null; }
      previousDisplay.forEach(([el, display]) => { el.style.display = display; });
    }
  }

  async function grabFrame(stream, track) {
    if (window.ImageCapture) return new ImageCapture(track).grabFrame();
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise(r => requestAnimationFrame(r));
    return video;
  }

  async function screenshotHtmlBlob(text, imageBlob) {
    const imageUrl = await blobToDataUrl(imageBlob);
    return new Blob([
      '<div data-selector-copy="screenshot-text">',
      '<pre style="white-space:pre-wrap;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;margin:0 0 12px;">',
      escapeHtml(text),
      '</pre>',
      '<img alt="Selector screenshot" src="',
      imageUrl,
      '" style="max-width:100%;height:auto;">',
      '</div>',
    ], { type: "text/html" });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Could not encode screenshot"));
      reader.readAsDataURL(blob);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }
