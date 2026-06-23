// 安装页入口：读取 build.js 生成的 dist/selector.css / dist/selector.js，写入书签链接。
(function () {
var installScript = document.currentScript;

document.addEventListener("DOMContentLoaded", function () {
  var base = installScript && installScript.src
    ? new URL("./", installScript.src).href
    : new URL("core/", document.baseURI).href;
  var link = document.getElementById("bm-link");

  Promise.all([
    fetch(base + "dist/selector.css").then(function (r) {
      if (!r.ok) throw new Error("dist/selector.css");
      return r.text();
    }),
    fetch(base + "dist/selector.js").then(function (r) {
      if (!r.ok) throw new Error("dist/selector.js");
      return r.text();
    }),
  ])
    .then(function (results) {
      var css = results[0];
      var js = results[1];
      var cssInjector = "(function(){"
        + "var s=document.getElementById('ai-editor-style')||document.createElement('style');"
        + "s.id='ai-editor-style';"
        + "s.textContent=" + JSON.stringify(css) + ";"
        + "(document.head||document.documentElement).appendChild(s);"
        + "})();";
      link.href = "javascript:" + encodeURIComponent(cssInjector + js);
      link.classList.remove("loading");
    })
    .catch(function () {
      document.getElementById("bm-err").style.display = "block";
      link.classList.remove("loading");
    });
});
})();
