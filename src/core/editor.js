/**
 * Selector — 可视化元素选择器，支持逐元素备注。
 * 通过书签脚本注入。点击 = 选择，Shift+点击 = 多选，拖拽 = 框选。
 */
(function () {
  "use strict";
  if (document.querySelector(".ai-editor-root")) return;

  const NS = "ai-editor";
  // ── Host 能力接缝（HOST_CONTRACT.md §0/§1）────────────
  // 闭源扩展会在核心代码运行前，于主世界注入 window.__SELECTOR_HOST__，
  // 提供更强的实现（跨标签页截图、跨域资源抓取、授权门槛、额外 UI 行等）。
  // 免费书签脚本没有 __SELECTOR_HOST__，因此 HOST = {}，下面所有接缝都会
  // 回落到原有 else 分支，行为保持不变。每个 Host 方法都是可选的：
  // 调用方必须始终保留原逻辑作为兜底，不要让某条路径只能依赖 Host。
  const HOST = (typeof window !== "undefined" && window.__SELECTOR_HOST__) || {};
  const AI_ID = "data-ai-id";
  const VERSION = "0.4.0";
  // 设置面板推广链接的互跳目标（书签脚本 ⇄ Pro 扩展）。
  const EXT_LANDING_URL = "https://oil-oil.github.io/selector-extension/";
  const BOOKMARKLET_URL = "https://oil-oil.github.io/selector/";
  // ── 国际化 ─────────────────────────────────────────────────
  const DICT = {
    en: {
      selecting:"Selecting", paused:"Paused", copyPrompt:"Copy Prompt", copyReport:"Amaterasu!", copyCombined:"Copy + Screenshot", copyScreenshot:"Copy Screenshot",
      copied:"Copied", copiedSaved:"Copied + Saved", exported:"Markdown Exported", screenshotCopied:"Screenshot Copied", screenshotFailed:"Screenshot Failed",
      settings:"Settings", lang:"Language", addInstruction:"Add instruction", needLicense:"Activate to use",
      instrPlaceholder:"Instruction for this element\u2026", clear:"Clear", done:"Done",
      clearAll:"Clear all", minimize:"Minimize", restore:"Restore", close:"Close",
      groupGeneral:"General",
      skSelect:"Select", skMulti:"Multi", skNavigate:"Navigate", skPause:"Pause",
      skCopy:"Copy", skScreenshot:"Screenshot", skMarkdown:"Markdown", skActivate:"Activate", skUndo:"Undo", skClear:"Clear",
      optCombined:"Attach image", optCombinedDesc:"Include screenshots when copying, adding and sending",
      optSharingan:"Sharingan mode", optSharinganDesc:"Copy a pixel-faithful clone report for AI — full DOM, hover/dark CSS, fonts, animations, and design tokens",
      savePng:"Save PNG",
      proPromoTitle:"Selector Pro", proPromoDesc:"Full-element & full-page shots, cross-origin fidelity, synced settings, Markdown / JSON.", proPromoCta:"Get the extension →",
      freePromoTitle:"Free bookmarklet", freePromoDesc:"No install — drag a bookmark, use on any page.", freePromoCta:"Open on GitHub →",
      licLabel:"License", licActive:"Active", licNone:"Inactive",
      licActiveNote:"Pro is active — thank you", licNoneNote:"Activate to unlock everything",
      licActivate:"Activate →", licManage:"Manage subscription →", freeLink:"Free bookmarklet version →",
      skRevPrompt:"→ Prompt", revRunning:"Reading image…", revNoImage:"Select an element first", revFailed:"Couldn't generate a prompt",
      revTitle:"Image → generation prompt", revCopied:"Copied to clipboard — paste into your image model.", copyGenPrompt:"Copy image prompt",
      mdTitle:"Markdown ready", copyMarkdown:"Copy Markdown",
      errUnsupported:"Browser not supported", errCancelled:"Screen choice cancelled",
      errPermission:"Screen recording blocked", errClipboard:"Clipboard blocked",
      errCapture:"Screenshot failed", errEmpty:"Selected area is empty",
    },
    zh: {
      selecting:"\u9009\u62e9\u4e2d", paused:"\u5df2\u6682\u505c", copyPrompt:"\u590d\u5236\u63d0\u793a\u8bcd", copyReport:"\u963f\u739b\u7279\u62c9\u65af\uff01", copyCombined:"\u590d\u5236\u56fe\u6587", copyScreenshot:"\u590d\u5236\u622a\u56fe",
      copied:"\u5df2\u590d\u5236", copiedSaved:"\u5df2\u590d\u5236\u5e76\u4fdd\u5b58", exported:"Markdown \u5df2\u5bfc\u51fa", screenshotCopied:"\u622a\u56fe\u5df2\u590d\u5236", screenshotFailed:"\u622a\u56fe\u5931\u8d25",
      settings:"\u8bbe\u7f6e", lang:"\u8bed\u8a00", addInstruction:"\u6dfb\u52a0\u6307\u4ee4", needLicense:"\u6fc0\u6d3b\u540e\u5373\u53ef\u4f7f\u7528",
      instrPlaceholder:"\u6b64\u5143\u7d20\u7684\u4fee\u6539\u6307\u4ee4\u2026", clear:"\u6e05\u9664", done:"\u5b8c\u6210",
      clearAll:"\u6e05\u9664\u5168\u90e8", minimize:"\u6700\u5c0f\u5316", restore:"\u6062\u590d", close:"\u5173\u95ed",
      groupGeneral:"\u901a\u7528",
      skSelect:"\u9009\u62e9", skMulti:"\u591a\u9009", skNavigate:"\u5bfc\u822a", skPause:"\u6682\u505c",
      skCopy:"\u590d\u5236", skScreenshot:"\u622a\u56fe", skMarkdown:"Markdown", skActivate:"\u6fc0\u6d3b", skUndo:"\u64a4\u9500", skClear:"\u6e05\u9664",
      optCombined:"附带图片", optCombinedDesc:"复制、添加和发送时附带截图",
      optSharingan:"\u5199\u8f6e\u773c\u6a21\u5f0f", optSharinganDesc:"\u590d\u5236\u4f9b AI \u50cf\u7d20\u7ea7\u590d\u523b\u7684\u62a5\u544a \u2014\u2014 \u5b8c\u6574 DOM\u3001hover/dark \u6837\u5f0f\u3001\u5b57\u4f53\u3001\u52a8\u753b\u4e0e\u8bbe\u8ba1 token",
      savePng:"\u4fdd\u5b58 PNG",
      proPromoTitle:"Selector Pro", proPromoDesc:"\u5b8c\u6574\u5143\u7d20/\u6574\u9875\u622a\u56fe\u3001\u8de8\u57df\u9ad8\u4fdd\u771f\u3001\u8bbe\u7f6e\u540c\u6b65\u3001Markdown / JSON\u3002", proPromoCta:"\u83b7\u53d6\u6d4f\u89c8\u5668\u6269\u5c55 \u2192",
      freePromoTitle:"\u514d\u8d39\u4e66\u7b7e\u7248", freePromoDesc:"\u514d\u5b89\u88c5 \u2014\u2014 \u62d6\u4e00\u4e2a\u4e66\u7b7e\uff0c\u4efb\u610f\u9875\u9762\u53ef\u7528\u3002", freePromoCta:"\u5728 GitHub \u6253\u5f00 \u2192",
      licLabel:"\u6388\u6743", licActive:"\u5df2\u6fc0\u6d3b", licNone:"\u672a\u6fc0\u6d3b",
      licActiveNote:"Pro \u5df2\u6fc0\u6d3b\uff0c\u611f\u8c22\u652f\u6301", licNoneNote:"\u6fc0\u6d3b\u4ee5\u89e3\u9501\u5168\u90e8\u80fd\u529b",
      licActivate:"\u6fc0\u6d3b \u2192", licManage:"\u7ba1\u7406\u8ba2\u9605 \u2192", freeLink:"\u514d\u8d39\u4e66\u7b7e\u7248 \u2192",
      skRevPrompt:"\u53cd\u63a8", revRunning:"\u8bfb\u56fe\u4e2d\u2026", revNoImage:"\u8bf7\u5148\u9009\u4e2d\u4e00\u4e2a\u5143\u7d20", revFailed:"\u53cd\u63a8\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
      revTitle:"\u56fe\u7247 \u2192 \u751f\u6210\u63d0\u793a\u8bcd", revCopied:"\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f \u2014\u2014 \u7c98\u5230\u4f60\u7684\u751f\u56fe\u6a21\u578b\u5373\u53ef\u3002", copyGenPrompt:"\u590d\u5236\u751f\u56fe\u63d0\u793a\u8bcd",
      mdTitle:"Markdown \u5df2\u751f\u6210", copyMarkdown:"\u590d\u5236 Markdown",
      errUnsupported:"\u6d4f\u89c8\u5668\u4e0d\u652f\u6301", errCancelled:"\u5df2\u53d6\u6d88\u5c4f\u5e55\u9009\u62e9",
      errPermission:"\u5c4f\u5e55\u5f55\u5236\u6743\u9650\u53d7\u9650", errClipboard:"\u526a\u8d34\u677f\u6743\u9650\u53d7\u9650",
      errCapture:"\u622a\u56fe\u5931\u8d25", errEmpty:"\u9009\u4e2d\u533a\u57df\u65e0\u6cd5\u622a\u56fe",
    }
  };
  let lang = "en";
  // Host 可预置语言（初始化时读取一次）；否则读取 localStorage；
  // 再否则跟随浏览器界面语言，让国际化尽量匹配用户。
  try { lang = HOST.initialLang || localStorage.getItem(NS + "-lang") || (/^zh\b/i.test(navigator.language || "") ? "zh" : "en"); } catch(_) {}
  function t(k) { return (DICT[lang] && DICT[lang][k]) || DICT.en[k] || k; }

  // ── 设置 ───────────────────────────────────────────────────
  const DEFAULTS = { sourceRoot:'', combined:false, sharingan:false, client:'auto', preset:'', shortcut:'Alt+Enter' };
  Object.assign(DICT.zh, { copyPrompt:'复制上下文', copyReport:'复制增强上下文', optSharingan:'开启增强上下文', optSharinganDesc:'附带完整结构、样式、字体和设计信息', selecting:'AItool · @LBQ' });
  Object.assign(DICT.en, { copyPrompt:'Copy context', copyReport:'Copy rich context', optSharingan:'Enable rich context', optSharinganDesc:'Include structure, styles, fonts and design details', selecting:'AItool · @LBQ' });
  // 不超过这个大小的报告直接写入剪贴板。只有超过这个大小时，才把完整报告
  // 下载为 .md 文件，避免拖垮系统剪贴板。旧阈值 30_000 会让现代报告
  // 过早降级成短提示词兜底，而浏览器其实能处理 MB 级剪贴板文本。
  const SHARINGAN_CLIPBOARD_CHAR_LIMIT = 500000;
  let settings = Object.assign({}, DEFAULTS);
  // Host 可预置 settings 对象（初始化时读取一次）；否则读取 localStorage。
  // 两种来源都会合并到 DEFAULTS 上，保证对象结构稳定。
  try { var s = HOST.initialSettings || JSON.parse(localStorage.getItem(NS + "-settings")); if (s) settings = Object.assign({}, DEFAULTS, s); } catch(_) {}
  function saveSettings() {
    persistPreferences();
  }

  // ── 状态 ───────────────────────────────────────────────────
  let selectedElements = [], chatPanel = null, hoverBox = null, aiIdCounter = 0;
  let rafPending = false, lastMoveTarget = null, minimized = false, paused = false;
  const selOverlays = new Map(), annotations = new Map(), listeners = [];
  let dragState = null, wasJustDragging = false, activePopover = null;
  const selectionHistory = [];
  let screenshotBtn = null, saveBtn = null, pendingScreenshotSave = null, settingsOpen = false, settingsPanel = null;
  let revPanel = null, pendingGenPrompt = null, pendingResultCopyKey = null, revStream = null;

  function on(target, type, fn, capture) {
    target.addEventListener(type, fn, capture);
    listeners.push({ target, type, fn, capture });
  }

  // ── 初始化 ─────────────────────────────────────────────────
  function init() {
    assignAiIds(document.body);
    createHoverBox();
    createChatPanel();
    on(document, "mousedown", handleMouseDown, true);
    on(document, "click", handleClick, true);
    on(document, "mousemove", handleMouseMove, true);
    on(document, "mouseup", handleMouseUp, true);
    on(document, "mouseleave", () => { showHover(null); cancelDrag(); }, true);
    on(document, "keydown", handleKeyDown, true);
    let repositionRaf = false;
    const scheduleReposition = () => {
      if (!repositionRaf) { repositionRaf = true; requestAnimationFrame(() => { positionAllOverlays(); repositionRaf = false; }); }
    };
    on(window, "scroll", scheduleReposition, true);
    on(window, "resize", scheduleReposition, false);
    on(window, 'pagehide', releaseDisplayCapture, false);
    applyI18n();
  }

  // ── 销毁 ───────────────────────────────────────────────────
  function destroy() {
    closeDisplayCapture();
    for (const { target, type, fn, capture } of listeners) target.removeEventListener(type, fn, capture);
    destroyAllOverlays(); removeAnnotationPopover(); closeSettings();
    if (hoverBox) hoverBox.remove();
    if (chatPanel) chatPanel.remove();
  }

  /*__SELECTION_MODULE__*/
  /*__PANEL_MODULE__*/
  /*__PREFERENCES_MODULE__*/
  /*__COPY_MODULE__*/
  /*__FIGMA_MODULE__*/
  /*__SCREENSHOT_MODULE__*/
  /*__CONTEXT_SHARINGAN_MODULE__*/
  /*__CONTEXT_ELEMENT_MODULE__*/
  /*__SOURCE_MODULE__*/

  // ── 启动 ───────────────────────────────────────────────────
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
