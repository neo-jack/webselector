  // ── 元素 AI-ID ─────────────────────────────────────────────
  function assignAiIds(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node; while ((node = walker.nextNode())) { if (isEditorElement(node)) continue; if (!node.hasAttribute(AI_ID)) node.setAttribute(AI_ID, `el-${aiIdCounter++}`); }
  }
  function isEditorElement(el) { return el && el.closest && !!el.closest(`.${NS}-root`); }
  function byAiId(id) { return document.querySelector(`[${AI_ID}="${id}"]`); }

  const ignoredElements = new Set();
  function ignoreElement(el) {
    pushHistory(); ignoredElements.add(el); removeSelection(el);
    removeAnnotationPopover(); showHover(null); updateTags();
  }
  function pointerTarget(event) {
    if (isEditorElement(event.target)) return null;
    if (!ignoredElements.size) return resolveTarget(event.target);
    const saved = new Map();
    function setPointer(el, value) {
      if (!saved.has(el)) saved.set(el, [el.style.getPropertyValue('pointer-events'), el.style.getPropertyPriority('pointer-events')]);
      el.style.setProperty('pointer-events', value, 'important');
    }
    try {
      for (const el of ignoredElements) {
        if (!el.isConnected) continue;
        for (const child of el.children) if (!ignoredElements.has(child) && getComputedStyle(child).pointerEvents !== 'none') setPointer(child, 'auto');
      }
      for (const el of ignoredElements) if (el.isConnected) setPointer(el, 'none');
      for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
        if (ignoredElements.has(el) || isEditorElement(el)) continue;
        const target = resolveTarget(el); if (target) return target;
      }
      return null;
    } finally {
      for (const [el, [value, priority]] of saved) {
        if (value) el.style.setProperty('pointer-events', value, priority); else el.style.removeProperty('pointer-events');
      }
    }
  }

  // ── 目标解析 ───────────────────────────────────────────────
  function resolveTarget(el) {
    if (!el || isEditorElement(el) || el === document.body || el === document.documentElement) return null;
    const action = closestActionElement(el);
    if (action && !ignoredElements.has(action) && !isEditorElement(action) && isVisible(action)) return action;
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (ignoredElements.has(cur)) return !ignoredElements.has(el) && isVisible(el) ? el : null;
      if (isEditorElement(cur)) { cur = cur.parentElement; continue; }
      if (!isVisible(cur)) { cur = cur.parentElement; continue; }
      if (isMeaningful(cur)) return cur;
      cur = cur.parentElement;
    }
    return ignoredElements.has(el) ? null : el;
  }

  function closestActionElement(el) {
    return el && el.closest && el.closest("button,a,input,select,textarea,[role='button'],[role='link'],[role='menuitem'],[role='tab'],[role='checkbox'],[role='radio']");
  }
  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
  }
  function isMeaningful(el) {
    if (isAtomicElement(el)) return true;
    if (hasDirectText(el)) return true;
    if (el.querySelector("img,video,canvas,svg,button,a,input,select,textarea,iframe")) return true;
    return el.children.length > 1;
  }

  function isAtomicElement(el) {
    const tag = el.tagName && el.tagName.toLowerCase();
    if (/^(button|a|input|select|textarea|img|video|canvas|svg|iframe|h[1-6]|p|li|dt|dd|summary)$/.test(tag)) return true;
    return !!el.getAttribute("role");
  }
  function hasDirectText(el) {
    for (const n of el.childNodes) { if (n.nodeType === 3 && n.textContent.trim()) return true; }
    return false;
  }

  // ── 悬停高亮层 ────────────────────────────────────────────
  function createHoverBox() { hoverBox = document.createElement("div"); hoverBox.className = `${NS}-hover-box`; document.body.appendChild(hoverBox); }
  function showHover(el) {
    if (!el || isEditorElement(el) || selectedElements.includes(el)) { hoverBox.style.opacity = "0"; return; }
    const r = el.getBoundingClientRect();
    hoverBox.style.top = (r.top-1)+"px"; hoverBox.style.left = (r.left-1)+"px";
    hoverBox.style.width = (r.width+2)+"px"; hoverBox.style.height = (r.height+2)+"px"; hoverBox.style.opacity = "1";
  }

  // ── 鼠标处理 ───────────────────────────────────────────────
  function handleMouseMove(e) {
    if (paused) return;
    if (dragState) {
      const dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
      if (!dragState.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragState.isDragging = true;
        dragState.marquee = document.createElement("div"); dragState.marquee.className = `${NS}-marquee`;
        document.body.appendChild(dragState.marquee); showHover(null);
      }
      if (dragState.isDragging) {
        dragState.marquee.style.left = Math.min(e.clientX, dragState.startX)+"px";
        dragState.marquee.style.top = Math.min(e.clientY, dragState.startY)+"px";
        dragState.marquee.style.width = Math.abs(dx)+"px"; dragState.marquee.style.height = Math.abs(dy)+"px";
        return;
      }
    }
    lastMoveTarget = pointerTarget(e);
    if (!rafPending) { rafPending = true; requestAnimationFrame(() => { showHover(lastMoveTarget); rafPending = false; }); }
  }
  function handleMouseDown(e) {
    if (isEditorElement(e.target) || paused || e.button !== 0) return;
    if (e.shiftKey) e.preventDefault();
    dragState = { startX: e.clientX, startY: e.clientY, isDragging: false, marquee: null };
  }
  function handleMouseUp(e) {
    if (!dragState || !dragState.isDragging) { dragState = null; return; }
    wasJustDragging = true;
    const mRect = dragState.marquee.getBoundingClientRect();
    dragState.marquee.remove(); dragState = null;
    pushHistory(); if (!e.shiftKey) clearSelection();
    document.querySelectorAll(`[${AI_ID}]`).forEach(el => {
      if (isEditorElement(el) || !isVisible(el) || !isMeaningful(el)) return;
      if (rectsIntersect(mRect, el.getBoundingClientRect())) addSelection(el);
    });
    updateTags(); setTimeout(() => { wasJustDragging = false; }, 0);
  }
  function cancelDrag() { if (dragState && dragState.marquee) dragState.marquee.remove(); dragState = null; }
  function rectsIntersect(a, b) { return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }
  function handleClick(e) {
    if (isEditorElement(e.target) || paused || wasJustDragging) return;
    e.preventDefault(); e.stopPropagation(); removeAnnotationPopover();
    const sel = window.getSelection(); if (sel) sel.removeAllRanges();
    pushHistory(); const el = pointerTarget(e);
    if (e.shiftKey) toggleElement(el); else { clearSelection(); addSelection(el); }
    updateTags();
  }

  // ── 选择高亮层 ────────────────────────────────────────────
  function selectionIcon(name) {
    const paths = {
      figma: '<path d="M12 3H8.5a3.5 3.5 0 0 0 0 7H12V3Zm0 0h3.5a3.5 3.5 0 0 1 0 7H12V3ZM12 10H8.5a3.5 3.5 0 0 0 0 7H12v-7Zm0 7H8.5a3.5 3.5 0 1 0 3.5 3.5V17Z"/><circle cx="15.5" cy="13.5" r="3.5"/>',
      exit: '<path d="M9 4H4v16h5M13 8l4 4-4 4M8 12h13"/>',
      close: '<path d="m6 6 12 12M6 18 18 6"/>',
      ignore: '<path d="m3 3 18 18M10.5 10.5a2 2 0 0 0 3 3M9 5a12 12 0 0 1 12 7 15 15 0 0 1-4 5M6 6a15 15 0 0 0-3 6 12 12 0 0 0 12 7"/>',
      add: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h4M14 16h6M17 13v6"/>',
      window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M12 12v5M9.5 14.5h5"/>',
      source: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
      edit: '<path d="M12 20h9M16 3a2.1 2.1 0 0 1 3 3L7 18l-4 1 1-4Z"/>',
      send: '<path d="m22 2-7 20-4-9-9-4Z M22 2 11 13"/>',
    };
    return '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
  }
  function createSelOverlay(el) {
    const aiId = el.getAttribute(AI_ID); if (selOverlays.has(aiId)) return;
    const box = document.createElement("div"); box.className = `${NS}-sel-box`;
    const corners = [0,1,2,3].map(i => { const c = document.createElement("div"); c.className = `${NS}-sel-corner`; c.style.animationDelay = `${i*28}ms`; document.body.appendChild(c); return c; });
    const label = document.createElement("div"); label.className = `${NS}-sel-label`; label.textContent = elementLabel(el);
    const annotateBtn = document.createElement("button");
    annotateBtn.className = `${NS}-root ${NS}-annotate-btn`; annotateBtn.title = t("addInstruction");
    annotateBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    annotateBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); showAnnotationPopover(el, annotateBtn); };
    const ignoreBtn = document.createElement('button');
    ignoreBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-ignore-btn';
    ignoreBtn.textContent = '忽略'; ignoreBtn.title = '忽略此元素，继续选择内层元素（Ctrl/Cmd+Z 撤销）';
    ignoreBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); ignoreElement(el); };
    const newChatBtn = document.createElement('button');
    newChatBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-new-chat-btn';
    newChatBtn.textContent = '复制'; newChatBtn.title = '复制当前元素提示词';
    newChatBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); copyPrompt([el]); };
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-selection-close-btn';
    closeBtn.textContent = '×'; closeBtn.title = '关闭 AItool'; closeBtn.setAttribute('aria-label', '关闭 AItool');
    closeBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); destroy(); };
    const deselectBtn = document.createElement('button');
    deselectBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-deselect-btn';
    deselectBtn.onclick = e => {
      e.stopPropagation(); e.preventDefault(); pushHistory(); removeSelection(el);
      removeAnnotationPopover(); showHover(null); updateTags();
    };
    const figmaBtn = document.createElement('button');
    figmaBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-figma-btn';
    figmaBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); copyElementToFigma(el, figmaBtn); };
    const sourceBtn = document.createElement('button');
    sourceBtn.type = 'button'; sourceBtn.className = NS + '-root ' + NS + '-annotate-btn ' + NS + '-source-btn';
    sourceBtn.textContent = '源码'; sourceBtn.title = '复制 React / Vue 源码位置';
    sourceBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); locateElementSource(el, sourceBtn); };
    const actions = [
      [closeBtn, 'close', '关闭 AItool'], [deselectBtn, 'exit', '取消当前选框'], [figmaBtn, 'figma', '复制到 Figma'], [ignoreBtn, 'ignore', '忽略元素'],
      [sourceBtn, 'source', '复制源码位置'],
      [newChatBtn, 'window', '复制当前元素'],
      [annotateBtn, 'edit', '编辑指令与 AI 操作'],
    ];
    for (const [btn, icon, labelText] of actions) {
      btn.type = 'button'; btn.innerHTML = selectionIcon(icon); btn.title = labelText;
      btn.setAttribute('aria-label', labelText); btn.classList.add(NS + '-icon-action');
    }
    document.body.append(box, label, ...actions.map(([btn]) => btn));
    selOverlays.set(aiId, { figmaBtn, sourceBtn, box, corners, label, annotateBtn, ignoreBtn, newChatBtn, closeBtn, deselectBtn }); positionSelOverlay(el);
  }
  function positionSelOverlay(el) {
    const aiId = el.getAttribute(AI_ID), ov = selOverlays.get(aiId); if (!ov) return;
    const r = el.getBoundingClientRect(), pad = 2;
    ov.box.style.top=(r.top-pad)+"px"; ov.box.style.left=(r.left-pad)+"px"; ov.box.style.width=(r.width+pad*2)+"px"; ov.box.style.height=(r.height+pad*2)+"px";
    const cs=6, pos=[{top:r.top-pad-cs/2,left:r.left-pad-cs/2},{top:r.top-pad-cs/2,left:r.right+pad-cs/2},{top:r.bottom+pad-cs/2,left:r.left-pad-cs/2},{top:r.bottom+pad-cs/2,left:r.right+pad-cs/2}];
    for (let i=0;i<4;i++) { ov.corners[i].style.top=pos[i].top+"px"; ov.corners[i].style.left=pos[i].left+"px"; }
    ov.label.style.top=(r.top-pad-20)+"px"; ov.label.style.left=(r.left-pad)+"px";
    const top = Math.max(4, r.top-pad-24);
    const left = Math.max(4, Math.min(window.innerWidth-202, r.right+pad-198));
    [ov.closeBtn, ov.deselectBtn, ov.figmaBtn, ov.ignoreBtn, ov.sourceBtn, ov.newChatBtn, ov.annotateBtn].forEach((btn, index) => {
      btn.style.top=top+'px'; btn.style.left=(left+index*29)+'px';
    });
    ov.newChatBtn.disabled = false;
    ov.label.style.maxWidth=Math.max(0,left-r.left-6)+'px';
    ov.annotateBtn.classList.toggle(`${NS}-has-note`, annotations.has(aiId));
  }
  function positionAllOverlays() { for (const el of selectedElements) positionSelOverlay(el); }
  function destroySelOverlay(aiId) { const ov=selOverlays.get(aiId); if(!ov)return; ov.figmaBtn.remove(); ov.sourceBtn.remove(); ov.box.remove(); ov.corners.forEach(c=>c.remove()); ov.label.remove(); ov.annotateBtn.remove(); ov.ignoreBtn.remove(); ov.newChatBtn.remove(); ov.closeBtn.remove(); ov.deselectBtn.remove(); selOverlays.delete(aiId); }
  function destroyAllOverlays() { for (const [aiId] of selOverlays) destroySelOverlay(aiId); }
  function addSelection(el) { if (el && !ignoredElements.has(el) && !selectedElements.includes(el)) { if (!el.hasAttribute(AI_ID)) el.setAttribute(AI_ID, `el-${aiIdCounter++}`); selectedElements.push(el); createSelOverlay(el); } }
  function removeSelection(el) { const idx=selectedElements.indexOf(el); if(idx>=0){ selectedElements.splice(idx,1); destroySelOverlay(el.getAttribute(AI_ID)); annotations.delete(el.getAttribute(AI_ID)); } }
  function toggleElement(el) { selectedElements.includes(el) ? removeSelection(el) : addSelection(el); }
  function clearSelection() { destroyAllOverlays(); selectedElements=[]; annotations.clear(); removeAnnotationPopover(); }

  // ── 历史记录（撤销）───────────────────────────────────────
  function pushHistory() { selectionHistory.push({ elements:[...selectedElements], annotations:new Map(annotations), ignored:new Set(ignoredElements) }); if (selectionHistory.length>30) selectionHistory.shift(); }
  function undo() {
    if (!selectionHistory.length) return; const state=selectionHistory.pop();
    destroyAllOverlays(); removeAnnotationPopover(); ignoredElements.clear(); for (const el of state.ignored || []) ignoredElements.add(el); selectedElements=state.elements;
    annotations.clear(); for (const [k,v] of state.annotations) annotations.set(k,v);
    for (const el of selectedElements) createSelOverlay(el); updateTags();
  }

  // ── 导航 ───────────────────────────────────────────────────
  function navigateToParent() {
    if (selectedElements.length!==1) return;
    let p=selectedElements[0].parentElement;
    while(p&&p!==document.body&&p!==document.documentElement){ if(!ignoredElements.has(p)&&!isEditorElement(p)&&isVisible(p)){ pushHistory();clearSelection();addSelection(p);updateTags();return; } p=p.parentElement; }
  }
  function navigateToChild() {
    if (selectedElements.length!==1) return;
    for(const c of selectedElements[0].children){ if(!ignoredElements.has(c)&&!isEditorElement(c)&&isVisible(c)&&isMeaningful(c)){ pushHistory();clearSelection();addSelection(c);updateTags();return; } }
  }
  function navigateToSibling(dir) {
    if (selectedElements.length!==1) return; const el=selectedElements[0], par=el.parentElement; if(!par) return;
    const sibs=Array.from(par.children).filter(c=>!ignoredElements.has(c)&&!isEditorElement(c)&&isVisible(c)&&isMeaningful(c));
    const next=sibs[sibs.indexOf(el)+dir]; if(next){ pushHistory();clearSelection();addSelection(next);updateTags(); }
  }

  function handleKeyDown(e) {
    if (e.target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
    const shortcut = [e.ctrlKey && 'Ctrl', e.metaKey && 'Meta', e.altKey && 'Alt', e.shiftKey && 'Shift', e.key.length === 1 ? e.key.toUpperCase() : e.key].filter(Boolean).join('+');
    if (shortcut === settings.shortcut && (selectedElements.length || pendingGenPrompt)) { e.preventDefault(); sendPrompt(); return; }
    const mod=e.metaKey||e.ctrlKey;
    if(e.key==="Escape"){
      e.preventDefault();
      if(revPanel) closeRevPromptResult();
      else if(activePopover) removeAnnotationPopover();
      else if(settingsOpen) closeSettings();
      else if(selectedElements.length>0){ pushHistory(); clearSelection(); updateTags(); }
      else togglePaused();
      return;
    }
    // 结果面板打开时，即使没有选中元素，⌘C 也可用（⌘M 无选择时会回落到
    // 页面正文，因此可能没有真实选择）。copyPrompt() 的 pendingGenPrompt
    // 分支会处理这种情况。
    if(mod&&e.shiftKey&&e.key.toLowerCase()==="c"&&selectedElements.length>0){ e.preventDefault(); captureScreenshot(); return; }
    if(mod&&!e.shiftKey&&e.key.toLowerCase()==="i"&&(HOST.reversePrompt||HOST.reversePromptStream)&&selectedElements.length>0){ e.preventDefault(); reversePromptForSelection(); return; }
    if(mod&&e.key.toLowerCase()==="z"&&!e.shiftKey){ e.preventDefault(); undo(); return; }
    if(e.key==="ArrowUp"&&selectedElements.length===1){ e.preventDefault(); navigateToParent(); return; }
    if(e.key==="ArrowDown"&&selectedElements.length===1){ e.preventDefault(); navigateToChild(); return; }
    if(e.key==="ArrowLeft"&&selectedElements.length===1){ e.preventDefault(); navigateToSibling(-1); return; }
    if(e.key==="ArrowRight"&&selectedElements.length===1){ e.preventDefault(); navigateToSibling(1); return; }
  }

  function togglePaused() {
    paused = !paused; showHover(null); cancelDrag(); removeAnnotationPopover();
    const dot = chatPanel.querySelector(`.${NS}-status-dot`), label = chatPanel.querySelector(`.${NS}-status-label`);
    if (dot) dot.style.background = paused ? "#888" : "#4ade80";
    if (label) label.textContent = paused ? t("paused") : t("selecting");
    applyI18n();
  }
