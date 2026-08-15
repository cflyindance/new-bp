# eMenu 本地配置 · 嵌入 emenu-new

## 目标

在 eMenu 本地配置后台侧栏「调味设置」下方新增【eMenu】导航；点击后主内容区 iframe 打开已构建的 `dist/emenu-new`。

## 方案

- 路由：`/emenu-local/emenu`
- 主区全高 iframe → `./emenu-new/index.html?embedded=1&v=<build-stamp>`
- 源码：`vendor/emenu-new`（自 React 应用拷贝）；私有包 `@menusifu/socket-client` 用本地 portal stub，避免 Nexus 鉴权
- 构建：`node scripts/build-emenu-new-embed.mjs`（`base=/emenu-new/`，输出到 `dist/emenu-new`，写入 `.emenu-embed-build.json`）
- Vite 开发态静态路由增加 `emenu-new`；构建 stash 列表纳入 `emenu-new`
- 开发/预览代理：`/kpos` → `http://localhost:22080`（含 WS；可用 `EMENU_KPOS_PROXY_TARGET` 覆盖），避免嵌入页相对路径 API 打到 Vite 自身 404

## 非目标

- 不改造 eMenu 业务功能本身（仅嵌入运行）
- 不在 embed 构建中启用真实 Socket/Nexus 私有依赖
