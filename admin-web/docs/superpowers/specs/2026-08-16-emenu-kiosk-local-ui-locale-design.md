# eMenu / Kiosk 本地配置 · 中英文界面切换

## 目标

- eMenu 本地配置后台与 Kiosk 本地配置后台支持 **中文 / English** 界面切换。
- **默认中文**（无缓存或非法值时回退 `zh`）。
- 覆盖范围：壳层 UI、本地原生页（含调味设置等残留硬编码文案）、以及嵌入的 eMenu / Kiosk Lite（经 URL `language` 跟随）。
- 语言偏好与商家后台 **全局共用**（`menusifu-admin-ui-locale`）。

## 背景

- 仓库已有 `admin-web/src/i18n.ts`：`UiLocale = "zh" | "en"`，`getUiLocale` / `setUiLocale` / `t` / `tf`，默认 `zh`。
- 商家后台顶栏已有语言下拉（`main.ts` 内 `renderGlobalUiLocaleControl` / `bindGlobalUiLocaleControl`）。
- eMenu / Kiosk 本地壳层已大量使用 `t()`，但 **顶栏无语言入口**；部分文案仍硬编码（如 Kiosk 顶栏 “Local configuration”、调味页部分中文）。
- 嵌入端已支持 URL 语言：
  - Kiosk Lite：`?language=zh-cn|en` → `i18n.changeLanguage`
  - eMenu：历史路径含 `language` 查询；本设计以 iframe `src` 显式带参并在切换时重载为准

## 方案

### 架构

```
localStorage[menusifu-admin-ui-locale]  （默认 zh）
        │
   getUiLocale() / setUiLocale()
        │
        ├─► shell / 本地原生页 t()
        ├─► document lang / data-ui-locale
        └─► iframe src ?language=zh-cn|en
                 │  切换 → remount → iframe 重载
                 ▼
           eMenu / Kiosk Lite 自有 i18n
```

### UI

- 从 `main.ts` **抽出**公共控件模块（建议 `admin-web/src/shell/ui-locale-control.ts`）：`renderUiLocaleControl()` + `bindUiLocaleControl(onChange)`。
- 商家后台改用该模块（行为不变）。
- eMenu / Kiosk 本地壳层顶栏：**主题按钮左侧**挂同一下拉（中文 / English）。
- 切换后：`setUiLocale` → `applyUiLocaleToDocument` → 派发 `menusifu:ui-locale-change`（与现网一致）→ 调用既有 `onMount` / `mount` 重渲。

### iframe 语言映射

| 壳层 locale | iframe `language` |
|-------------|-------------------|
| `zh`        | `zh-cn`           |
| `en`        | `en`              |

- 所有相关 iframe `src`（eMenu、eMenu 设置、Kiosk、Kiosk 设置）在构建时追加上述参数（保留既有 `embedded=1`、`v=` 等）。
- **同步方式**：URL 参数 + 重载（不引入 postMessage 热切换）。

### 文案补齐

- 壳层硬编码（如 “Local configuration” 类英文固定串）改为 `i18n` 键，中英齐全。
- 调味设置等本地原生页中仍硬编码的用户可见中文，迁入 `i18n.ts`（`zh` / `en`）。
- **不**改写嵌入应用内部词库；只喂 `language`。

## 非目标

- 不改食客端业务语言配置（如 FOH 652/653）。
- 不做 postMessage 实时改语言。
- 不为本地配置单独建第二套 locale 存储。
- 不要求切换语言时保留 iframe 内未保存编辑状态（重载即丢）。

## 验收

1. 首次进入（或清除 locale 后）eMenu / Kiosk 本地配置为中文。
2. 顶栏主题旁可切换中文 / English；侧栏、标题、占位页、主机 IP、调味等壳层/原生文案立即切换。
3. 本地配置与商家后台共用偏好：一处切换，另一视角保持一致。
4. 嵌入页 URL 带正确 `language`，嵌入 UI 语言与壳层一致。
5. 切换语言后 iframe 重载并跟随；不要求无刷新热切换。
6. 与主题按钮并存；移动端顶栏仍可见语言下拉。

## 主要改动文件（预期）

- `admin-web/src/shell/ui-locale-control.ts`（新建）
- `admin-web/src/main.ts`（改用公共控件）
- `admin-web/src/shell/emenu-local-shell.ts`
- `admin-web/src/shell/kiosk-local-shell.ts`
- `admin-web/src/i18n.ts`（补键与英文）
- `admin-web/src/emenu-local/seasoning/*`（硬编码 → `t()`，按需）
