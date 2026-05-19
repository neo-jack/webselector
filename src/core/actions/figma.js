  // Write the design HTML while the click still carries clipboard activation.
  let figmaCopyBusy = false;
  async function copyElementToFigma(element, button) {
    if (figmaCopyBusy) return;
    if (!element?.isConnected) {
      showCopyFeedback('元素已移除，请重新选择', true); return;
    }
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      showCopyFeedback('当前页面不支持设计剪贴板，请使用 HTTPS', true); return;
    }
    figmaCopyBusy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.title = '正在复制到 Figma…';
    const hidden = [];
    try {
      // Hide our overlays, including when the selected element is body/html.
      document.querySelectorAll(`.${NS}-root, .${NS}-hover-box, .${NS}-sel-box, .${NS}-sel-corner, .${NS}-sel-label, .${NS}-marquee`).forEach(node => {
        hidden.push([node, node.style.getPropertyValue('display'), node.style.getPropertyPriority('display')]);
        node.style.setProperty('display', 'none', 'important');
      });
      const capture = FIGMA_CAPTURE(element).then(html => new Blob([html], { type: 'text/html' }));
      // Observe capture even if the clipboard rejects before it consumes the promise.
      const settled = capture.then(() => null, error => error);
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': capture })]);
      } finally {
        await settled;
      }
      if (button.isConnected) showCopyFeedback('已复制，请到 Figma 粘贴');
    } catch (error) {
      if (button.isConnected) showCopyFeedback('复制到 Figma 失败', true, error?.message || String(error));
    } finally {
      for (const [node, value, priority] of hidden) {
        if (value) node.style.setProperty('display', value, priority);
        else node.style.removeProperty('display');
      }
      figmaCopyBusy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.title = '复制到 Figma';
    }
  }
