# eMenu 本地配置后台调味设置实施计划

**设计依据**：`docs/superpowers/specs/2026-08-12-emenu-local-seasoning-settings-design.md`

## 实施边界

当前仓库是原生 TypeScript + Vite 的演示后台，已有 Vite Mock API 与独立 Node 本地服务共用 handler 的实现方式。本功能沿用该结构：

- 页面只调用调味 API 适配层，不直接读写 `localStorage`、`sessionStorage` 或 `.cache` 文件。
- 开发态由 Vite 中间件提供同源 API；独立运行时由 Node 本地服务复用同一 handler。
- `.cache/emenu-local-seasoning-db.json` 只作为本仓库演示数据，不进入 Git；正式设备部署时可用相同 API 契约替换持久化实现。
- 本计划覆盖已确认的后台工作台、批量关联、商品维护、门店级版本与终端快照契约；不扩展到品牌下发、设备覆盖或审批发布。

## 1. 建立 RED 验证护栏

**新增文件**：

- `scripts/verify-emenu-local-seasoning-settings.mjs`
- `scripts/verify-emenu-local-seasoning-domain.ts`
- `scripts/verify-emenu-local-seasoning-api.mjs`

**修改文件**：

- `package.json`

**工作内容**：

1. 新增结构验证，断言调味路由不再输出占位卡，并存在稳定标记：页签、总览、公共库、批量向导、商品抽屉、脏草稿守卫和中英文 key。
2. 新增领域验证，覆盖：
   - 固定动作顺序；
   - `(productId, action, optionId)` 唯一键；
   - 新关系默认 `active`；
   - 金额精度与禁止负数；
   - 候选关系笛卡尔展开；
   - 新关系追加排序；
   - 同 Option 跨动作互斥替换；
   - 新增、跳过、价格差异、停用关系和不可用五类预览结果。
3. 新增 API 验证，使用临时数据库文件启动 handler，覆盖游标分页、筛选全选、原子批量保存、版本冲突、停用引用保护、审计日志与完整快照。
4. 在 `package.json` 增加：
   - `verify:emenu-local-seasoning`
   - `emenu-local-api`
   - `dev:emenu-local`
5. 实现前分别运行三个验证并保留因目标模块缺失而失败的 RED 证据。

## 2. 建立领域模型与稳定种子数据

**新增文件**：

- `src/emenu-local/seasoning/seasoning-types.ts`
- `src/emenu-local/seasoning/seasoning-domain.ts`
- `scripts/lib/emenu-local-seasoning-seed.mjs`

**工作内容**：

1. 在 `seasoning-types.ts` 声明 Option、商品摘要、原子关联、聚合行、游标页、选择器、批量候选、保存结果、审计记录和终端快照类型。
2. 以只读常量声明 `ADD / LESS / MORE / NONE` 及固定显示顺序，禁止 UI 各自维护动作列表。
3. 在 `seasoning-domain.ts` 实现纯函数：
   - 唯一键构造；
   - 金额规范化；
   - 稳定比较器；
   - 新关系追加排序；
   - 候选展开与冲突分类；
   - 摘要计数；
   - 食客端同 Option 动作替换。
4. 种子数据包含多个商品分类、启用/停用商品、至少 20 个公共 Option、同 Option 跨动作关联、¥0 与收费关联、停用关系及两种不同价格，保证每种设计状态都能在页面中出现。
5. 领域模块不依赖 DOM、HTTP 或文件系统，确保验证脚本可直接运行。

## 3. 实现门店级本地 API 与持久化

**新增文件**：

- `scripts/lib/emenu-local-seasoning-api-handler.mjs`
- `server/emenu-local-config-api-server.mjs`
- `server/run-emenu-local-config-dev.mjs`

**修改文件**：

- `vite.config.ts`
- `package.json`

**工作内容**：

1. 使用 `/api/v1/emenu-local/seasoning` 前缀实现以下端点：
   - `GET /bootstrap`：权限、当前版本、动作元数据和首屏摘要；
   - `GET /options`、`POST /options`、`PATCH /options/:id`；
   - `GET /relations/summary`；
   - `GET /relations/products`；
   - `GET /products`；
   - `POST /relations/preview`；
   - `POST /relations/batch`；
   - `PUT /products/:productId/relations`；
   - `GET /audit-log`；
   - `GET /snapshot`。
2. 所有增长型列表接受 `query`、业务筛选、`cursor`、`limit`，返回 `items`、`nextCursor`、`total` 和稳定排序标识。游标包含最后一条稳定排序键，避免跨页重复或漏项。
3. 商品选择器支持两种明确模式：
   - `ids`：选择本页或手工选择的商品 ID；
   - `filter`：服务端筛选快照 + 排除 ID，用于“选择全部筛选结果”。
4. 预览端点返回查询快照 token、实际商品数和候选关系；提交时携带 token，防止筛选结果在预览与保存之间漂移。
5. 保存请求必须携带 `expectedVersion`。版本不匹配返回 `409 version_conflict`；引用或金额校验失败返回逐条错误且不写入。
6. 批量保存遵守已确认规则：
   - 新关系默认启用并追加；
   - 同值关系跳过；
   - 价格差异按用户决策保留或覆盖；
   - 停用关系按用户决策保持停用或重新启用；
   - 已有关系排序不因批量保存改变。
7. 数据写入采用“内存校验完整新状态 → 写同目录临时文件 → 原子替换正式文件”；失败保留旧文件。每次成功事务只递增一次 `seasoningConfigVersion`，并追加操作日志。
8. 公共 Option 删除前检查关系和订单快照引用；无法证明无引用时只允许停用。
9. `/snapshot` 返回版本化完整快照和校验摘要，供终端完成校验后整体替换缓存。
10. 将同一 handler 接入 Vite `configureServer` / `configurePreviewServer`；独立服务默认使用单独端口，并在 `dev:emenu-local` 中与 Vite 代理共同启动。

## 4. 建立前端 API、状态容器与页面生命周期

**新增文件**：

- `src/emenu-local/seasoning/seasoning-api.ts`
- `src/emenu-local/seasoning/seasoning-store.ts`
- `src/emenu-local/seasoning/seasoning-page.ts`

**修改文件**：

- `src/shell/emenu-local-shell.ts`

**工作内容**：

1. `seasoning-api.ts` 封装 fetch、查询参数、超时、错误类型、版本冲突和响应校验；UI 不直接拼 URL。
2. `seasoning-store.ts` 维护页面级状态：当前页签、筛选、游标页、权限、配置版本、加载/错误状态、向导草稿、抽屉草稿及脏状态。
3. Store 提供订阅、加载、刷新、打开/关闭向导、打开/关闭抽屉和提交动作；保存成功后按新版本刷新受影响聚合，不整页重置用户筛选。
4. `seasoning-page.ts` 负责页面 HTML、事件委托、焦点恢复和卸载清理，不拥有领域计算或文件持久化。
5. 将 `emenu-local-shell.ts` 中的占位渲染改为按路由分发：只有 `seasoning-settings` 挂载真实调味页面，其余四个页面继续显示原占位内容。
6. `bindEmenuLocalShell` 接收当前路径或由 DOM 标记识别调味页面，仅在目标路由初始化调味 Store；切换一级导航时销毁订阅和未完成请求。

## 5. 实现调味关联总览与增长型列表

**新增文件**：

- `src/emenu-local/seasoning/seasoning-overview-ui.ts`
- `src/emenu-local/seasoning/seasoning-pagination.ts`

**工作内容**：

1. 渲染“调味关联 / 公共调味库”页签、搜索、动作/商品分类/关联状态筛选和清空筛选。
2. 总览每行以“动作 + Option”聚合，显示关联商品数、真实价格汇总、状态和操作。
3. 搜索和筛选使用短延迟提交，变更条件时取消旧请求、重置游标并保持稳定加载状态。
4. 实现游标分页的上一页/下一页记录，不推断页码；列表状态明确区分首次加载、刷新、错误、公共库为空、尚无关系和筛选无结果。
5. 点击商品数量打开关联商品清单；清单支持服务端商品搜索、分类筛选、价格编辑、启停和移除确认。
6. 无编辑权限时总览与清单仍可浏览，但不渲染可产生修改的操作。

## 6. 实现公共调味库

**新增文件**：

- `src/emenu-local/seasoning/seasoning-option-library-ui.ts`

**工作内容**：

1. 渲染可搜索、可分页的 Option 列表，显示名称、编码、状态、默认顺序和关联商品数。
2. 新增/编辑表单校验名称、编码唯一性和排序；编码创建后只读。
3. 停用前展示影响关系和商品数；停用后不从后台列表消失。
4. 只有 API 明确返回 `deletable: true` 时显示删除入口；否则只允许停用。
5. 从批量向导跳转到公共库时保存向导草稿；新增成功后提供“返回批量关联”，并重新加载可选 Option。
6. 所有对话框实现焦点约束、Escape 行为、确认按钮禁用状态和关闭后焦点恢复。

## 7. 实现“动作 → Option → 商品 → 预览”批量向导

**新增文件**：

- `src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts`

**工作内容**：

1. 第一步单选固定动作；步骤条持续展示当前选择。
2. 第二步多选启用 Option，支持搜索和批次默认价格。非“添加”动作默认收起价格编辑。
3. 第三步加载服务端商品列表，明确提供：
   - “选择本页”；
   - “选择全部筛选结果”；
   - 手工取消个别商品。
4. 筛选条件变化后使旧的全筛选选择失效，并要求重新确认；始终显示服务端确认的选择数量。
5. 第四步调用 preview API，不在浏览器自行猜测大批量候选；支持按新增、跳过、价格差异、停用关系、不可用筛选。
6. 支持移除个别候选、覆盖单商品价格、对差异选择保留/覆盖、对停用关系选择跳过/重新启用。批量向导不提供排序编辑。
7. 未解决冲突或不可用记录存在时禁止提交；提交携带预览 token、用户决策和 `expectedVersion`。
8. 成功后展示新增、更新、重新启用和跳过数量，刷新总览并关闭向导；失败保留草稿并定位到错误记录。
9. 向导返回、更改动作、关闭和路由离开均执行脏状态保护。

## 8. 实现单商品四动作维护抽屉

**新增文件**：

- `src/emenu-local/seasoning/seasoning-product-drawer-ui.ts`

**工作内容**：

1. 抽屉同时展示添加、少放、多放、不要四个动作及其 Option、价格和状态。
2. 每个动作支持添加启用 Option、编辑价格、启停、移除和排序。
3. 排序同时提供拖动和“上移/下移”按钮；保存前规范化为稳定整数序列。
4. “复制自其他商品”先预览新增、更新和跳过，再要求确认；“清空某动作”显示影响条数并二次确认。
5. 保存使用商品级整体请求和 `expectedVersion`，确保四动作修改原子写入。
6. 关闭有修改的抽屉、切换商品或离开调味页面时提示放弃；无修改时直接关闭。
7. 版本冲突时不丢弃草稿，提示刷新当前商品后重新核对，不自动覆盖。

## 9. 补齐终端选择契约、权限、国际化与可访问性

**新增文件**：

- `src/emenu-local/seasoning/seasoning-terminal-rules.ts`

**修改文件**：

- `src/i18n.ts`
- `src/styles/app.css`（仅在 Tailwind 工具类无法稳定表达时）

**工作内容**：

1. `seasoning-terminal-rules.ts` 从完整快照生成指定商品的四动作展示模型，并实现同 Option 最后选择替换、价格汇总与订单快照数据生成，供领域验证和未来终端复用。
2. 权限由 bootstrap API 返回 `canView / canEdit`；页面只读态不依赖隐藏按钮作为唯一保护，保存端点再次校验。
3. 在 `src/i18n.ts` 补齐页面、页签、筛选、空状态、动作、向导、冲突、抽屉、保存摘要、同步错误和 aria 文案的中英文。
4. 桌面使用聚合表和右侧抽屉；窄屏改为分组列表与全屏抽屉。避免固定宽度导致横向溢出。
5. 动作和冲突同时使用文字、图标/形状与颜色；颜色不作为唯一信息。
6. 完成键盘导航、焦点约束、关闭后焦点恢复、加载状态播报和可访问名称。

## 10. 完成 API、页面与浏览器验收

**修改文件**：

- `scripts/verify-emenu-local-seasoning-settings.mjs`
- `scripts/verify-emenu-local-seasoning-domain.ts`
- `scripts/verify-emenu-local-seasoning-api.mjs`
- `scripts/verify-emenu-local-config-shell.mjs`（将调味路由的断言从占位调整为真实页面）

**验证顺序**：

1. 运行 `npm run verify:emenu-local-seasoning`，取得领域、API 和结构验证 GREEN。
2. 运行 `node scripts/verify-emenu-local-config-shell.mjs`，确保五个一级导航和 Shell 门控没有回归。
3. 运行 `npx tsc --noEmit`。
4. 对全部目标文件运行 `git diff --check`。
5. 启动 `npm run dev:emenu-local`，完成浏览器主路径：
   - 进入调味设置，确认其余四个 eMenu 页面仍为占位页；
   - 新建公共 Option，并验证重复编码错误；
   - 按“动作 → Option → 商品”完成小批量与跨页全筛选批量关联；
   - 验证同值跳过、价格差异、停用关系重新启用和不可用记录；
   - 在单商品抽屉编辑四动作、价格和顺序；
   - 模拟两个会话，确认旧版本保存返回冲突且草稿保留；
   - 停用公共 Option，确认总览保留、终端快照隐藏；
   - 验证保存后版本递增、审计日志生成、快照完整；
   - 验证刷新后数据仍存在，API 不可用时页面给出明确错误；
   - 验证只读权限、中文/英文、桌面/窄屏和完整键盘流程；
   - 检查浏览器控制台无新增错误。
6. 模拟快照写入失败或损坏，确认正式数据库文件不被半写覆盖；模拟终端校验失败，确认仍可使用上一份有效快照。

## 建议提交拆分

1. `test: add eMenu seasoning verification guards`
2. `feat: add seasoning domain and local API`
3. `feat: add seasoning overview and option library`
4. `feat: add seasoning batch association wizard`
5. `feat: add seasoning product maintenance drawer`
6. `test: verify seasoning sync and accessibility flows`

每个提交只包含本功能相关文件。当前工作区已有大量无关未提交修改，实施时必须逐文件暂存，禁止使用 `git add .` 或改写无关变更。
