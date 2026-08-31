# AItool · 界面元素选择器

选择网页元素，复制带有样式、组件上下文和修改要求的提示词，粘贴到自己使用的 AI 工具。

## 在线预览

[打开 AItool · 界面元素选择器](https://www.lanbinquan.top/AItool/)

## 使用

1. 打开安装页，将 AItool 链接拖到书签栏。
2. 在目标网页点击书签，单击或框选元素；Shift 支持多选。
3. 填写元素备注，点击“复制指令”或工具栏“复制提示词”。
4. 在任意 AI 工具中手动粘贴。启用附带图片时按浏览器提示授权共享截图。

不需要本机桥接、VS Code 或客户端连接。源码按钮复制可识别的源文件位置；生产构建未提供源码信息时会提示无法定位。设置按网站保存在浏览器 localStorage，不跨站同步。

## 开发

使用 Node.js 24，在项目根目录依次运行：

    npm run build
    npm test
    npm run preview

预览地址：http://127.0.0.1:5177/ 。构建通过 npx 调用 esbuild，首次需要网络。修改核心脚本后重新构建并重新安装书签。

Figma 捕获的独立浏览器测试：npm run test:figma，需要可用的 Playwright 浏览器环境。

## 目录

- src/index.html：安装页面。
- src/core/selection：选中、框选和元素操作。
- src/core/panel：工具栏、备注和本地设置。
- src/core/actions：提示词、截图、Markdown 与 Figma 复制。
- src/core/context：元素上下文和源码位置解析。
- src/core/vendor：捕获依赖及来源、许可证。
- scripts/preview.mjs：本地静态预览。

保留上游 Selector 及第三方依赖的来源和许可说明。
