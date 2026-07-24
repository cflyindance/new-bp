# 滑层 Hub 搜索 · 实现计划

> **依据**：`docs/项目文档/滑层Hub搜索设计方案.md`（v1.1）  
> **日期**：2026-07-24  
> **状态**：已实现（全部 sheet 滑层）  
> **首版启用**：全部 `subNavPlacement: "sheet"` + 专用滑层壳（营销/促销/会员/礼品卡/报表/打印/预约/商品中心/库存/财务等）

---

## 任务拆分

### 1. 索引与查询纯函数

新建 `src/config/hub-sheet-search.ts`：

| 导出 | 职责 |
|------|------|
| `HUB_SHEET_SEARCH_ENABLED_IDS` | 首版 `["queue-call"]` |
| `isHubSheetSearchEnabled(hubId)` | 开关判断 |
| `buildHubSearchIndex(hubId)` | 从 `NAV_MODULES` children + 对应 `MODULE_SETTINGS_BY_PATH[settingsPath].items` 建索引；尊重 `getFilteredNavModuleSheetSubnav` / 设置预设过滤（与滑层可见项一致） |
| `shouldEnterHubSearch(q)` | 中文 ≥1 字；英文/数字 ≥2 字符 |
| `queryHubSearchIndex(index, q)` | 包含匹配 + 字段权重；合并多字段；产出 `HubSearchHit[]`（含 `displayGroup`: `nav` \| `setting` \| `desc`、摘要、href、navPathKeys） |
| `navPathsToKeepFromHits(hits)` | 左栏应保留的 L2 path 集合（setting 命中 → 含「设置」path） |

单测（可选）：对前厅索引搜「搜索菜单」/ sceneDesc 片段 / 导航名，断言分组与 href。

### 2. 搜索会话状态

新建轻量状态（可同文件或 `hub-sheet-search-ui.ts`）：

- `get/setHubSheetSearchQuery(hubId)`（session 或模块内 Map）
- `clearHubSheetSearch(hubId)`；滑层关闭 / 切 hub 时调用
- `consumeHubSearchFocusTarget()`：点击结果后暂存 `{ seq?, itemId?, path }`，主区渲染完滚动高亮后清除

### 3. 滑层壳：搜索框 + 左栏过滤

改 `renderNavModuleSecondarySheet`（`main.ts`）：

1. 标题栏与 `nav` 之间插入搜索区（仅 `isHubSheetSearchEnabled(m.id)`）  
   - `role="search"`、`data-hub-sheet-search="${m.id}"`  
   - input + 清除按钮；占位符走 i18n  
2. 有有效关键词时：`getFilteredNavModuleSheetSubnav` 结果再按 `navPathsToKeepFromHits` 过滤；无命中时左栏空态文案  
3. 绑定：input 防抖 200ms → 写 query → remount 侧栏 + 主区；清除 / Esc（有关键词时优先清空搜索，不关层）  
4. 搜索态下点左栏链接：先 `clearHubSheetSearch`，再走原 hash 导航  

### 4. 右栏结果列表

改 `renderMain`（或紧邻主内容出口）：

- 若当前打开的 sheet hub 已启用搜索且 `shouldEnterHubSearch(q)`：  
  **主内容优先渲染结果面板**（覆盖业务页）  
- `renderHubSearchResultsPane(hubId, q, hits)`：  
  - 分组标题：功能入口 / 设置项 / 说明匹配  
  - 行：标题、类型、面包屑、高亮摘要；`data-hub-search-hit`  
  - 空态文案按设计方案 §4.4  
- 点击 hit：`clearHubSheetSearch` → 写 focus target → `location.hash` / `replaceHashPath` 到 `hit.href`（设置项优先 `getModuleSettingsItemHref`；若与现有 hash 路由冲突，改用 category path + focus seq，与 AI 跳转对齐）

### 5. 落地定位与高亮

在设置页 / 业务页 mount 后：

- 读取 `consumeHubSearchFocusTarget`  
- 对 `data-module-setting-row-seq="${seq}"`（或 item id）`scrollIntoView` + 短暂 ring/高亮 class（约 1.5s）  
- 确保分组已展开（依赖现有 category path / scroll spy；必要时主动选中 groupKey）

### 6. i18n

`i18n.ts` 增加键（中英）：

- 占位符、清除、结果标题、计数、空态（右/左）、类型标签（功能入口 / 设置项 / 说明匹配）

### 7. 关闭与生命周期

- `data-nav-module-sheet-secondary-close` / 关 sheet：`clearHubSheetSearch(hubId)`  
- 打开其他 hub sheet：清前一个 hub 的 query  

---

## 建议实现顺序

1 → 2 → 6 → 3 → 4 → 5 → 7 → 冒烟

先纯函数可测，再挂 UI，最后定位高亮。

---

## 冒烟验收

对照设计方案 §七（含 §4.3.1 左栏点击离开搜索态）。

重点手测：

1. 仅前厅滑层有搜索框  
2. 「搜索菜单」→ 设置项结果；点进可定位  
3. sceneDesc 片段 → 说明匹配分组  
4. 「品类管理」→ 功能入口  
5. 无命中双空态；清空恢复业务页  
6. 搜索态点左栏「设置」→ 进设置页且搜索框已空  

---

## 完成定义

- 前厅滑层可按设计完成搜索 → 结果 → 跳转定位全流程  
- 其他 sheet hub 默认无搜索框  
- 未改 catalog 数据结构；索引只读现有导航与设置 catalog  
