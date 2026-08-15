# Kiosk 本地配置 · 嵌入 kiosklite（页面本地 / 数据主机）

## 目标

- **页面**：【Kiosk】加载本地 `dist/kiosklite` 的 embed 构建（`.embed-build`），不加载主机 `/kpos/kiosklite`
- **数据**：业务接口经 `/kpos`、`/img` 代理到本机 POS（默认 `http://localhost:22080`）
- **开发**：源码在 `dist/kiosklite`；改完后执行 `npm run build:kiosklite-embed`

## 方案

- 路由：`/kiosk-local/kiosk`、`/kiosk-local/kiosk-settings`
- iframe → `./kiosklite/index.html?embedded=1&v=<stamp>`
- 设置 iframe → `./kiosklite/index.html?embedded=1&v=<stamp>#/configApp`（对应主机 `/kpos/kiosklite/#/configApp`）
- session：父页响应 iframe `getSessionKey`，经 `/kpos/webapp/license/clientInstanceLogin` 取主机 session（可用 `localStorage.menusifu:kiosk-local:appInstanceName` 覆盖默认 license `22`）
- 构建：`npm run build:kiosklite-embed`（`base=/kiosklite/`，输出 `dist/kiosklite/.embed-build`，不覆盖源码）
- 兜底：本机 Node 不便装依赖时，`npm run sync:kiosklite-embed` 从 POS 拉取页面并改写到 `/kiosklite/`，再用本地 `public/version.json`（如 4.9.5）覆盖版本文件
- Vite 静态：`/kiosklite/*` → `.embed-build`
- 数据：`/kpos`、`/img` → POS（与 eMenu 相同）
- **不**将 `/kiosklite` 代理到主机页面

## 非目标

- 不替代主机业务 API
- 不以主机 `/kpos/kiosklite` 作为页面入口（页面必须走本地 embed）
