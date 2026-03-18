## Figma 捕获适配

`figma-capture.js` 提取自用户指定的本地 `res/copy-to-design-web-to-design/readable/capture.js`（Copy to Design 1.3.0），来源信息见该参考包的 `SOURCE.md`。参考包未提供可确认的开源许可证；本文件不将其标记为 MIT 或其他开源授权。

- 提取从 IIFE 开始至 `const Ml = !0` 之前的 DOM 捕获、资源和 HTML 编码实现，放入独立 `FIGMA_CAPTURE` 闭包。
- 适配入口直接接收 Element，调用 `yl` 捕获，归零根节点坐标，再用 `qa` / `ba` 生成含 `figmeta` 和 `figh2d` 的设计 HTML。
- 不包含 Chrome runtime、扩展后台、完整性校验、扩展选择器或 offscreen document；由 `actions/figma.js` 调用浏览器剪贴板。
- 资源受目标网页 CORS/CSP 限制；不提供扩展后台跨域资源抓取和跨域 iframe 合并能力。升级应重新检查 DOM 快照、字体/图片与 Figma 实际粘贴兼容性。
- 不直接覆盖参考包；该适配文件是本项目维护副本。构建会内嵌到单文件书签，不从参考目录动态加载。

### 本地兼容处理

- 背景捕获包含祖先的背景填充及与选区相交、负 z-index、无正文或表单控件的 absolute/fixed 兄弟装饰层，裁剪至选区；不按业务类名识别、不复制其他兄弟正文。装饰层资源和节点 ID 合并时避免冲突。复杂跨层叠上下文的覆盖关系仍需视觉验证。
- SVG CSS 背景转 PNG 保留浏览器渲染的滤镜；按 SVG 尺寸/viewBox 保持比例，最大边 4096px。内联 SVG 图标保留矢量，序列化时携带 XML 命名空间；单独选择 SVG 子节点时封装为独立 SVG 并固化继承描边。
- 捕获前等待字体就绪（10 秒上限）。图片、SVG sprite、SVG 内嵌图片或遮罩加载失败时不写入不完整设计。跨域资源仍受浏览器 CORS/CSP 约束，不全局劫持 fetch 或绕过权限。
- 背景 URL 处理支持单双引号、无引号及 CSS 转义；maskImage 为 none 时尝试 webkitMaskImage；始终排除 AItool 的 UI。

### 公开方案参考

- [html-to-image / clone-node.ts](https://github.com/bubkoo/html-to-image/blob/master/src/clone-node.ts)：computed style 固化、SVG 依赖和节点克隆。
- [html-to-image / embed-images.ts](https://github.com/bubkoo/html-to-image/blob/master/src/embed-images.ts)：背景、mask、SVG image 资源内嵌。
- [sergcen/html-to-figma](https://github.com/sergcen/html-to-figma)：DOM 到 Figma 图层方案；本项目保留原 figh2d 剪贴板格式，不引入其插件协议。

上述公开方案作为设计参考，本地补丁为独立实现，不将其许可证套用到原 Copy to Design 提取代码。
