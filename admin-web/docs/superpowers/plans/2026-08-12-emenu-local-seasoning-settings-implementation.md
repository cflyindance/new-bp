# eMenu 本地配置后台调味设置实施计划

**设计依据**：`docs/superpowers/specs/2026-08-12-emenu-local-seasoning-settings-design.md`

## 实施边界

当前仓库是原生 TypeScript + Vite 的演示后台，已有 Vite Mock API 与独立 Node 本地服务共用 handler 的实现方式。本功能沿用该结构：

- 页面只调用调味 API 适配层，不直接读写 `localStorage`、`sessionStorage` 或 `.cache` 文件。
- 开发态由 Vite 中间件提供同源 API；独立运行时由 Node 本地服务复用同一 handler。
- `.cache/emenu-local-seasoning-db.json` 只作为本仓库演示数据，不进入 Git；正式设备部署时可用相同 API 契约替换持久化实现。
- 本计划覆盖已确认的后台工作台、批量关联、商品维护、门店级版本与终端快照契约；不扩展到品牌下发、设备覆盖或审批发布。
- 当前工作区已经存在调味工作台、公共库、批量向导、商品抽屉和第一版 Mock API。本计划按增量改造执行：保留已通过的领域与页面能力，把批量商品步骤从“分类下拉 + 商品卡片”替换为真实“组 / 类 / 菜”三列，并统一升级选择与预览契约；不并行保留旧选择模式。
- 菜单结构仅复用“前厅关联中心 → 特殊品类”的三列浏览、父子级联和半选语义，不引用其静态树或页面状态，不引入产线字段，视觉继续沿用 eMenu 本地配置后台。

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
4. 先为本次增量补充失败断言：
   - 真实组 / 类 / 菜结构和活动分支切换；
   - 组、类级联选择、半选和不可选商品计数；
   - 搜索范围内父级选择、未加载后代选择和重复商品路径去重；
   - 商品选择草稿的过期、版本失效、门店与会话隔离；
   - 预览游标分页、跨页决策、未解决计数和草稿恢复。
5. 在 `package.json` 增加：
   - `verify:emenu-local-seasoning`
   - `emenu-local-api`
   - `dev:emenu-local`
6. 实现前分别运行三个验证并保留因目标契约缺失而失败的 RED 证据。

## 2. 建立领域模型与稳定种子数据

**新增文件**：

- `src/emenu-local/seasoning/seasoning-types.ts`
- `src/emenu-local/seasoning/seasoning-domain.ts`
- `scripts/lib/emenu-local-seasoning-seed.mjs`

**工作内容**：

1. 在 `seasoning-types.ts` 声明 Option、菜单组、菜单类、菜节点、商品摘要、原子关联、聚合行、游标页、商品选择草稿、节点选择计数、预览草稿页、批量候选、保存结果、审计记录和终端快照类型；移除旧的 `ids / snapshot` 联合选择器。
2. 以只读常量声明 `ADD / LESS / MORE / NONE` 及固定显示顺序，禁止 UI 各自维护动作列表。
3. 在 `seasoning-domain.ts` 实现纯函数：
   - 唯一键构造；
   - 金额规范化；
   - 稳定比较器；
   - 新关系追加排序；
   - 候选展开与冲突分类；
   - 摘要计数；
   - 食客端同 Option 动作替换。
4. 种子数据包含多个菜单组和分类、至少一个跨路径重复出现的商品、启用/停用及 eMenu 不可售商品、至少 20 个公共 Option、同 Option 跨动作关联、¥0 与收费关联、停用关系及两种不同价格，保证每种设计状态都能在页面中出现。
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
   - `GET /menu-structure`：返回组、类元数据、节点计数和活动类菜品游标页，支持商品名称或编码搜索；
   - `POST /product-selections`、`GET /product-selections/:token`、`PATCH /product-selections/:token`、`DELETE /product-selections/:token`：创建、读取、更新和丢弃商品选择草稿；
   - `POST /relations/preview`：根据商品选择 token、动作和 Option 创建预览草稿；
   - `GET /relation-previews/:token/items`、`PATCH /relation-previews/:token/items`、`DELETE /relation-previews/:token`：分页读取候选、写入移除/价格/冲突决策和丢弃预览草稿；
   - `POST /relations/batch`；
   - `PUT /products/:productId/relations`；
   - `GET /audit-log`；
   - `GET /snapshot`。
2. 所有增长型列表接受 `query`、业务筛选、`cursor`、`limit`，返回 `items`、`nextCursor`、`total` 和稳定排序标识。游标包含最后一条稳定排序键，避免跨页重复或漏项。
3. 商品选择统一使用服务端草稿，不再区分显式 ID 和筛选快照：
   - 菜品单选按 `productId` 更新；
   - 组、类级联按稳定路径和当前搜索词在服务端展开全部可选后代，包括未加载菜品；
   - “选择全部筛选结果”按当前搜索词展开全部可选商品；
   - 同一商品在多个菜单路径出现时按 `productId` 去重，返回已选总数以及当前可见节点的 `selectedCount / selectableCount`；
   - 停用或 eMenu 不可售商品可见但不参与全选和半选分母。
4. 商品选择 token 绑定门店、操作者会话、菜单选择版本和过期时间。商品新增/删除、改名/改编码、移动或增删菜单路径、启停和 eMenu 可售状态变化均使 token 失效。取消向导和成功提交立即删除草稿，异常中断由 TTL 清理。
5. 预览端点创建服务端预览草稿并只返回状态汇总、未解决总数和第一页。候选读取使用稳定游标；移除、单条价格和冲突决策写入预览草稿，翻页后不丢失。提交只携带 `previewToken` 和 `expectedVersion`，不传递无界候选或决策数组。
6. 保存请求必须携带 `expectedVersion`。版本不匹配返回 `409 version_conflict`；引用或金额校验失败返回逐条错误且不写入。
7. 批量保存遵守已确认规则：
   - 新关系默认启用并追加；
   - 同值关系跳过；
   - 价格差异按用户决策保留或覆盖；
   - 停用关系按用户决策保持停用或重新启用；
   - 已有关系排序不因批量保存改变。
8. 数据写入采用“内存校验完整新状态 → 写同目录临时文件 → 原子替换正式文件”；失败保留旧文件。每次成功事务只递增一次 `seasoningConfigVersion`，并追加操作日志。
9. 公共 Option 删除前检查关系和订单快照引用；无法证明无引用时只允许停用。
10. `/snapshot` 返回版本化完整快照和校验摘要，供终端完成校验后整体替换缓存。
11. 将同一 handler 接入 Vite `configureServer` / `configurePreviewServer`；独立服务默认使用单独端口，并在 `dev:emenu-local` 中与 Vite 代理共同启动。

## 4. 建立前端 API、状态容器与页面生命周期

**新增文件**：

- `src/emenu-local/seasoning/seasoning-api.ts`
- `src/emenu-local/seasoning/seasoning-store.ts`
- `src/emenu-local/seasoning/seasoning-page.ts`

**修改文件**：

- `src/shell/emenu-local-shell.ts`

**工作内容**：

1. `seasoning-api.ts` 封装 fetch、查询参数、超时、错误类型、版本冲突和响应校验；增加菜单结构、商品选择草稿、预览分页与预览决策方法，删除旧 `products()` 和 `createProductSelectionSnapshot()` 的批量向导依赖；UI 不直接拼 URL。
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

## 7. 实现“商品 → 动作 → Option → 预览”批量向导

**新增文件**：

- `src/emenu-local/seasoning/seasoning-menu-structure-picker-ui.ts`

**修改文件**：

- `src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts`
- `src/emenu-local/seasoning/seasoning-api.ts`
- `src/emenu-local/seasoning/seasoning-types.ts`

**工作内容**：

1. 将第一步改为固定一行三列的“组 / 类 / 菜”选择器：列宽在桌面保持均衡，列头和分隔线采用 eMenu 工作区样式；不渲染产线列，也不导入前厅特殊品类的静态菜单树。
2. 选择器分别维护活动组、活动类、当前搜索词、菜品游标页、`productSelectionToken` 和可见节点计数：
   - 点击组或类内容区只切换右侧浏览；
   - 勾选组或类调用服务端范围更新并刷新父子计数；
   - 菜品复选框支持逐项多选；
   - 部分选择通过 `selectedCount / selectableCount` 设置原生 `indeterminate`；
   - 停用或不可售菜品置灰、禁选并显示原因；
   - 重复商品路径同步勾选状态，已选总数按商品 ID 去重。
3. 搜索商品名称或编码时保留三级路径，只显示有匹配菜品的组和类。搜索期间勾选父级只作用于当前命中；完成的选择固化在服务端草稿，修改或清空搜索不改变既有选择。
4. 菜列使用游标追加加载；组、类级联由服务端覆盖全部可选后代，不受当前已加载菜品限制。保留“选择全部筛选结果”，移除旧“选择本页”和分类下拉。
5. 第二步单选固定动作；步骤条持续展示服务端确认的商品数量和动作。第三步多选启用 Option，支持搜索和批次默认价格；非“添加”动作默认收起价格编辑。
6. 商品选择变化清空动作、Option、默认价格和全部预览；动作变化保留商品选择草稿并清空 Option、默认价格和预览；Option 变化保留商品与动作并删除旧预览草稿后重建。
7. 第四步创建 `previewToken`，按状态汇总和游标页显示候选。移除候选、覆盖单条 `(商品, 动作, Option)` 价格、价格差异决策和停用关系决策均写入服务端预览草稿；筛选或翻页后保持状态。
8. 使用服务端返回的全量未解决数量控制提交。提交只传 `previewToken` 和 `expectedVersion`；成功后展示新增、更新、重新启用和跳过数量，刷新总览并关闭向导。
9. `previewToken` 失效时返回 Option 步骤并重新生成；若商品选择 token 同时失效则返回商品步骤。普通关闭和路由离开执行脏状态保护；用户确认放弃或保存成功后显式删除选择与预览草稿。
10. 菜单为空显示维护商品引导；请求失败保留弹窗、活动分支和 token，并提供重试。窄屏保持三列的层级顺序，在选择器容器内部横向浏览，不退化为无层级商品卡片。

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
4. 桌面使用聚合表和右侧抽屉；批量商品选择器保持一行三列。窄屏总览改为分组列表、抽屉改为全屏，菜单选择器只在自身容器内横向浏览三列，避免整页横向溢出。
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
   - 确认批量商品步骤一行三列显示组 / 类 / 菜，不存在产线列，视觉与 eMenu 工作区一致；
   - 验证点击组 / 类仅切换浏览，勾选组 / 类级联全部后代，菜逐项多选，父级半选正确；
   - 验证停用与不可售菜品禁选、跨组选择不丢失、重复商品路径同步且总数去重；
   - 验证商品搜索保留三级路径，搜索中的父级选择只影响命中结果，清空搜索不改变已完成选择；
   - 验证菜品分页时父级仍能选择未加载后代，“选择全部筛选结果”覆盖未展开商品；
   - 按“商品 → 动作 → Option”完成批量关联，验证预览分页、跨页冲突决策和未解决总数；
   - 验证同值跳过、价格差异、停用关系重新启用和不可用记录；
   - 在单商品抽屉编辑四动作、价格和顺序；
   - 模拟两个会话，确认旧版本保存返回冲突且草稿保留；
   - 停用公共 Option，确认总览保留、终端快照隐藏；
   - 验证保存后版本递增、审计日志生成、快照完整；
   - 验证刷新后数据仍存在，API 不可用时页面给出明确错误；
   - 模拟商品选择 token 与预览 token 过期，确认分别回到商品步骤和 Option 步骤；
   - 验证只读权限、中文/英文、桌面/窄屏和完整键盘流程；
   - 检查浏览器控制台无新增错误。
6. 模拟快照写入失败或损坏，确认正式数据库文件不被半写覆盖；模拟终端校验失败，确认仍可使用上一份有效快照。

## 建议提交拆分

1. `test: add eMenu seasoning verification guards`
2. `feat: add seasoning domain and local API`
3. `feat: add seasoning overview and option library`
4. `feat: add seasoning menu selection drafts`
5. `feat: add seasoning group category dish picker`
6. `feat: paginate seasoning batch previews`
7. `feat: add seasoning product maintenance drawer`
8. `test: verify seasoning sync and accessibility flows`

每个提交只包含本功能相关文件。当前工作区已有大量无关未提交修改，实施时必须逐文件暂存，禁止使用 `git add .` 或改写无关变更。
