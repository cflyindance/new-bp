# Kiosk 本地配置 · 设置页 UI 固定中文

## 目标

进入 Kiosk 本地配置后台的「Kiosk 设置」时，嵌入的 kiosklite `configApp` 界面文案固定为中文，不随管理后台中/英切换变化。

## 背景

- 「Kiosk 设置」路由：`/kiosk-local/kiosk-settings`
- 壳层在 `admin-web/src/shell/kiosk-local-shell.ts` 用 iframe 加载：
  - `./kpos/kiosklite/index.html?embedded=1&v=<stamp>#/configApp`
- kiosklite 入口 `dist/kiosklite/src/index.js` 已支持 URL 查询参数 `language`：
  - `language=zh-cn` → `i18n.changeLanguage('zh_cn')`
  - 其他带 `language` 的值 → 回落为 `en`
- 当前设置 iframe **未**传 `language`，configApp 使用 kiosklite 默认英文。

## 方案

在 `KIOSKLITE_SETTINGS_IFRAME_SRC` 的查询串中增加 `language=zh-cn`：

```text
./kpos/kiosklite/index.html?embedded=1&language=zh-cn&v=<stamp>#/configApp
```

仅改宿主壳层常量；不改 kiosklite 源码、不改全局 i18n 默认值。

## 非目标

- 不改「Kiosk」预览 iframe（`KIOSKLITE_IFRAME_SRC`）语言
- 不改服务设置里「默认语言」配置项（食客端菜单默认语言，`default-language` / id 11）
- 不让设置页跟随管理后台 UI 语言
- 不引入 postMessage 语言桥

## 行为与验收

1. 打开 `#/kiosk-local/kiosk-settings`，嵌入页开关/选项等文案为中文。
2. 管理后台切换中/英后再次进入「Kiosk 设置」，嵌入页仍为中文。
3. 「Kiosk」预览页语言行为与改前一致。

## 改动面

| 文件 | 变更 |
|------|------|
| `admin-web/src/shell/kiosk-local-shell.ts` | `KIOSKLITE_SETTINGS_IFRAME_SRC` 增加 `language=zh-cn` |

按仓库规则：权威编辑在 worktree，同步镜像到主工作区 `admin-web/` 供 `npm run dev` 预览。
