# eMenu 本地配置 · 嵌入 emenu-new（页面本地 / 数据主机）

## 目标

- **页面**：eMenu、设置均加载本地 `dist/emenu-new`（包版本如 5.11.83），不加载主机 `/kpos/emenu`（如 5.11.79）前端包
- **数据**：业务接口仍经 `/kpos` 代理到本机 POS（默认 `http://localhost:22080`）
- **开发**：后续 eMenu 前端改动在 `dist/emenu-new` 源码中进行

## 方案

| 入口 | iframe |
|------|--------|
| eMenu | `./emenu-new/index.html?embedded=1&v=<stamp>` |
| 设置 | `./emenu-new/index.html?embedded=1&v=<stamp>#/setting` |

- Vite 静态：`/emenu-new/*` → `dist/emenu-new`
- Vite 代理：`/kpos`（API/WS 等）→ POS；**例外**：`/kpos/emenu/version.json` 强制读本地 `dist/emenu-new/version.json`，避免设置页显示主机包版本号
- 不把 `/emenu` 整站代理到主机

## 非目标

- 不替代主机业务 API
- 不以主机 `/kpos/emenu` 作为页面入口
