# eMenu 调味设置 GitHub Pages 浏览器演示模式设计

日期：2026-08-14

## 背景

调味设置前端当前固定请求同源接口 `/api/v1/emenu-local/seasoning/*`。本地 Vite 开发服务器会挂载 Node API handler，因此功能可用；GitHub Pages 只提供静态文件，请求会落到 `https://cflyindance.github.io/api/v1/...` 并返回 404。

本方案采用浏览器演示模式，使 GitHub Pages 上的调味设置可以完整演示操作，同时保留本地开发和未来正式门店服务使用现有 Node API 的能力。

## 目标

- GitHub Pages 打开调味设置时不再发起同源 `/api` 请求。
- GitHub Pages 支持公共调味库、商品选择、动作与 Option、定价、排序、预览、保存、编辑和删除等现有交互。
- 演示数据写入当前浏览器本地存储，刷新后继续存在。
- 本地 Vite 和正式门店环境继续使用现有 Node API，不改变其接口契约。
- 演示模式必须显式识别，普通 API 故障不得静默降级为浏览器数据。

## 非目标

- 不在不同浏览器或不同设备之间同步演示数据。
- 不把 GitHub Pages 作为门店正式配置服务。
- 不在本次改造中替换正式门店后端的 JSON 文件持久化方案。
- 不修改调味设置现有页面视觉和业务流程。

## 方案比较

### 方案一：部署独立远程 API

可以保留现有前端请求模型，但需要新的服务地址、持久化设施、跨域策略和运维环境，不符合本次 GitHub Pages 演示目标。

### 方案二：浏览器内 API 适配器（采用）

保持 `seasoningApi` 的公开方法不变，在 GitHub Pages 环境将请求路由到浏览器适配器。适配器使用 `localStorage` 保存版本化数据，并在内存中维护短生命周期的选择和预览草稿。

优点是页面组件无需感知部署差异，GitHub Pages 可完整演示；代价是浏览器数据不能跨设备共享，并且需要维护与 Node handler 一致的浏览器端业务契约。

### 方案三：只提供只读静态 JSON

实现最小，但新增、编辑、批量关联和保存均不可用，不满足已确认的演示要求。

## 架构

### 运行模式判定

新增纯函数解析 `VITE_EMENU_SEASONING_MODE`，允许值仅为 `auto | http | browser`：

1. 显式 `browser` 或 `http` 始终优先于 hostname。
2. `auto` 或未配置时，hostname 以 `.github.io` 结尾则使用浏览器演示模式，否则使用 HTTP API。
3. 变量存在但不是允许值时立即抛出配置错误，不允许猜测或回退。
4. GitHub Pages 工作流必须显式以 `VITE_EMENU_SEASONING_MODE=browser` 执行构建，hostname 自动识别只作为直接打开其他 Pages 构建时的安全兜底。

不允许因 HTTP 404、网络超时或服务异常自动切换模式，避免正式环境故障被本地数据掩盖。

### API 门面

`seasoningApi` 继续暴露现有全部方法。每个方法通过统一 transport 执行，并统一把失败规范化为 `SeasoningApiError(status, code, payload)`，从而保留页面依赖的 `instanceof SeasoningApiError` 恢复逻辑：

- `http transport`：保留当前 `fetch` 行为。
- `browser transport`：调用浏览器演示仓储和领域操作。

页面、store 和组件不直接判断运行环境。

### 浏览器持久化与并发

- 使用固定键 `emenu-local:seasoning-demo:v1` 保存 `{ schemaVersion: 1, db }`。
- `BrowserSeasoningDbV1.db` 明确包含 Node seed 的全部持久字段：`version`、`updatedAt`、`migrations`、`permissions`、`categories`、`menuGroups`、`products`、`optionCategories`、`options`、`relations`、`auditLog` 和 `orderSnapshots`。
- 首次访问从浏览器演示 seed 初始化。
- 每次查询都重新读取当前存储值；也监听 `storage` 事件使缓存失效，确保一个标签页能观察另一个标签页的提交。
- 每次写入必须在命名 Web Lock `emenu-local:seasoning-demo:write:v1` 内重新读取数据、再次校验 `expectedVersion`、完成领域校验、整体写入并递增配置版本，防止两个标签页同时接受同一旧版本。浏览器不支持 Web Locks 时写操作返回 `browser_lock_unavailable`，不得进行不安全写入。
- 存储缺失时初始化；JSON 损坏或 schema 不兼容时返回 `browser_demo_data_invalid`；存储不可用时返回 `browser_storage_unavailable`；配额或写入失败返回 `browser_storage_write_failed`。所有失败均保留原始存储值，不自动覆盖或清空。
- 后续 schema 通过显式迁移函数升级；本期只识别 v1，不提供静默重置。需要重置时由独立的明确用户操作处理，不属于本次范围。

### 草稿、会话与失效语义

- 商品选择草稿与预览草稿分别保存在当前页面内存中，刷新页面会丢弃草稿，但已提交到 `localStorage` 的配置保留。
- 两类草稿 TTL 均为 15 分钟，使用可注入 clock 测试到期行为，并在访问或创建草稿时清理过期记录。
- 商品选择草稿绑定当前 session、存储 scope 和 `menuVersion`。只有菜单商品、菜单路径、商品状态或 eMenu 可售状态等菜单指纹变化才返回现有的 `product_selection_stale`；无关 Option 修改不得使选择草稿失效。
- 预览草稿绑定当前 session、存储 scope 和配置 `version`。读取、更新或删除预览时，如果 token 缺失、过期、session/scope 不匹配或配置版本已变化，返回 `409 preview_expired`。提交批量关系时先校验请求的 `expectedVersion`：旧版本返回 `409 version_conflict`；版本仍匹配但预览 token 已失效时返回 `409 preview_expired`。
- token 不存在、session 不匹配、scope 不匹配、过期及版本失效分别复用 Node handler 的既有状态码和错误码。

### 契约复用

浏览器适配器返回与现有 Node API 相同的 TypeScript 类型和错误码。优先提取可在 Node 与浏览器共同使用的纯领域函数和 seed 数据，避免复制排序、分页、价格和关系规则。

如果现有 Node handler 中的文件系统耦合无法直接复用，则只抽取本次调用链需要的纯数据操作；HTTP 解析、文件写入和浏览器存储分别留在各自 adapter 中。

必须建立逐方法契约矩阵，并对 HTTP 与 browser transport 运行同一组行为用例。矩阵覆盖 `seasoningApi` 当前全部方法：

- 初始化与总览：`bootstrap`、`summaries`、`relationProductGroups`。
- Option 与分类：`options`、`optionPicker`、`optionCategories`、`createOptionCategory`、`updateOptionCategory`、`reorderOptionCategories`、`deleteOptionCategory`、`createOption`、`updateOption`。
- 商品与选择草稿：`products`、`menuStructure`、`createProductSelection`、`productSelection`、`updateProductSelection`、`discardProductSelection`。
- 商品关系：`relationProducts`、`productRelations`、`saveProductRelations`。
- 批量预览与提交：`previewBatch`、`previewItems`、`previewProducts`、`updatePreviewDecision`、`discardPreview`、`commitBatch`。

每个方法至少覆盖成功 payload、默认参数、筛选/排序/分页、权限、写入版本递增、HTTP 状态、错误 payload 和适用的 token 规则。新增 facade 方法时，类型级完整性检查必须迫使两个 transport 同时实现。

## 数据流

1. 页面调用 `seasoningApi.bootstrap()` 等现有方法。
2. API 门面根据已固定的运行模式选择 transport。
3. GitHub Pages 由 browser transport 读取版本化本地数据并执行领域操作。
4. 查询直接返回同契约结果；写操作校验版本后原子替换本地数据。
5. 页面继续通过现有 store 渲染结果，无需新增页面分支。

## 错误处理

- 浏览器存储不可用：抛出 `SeasoningApiError(503, "browser_storage_unavailable", { error: "browser_storage_unavailable", mode: "browser" })`，页面进入现有加载失败状态。
- 数据损坏或 schema 不兼容：抛出 `SeasoningApiError(500, "browser_demo_data_invalid", { error: "browser_demo_data_invalid", mode: "browser" })`，不自动删除原数据。
- Web Locks 不可用：写操作抛出 `SeasoningApiError(503, "browser_lock_unavailable", { error: "browser_lock_unavailable", mode: "browser" })`。
- 配额不足或其他写入失败：抛出 `SeasoningApiError(507, "browser_storage_write_failed", { error: "browser_storage_write_failed", mode: "browser" })`，原始值保持不变。
- 版本冲突、非法价格、重复关系、无效 token 等继续使用现有稳定错误码。
- 浏览器模式不得向 `/api/v1/emenu-local/seasoning` 发出请求。

## 测试与验收

### TDD

先增加失败验证，证明当前 GitHub Pages 模式仍会解析并请求 `/api/v1/...`。然后实现最小 transport 切换和浏览器仓储，验证：

- GitHub Pages hostname、显式 browser、显式 http 和 auto 模式解析正确；非法值失败。
- 本地 hostname 默认仍选择 http transport，显式 http 可以覆盖 `.github.io` hostname。
- browser transport 与 http transport 通过逐方法契约矩阵，错误均为 `SeasoningApiError`。
- 数据写入后重新创建仓储仍可读取。
- 两个仓储实例并发写入时，后写者必须重新校验并得到版本冲突，不得丢失更新。
- 商品选择与预览分别遵循 menuVersion 和配置 version，刷新只丢弃草稿。
- 首次 seed、存储不可用、配额失败、损坏 JSON、未知 schema、版本冲突、排序、分页和价格校验保持约定行为且不覆盖原数据；浏览器基础设施错误断言完整的 `SeasoningApiError(status, code, payload)` 三元组。

### 回归

- 运行现有调味领域、结构和 Node API 验证。
- 增加通过 Vite middleware 与 HTTP facade 的集成验证，避免只验证底层 handler 而漏掉 transport 路由回归。
- 运行 TypeScript 类型检查。
- 因修改生产运行时和构建环境判定，必须运行完整 `npm run build`。
- GitHub Pages 工作流执行 browser 模式构建，并在 CI 中串联调味验证套件、HTTP facade 集成、browser 模式构建与浏览器 E2E。

### 浏览器 E2E

在显式 browser 模式的静态构建中完成：

1. 打开调味设置并成功加载列表。
2. 新增或编辑 Option。
3. 建立商品、动作和 Option 关联并保存。
4. 刷新页面，确认修改仍存在。
5. 监听网络请求，确认未请求 `/api/v1/emenu-local/seasoning/*`。
6. 检查生成的 Pages JavaScript 产物实际固定为 browser 模式，而不只测试模式解析函数。

## 风险与回滚

- 主要风险是浏览器与 Node 两套执行路径产生契约漂移；通过共享类型、纯领域函数和双路径回归测试控制。
- `localStorage` 容量有限，但演示 seed 与调味配置规模远低于常见浏览器配额；正式大规模数据不属于演示模式。
- 回滚时删除 browser transport、运行模式判定和对应测试，即可恢复仅使用 Node API 的实现；现有 Node API 数据文件不受影响。
