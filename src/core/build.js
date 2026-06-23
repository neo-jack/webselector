(function () {
  const f = require("fs");
  const p = require("path");
  const c = require("child_process");

  const d = __dirname;
  const o = p.join(d, "dist");
  const e = p.join(d, ".tmp-selector-entry.js");
  const j = p.join(o, "selector.js");
  const s = p.join(o, "selector.css");
  const a = ["selection/selection.css", "panel/panel.css", "actions/actions.css"];
  const m = [
    ["editor", "editor.js"],
    ["selection", "selection/selection.js"],
    ["panel", "panel/panel.js"],
    ["preferences", "panel/preferences.js"],
    ["copy", "actions/copy.js"],
    ["figma", "actions/figma.js"],
    ["figmaCapture", "vendor/figma-capture.js"],
    ["screenshot", "actions/screenshot.js"],
    ["sharingan", "context/sharingan.js"],
    ["element", "context/element.js"],
    ["source", "context/source.js"],
  ];

  const r = (x) => f.readFileSync(p.join(d, x), "utf8");
  const w = (x, y) => f.writeFileSync(x, y, "utf8");
  const g = () => a.map(r).join("\n");
  const h = () => {
    const z = {};
    for (const [k, v] of m) z[k] = r(v);
    z.sharingan = z.sharingan.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
    let q = z.editor;
    for (const [k, v] of [
      ["/*__SELECTION_MODULE__*/", z.selection],
      ["/*__PANEL_MODULE__*/", z.panel],
      ["/*__PREFERENCES_MODULE__*/", z.preferences],
      ["/*__COPY_MODULE__*/", z.copy],
      ["/*__FIGMA_MODULE__*/", z.figmaCapture + "\n" + z.figma],
      ["/*__SCREENSHOT_MODULE__*/", z.screenshot],
      ["/*__CONTEXT_SHARINGAN_MODULE__*/", z.sharingan],
      ["/*__CONTEXT_ELEMENT_MODULE__*/", z.element],
      ["/*__SOURCE_MODULE__*/", z.source],
    ]) q = q.split(k).join(v);
    const domImage = r("vendor/html-to-image.js").replace(/\/\/# sourceMappingURL=.*$/gm, "");
    return q.replace('"use strict";', '"use strict";\nconst DOM_IMAGE = (() => { const exports = {}; const module = { exports };\n' + domImage + '\nreturn module.exports; })();');
  };
  const u = (cmd, args) => {
    const win = process.platform === "win32";
    const exe = win ? process.execPath : cmd;
    const argv = win
      ? [p.join(p.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")].concat(args)
      : args;
    const x = c.spawnSync(exe, argv, { cwd: d, stdio: "inherit" });
    if (x.error || x.status !== 0) throw new Error(cmd + " " + args.join(" ") + " failed");
  };

  try {
    f.mkdirSync(o, { recursive: true });
    w(s, g());
    w(e, h());
    u("npx", [
      "--yes",
      "esbuild",
      e,
      "--bundle",
      "--minify",
      "--legal-comments=none",
      "--outfile=" + j,
    ]);
  } finally {
    try { f.unlinkSync(e); } catch (_) {}
  }
})();
